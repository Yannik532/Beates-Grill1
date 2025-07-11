<?php
// ===================================
// BEATE'S GRILL - KONTAKT HANDLER
// Sicherer E-Mail-Versand
// ===================================

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// Nur POST-Requests erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Method Not Allowed');
}

// CSRF-Schutz (einfache Variante)
session_start();
if (!isset($_POST['csrf_token']) || empty($_POST['csrf_token'])) {
    http_response_code(403);
    die('CSRF token required');
}

// Für Demo-Zwecke: Akzeptiere client-generierte CSRF-Tokens
// In Produktion sollte dies server-seitig validiert werden
if (!preg_match('/^csrf_\d+_[a-zA-Z0-9]+$/', $_POST['csrf_token'])) {
    http_response_code(403);
    die('Invalid CSRF token format');
}

// Rate Limiting (einfach mit Session)
if (isset($_SESSION['last_contact']) && time() - $_SESSION['last_contact'] < 60) {
    http_response_code(429);
    die('Too many requests. Please wait 1 minute.');
}

// Input validieren und säubern
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Eingaben verarbeiten
$name = sanitizeInput($_POST['name'] ?? '');
$email = sanitizeInput($_POST['email'] ?? '');
$message = sanitizeInput($_POST['message'] ?? '');

$errors = [];

// Validierung
if (empty($name) || strlen($name) < 2) {
    $errors[] = 'Name ist erforderlich (mindestens 2 Zeichen)';
}

if (empty($email) || !validateEmail($email)) {
    $errors[] = 'Gültige E-Mail-Adresse ist erforderlich';
}

if (empty($message) || strlen($message) < 10) {
    $errors[] = 'Nachricht ist erforderlich (mindestens 10 Zeichen)';
}

// Spam-Schutz (einfache Honeypot-Prüfung)
if (!empty($_POST['website'])) {
    // Verstecktes Feld wurde ausgefüllt = Bot
    $errors[] = 'Spam detected';
}

// Bei Fehlern JSON-Response zurückgeben
if (!empty($errors)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'errors' => $errors
    ]);
    exit;
}

// E-Mail zusammenstellen
$to = 'test.strom@gmx.de'; // HIER ECHTE E-MAIL EINTRAGEN!
$subject = 'Neue Kontaktanfrage von der Website';

$emailBody = "
Neue Kontaktanfrage von der Website:

Name: $name
E-Mail: $email
Zeitpunkt: " . date('d.m.Y H:i:s') . "

Nachricht:
$message

---
Diese E-Mail wurde automatisch von beates-grill.de generiert.
IP-Adresse: " . $_SERVER['REMOTE_ADDR'] . "
";

$headers = [
    'From: noreply@beates-grill.de',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
    'Content-Type: text/plain; charset=UTF-8'
];

// E-Mail senden
if (mail($to, $subject, $emailBody, implode("\r\n", $headers))) {
    // Erfolg - Rate Limiting setzen
    $_SESSION['last_contact'] = time();
    
    // Log für Monitoring (optional)
    error_log("Contact form success: $name ($email)");
    
    // Erfolg-Response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Vielen Dank für Ihre Nachricht! Wir melden uns bald bei Ihnen.'
    ]);
} else {
    // E-Mail-Fehler
    error_log("Contact form mail error: Failed to send email");
    
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'errors' => ['E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.']
    ]);
}
?> 