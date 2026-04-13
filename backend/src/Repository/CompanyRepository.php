<?php

namespace App\Repository;

use App\Entity\Company;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Company>
 */
class CompanyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Company::class);
    }

    /**
     * @return list<Company>
     */
    public function search(?string $q, ?string $sector): array
    {
        $qb = $this->createQueryBuilder('c')->orderBy('c.name', 'ASC');

        if ($q !== null && '' !== trim($q)) {
            $term = '%'.mb_strtolower(trim($q)).'%';
            $qb->andWhere(
                'LOWER(c.name) LIKE :q OR LOWER(COALESCE(c.description, \'\')) LIKE :q OR LOWER(COALESCE(c.sector, \'\')) LIKE :q OR LOWER(COALESCE(c.country, \'\')) LIKE :q'
            )->setParameter('q', $term);
        }

        if ($sector !== null && '' !== trim($sector)) {
            $qb->andWhere('c.sector = :sector')->setParameter('sector', trim($sector));
        }

        /** @var list<Company> */
        return $qb->getQuery()->getResult();
    }
}
