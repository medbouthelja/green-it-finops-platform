<?php

namespace App\Service;

use App\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Generates and checks 6-digit email codes (signup + login).
 * Sends email when MAILER_DSN is not null:// and MAILER_FROM is set; otherwise logs WARNING (code in logs).
 */
class VerificationCodeService
{
    private const TTL_MINUTES = 15;

    public function __construct(
        #[Autowire('%jwt_secret%')]
        private readonly string $pepper,
        private readonly LoggerInterface $logger,
        private readonly MailerInterface $mailer,
        #[Autowire('%env(MAILER_DSN)%')]
        private readonly string $mailerDsn,
        #[Autowire('%env(MAILER_FROM)%')]
        private readonly string $mailerFrom,
    ) {
    }

    public function generatePlainCode(): string
    {
        return str_pad((string) random_int(0, 999_999), 6, '0', \STR_PAD_LEFT);
    }

    public function hashCode(string $plain): string
    {
        return hash_hmac('sha256', $plain, $this->pepper);
    }

    public function verify(?string $hash, string $plain): bool
    {
        if (null === $hash || '' === $plain || 6 !== \strlen($plain)) {
            return false;
        }

        return hash_equals($hash, $this->hashCode($plain));
    }

    public function expiresAt(): \DateTimeImmutable
    {
        return new \DateTimeImmutable(sprintf('+%d minutes', self::TTL_MINUTES));
    }

    public function isExpired(?\DateTimeImmutable $expiresAt): bool
    {
        if (null === $expiresAt) {
            return true;
        }

        return $expiresAt < new \DateTimeImmutable();
    }

    public function notifySignup(User $user, string $plainCode): void
    {
        $this->logCodeFallback($user->getEmail(), $plainCode, 'signup');
        $this->trySendEmail(
            $user->getEmail(),
            'Vérification de votre compte — code à 6 chiffres',
            $this->signupBody($plainCode),
        );
    }

    public function notifyLogin(User $user, string $plainCode): void
    {
        $this->logCodeFallback($user->getEmail(), $plainCode, 'login');
        $this->trySendEmail(
            $user->getEmail(),
            'Connexion — code à 6 chiffres',
            $this->loginBody($plainCode),
        );
    }

    private function logCodeFallback(string $email, string $plainCode, string $kind): void
    {
        $this->logger->warning(\sprintf('[%s] Email verification code (configure MAILER_DSN + MAILER_FROM to receive by mail)', $kind), [
            'email' => $email,
            'code' => $plainCode,
            'expiresMinutes' => self::TTL_MINUTES,
        ]);
    }

    private function signupBody(string $code): string
    {
        $m = self::TTL_MINUTES;

        return <<<TXT
Bonjour,

Voici votre code de vérification pour finaliser votre inscription :

  {$code}

Ce code expire dans {$m} minutes.

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.

— Green IT Platform
TXT;
    }

    private function loginBody(string $code): string
    {
        $m = self::TTL_MINUTES;

        return <<<TXT
Bonjour,

Voici votre code pour terminer votre connexion :

  {$code}

Ce code expire dans {$m} minutes.

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.

— Green IT Platform
TXT;
    }

    private function trySendEmail(string $to, string $subject, string $textBody): void
    {
        if (!$this->isEmailDeliveryConfigured()) {
            $this->logger->info('Email not sent: set MAILER_DSN (real SMTP) and MAILER_FROM in backend/.env.local — see backend/README.md');

            return;
        }

        try {
            $from = Address::create($this->mailerFrom);
            $email = (new Email())
                ->from($from)
                ->to($to)
                ->subject($subject)
                ->text($textBody);

            $this->mailer->send($email);
            $this->logger->info('Verification email sent', ['to' => $to]);
        } catch (\Throwable $e) {
            $this->logger->error('Failed to send verification email: '.$e->getMessage(), ['to' => $to, 'exception' => $e]);
        }
    }

    private function isEmailDeliveryConfigured(): bool
    {
        $dsn = strtolower(trim($this->mailerDsn));

        if ('' === $dsn || str_starts_with($dsn, 'null://')) {
            return false;
        }

        return '' !== trim($this->mailerFrom);
    }
}
