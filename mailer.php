<?php
// ── CORS ──────────────────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Only accept POST ───────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method not allowed']);
    exit;
}

// ── Validate email ─────────────────────────────────────────────────────────
$email = isset($_POST['email']) ? trim($_POST['email']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid email']);
    exit;
}

$email     = filter_var($email, FILTER_SANITIZE_EMAIL);
$timestamp = date('Y-m-d H:i:s T');

// ── Route: contact form (has name) vs dagad signup (email only) ───────────
$is_contact = isset($_POST['name']) && trim($_POST['name']) !== '';

if ($is_contact) {
    // ── Contact form: name required, email required, message optional ─────
    $name    = strip_tags(trim($_POST['name']));
    $message = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : '';

    if ($name === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'name required']);
        exit;
    }

    // Save to contacts.txt
    $contacts_file = __DIR__ . '/contacts.txt';
    $log_line = $timestamp
        . ' | ' . $email
        . ' | ' . str_replace(["\r", "\n"], ' ', $name)
        . ' | ' . str_replace(["\r", "\n"], ' ', $message)
        . PHP_EOL;

    $saved = file_put_contents($contacts_file, $log_line, FILE_APPEND | LOCK_EX);

    if ($saved === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'could not save submission']);
        exit;
    }

    // Email notification
    $to      = 'sharmiladoedhar45@gmail.com';
    $subject = 'New kshiiteej submission — ' . mb_substr($name, 0, 60);
    $body    = "New submission from kshiiteej.com/contact\n\n"
             . "Name:  {$name}\n"
             . "Email: {$email}\n"
             . "Time:  {$timestamp}\n"
             . ($message !== '' ? "\nMessage:\n{$message}" : "\n(no message left)");
    $headers = implode("\r\n", [
        'From: kshiiteej <noreply@kshiiteej.com>',
        'Reply-To: ' . $name . ' <' . $email . '>',
        'X-Mailer: PHP/' . PHP_VERSION,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ]);

    mail($to, $subject, $body, $headers);

} else {
    // ── Dagad signup: email only ───────────────────────────────────────────
    $leads_file = __DIR__ . '/leads.txt';
    $log_line   = $timestamp . ' | ' . $email . PHP_EOL;

    $saved = file_put_contents($leads_file, $log_line, FILE_APPEND | LOCK_EX);

    if ($saved === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'could not write lead']);
        exit;
    }

    $to      = 'sharmiladoedhar45@gmail.com';
    $subject = 'New kshiiteej lead — dagad drop 01';
    $body    = "New signup from kshiiteej.com\n\nEmail: {$email}\nTime: {$timestamp}\nSource: dagad landing page";
    $headers = implode("\r\n", [
        'From: kshiiteej <noreply@kshiiteej.com>',
        'Reply-To: ' . $email,
        'X-Mailer: PHP/' . PHP_VERSION,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ]);

    mail($to, $subject, $body, $headers);
}
// mail() failure is non-fatal — submission is already saved to file

// ── Done ───────────────────────────────────────────────────────────────────
echo json_encode(['success' => true]);
