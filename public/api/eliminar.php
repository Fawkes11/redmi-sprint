<?php
// Elimina partidas de un totem desde el propio totem (modo administración).
// Seguridad: la petición va firmada con la clave del totem (solo puede tocar SUS partidas) y exige
// el PIN de 6 dígitos, validado aquí con el mismo bloqueo que la página de descarga.
// Las partidas no se borran del todo: pasan a excluidas.json (con fecha) y ya no se vuelven a
// aceptar aunque el totem u otro envío las mande de nuevo. Se pueden restaurar desde ese archivo.
//
// Cuerpo: {"pin": "123456", "ids": ["id1", "id2"]}. Con "ids" vacío solo comprueba el PIN
// (para entrar al modo administración).
require __DIR__ . '/_comun.php';

const IDS_MAXIMOS = 500;

redmi_api_inicio();

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 64 * 1024) redmi_responder(413, ['error' => 'Envío demasiado grande']);
$cuerpo = file_get_contents('php://input', false, null, 0, 64 * 1024 + 1);
if ($cuerpo === false || $cuerpo === '') redmi_responder(400, ['error' => 'Contenido inválido']);

$totem = redmi_totem_por_firma($cuerpo);
if ($totem === null) redmi_responder(403, ['error' => 'Clave del totem incorrecta']);

$datos = json_decode($cuerpo, true);
$ids = $datos['ids'] ?? null;
if (!is_array($ids) || count($ids) > IDS_MAXIMOS) redmi_responder(422, ['error' => 'Solicitud inválida']);
foreach ($ids as $id) {
    if (!is_string($id) || !preg_match('/^[A-Za-z0-9-]{1,64}$/', $id)) redmi_responder(422, ['error' => 'Solicitud inválida']);
}

$pin = redmi_verificar_pin($datos['pin'] ?? null);
if ($pin === 'bloqueado') redmi_responder(429, ['error' => 'Demasiados intentos. Espere unos minutos.']);
if ($pin !== 'ok') redmi_responder(401, ['error' => 'PIN incorrecto']);

if (!$ids) redmi_responder(200, ['totem' => $totem, 'eliminadas' => 0]);

$slug = redmi_slug($totem);
$carpeta = redmi_carpeta_totem($slug);
$bloqueo = fopen($carpeta . '/.bloqueo', 'c');
flock($bloqueo, LOCK_EX);

$partidas = redmi_leer_partidas($slug);
$excluidas = redmi_leer_excluidas($slug);
$ahora = (new DateTime('now', new DateTimeZone('America/Bogota')))->format('c');
foreach ($ids as $id) {
    // Aunque el servidor aún no la tenga (no se había exportado), queda excluida para el futuro
    $excluidas[$id] = [
        'name' => $partidas[$id]['name'] ?? null,
        'score' => $partidas[$id]['score'] ?? null,
        'eliminada' => $ahora,
    ];
}
$quedan = array_diff_key($partidas, array_flip($ids));
if (count($quedan) !== count($partidas)) {
    redmi_escribir($carpeta . '/anterior.json', json_encode($partidas, JSON_UNESCAPED_UNICODE));
    redmi_escribir($carpeta . '/partidas.json', json_encode($quedan, JSON_UNESCAPED_UNICODE));
}
redmi_escribir($carpeta . '/excluidas.json', json_encode($excluidas, JSON_UNESCAPED_UNICODE));

flock($bloqueo, LOCK_UN);
fclose($bloqueo);

redmi_responder(200, ['totem' => $totem, 'eliminadas' => count($ids), 'total' => count($quedan)]);
