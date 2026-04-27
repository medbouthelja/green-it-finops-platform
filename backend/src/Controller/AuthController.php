<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\VerificationCodeService;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        #[Autowire('%jwt_secret%')]
        private readonly string $jwtSecret,
        private readonly VerificationCodeService $verificationCodes,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/register', name: 'api_auth_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserRepository $users,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) ? strtolower(trim((string) $data['email'])) : '';
        $password = isset($data['password']) ? (string) $data['password'] : '';
        $firstName = isset($data['firstName']) ? trim((string) $data['firstName']) : '';
        $lastName = isset($data['lastName']) ? trim((string) $data['lastName']) : '';

        if ('' === $email || !filter_var($email, \FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['message' => 'Valid email required'], Response::HTTP_BAD_REQUEST);
        }
        if (\strlen($password) < 8) {
            return new JsonResponse(['message' => 'Password must be at least 8 characters'], Response::HTTP_BAD_REQUEST);
        }

        if ($users->findOneBy(['email' => $email])) {
            return new JsonResponse(['message' => 'Email already registered'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setPassword($passwordHasher->hashPassword($user, $password));
        $user->setRoles(['ROLE_PENDING']);
        $user->setFirstName('' !== $firstName ? $firstName : null);
        $user->setLastName('' !== $lastName ? $lastName : null);
        $user->setEmailVerified(false);
        $user->clearSignupVerification();
        $user->clearLoginVerification();

        $plain = $this->verificationCodes->generatePlainCode();
        $user->setSignupCodeHash($this->verificationCodes->hashCode($plain));
        $user->setSignupCodeExpiresAt($this->verificationCodes->expiresAt());

        $this->em->persist($user);
        $this->em->flush();

        $this->verificationCodes->notifySignup($user, $plain);

        return new JsonResponse([
            'message' => 'Registration started. Enter the 6-digit code sent to your email (see API server logs if SMTP is not configured).',
            'email' => $email,
            'step' => 'verify_signup',
        ], Response::HTTP_CREATED);
    }

    #[Route('/verify-signup', name: 'api_auth_verify_signup', methods: ['POST'])]
    public function verifySignup(Request $request, UserRepository $users): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) ? strtolower(trim((string) $data['email'])) : '';
        $code = isset($data['code']) ? preg_replace('/\D/', '', (string) $data['code']) : '';

        if ('' === $email || 6 !== \strlen($code)) {
            return new JsonResponse(['message' => 'Email and 6-digit code required'], Response::HTTP_BAD_REQUEST);
        }

        $user = $users->findOneBy(['email' => $email]);
        if (!$user) {
            return new JsonResponse(['message' => 'Invalid code or email'], Response::HTTP_BAD_REQUEST);
        }

        if ($user->isEmailVerified()) {
            return new JsonResponse(['message' => 'Email already verified. You can log in.'], Response::HTTP_BAD_REQUEST);
        }

        if ($this->verificationCodes->isExpired($user->getSignupCodeExpiresAt())) {
            return new JsonResponse(['message' => 'Code expired. Register again or contact support.'], Response::HTTP_BAD_REQUEST);
        }

        if (!$this->verificationCodes->verify($user->getSignupCodeHash(), $code)) {
            return new JsonResponse(['message' => 'Invalid code'], Response::HTTP_BAD_REQUEST);
        }

        $user->setEmailVerified(true);
        $user->clearSignupVerification();
        $this->em->flush();

        return new JsonResponse([
            'message' => 'Email verified. An administrator must assign your role and company before you can use the app.',
            'email' => $user->getEmail(),
        ]);
    }

    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $users,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) ? strtolower(trim((string) $data['email'])) : '';
        $password = isset($data['password']) ? (string) $data['password'] : '';
        if ('' === $email || '' === $password) {
            return new JsonResponse(['message' => 'Email and password required'], Response::HTTP_BAD_REQUEST);
        }

        $user = $users->findOneBy(['email' => $email]);
        if (!$user || !$passwordHasher->isPasswordValid($user, $password)) {
            return new JsonResponse(['message' => 'Invalid credentials'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->isEmailVerified()) {
            return new JsonResponse([
                'message' => 'Email not verified yet.',
                'code' => 'EMAIL_NOT_VERIFIED',
                'step' => 'verify_signup',
            ], Response::HTTP_FORBIDDEN);
        }

        if (!$this->loginEmailCodeEnabled()) {
            $user->clearLoginVerification();
            $this->em->flush();

            return new JsonResponse([
                'token' => $this->encodeJwt($user),
                'user' => $this->serializeUser($user),
            ]);
        }

        $plain = $this->verificationCodes->generatePlainCode();
        $user->setLoginCodeHash($this->verificationCodes->hashCode($plain));
        $user->setLoginCodeExpiresAt($this->verificationCodes->expiresAt());
        $this->em->flush();

        $this->verificationCodes->notifyLogin($user, $plain);

        return new JsonResponse([
            'message' => 'Enter the 6-digit code sent to your email (see API server logs if SMTP is not configured).',
            'step' => 'verify_login',
            'email' => $user->getEmail(),
        ]);
    }

    #[Route('/verify-login', name: 'api_auth_verify_login', methods: ['POST'])]
    public function verifyLogin(Request $request, UserRepository $users): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) ? strtolower(trim((string) $data['email'])) : '';
        $code = isset($data['code']) ? preg_replace('/\D/', '', (string) $data['code']) : '';

        if ('' === $email || 6 !== \strlen($code)) {
            return new JsonResponse(['message' => 'Email and 6-digit code required'], Response::HTTP_BAD_REQUEST);
        }

        $user = $users->findOneBy(['email' => $email]);
        if (!$user) {
            return new JsonResponse(['message' => 'Invalid code or email'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->isEmailVerified()) {
            return new JsonResponse(['message' => 'Email not verified'], Response::HTTP_FORBIDDEN);
        }

        if ($this->verificationCodes->isExpired($user->getLoginCodeExpiresAt())) {
            return new JsonResponse(['message' => 'Code expired. Log in again with your password.'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->verificationCodes->verify($user->getLoginCodeHash(), $code)) {
            return new JsonResponse(['message' => 'Invalid code'], Response::HTTP_UNAUTHORIZED);
        }

        $user->clearLoginVerification();
        $this->em->flush();

        $token = $this->encodeJwt($user);

        return new JsonResponse([
            'token' => $token,
            'user' => $this->serializeUser($user),
        ]);
    }

    /** When false, password alone returns a JWT (dev / legacy). Set LOGIN_EMAIL_CODE=1 in production. */
    private function loginEmailCodeEnabled(): bool
    {
        $v = $_ENV['LOGIN_EMAIL_CODE'] ?? getenv('LOGIN_EMAIL_CODE');
        if (null === $v || '' === trim((string) $v)) {
            return true;
        }

        return filter_var($v, \FILTER_VALIDATE_BOOLEAN);
    }

    private function encodeJwt(User $user): string
    {
        $payload = [
            'sub' => $user->getUserIdentifier(),
            'iat' => time(),
            'exp' => time() + 7 * 86400,
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    /** @return array<string, mixed> */
    private function serializeUser(User $user): array
    {
        $company = $user->getCompany();

        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'role' => $user->getApiRole(),
            'emailVerified' => $user->isEmailVerified(),
            'company' => $company ? [
                'id' => $company->getId(),
                'name' => $company->getName(),
            ] : null,
        ];
    }
}
