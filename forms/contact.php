<?php

declare(strict_types=1);

// Contact form handler for static HTML sites hosted on cPanel.
// Requires PHPMailer installed either via Composer (preferred) or by uploading the PHPMailer folder.
//
// Install options:
// 1) Composer (preferred): composer require phpmailer/phpmailer
//    -> uploads `vendor/` and this script can require `vendor/autoload.php`
// 2) Manual upload: download PHPMailer release and upload into `forms/PHPMailer/`.

session_start();

function redirect_back(bool $ok): void {
    $target = $ok ? '../contact.html?sent=1#contact-form' : '../contact.html?sent=0#contact-form';
    header('Location: ' . $target, true, 303);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_back(false);
}

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    // Fail closed; do not output config details.
    redirect_back(false);
}

/** @var array $config */
$config = require $configFile;

// Optional host allowlist
$allowedHosts = $config['allowed_hosts'] ?? [];
if (is_array($allowedHosts) && count($allowedHosts) > 0) {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($host === '' || !in_array($host, $allowedHosts, true)) {
        redirect_back(false);
    }
}

// Rate limit per session
$minSeconds = (int)($config['rate_limit_seconds'] ?? 0);
if ($minSeconds > 0) {
    $last = (int)($_SESSION['contact_last_ts'] ?? 0);
    $now = time();
    if ($last > 0 && ($now - $last) < $minSeconds) {
        redirect_back(false);
    }
    $_SESSION['contact_last_ts'] = $now;
}

// Honeypot (bots fill hidden fields)
$honeypot = (string)($_POST['website'] ?? '');
if (trim($honeypot) !== '') {
    redirect_back(true); // pretend success to avoid bot retries
}

$name = trim((string)($_POST['name'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$subject = trim((string)($_POST['subject'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

// Basic validation
if ($name === '' || $email === '' || $message === '') {
    redirect_back(false);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_back(false);
}

// Prevent header injection / overly large payloads
$name = mb_substr($name, 0, 120);
$email = mb_substr($email, 0, 200);
$subject = mb_substr($subject !== '' ? $subject : 'Website Contact Form', 0, 160);
$message = mb_substr($message, 0, 5000);

// Load PHPMailer
$autoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoload)) {
    require $autoload;
} else {
    $phpmailerBase = __DIR__ . '/PHPMailer/src/';
    if (file_exists($phpmailerBase . 'PHPMailer.php')) {
        require $phpmailerBase . 'PHPMailer.php';
        require $phpmailerBase . 'SMTP.php';
        require $phpmailerBase . 'Exception.php';
    } else {
        redirect_back(false);
    }
}

try {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    $mail->isSMTP();
    $mail->Host = (string)($config['smtp']['host'] ?? '');
    $mail->Port = (int)($config['smtp']['port'] ?? 0);
    $mail->SMTPAuth = true;
    $mail->Username = (string)($config['smtp']['username'] ?? '');
    $mail->Password = (string)($config['smtp']['password'] ?? '');

    $enc = (string)($config['smtp']['encryption'] ?? '');
    if ($enc === 'ssl') {
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($enc === 'tls') {
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    }

    $fromEmail = (string)($config['from']['email'] ?? '');
    $fromName = (string)($config['from']['name'] ?? 'Website');
    $toEmail = (string)($config['to']['email'] ?? '');
    $toName = (string)($config['to']['name'] ?? '');

    if ($fromEmail === '' || $toEmail === '') {
        redirect_back(false);
    }

    $mail->setFrom($fromEmail, $fromName);
    $mail->addAddress($toEmail, $toName);

    if (!empty($config['reply_to_enabled'])) {
        $mail->addReplyTo($email, $name);
    }

    $mail->Subject = $subject;

    $bodyLines = [
        "New message from TJF Foundation website:",
        "",
        "Name: {$name}",
        "Email: {$email}",
        "Subject: {$subject}",
        "",
        "Message:",
        $message,
        "",
        "--",
        "Sent from contact form",
        "IP: " . (string)($_SERVER['REMOTE_ADDR'] ?? ''),
        "UA: " . (string)($_SERVER['HTTP_USER_AGENT'] ?? ''),
    ];

    $mail->Body = implode("\n", $bodyLines);

    $mail->send();
    redirect_back(true);
} catch (Throwable $e) {
    // Don't leak SMTP details.
    redirect_back(false);
}
