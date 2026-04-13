<?php

namespace App\Repository;

use App\Entity\Project;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Project>
 */
class ProjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Project::class);
    }

    /**
     * @return list<Project>
     */
    public function findForUser(User $user): array
    {
        if (\in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return $this->findBy([], ['id' => 'DESC']);
        }

        $company = $user->getCompany();
        if (null === $company) {
            return [];
        }

        return $this->findBy(['company' => $company], ['id' => 'DESC']);
    }
}
