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
            'company' => $company ? [
                'id' => $company->getId(),
                'name' => $company->getName(),
            ] : null,
        ];
    }
}
