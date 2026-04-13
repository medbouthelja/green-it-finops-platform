<?php

namespace App\Controller;

use App\Entity\Alert;
use App\Entity\Project;
use App\Entity\User;
use App\Repository\AlertRepository;
use App\Repository\ProjectRepository;
use App\Service\ProjectAccessService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

#[Route('/api/assistant')]
class AssistantController extends AbstractController
{
    public function __construct(
        private readonly ProjectRepository $projects,
        private readonly AlertRepository $alerts,
        private readonly ProjectAccessService $projectAccess,
        private readonly HttpClientInterface $httpClient,
        #[Autowire('%env(AI_API_KEY)%')]
        private readonly string $aiApiKey,
        #[Autowire('%env(AI_API_URL)%')]
        private readonly string $aiApiUrl,
        #[Autowire('%env(AI_MODEL)%')]
        private readonly string $aiModel,
        #[Autowire('%env(bool:AI_HTTP_VERIFY_SSL)%')]
        private readonly bool $aiHttpVerifySsl,
        #[Autowire('%kernel.debug%')]
        private readonly bool $debug,
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

        $replyLanguage = $this->normalizeReplyLanguage($data['language'] ?? null);

        $user = $this->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $context = $this->buildContext($user);
        $llm = $this->askAiProvider($message, $history, $context, $replyLanguage);
        $answer = $llm['answer'];

        if ($answer === null) {
            $answer = $this->buildFallbackAnswer($message, $context, $this->isAiConfigured(), $llm['error'] ?? null, $replyLanguage);
        }

        $meta = [
            'projects' => $context['totalProjects'],
            'activeProjects' => $context['activeProjects'],
            'unreadAlerts' => $context['unreadAlerts'],
            'aiEnabled' => $this->isAiConfigured(),
            'aiLlmUsed' => $llm['answer'] !== null,
            'replyLanguage' => $replyLanguage,
        ];
        if ($this->debug && isset($llm['error']) && $llm['error'] !== '') {
            $meta['aiLlmError'] = $llm['error'];
        }

        return new JsonResponse([
            'answer' => $answer,
            'meta' => $meta,
        ]);
    }

    private function isAiConfigured(): bool
    {
        return trim($this->aiApiKey) !== '';
    }

    /** @param mixed $raw */
    private function normalizeReplyLanguage($raw): string
    {
        $s = \is_string($raw) ? strtolower(trim($raw)) : 'auto';
        $allowed = [
            'auto', 'en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'ar', 'ja', 'zh', 'ko', 'hi', 'tr',
            'sv', 'da', 'no', 'fi', 'vi', 'id', 'uk', 'ro', 'hu', 'cs', 'el', 'he', 'th', 'bg', 'hr', 'sk',
            'sl', 'lt', 'lv', 'et', 'ca', 'ms', 'sw', 'ta', 'bn', 'fa', 'ur', 'pa', 'mr', 'gu', 'kn', 'ml', 'te',
        ];

        return \in_array($s, $allowed, true) ? $s : 'auto';
    }

    private function replyLanguageInstruction(string $lang): string
    {
        if ($lang === 'auto') {
            return <<<'TXT'
LANGUAGE_RULE: Detect the language of the user's latest message (and recent turns when helpful) and reply entirely in that language. If the user mixes languages, follow the dominant language of the latest message. If unclear, default to English. Keep numbers and project names from the JSON context as-is.
TXT;
        }

        $labels = [
            'en' => 'English', 'fr' => 'French', 'de' => 'German', 'es' => 'Spanish', 'it' => 'Italian',
            'pt' => 'Portuguese', 'nl' => 'Dutch', 'pl' => 'Polish', 'ru' => 'Russian', 'ar' => 'Arabic',
            'ja' => 'Japanese', 'zh' => 'Chinese', 'ko' => 'Korean', 'hi' => 'Hindi', 'tr' => 'Turkish',
            'sv' => 'Swedish', 'da' => 'Danish', 'no' => 'Norwegian', 'fi' => 'Finnish', 'vi' => 'Vietnamese',
            'id' => 'Indonesian', 'uk' => 'Ukrainian', 'ro' => 'Romanian', 'hu' => 'Hungarian', 'cs' => 'Czech',
            'el' => 'Greek', 'he' => 'Hebrew', 'th' => 'Thai', 'bg' => 'Bulgarian', 'hr' => 'Croatian', 'sk' => 'Slovak',
            'sl' => 'Slovene', 'lt' => 'Lithuanian', 'lv' => 'Latvian', 'et' => 'Estonian', 'ca' => 'Catalan',
            'ms' => 'Malay', 'sw' => 'Swahili', 'ta' => 'Tamil', 'bn' => 'Bengali', 'fa' => 'Persian', 'ur' => 'Urdu',
            'pa' => 'Punjabi', 'mr' => 'Marathi', 'gu' => 'Gujarati', 'kn' => 'Kannada', 'ml' => 'Malayalam', 'te' => 'Telugu',
        ];
        $label = $labels[$lang] ?? $lang;

        return "LANGUAGE_RULE: Write your entire reply in {$label} (BCP-47 / ISO-style code: {$lang}). Do not switch to another language for the main answer.";
    }

