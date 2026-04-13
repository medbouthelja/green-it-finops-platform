<?php

namespace App\Controller;

use App\Entity\Project;
use App\Entity\TimeEntry;
use App\Entity\User;
use App\Repository\CompanyRepository;
use App\Repository\ProjectRepository;
use App\Repository\TimeEntryRepository;
use App\Service\ProjectAccessService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/projects')]
class ProjectController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ProjectRepository $projects,
        private readonly TimeEntryRepository $timeEntries,
        private readonly CompanyRepository $companies,
        private readonly ProjectAccessService $projectAccess,
    ) {
    }

    #[Route('', name: 'api_projects_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $list = $this->projects->findForUser($user);

        return new JsonResponse(array_map(fn (Project $p) => $this->serializeProject($p), $list));
    }

    #[Route('/{id}', name: 'api_projects_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function get(int $id): JsonResponse
    {
        $project = $this->resolveProjectOrNotFound($id);
        if ($project instanceof JsonResponse) {
            return $project;
        }

        return new JsonResponse($this->serializeProject($project));
    }

    #[Route('', name: 'api_projects_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $project = $this->hydrateProject(new Project(), $data, true);
        $project->setOwner($user);

        if ($this->isGranted('ROLE_ADMIN')) {
            $cid = isset($data['companyId']) ? (int) $data['companyId'] : 0;
            $company = $cid > 0 ? $this->companies->find($cid) : null;
            if (null === $company) {
                return new JsonResponse(['message' => 'companyId is required and must reference an existing company'], Response::HTTP_BAD_REQUEST);
            }
            $project->setCompany($company);
        } else {
            $company = $user->getCompany();
            if (null === $company) {
                return new JsonResponse(['message' => 'Your account is not assigned to a company'], Response::HTTP_BAD_REQUEST);
            }
            $project->setCompany($company);
        }

        $this->em->persist($project);
        $this->em->flush();

        return new JsonResponse($this->serializeProject($project), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_projects_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $project = $this->resolveProjectOrNotFound($id);
        if ($project instanceof JsonResponse) {
            return $project;
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $this->hydrateProject($project, $data, false);
        if ($this->isGranted('ROLE_ADMIN') && isset($data['companyId'])) {
            $cid = (int) $data['companyId'];
            $co = $cid > 0 ? $this->companies->find($cid) : null;
            if ($co) {
                $project->setCompany($co);
            }
        }
        $this->em->flush();

        return new JsonResponse($this->serializeProject($project));
    }

    #[Route('/{id}', name: 'api_projects_delete', methods: ['DELETE'])]
    public function delete(int $id): Response
    {
        $project = $this->resolveProjectOrNotFound($id);
        if ($project instanceof JsonResponse) {
            return $project;
        }

        $this->em->remove($project);
        $this->em->flush();

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/budget', name: 'api_projects_budget', methods: ['GET'])]
    public function budget(int $id): JsonResponse
    {
        $project = $this->resolveProjectOrNotFound($id);
        if ($project instanceof JsonResponse) {
            return $project;
        }

        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'];
        $budget = $project->getBudget();
        $consumed = $project->getConsumed();
        $perMonth = $budget / \max(1, \count($months));
        $out = [];
        $acc = 0.0;
        foreach ($months as $i => $m) {
            $portion = $consumed * (($i + 1) / \count($months));
            $monthConsumed = $portion - $acc;
            $acc = $portion;
            $out[] = [
                'month' => $m,
                'budget' => round($perMonth, 2),
                'consumed' => round($monthConsumed, 2),
            ];
        }

        return new JsonResponse($out);
    }

    #[Route('/{id}/progress', name: 'api_projects_progress', methods: ['GET'])]
    public function progress(int $id): JsonResponse
    {
        $project = $this->resolveProjectOrNotFound($id);
        if ($project instanceof JsonResponse) {
            return $project;
        }

        return new JsonResponse([
            'progress' => $project->getProgress(),
            'milestones' => [
                ['label' => 'Spécification', 'percent' => 100],
                ['label' => 'Conception', 'percent' => 100],
                ['label' => 'Développement', 'percent' => min(100, $project->getProgress())],
            ],
        ]);
    }

    #[Route('/{projectId}/time-entries', name: 'api_projects_time_entries_list', methods: ['GET'])]
    public function listTimeEntries(int $projectId): JsonResponse
    {
        $project = $this->resolveProjectOrNotFound($projectId);
        if ($project instanceof JsonResponse) {
            return $project;
        }

        $entries = $this->timeEntries->findBy(['project' => $project], ['date' => 'DESC']);

        $out = array_map(fn (TimeEntry $e) => $this->serializeTimeEntry($e), $entries);

        return new JsonResponse($out);
    }

    #[Route('/{projectId}/time-entries', name: 'api_projects_time_entries_create', methods: ['POST'])]
    public function createTimeEntry(int $projectId, Request $request): JsonResponse
    {
        $project = $this->resolveProjectOrNotFound($projectId);
        if ($project instanceof JsonResponse) {
            return $project;
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $hours = isset($data['hours']) ? (float) $data['hours'] : 0;
        $task = isset($data['task']) ? (string) $data['task'] : '';
        $userName = (string) ($data['user'] ?? $data['userName'] ?? 'Utilisateur');
        $dateStr = $data['date'] ?? date('Y-m-d');

        try {
            $date = new \DateTimeImmutable($dateStr);
        } catch (\Exception) {
            return new JsonResponse(['message' => 'Invalid date'], Response::HTTP_BAD_REQUEST);
        }

        $entry = new TimeEntry();
        $entry->setProject($project);
        $entry->setUserName($userName);
        $entry->setDate($date);
        $entry->setHours($hours);
        $entry->setTask($task);

        $project->setConsumed(round($project->getConsumed() + $hours * $project->getTjm(), 2));

        $this->em->persist($entry);
        $this->em->flush();

        return new JsonResponse($this->serializeTimeEntry($entry), Response::HTTP_CREATED);
    }

    private function resolveProjectOrNotFound(int $id): Project|JsonResponse
    {
        $project = $this->projects->find($id);
        if (!$project) {
            return new JsonResponse(['message' => 'Not found'], Response::HTTP_NOT_FOUND);
        }
        $user = $this->getUser();
        if (!$user instanceof User || !$this->projectAccess->canAccess($user, $project)) {
            return new JsonResponse(['message' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        return $project;
    }

    /** @return array<string, mixed> */
    private function serializeProject(Project $p): array
    {
        $company = $p->getCompany();

        return [
            'id' => $p->getId(),
            'name' => $p->getName(),
            'description' => $p->getDescription(),
            'status' => $p->getStatus(),
            'methodology' => $p->getMethodology(),
            'budget' => $p->getBudget(),
            'consumed' => $p->getConsumed(),
            'progress' => $p->getProgress(),
            'tjm' => $p->getTjm(),
            'startDate' => $p->getStartDate()->format('Y-m-d'),
            'endDate' => $p->getEndDate()->format('Y-m-d'),
            'team' => $p->getTeam(),
            'company' => $company ? [
                'id' => $company->getId(),
                'name' => $company->getName(),
            ] : null,
        ];
    }

    /** @param array<string, mixed> $data */
    private function hydrateProject(Project $p, array $data, bool $isCreate): Project
    {
        if (isset($data['name'])) {
            $p->setName((string) $data['name']);
        } elseif ($isCreate) {
            $p->setName('Nouveau projet');
        }
        if (\array_key_exists('description', $data)) {
            $p->setDescription($data['description'] !== null ? (string) $data['description'] : null);
        }
        if (isset($data['status'])) {
            $p->setStatus((string) $data['status']);
        } elseif ($isCreate) {
            $p->setStatus('active');
        }
        if (isset($data['methodology'])) {
            $p->setMethodology((string) $data['methodology']);
        } elseif ($isCreate) {
            $p->setMethodology('scrum');
        }
        if (isset($data['budget'])) {
            $p->setBudget((float) $data['budget']);
        } elseif ($isCreate) {
            $p->setBudget(0);
        }
        if (isset($data['consumed'])) {
            $p->setConsumed((float) $data['consumed']);
        } elseif ($isCreate) {
            $p->setConsumed(0);
        }
        if (isset($data['progress'])) {
            $p->setProgress((int) $data['progress']);
        } elseif ($isCreate) {
            $p->setProgress(0);
        }
        if (isset($data['tjm'])) {
            $p->setTjm((float) $data['tjm']);
        } elseif ($isCreate) {
            $p->setTjm(0);
        }
        if (isset($data['startDate'])) {
            $p->setStartDate(new \DateTimeImmutable((string) $data['startDate']));
        } elseif ($isCreate) {
            $p->setStartDate(new \DateTimeImmutable());
        }
        if (isset($data['endDate'])) {
            $p->setEndDate(new \DateTimeImmutable((string) $data['endDate']));
        } elseif ($isCreate) {
            $p->setEndDate((new \DateTimeImmutable())->modify('+6 months'));
        }
        if (isset($data['team']) && \is_array($data['team'])) {
            $p->setTeam($data['team']);
        } elseif ($isCreate) {
            $p->setTeam([]);
        }

        return $p;
    }

    /** @return array<string, mixed> */
    private function serializeTimeEntry(TimeEntry $e): array
    {
        return [
            'id' => $e->getId(),
            'user' => $e->getUserName(),
            'date' => $e->getDate()->format('Y-m-d'),
            'hours' => $e->getHours(),
            'task' => $e->getTask(),
        ];
    }
}
