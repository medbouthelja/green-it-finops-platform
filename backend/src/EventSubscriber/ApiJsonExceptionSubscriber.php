<?php

namespace App\EventSubscriber;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Return JSON for unhandled exceptions on /api so the SPA can show the real message
 * instead of parsing Symfony's HTML error page (which yields "Request failed with status code 500").
 */
final class ApiJsonExceptionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Autowire('%kernel.debug%')]
        private readonly bool $debug,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        // Before ErrorListener (-128) so the HTML error response is never built for /api.
        return [KernelEvents::EXCEPTION => ['onKernelException', 0]];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $request = $event->getRequest();
        if (!$this->isApiRequest($request)) {
            return;
        }

        $throwable = $event->getThrowable();
        $status = Response::HTTP_INTERNAL_SERVER_ERROR;
        if ($throwable instanceof HttpExceptionInterface) {
            $status = $throwable->getStatusCode();
        }

        $message = $throwable->getMessage();
        if ('' === $message) {
            $message = Response::$statusTexts[$status] ?? 'Error';
        }

        $payload = ['message' => $message];
        if ($this->debug) {
            $payload['exception'] = $throwable::class;
            $payload['file'] = $throwable->getFile();
            $payload['line'] = $throwable->getLine();
        }

        $event->setResponse(new JsonResponse($payload, $status));
    }

    private function isApiRequest(Request $request): bool
    {
        $path = $request->getPathInfo() ?? '';

        return str_starts_with($path, '/api');
    }
}
