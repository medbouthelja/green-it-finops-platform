<?php

namespace App\Controller;

use App\Entity\Company;
use App\Repository\CompanyRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/companies')]
class CompanyController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CompanyRepository $companies,
    ) {
    }

    #[Route('', name: 'api_companies_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(Request $request): JsonResponse
    {
        $q = $request->query->get('q');
        $sector = $request->query->get('sector');
        $list = $this->companies->search(
            \is_string($q) ? $q : null,
            \is_string($sector) ? $sector : null,
        );

        return new JsonResponse(array_map(fn (Company $c) => $this->serializeCompany($c, true), $list));
    }

    #[Route('/{id}', name: 'api_companies_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function get(int $id): JsonResponse
    {
        $company = $this->companies->find($id);
        if (!$company) {
            return new JsonResponse(['message' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse($this->serializeCompany($company, true));
    }

    #[Route('', name: 'api_companies_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $name = isset($data['name']) ? trim((string) $data['name']) : '';
        if ('' === $name) {
            return new JsonResponse(['message' => 'name is required'], Response::HTTP_BAD_REQUEST);
        }

        $c = new Company();
        $c->setName($name);
        $this->hydrateCompany($c, $data);
        $this->em->persist($c);
        $this->em->flush();

        return new JsonResponse($this->serializeCompany($c, true), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_companies_update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $company = $this->companies->find($id);
        if (!$company) {
            return new JsonResponse(['message' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['name'])) {
            $n = trim((string) $data['name']);
            if ('' !== $n) {
                $company->setName($n);
            }
        }
        $this->hydrateCompany($company, $data);
        $this->em->flush();

        return new JsonResponse($this->serializeCompany($company, true));
    }

    #[Route('/{id}', name: 'api_companies_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): Response
    {
        $company = $this->companies->find($id);
        if (!$company) {
            return new JsonResponse(['message' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        if ($company->getProjects()->count() > 0) {
            return new JsonResponse(
                ['message' => 'Cannot delete a company that still has projects'],
                Response::HTTP_CONFLICT
            );
        }

        $this->em->remove($company);
        $this->em->flush();

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    /** @return array<string, mixed> */
    private function serializeCompany(Company $c, bool $withCounts): array
    {
        $row = [
            'id' => $c->getId(),
            'name' => $c->getName(),
            'description' => $c->getDescription(),
            'sector' => $c->getSector(),
            'country' => $c->getCountry(),
            'createdAt' => $c->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
        if ($withCounts) {
            $row['projectCount'] = $c->getProjects()->count();
        }

        return $row;
    }

    /** @param array<string, mixed> $data */
    private function hydrateCompany(Company $c, array $data): void
    {
        if (\array_key_exists('description', $data)) {
            $c->setDescription($data['description'] !== null ? (string) $data['description'] : null);
        }
        if (\array_key_exists('sector', $data)) {
            $c->setSector($data['sector'] !== null ? (string) $data['sector'] : null);
        }
        if (\array_key_exists('country', $data)) {
            $c->setCountry($data['country'] !== null ? (string) $data['country'] : null);
        }
    }
}
