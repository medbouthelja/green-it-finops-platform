<?php

namespace App\Security;

use App\Repository\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class JwtAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly string $jwtSecretKey,
    ) {
    }

    public function supports(Request $request): ?bool
    {
        $path = $request->getPathInfo();
        if ($request->isMethod('OPTIONS')) {
            return false;
        }

        if (str_starts_with($path, '/api/auth/')) {
            return false;
        }

        return str_starts_with($path, '/api');
    }

    public function authenticate(Request $request): Passport
    {
        $authHeader = $request->headers->get('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            throw new AuthenticationException('Missing Bearer token');
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecretKey, 'HS256'));
        } catch (\Throwable) {
            throw new AuthenticationException('Invalid or expired JWT');
        }

        $email = $decoded->sub ?? null;
        if (!\is_string($email) || '' === $email) {
            throw new AuthenticationException('Invalid JWT payload');
        }

        return new SelfValidatingPassport(
            new UserBadge($email, function (string $userIdentifier) {
                $user = $this->users->findOneBy(['email' => $userIdentifier]);
                if (!$user) {
                    throw new AuthenticationException('User not found');
                }

                return $user;
            })
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(['message' => $exception->getMessage()], Response::HTTP_UNAUTHORIZED);
    }
}
