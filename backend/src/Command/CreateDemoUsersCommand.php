<?php

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-demo-users',
    description: 'Crée ou met à jour admin@, manager@, techlead@ (mot de passe: password) sans toucher aux projets',
)]
class CreateDemoUsersCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $accounts = [
            ['admin@example.com', ['ROLE_ADMIN'], 'Admin', 'Demo'],
            ['manager@example.com', ['ROLE_MANAGER'], 'Sophie', 'Bernard'],
            ['techlead@example.com', ['ROLE_TECH_LEAD'], 'Alex', 'Morel'],
        ];

        foreach ($accounts as [$email, $roles, $firstName, $lastName]) {
            $user = $this->users->findOneBy(['email' => $email]);
            if (!$user instanceof User) {
                $user = new User();
                $user->setEmail($email);
            }
            $user->setRoles($roles);
            $user->setFirstName($firstName);
            $user->setLastName($lastName);
            $user->setPassword($this->passwordHasher->hashPassword($user, 'password'));
            $this->em->persist($user);
        }

        $this->em->flush();
        $output->writeln('<info>OK</info> — 3 comptes prêts (mot de passe : <comment>password</comment>).');

        return Command::SUCCESS;
    }
}
