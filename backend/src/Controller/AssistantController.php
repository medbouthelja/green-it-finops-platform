<?php

namespace App\Controller;

use App\Entity\Alert;
use App\Entity\Project;
use App\Repository\AlertRepository;
use App\Repository\ProjectRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/assistant')]
class AssistantController extends AbstractController
{
    public function __construct(
        private readonly ProjectRepository $projects,
        private readonly AlertRepository $alerts,
    ) {
    }

    #[Route('/chat', name: 'api_assistant_chat', methods: ['POST'])]
    public function chat(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $message = trim((string) ($data['message'] ?? ''));
        if ($message === '') {
            return new JsonResponse(['message' => 'Message is required'], Response::HTTP_BAD_REQUEST);
        }

        if (mb_strlen($message) > 2000) {
            return new JsonResponse(['message' => 'Message too long'], Response::HTTP_BAD_REQUEST);
        }

        /** @var list<array{role: string, content: string}> $history */
        $history = [];
        if (isset($data['messages']) && \is_array($data['messages'])) {
            foreach ($data['messages'] as $row) {
                if (!\is_array($row)) {
                    continue;
                }
                $role = isset($row['role']) ? (string) $row['role'] : '';
                $content = isset($row['content']) ? trim((string) $row['content']) : '';
                if (!\in_array($role, ['user', 'assistant'], true) || $content === '') {
                    continue;
                }
                if (mb_strlen($content) > 8000) {
                    continue;
                }
                $history[] = ['role' => $role, 'content' => $content];
            }
        }

        $context = $this->buildContext();
        $answer = $this->askAiProvider($message, $history, $context);

        if ($answer === null) {
            $answer = $this->buildFallbackAnswer($message, $context);
        }

        return new JsonResponse([
            'answer' => $answer,
            'meta' => [
                'projects' => $context['totalProjects'],
                'activeProjects' => $context['activeProjects'],
                'unreadAlerts' => $context['unreadAlerts'],
                'aiEnabled' => $this->getAiApiKey() !== '',
            ],
        ]);
    }

    private function getAiApiKey(): string
    {
        $fromEnv = $_ENV['AI_API_KEY'] ?? $_SERVER['AI_API_KEY'] ?? null;
        if (\is_string($fromEnv) && $fromEnv !== '') {
            return $fromEnv;
        }

        $key = getenv('AI_API_KEY');
        if (\is_string($key) && $key !== '') {
            return $key;
        }

        return '';
    }