    /**
     * XAMPP Windows : curl pointe souvent vers un curl-ca-bundle.crt absent → erreur "Error setting certificate file".
     * Solution propre : telecharger cacert.pem et definir AI_CACERT=chemin absolu, ou php.ini openssl.cafile.
     * En dev seulement : AI_HTTP_VERIFY_SSL=0 dans .env.local (jamais en production).
     *
     * @return array<string, mixed>
     */
    private function outboundTlsOptions(): array
    {
        $ca = trim((string) ($_ENV['AI_CACERT'] ?? ''));
        if ($ca !== '' && is_readable($ca)) {
            return [
                'cafile' => $ca,
                'verify_peer' => true,
                'verify_host' => true,
            ];
        }

        if (!$this->aiHttpVerifySsl) {
            return [
                'verify_peer' => false,
                'verify_host' => false,
            ];
        }

        return [];
    }

    /** @return array<string, mixed> */
    private function buildContext(User $user): array
    {
        $allProjects = $this->projects->findForUser($user);
        $allAlertsRaw = $this->alerts->findBy([], ['createdAt' => 'DESC']);
        $allAlerts = array_values(array_filter(
            $allAlertsRaw,
            function (Alert $a) use ($user): bool {
                $p = $a->getProject();

                return $p !== null && $this->projectAccess->canAccess($user, $p);
            }
        ));

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
     *
     * @return array{answer: ?string, error: string}
     */
    private function askAiProvider(string $message, array $history, array $context, string $replyLanguage): array
    {
        $apiKey = trim($this->aiApiKey);
        if ($apiKey === '') {
            return ['answer' => null, 'error' => ''];
        }

        $apiUrl = trim($this->aiApiUrl) !== ''
            ? trim($this->aiApiUrl)
            : 'https://api.openai.com/v1/chat/completions';
        $model = trim($this->aiModel) !== '' ? trim($this->aiModel) : 'gpt-4o-mini';

        $langBlock = $this->replyLanguageInstruction($replyLanguage);

        $systemPrompt = "You are a conversational assistant embedded in an IT project, budget, and FinOps / Green IT platform.\n"
            . "Reply naturally, like a real chat. Adapt your tone to the question.\n"
            . "You may rephrase, ask clarifying questions, or use lists when helpful.\n"
            . "Use only data present in the JSON context below for figures and project names; do not invent facts absent from the context.\n"
            . "If the user talks about something else (greetings, small talk), respond normally without forcing budget topics.\n\n"
            .$langBlock."\n\n"
            ."Dashboard context (JSON):\n"
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
            return ['answer' => null, 'error' => 'payload_json_encode_failed'];
        }

        try {
            $response = $this->httpClient->request('POST', $apiUrl, array_merge(
                $this->outboundTlsOptions(),
                [
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'Authorization' => 'Bearer '.$apiKey,
                    ],
                    'body' => $payload,
                    'timeout' => 60,
                ]
            ));
            $status = $response->getStatusCode();
            $raw = $response->getContent(false);
        } catch (TransportExceptionInterface $e) {
            return ['answer' => null, 'error' => 'transport: '.$e->getMessage()];
        }

        if ($status < 200 || $status >= 300) {
            $snippet = \is_string($raw) ? mb_substr($raw, 0, 800) : '';

            return ['answer' => null, 'error' => 'http_'.$status.($snippet !== '' ? ': '.$snippet : '')];
        }

        if (!\is_string($raw) || $raw === '') {
            return ['answer' => null, 'error' => 'empty_response_body'];
        }

        $decoded = json_decode($raw, true);
        if (!\is_array($decoded)) {
            return ['answer' => null, 'error' => 'invalid_json: '.mb_substr($raw, 0, 400)];
        }

        $content = $decoded['choices'][0]['message']['content'] ?? null;
        if (!\is_string($content) || trim($content) === '') {
            return ['answer' => null, 'error' => 'no_choices_content: '.mb_substr($raw, 0, 400)];
        }

