<?php

namespace App\Controller;

use App\Entity\FinOpsAppliedAction;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/finops')]
class FinOpsActionController extends AbstractController
{
    #[Route('/recommendations/apply', name: 'api_finops_recommendation_apply', methods: ['POST'])]
    public function applyRecommendation(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $key = $data['recommendationId'] ?? null;
        $title = $data['title'] ?? null;
        if (!\is_string($key) || '' === trim($key) || !\is_string($title) || '' === trim($title)) {
            return new JsonResponse(['message' => 'recommendationId and title are required'], Response::HTTP_BAD_REQUEST);
        }

        $key = mb_substr(trim($key), 0, 160);
        $title = mb_substr(trim($title), 0, 500);

        $type = isset($data['type']) && \is_string($data['type']) ? mb_substr($data['type'], 0, 32) : 'cost';
        $priority = isset($data['priority']) && \is_string($data['priority']) ? mb_substr($data['priority'], 0, 32) : 'medium';
        $savings = isset($data['savings']) && is_numeric($data['savings']) ? (float) $data['savings'] : 0.0;

        $existing = $em->getRepository(FinOpsAppliedAction::class)->findOneBy([
            'user' => $user,
            'recommendationKey' => $key,
        ]);

        if (null !== $existing) {
            return new JsonResponse([
                'ok' => true,
                'id' => $existing->getId(),
                'alreadyApplied' => true,
            ], Response::HTTP_OK);
        }

        $row = new FinOpsAppliedAction();
        $row->setUser($user);
        $row->setRecommendationKey($key);
        $row->setTitle($title);
        $row->setType($type);
        $row->setPriority($priority);
        $row->setSavings($savings);

        $em->persist($row);
        $em->flush();

        return new JsonResponse([
            'ok' => true,
            'id' => $row->getId(),
            'alreadyApplied' => false,
        ], Response::HTTP_CREATED);
    }
}