    /** @return array<string, mixed> */
    private function buildContext(): array
    {
        $allProjects = $this->projects->findBy([], ['id' => 'DESC']);
        $allAlerts = $this->alerts->findBy([], ['createdAt' => 'DESC']);

        $totalProjects = \count($allProjects);
        $activeProjects = \count(array_filter(
            $allProjects,
            static fn (Project $p) => $p->getStatus() === 'active'
        ));

        $totalBudget = array_reduce(
            $allProjects,
            static fn (float $carry, Project $p) => $carry + $p->getBudget(),
            0.0
        );
        $totalConsumed = array_reduce(
            $allProjects,
            static fn (float $carry, Project $p) => $carry + $p->getConsumed(),
            0.0
        );

        $projectSummaries = array_map(static function (Project $p): array {
            return [
                'name' => $p->getName(),
                'status' => $p->getStatus(),
                'budget' => round($p->getBudget(), 2),
                'consumed' => round($p->getConsumed(), 2),
                'progress' => $p->getProgress(),
            ];
        }, array_slice($allProjects, 0, 12));

        $unreadAlerts = array_values(array_filter(
            $allAlerts,
            static fn (Alert $a) => !$a->isRead()
        ));

        $alertSummaries = array_map(static function (Alert $a): array {
            return [
                'title' => $a->getTitle(),
                'message' => $a->getMessage(),
                'type' => $a->getType(),
                'createdAt' => $a->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }, array_slice($unreadAlerts, 0, 8));

        return [
            'totalProjects' => $totalProjects,
            'activeProjects' => $activeProjects,
            'totalBudget' => round($totalBudget, 2),
            'totalConsumed' => round($totalConsumed, 2),
            'unreadAlerts' => \count($unreadAlerts),
            'projects' => $projectSummaries,
            'alerts' => $alertSummaries,
        ];
    }

    /**
     * @param list<array{role: string, content: string}> $history
     * @param array<string, mixed>                     $context
     */
    private function askAiProvider(string $message, array $history, array $context): ?string
    {
        $apiKey = $this->getAiApiKey();
        if ($apiKey === '') {
            return null;
        }

        $apiUrl = (string) (getenv('AI_API_URL') ?: ($_ENV['AI_API_URL'] ?? $_SERVER['AI_API_URL'] ?? 'https://api.openai.com/v1/chat/completions'));
        $model = (string) (getenv('AI_MODEL') ?: ($_ENV['AI_MODEL'] ?? $_SERVER['AI_MODEL'] ?? 'gpt-4o-mini'));

        $systemPrompt = "Tu es un assistant conversationnel integre a une plateforme de pilotage de projets IT, budget et FinOps / Green IT.\n"
            . "Reponds en francais naturel, comme une vraie conversation. Adapte ton ton a la question.\n"
            . "Tu peux reformuler, poser une question de clarification si necessaire, ou donner des listes quand c'est utile.\n"
            . "Base-toi sur le contexte JSON ci-dessous pour les chiffres et noms de projets; ne invente pas de donnees absentes du contexte.\n"
            . "Si l'utilisateur parle d'autre chose (salutations, plaisanterie), reponds normalement sans forcer le sujet budget.\n\n"
            . "Contexte tableau de bord (JSON):\n"
            . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        $trimmed = array_slice($history, -20);
        foreach ($trimmed as $turn) {
            $messages[] = ['role' => $turn['role'], 'content' => $turn['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $message];

        $payload = json_encode([
            'model' => $model,
            'temperature' => 0.65,
            'max_tokens' => 1200,
            'messages' => $messages,
        ]);

        if ($payload === false) {
            return null;
        }

        $ch = curl_init($apiUrl);
        if ($ch === false) {
            return null;
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 45,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer '.$apiKey,
            ],
            CURLOPT_POSTFIELDS => $payload,
        ]);

        $raw = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!\is_string($raw) || $raw === '' || $status < 200 || $status >= 300) {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (!\is_array($decoded)) {
            return null;
        }

        $content = $decoded['choices'][0]['message']['content'] ?? null;
        if (!\is_string($content) || trim($content) === '') {
            return null;
        }

        return trim($content);
    }

    /** @param array<string, mixed> $context */
    private function buildFallbackAnswer(string $message, array $context): string
    {
        $budgetLeft = (float) $context['totalBudget'] - (float) $context['totalConsumed'];
        $usageRate = (float) $context['totalBudget'] > 0
            ? ((float) $context['totalConsumed'] / (float) $context['totalBudget']) * 100
            : 0.0;

        $projectLines = [];
        foreach (array_slice($context['projects'], 0, 5) as $p) {
            if (!\is_array($p)) {
                continue;
            }
            $name = (string) ($p['name'] ?? '');
            $st = (string) ($p['status'] ?? '');
            $b = (float) ($p['budget'] ?? 0);
            $c = (float) ($p['consumed'] ?? 0);
            $projectLines[] = sprintf('%s (%s) — %.0f € consommés sur %.0f €', $name, $st, $c, $b);
        }
        $projectsBlock = $projectLines !== [] ? implode("\n", $projectLines) : 'Aucun projet dans le contexte.';

        $alertLines = [];
        foreach (array_slice($context['alerts'], 0, 3) as $a) {
            if (!\is_array($a)) {
                continue;
            }
            $alertLines[] = '- '.((string) ($a['title'] ?? 'Alerte')).': '.((string) ($a['message'] ?? ''));
        }
        $alertsBlock = $alertLines !== [] ? implode("\n", $alertLines) : 'Aucune alerte non lue listee.';

        $seed = abs(crc32($message)) % 4;
        $intros = [
            "D'apres les donnees actuelles du tableau de bord, voici ce que je peux en dire :",
            "En m'appuyant sur le snapshot projets et alertes, voici une reponse directe :",
            "Voici une synthese alignee avec vos chiffres en base :",
            "Pour repondre a votre message, je m'appuie sur l'etat suivant :",
        ];

        return $intros[$seed]."\n\n"
            .sprintf(
                "Globalement : %d projet(s) au total, dont %d actif(s). Budget cumule %.2f €, consomme %.2f € (reste %.2f €, soit environ %.1f %% utilise).\n",
                (int) $context['totalProjects'],
                (int) $context['activeProjects'],
                (float) $context['totalBudget'],
                (float) $context['totalConsumed'],
                $budgetLeft,
                $usageRate
            )
            ."Alertes non lues (nombre) : ".(int) $context['unreadAlerts']."\n\n"
            ."Detail projets (extrait) :\n".$projectsBlock."\n\n"
            ."Alertes (extrait) :\n".$alertsBlock."\n\n"
            ."Pour une vraie conversation (reformulations, suivi de fil, reponses ouvertes), configurez une cle API dans le backend : variable d'environnement AI_API_KEY dans backend/.env (voir backend/.env.example). Sans cle, je ne peux pas appeler un modele de langage externe.";
    }
}