        return ['answer' => trim($content), 'error' => ''];
    }

    /** @param array<string, mixed> $context */
    private function buildFallbackAnswer(string $message, array $context, bool $keyConfigured, ?string $llmError, string $replyLanguage): string
    {
        $useFr = ($replyLanguage === 'fr');

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
            if ($useFr) {
                $projectLines[] = sprintf('%s (%s) — %.0f € consommés sur %.0f €', $name, $st, $c, $b);
            } else {
                $projectLines[] = sprintf('%s (%s) — %.0f € consumed of %.0f € budget', $name, $st, $c, $b);
            }
        }
        $projectsBlock = $projectLines !== [] ? implode("\n", $projectLines) : ($useFr ? 'Aucun projet dans le contexte.' : 'No projects in context.');

        $alertLines = [];
        foreach (array_slice($context['alerts'], 0, 3) as $a) {
            if (!\is_array($a)) {
                continue;
            }
            $alertLines[] = '- '.((string) ($a['title'] ?? 'Alerte')).': '.((string) ($a['message'] ?? ''));
        }
        $alertsBlock = $alertLines !== [] ? implode("\n", $alertLines) : ($useFr ? 'Aucune alerte non lue listee.' : 'No unread alerts listed.');

        $seed = abs(crc32($message)) % 4;
        if ($useFr) {
            $intros = [
                "D'apres les donnees actuelles du tableau de bord, voici ce que je peux en dire :",
                "En m'appuyant sur le snapshot projets et alertes, voici une reponse directe :",
                "Voici une synthese alignee avec vos chiffres en base :",
                "Pour repondre a votre message, je m'appuie sur l'etat suivant :",
            ];
            $body = $intros[$seed]."\n\n"
                .sprintf(
                    "Globalement : %d projet(s) au total, dont %d actif(s). Budget cumule %.2f €, consomme %.2f € (reste %.2f €, soit environ %.1f %% utilise).\n",
                    (int) $context['totalProjects'],
                    (int) $context['activeProjects'],
                    (float) $context['totalBudget'],
                    (float) $context['totalConsumed'],
                    $budgetLeft,
                    $usageRate
                )
                .'Alertes non lues (nombre) : '.(int) $context['unreadAlerts']."\n\n"
                ."Detail projets (extrait) :\n".$projectsBlock."\n\n"
                ."Alertes (extrait) :\n".$alertsBlock."\n\n";
        } else {
            $intros = [
                'From the current dashboard data, here is what I can say:',
                'Using the project and alert snapshot, a direct answer:',
                'Here is a summary aligned with your figures in the database:',
                'To answer your message, I rely on the following state:',
            ];
            $body = $intros[$seed]."\n\n"
                .sprintf(
                    "Overall: %d project(s) total, %d active. Combined budget %.2f €, consumed %.2f € (remaining %.2f €, about %.1f %% used).\n",
                    (int) $context['totalProjects'],
                    (int) $context['activeProjects'],
                    (float) $context['totalBudget'],
                    (float) $context['totalConsumed'],
                    $budgetLeft,
                    $usageRate
                )
                .'Unread alerts (count): '.(int) $context['unreadAlerts']."\n\n"
                ."Projects (excerpt):\n".$projectsBlock."\n\n"
                ."Alerts (excerpt):\n".$alertsBlock."\n\n";
        }

        return $body.$this->fallbackFooter($keyConfigured, $llmError, $useFr);
    }

    private function fallbackFooter(bool $keyConfigured, ?string $llmError, bool $useFr): string
    {
        $hint = ($this->debug && $llmError !== null && $llmError !== '')
            ? ($useFr ? ' (detail technique : '.$llmError.')' : ' (technical detail: '.$llmError.')')
            : '';

        if (!$keyConfigured) {
            return $useFr
                ? "Pour une vraie conversation (reformulations, suivi de fil, reponses ouvertes), configurez une cle API dans le backend : AI_API_KEY (et optionnellement AI_API_URL, AI_MODEL) dans backend/.env.local ou backend/.env — voir backend/.env.example. Sans cle, je ne peux pas appeler un modele de langage externe."
                : 'For a full conversational experience, configure AI_API_KEY (and optionally AI_API_URL, AI_MODEL) in backend/.env.local or backend/.env — see backend/.env.example. Without a key, I cannot call a remote language model.';
        }

        return $useFr
            ? 'Une cle API est configuree, mais l’appel au modele distant a echoue (reseau, quota, cle ou modele invalide). Verifiez backend/.env.local, redemarrez le serveur PHP, et les journaux Symfony.'.$hint
            : 'An API key is set, but the remote model call failed (network, quota, invalid key or model). Check backend/.env.local, restart the PHP server, and Symfony logs.'.$hint;
    }
}
