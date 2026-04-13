<?php

namespace App\DataFixtures;

use App\Entity\Alert;
use App\Entity\CloudConsumption;
use App\Entity\Company;
use App\Entity\FinOpsRecommendation;
use App\Entity\GreenMetric;
use App\Entity\Project;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $acme = new Company();
        $acme->setName('Acme Green IT');
        $acme->setDescription('Client pilote — transformation cloud et sobriété numérique.');
        $acme->setSector('Technology');
        $acme->setCountry('France');
        $manager->persist($acme);

        $globex = new Company();
        $globex->setName('Globex Industries');
        $globex->setDescription('Groupe industriel — projets FinOps multi-sites.');
        $globex->setSector('Manufacturing');
        $globex->setCountry('Belgium');
        $manager->persist($globex);

        $manager->flush();

        $admin = new User();
        $admin->setEmail('admin@example.com');
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'password'));
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setFirstName('Admin');
        $admin->setLastName('Demo');
        $manager->persist($admin);

        $managerUser = new User();
        $managerUser->setEmail('manager@example.com');
        $managerUser->setPassword($this->passwordHasher->hashPassword($managerUser, 'password'));
        $managerUser->setRoles(['ROLE_MANAGER']);
        $managerUser->setFirstName('Sophie');
        $managerUser->setLastName('Bernard');
        $managerUser->setCompany($acme);
        $manager->persist($managerUser);

        $techLead = new User();
        $techLead->setEmail('techlead@example.com');
        $techLead->setPassword($this->passwordHasher->hashPassword($techLead, 'password'));
        $techLead->setRoles(['ROLE_TECH_LEAD']);
        $techLead->setFirstName('Alex');
        $techLead->setLastName('Morel');
        $techLead->setCompany($acme);
        $manager->persist($techLead);

        $manager->flush();

        $projectsData = [
            [
                'name' => 'Migration Cloud AWS',
                'description' => 'Migration de l\'infrastructure vers AWS',
                'status' => 'active',
                'methodology' => 'scrum',
                'budget' => 120000,
                'consumed' => 78000,
                'progress' => 65,
                'tjm' => 650,
                'start' => '2024-01-15',
                'end' => '2024-06-30',
                'team' => [
                    ['id' => 1, 'name' => 'Jean Dupont', 'role' => 'Tech Lead'],
                    ['id' => 2, 'name' => 'Marie Martin', 'role' => 'Développeur'],
                    ['id' => 3, 'name' => 'Pierre Durand', 'role' => 'Chef de projet'],
                ],
            ],
            [
                'name' => 'Refonte Application Web',
                'description' => 'Refonte complète de l\'application web',
                'status' => 'active',
                'methodology' => 'cycle-v',
                'budget' => 80000,
                'consumed' => 36000,
                'progress' => 45,
                'tjm' => 600,
                'start' => '2024-02-01',
                'end' => '2024-08-31',
                'team' => [],
            ],
            [
                'name' => 'Optimisation Infrastructure',
                'description' => 'Optimisation de l\'infrastructure existante',
                'status' => 'active',
                'methodology' => 'scrum',
                'budget' => 50000,
                'consumed' => 45000,
                'progress' => 90,
                'tjm' => 700,
                'start' => '2024-01-01',
                'end' => '2024-04-30',
                'team' => [],
                'company' => $globex,
            ],
        ];

        foreach ($projectsData as $row) {
            $p = new Project();
            $p->setName($row['name']);
            $p->setDescription($row['description']);
            $p->setStatus($row['status']);
            $p->setMethodology($row['methodology']);
            $p->setBudget($row['budget']);
            $p->setConsumed($row['consumed']);
            $p->setProgress($row['progress']);
            $p->setTjm($row['tjm']);
            $p->setStartDate(new \DateTimeImmutable($row['start']));
            $p->setEndDate(new \DateTimeImmutable($row['end']));
            $p->setTeam($row['team']);
            $p->setOwner($admin);
            $p->setCompany($row['company'] ?? $acme);
            $manager->persist($p);
            $manager->flush();

            $gm = new GreenMetric();
            $gm->setProject($p);
            $gm->setEnergyEfficiency(85);
            $gm->setRenewableEnergy(60);
            $manager->persist($gm);

            $months = [
                ['m' => 'Jan', 'cpu' => 120, 'st' => 500, 'net' => 80, 'cost' => 2500],
                ['m' => 'Fév', 'cpu' => 135, 'st' => 520, 'net' => 85, 'cost' => 2650],
                ['m' => 'Mar', 'cpu' => 140, 'st' => 540, 'net' => 90, 'cost' => 2800],
                ['m' => 'Avr', 'cpu' => 130, 'st' => 530, 'net' => 88, 'cost' => 2700],
                ['m' => 'Mai', 'cpu' => 125, 'st' => 510, 'net' => 82, 'cost' => 2550],
                ['m' => 'Juin', 'cpu' => 120, 'st' => 500, 'net' => 80, 'cost' => 2500],
            ];
            foreach ($months as $mo) {
                $c = new CloudConsumption();
                $c->setProject($p);
                $c->setMonth($mo['m']);
                $c->setCpu($mo['cpu']);
                $c->setStorage($mo['st']);
                $c->setNetwork($mo['net']);
                $c->setCost($mo['cost']);
                $manager->persist($c);
            }

            $recs = [
                ['cost', 'Optimiser les instances inactives', 'Arrêter des instances non utilisées', 450, 'high'],
                ['green', 'Migrer vers régions renouvelables', 'Déplacer les ressources', 200, 'medium'],
                ['cost', 'Réduire la taille des instances', 'Downsizing', 300, 'medium'],
            ];
            foreach ($recs as $r) {
                $rec = new FinOpsRecommendation();
                $rec->setProject($p);
                $rec->setType($r[0]);
                $rec->setTitle($r[1]);
                $rec->setDescription($r[2]);
                $rec->setSavings($r[3]);
                $rec->setPriority($r[4]);
                $manager->persist($rec);
            }

            $alert = new Alert();
            $alert->setProject($p);
            $alert->setTitle('Budget à surveiller');
            $alert->setMessage('Le projet '.$p->getName().' approche du seuil de consommation.');
            $alert->setType('warning');
            $alert->setRead(false);
            $manager->persist($alert);
        }

        $manager->flush();
    }
}
