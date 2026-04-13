<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\ProjectRepository;
use App\Service\ProjectAccessService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/simulations/projects')]
class SimulationController extends AbstractController
{
    public function __construct(
        private readonly ProjectRepository $projects,
        private readonly ProjectAccessService $projectAccess,
    ) {
    }

    #[Route('/{projectId}', name: 'api_simulation_run', methods: ['POST'])]
    public function simulate(int $projectId, Request $request): JsonResponse
    {
        $project = $this->projects->find($projectId);
        if (!$project) {
            return new JsonResponse(['message' => 'Not found'], Response::HTTP_NOT_FOUND);
        }
        $user = $this->getUser();
        if (!$user instanceof User || !$this->projectAccess->canAccess($user, $project)) {
            return new JsonResponse(['message' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            $data = [];
        }

        $tjmVar = (float) ($data['tjmVariation'] ?? 0);
        $progVar = (float) ($data['progressVariation'] ?? 0);
        $cloudVar = (float) ($data['cloudConsumptionVariation'] ?? 0);
        $teamVar = (float) ($data['teamSizeVariation'] ?? 0);

        $baseCost = $project->getConsumed();
        $baseProgress = (float) $project->getProgress();
        $baseTjm = $project->getTjm();
        $budget = $project->getBudget();
        $remainingBudget = $budget - $baseCost;

        $newTjm = $baseTjm * (1 + $tjmVar / 100);
        $newProgress = min(100.0, $baseProgress + $progVar);
        $remainingWork = 100 - $newProgress;
        $estimatedHours = $remainingWork > 0 ? ($remainingWork / 100) * ($budget / max(0.01, $baseTjm)) : 0;
        $newCost = $baseCost + ($estimatedHours * $newTjm);
        $cloudCostVariation = $cloudVar * 100;
        $finalCost = $newCost + $cloudCostVariation + $teamVar * 50;

        $variance = $finalCost - $budget;
        $variancePercent = $budget > 0 ? ($variance / $budget) * 100 : 0;

        $timeline = [];
        for ($i = 1; $i <= 5; ++$i) {
            $f = $i / 5;
            $timeline[] = [
                'month' => 'Mois '.$i,
                'original' => round($baseCost + ($finalCost - $baseCost) * ($f * 0.9), 2),
                'simulated' => round($baseCost + ($finalCost - $baseCost) * $f, 2),
            ];
        }

        return new JsonResponse([
            'original' => [
                'budget' => $budget,
                'consumed' => $baseCost,
                'progress' => $baseProgress,
                'remaining' => $remainingBudget,
            ],
            'simulated' => [
                'budget' => $budget,
                'consumed' => round($finalCost, 2),
                'progress' => $newProgress,
                'remaining' => round($budget - $finalCost, 2),
                'tjm' => round($newTjm, 2),
            ],
            'impact' => [
                'costVariance' => round($variance, 2),
                'costVariancePercent' => round($variancePercent, 2),
                'progressChange' => $progVar,
                'tjmChange' => $tjmVar,
            ],
            'timeline' => $timeline,
        ]);
    }
}
