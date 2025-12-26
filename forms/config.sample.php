<?php

declare(strict_types=1);

// Copy this file to `config.php` and fill in the values from cPanel → Email Accounts → Connect Devices (or Email Client Configuration).
//
// Common cPanel values (confirm in your hosting panel):
// - host: mail.tjffoundation.ng (or your server hostname)
// - port: 465 (SSL) or 587 (TLS)
// - encryption: 'ssl' (465) or 'tls' (587)
// - username: info@tjffoundation.ng
// - password: the mailbox password you set in cPanel

return [
    'smtp' => [
        'host' => 'mail.tjffoundation.ng',
        'port' => 465,
        'encryption' => 'ssl', // 'ssl' | 'tls'
        'username' => 'info@tjffoundation.ng',
        'password' => 'CHANGE_ME',
    ],

    // Where messages should be delivered.
    'to' => [
        'email' => 'info@tjffoundation.ng',
        'name' => 'TJF Foundation',
    ],

    // The From identity shown in the email (must usually be a mailbox on your domain).
    'from' => [
        'email' => 'info@tjffoundation.ng',
        'name' => 'TJF Foundation Website',
    ],

    // Optional: set a reply-to so hitting Reply goes to the visitor.
    'reply_to_enabled' => true,

    // Basic anti-abuse: minimum seconds between submits per browser session.
    'rate_limit_seconds' => 15,

    // Optional: restrict allowed Origin/Host to reduce cross-site abuse.
    // Leave empty to disable.
    'allowed_hosts' => [
        // 'tjffoundation.ng',
        // 'www.tjffoundation.ng',
    ],
];
