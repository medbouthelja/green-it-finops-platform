<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Http\Authorization\AccessDeniedHandlerInterface;

/**
 * Réponses JSON pour l’API quand IsGranted échoue (ex. entreprises réservées à ROLE_ADMIN).
 */
class AccessDeniedJsonHandler implements AccessDeniedHandlerInterface
{
    public function handle(Request $request, AccessDeniedException $accessDeniedException): ?Response
    {
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return null;
        }

        return new JsonResponse(
            [
                'message' => 'This action requires administrator privileges.',
            ],
            Response::HTTP_FORBIDDEN
        );
    }
}
