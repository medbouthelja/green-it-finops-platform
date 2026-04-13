<?php

namespace App\Service;

use App\Entity\Project;
use App\Entity\User;

class ProjectAccessService
{
    public function canAccess(?User $user, Project $project): bool
    {
        if (!$user instanceof User) {
            return false;
        }

        if (\in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return true;
        }

        $userCompany = $user->getCompany();
        $projectCompany = $project->getCompany();

        if (null === $userCompany || null === $projectCompany) {
            return false;
        }

        return $userCompany->getId() === $projectCompany->getId();
    }
}
