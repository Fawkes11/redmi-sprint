<?php
// Recibe las partidas de un totem y las SUMA a las que ya tiene guardadas ese totem.
// - Identidad: la firma HMAC dice qué totem envía (cada totem tiene su propia clave).
// - Sin duplicados: cada partida tiene un id único; solo se agregan ids que el servidor no tenía.
// - Si no hay partidas nuevas, no se escribe nada.
// - Si hay, el actual.csv pasa a anterior.csv (copia de seguridad) y se regenera actual.csv.
// Un totem con el ranking borrado no hace perder nada: lo ya recibido nunca se elimina.
require __DIR__ . '/_comun.php';

const TAMANO_MAXIMO = 2 * 1024 * 1024;
const ENVIOS_POR_HORA = 30;
const PARTIDAS_MAXIMAS = 20000;

// El paquete local (index.html abierto como archivo) tiene origen "null": se permite cualquier origen
// porque la autorización real es la firma, no el origen.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Firma');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function responder(int $codigo, array $datos): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') responder(204, []);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(405, ['error' => 'Método no permitido']);

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > TAMANO_MAXIMO) responder(413, ['error' => 'Envío demasiado grande']);
if (redmi_contar('envio:' . redmi_ip(), 3600, false) >= ENVIOS_POR_HORA) {
    responder(429, ['error' => 'Demasiados envíos, intente más tarde']);
}
redmi_contar('envio:' . redmi_ip(), 3600, true);

$cuerpo = file_get_contents('php://input', false, null, 0, TAMANO_MAXIMO + 1);
if ($cuerpo === false || $cuerpo === '' || strlen($cuerpo) > TAMANO_MAXIMO) responder(400, ['error' => 'Contenido inválido']);

// Qué totem es: el que tenga la clave con la que coincide la firma
$firma = strtolower($_SERVER['HTTP_X_FIRMA'] ?? '');
$totem = null;
if (preg_match('/^[0-9a-f]{64}$/', $firma)) {
    foreach (redmi_totems() as $clave => $nombre) {
        if (hash_equals(hash_hmac('sha256', $cuerpo, $clave), $firma)) $totem = $nombre;
    }
}
if ($totem === null) responder(403, ['error' => 'Clave del totem incorrecta']);

// Formato estricto: {"partidas": [{id, name, score, answered, correct, playedAt}, ...]}
$datos = json_decode($cuerpo, true);
$recibidas = $datos['partidas'] ?? null;
if (!is_array($recibidas) || count($recibidas) > PARTIDAS_MAXIMAS) responder(422, ['error' => 'Formato de ranking inválido']);
$validas = [];
foreach ($recibidas as $p) {
    $ok = is_array($p)
        && is_string($p['id'] ?? null) && preg_match('/^[A-Za-z0-9-]{1,64}$/', $p['id'])
        && is_string($p['name'] ?? null) && preg_match('/^.{1,60}$/us', $p['name'])
        && is_string($p['playedAt'] ?? null) && strtotime($p['playedAt']) !== false;
    foreach (['score', 'answered', 'correct'] as $campo) {
        $ok = $ok && is_int($p[$campo] ?? null) && $p[$campo] >= 0 && $p[$campo] <= 1000000;
    }
    if (!$ok) responder(422, ['error' => 'Partida inválida']);
    $validas[$p['id']] = [
        'id' => $p['id'], 'name' => $p['name'], 'score' => $p['score'],
        'answered' => $p['answered'], 'correct' => $p['correct'], 'playedAt' => $p['playedAt'],
    ];
}

// Comparar con lo guardado y sumar solo lo nuevo (lo ya guardado no se modifica)
$slug = redmi_slug($totem);
$carpeta = redmi_carpeta_totem($slug);
$bloqueo = fopen($carpeta . '/.bloqueo', 'c');
flock($bloqueo, LOCK_EX);

$guardadas = redmi_leer_partidas($slug);
$nuevas = array_diff_key($validas, $guardadas);

if ($nuevas) {
    $todas = $guardadas + $nuevas;
    if (is_file($carpeta . '/actual.csv')) rename($carpeta . '/actual.csv', $carpeta . '/anterior.csv');
    redmi_escribir($carpeta . '/actual.csv', redmi_csv(array_values($todas)));
    redmi_escribir($carpeta . '/partidas.json', json_encode($todas, JSON_UNESCAPED_UNICODE));
} else {
    $todas = $guardadas;
}

flock($bloqueo, LOCK_UN);
fclose($bloqueo);

responder(200, ['totem' => $totem, 'slug' => $slug, 'nuevas' => count($nuevas), 'total' => count($todas)]);
