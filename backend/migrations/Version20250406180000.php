<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * For databases that never received the companies table (POST /api/companies → 500).
 * If companies already exists (e.g. doctrine:schema:update), this migration does nothing.
 */
final class Version20250406180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Companies table and company_id columns (PostgreSQL, legacy DBs)';
    }

    public function up(Schema $schema): void
    {
        $conn = $this->connection;
        if ('postgresql' !== $conn->getDatabasePlatform()->getName()) {
            $this->abortIf(true, 'This migration targets PostgreSQL only.');
        }

        if ($conn->fetchOne("SELECT to_regclass('public.companies')")) {
            return;
        }

        $this->addSql('CREATE TABLE companies (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, sector VARCHAR(120) DEFAULT NULL, country VARCHAR(120) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');

        if ($conn->fetchOne("SELECT to_regclass('public.users')")) {
            $this->addSql('ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL');
            $this->addSql('ALTER TABLE users ADD CONSTRAINT fk_greenit_users_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        }

        if ($conn->fetchOne("SELECT to_regclass('public.projects')")) {
            $this->addSql('ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL');
            $this->addSql("INSERT INTO companies (name, created_at) VALUES ('Default organization', CURRENT_TIMESTAMP)");
            $this->addSql('UPDATE projects SET company_id = (SELECT id FROM companies ORDER BY id ASC LIMIT 1) WHERE company_id IS NULL');
            $this->addSql('ALTER TABLE projects ALTER COLUMN company_id SET NOT NULL');
            $this->addSql('ALTER TABLE projects ADD CONSTRAINT fk_greenit_projects_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        }
    }

    public function down(Schema $schema): void
    {
    }
}
