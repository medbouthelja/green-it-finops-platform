<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\CompanyRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users')]
#[IsGranted('ROLE_ADMIN')]
class UserAdminController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly CompanyRepository $companies,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('', name: 'api_users_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $rows = $this->users->findBy([], ['id' => 'ASC']);

        return new JsonResponse(array_map(fn (User $u) => $this->serializeUser($u), $rows));
    }

    #[Route('/{id}/company', name: 'api_users_assign_company', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function assignCompany(int $id, Request $request): JsonResponse
    {
        $user = $this->users->find($id);
        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data) || !\array_key_exists('companyId', $data)) {
            return new JsonResponse(['message' => 'companyId is required'], Response::HTTP_BAD_REQUEST);
        }

        $companyId = $data['companyId'];
        if (null === $companyId || '' === $companyId) {
            $user->setCompany(null);
        } else {
            $company = $this->companies->find((int) $companyId);
            if (null === $company) {
                return new JsonResponse(['message' => 'Company not found'], Response::HTTP_BAD_REQUEST);
            }
            $user->setCompany($company);
        }

        $this->em->flush();

        return new JsonResponse($this->serializeUser($user));
    }

    #[Route('/{id}/role', name: 'api_users_assign_role', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function assignRole(int $id, Request $request): JsonResponse
    {
        $user = $this->users->find($id);
        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data) || !isset($data['role'])) {
            return new JsonResponse(['message' => 'role is required'], Response::HTTP_BAD_REQUEST);
        }

        $role = strtoupper(trim((string) $data['role']));
        $allowed = ['PENDING', 'MANAGER', 'TECH_LEAD', 'ADMIN'];
        if (!\in_array($role, $allowed, true)) {
            return new JsonResponse(['message' => 'Invalid role. Use PENDING, MANAGER, TECH_LEAD, or ADMIN.'], Response::HTTP_BAD_REQUEST);
        }

        $user->setRoles(['ROLE_'.$role]);
        $this->em->flush();

        return new JsonResponse($this->serializeUser($user));
    }

    #[Route('/{id}', name: 'api_users_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $current = $this->getUser();
        if (!$current instanceof User) {
            return new JsonResponse(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $user = $this->users->find($id);
        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        if ($user->getId() === $current->getId()) {
            return new JsonResponse(['message' => 'You cannot delete your own account'], Response::HTTP_BAD_REQUEST);
        }

        if (\in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            $admins = 0;
            foreach ($this->users->findAll() as $u) {
                if (\in_array('ROLE_ADMIN', $u->getRoles(), true)) {
                    ++$admins;
                }
            }
            if ($admins <= 1) {
                return new JsonResponse(['message' => 'Cannot delete the last administrator account'], Response::HTTP_CONFLICT);
            }
        }

        $this->em->remove($user);
        $this->em->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
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
