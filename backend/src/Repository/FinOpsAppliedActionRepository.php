<?php

namespace App\Repository;

use App\Entity\FinOpsAppliedAction;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<FinOpsAppliedAction>
 */
class FinOpsAppliedActionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FinOpsAppliedAction::class);
    }
}
