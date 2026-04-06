<?php

namespace App\Entity;

use App\Repository\FinOpsAppliedActionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FinOpsAppliedActionRepository::class)]
#[ORM\Table(name: 'finops_applied_actions')]
#[ORM\UniqueConstraint(name: 'finops_applied_user_key_uniq', columns: ['user_id', 'recommendation_key'])]
class FinOpsAppliedAction
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(name: 'recommendation_key', length: 160)]
    private string $recommendationKey = '';

    #[ORM\Column(length: 512)]
    private string $title = '';

    #[ORM\Column(length: 32)]
    private string $type = 'cost';

    #[ORM\Column(length: 32)]
    private string $priority = 'medium';

    #[ORM\Column(type: Types::FLOAT)]
    private float $savings = 0.0;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $appliedAt = null;

    public function __construct()
    {
        $this->appliedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getRecommendationKey(): string
    {
        return $this->recommendationKey;
    }

    public function setRecommendationKey(string $recommendationKey): static
    {
        $this->recommendationKey = $recommendationKey;

        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getPriority(): string
    {
        return $this->priority;
    }

    public function setPriority(string $priority): static
    {
        $this->priority = $priority;

        return $this;
    }

    public function getSavings(): float
    {
        return $this->savings;
    }

    public function setSavings(float $savings): static
    {
        $this->savings = $savings;

        return $this;
    }

    public function getAppliedAt(): ?\DateTimeImmutable
    {
        return $this->appliedAt;
    }

    public function setAppliedAt(\DateTimeImmutable $appliedAt): static
    {
        $this->appliedAt = $appliedAt;

        return $this;
    }
}
