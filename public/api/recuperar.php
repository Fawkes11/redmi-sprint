<?php
// Devuelve al totem TODAS sus partidas guardadas en el servidor, para sumarlas a su ranking local
// (p. ej. partidas jugadas en otra URL y exportadas, o un totem que se reemplazó).
// Seguridad: firmada con la clave del totem (solo recibe SUS partidas) y exige el PIN, validado
// con el mismo bloqueo por intentos que la página de descarga. Las eliminadas no se devuelven.
//
// Cuerpo: {"pin": "123456"}
require __DIR__ . '/_comun.php';

redmi_api_inicio();

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 4096) redmi_responder(413, ['error' => 'Envío demasiado grande']);
$cuerpo = file_get_contents('php://input', false, null, 0, 4097);
if ($cuerpo === false || $cuerpo === '') redmi_responder(400, ['error' => 'Contenido inválido']);

$totem = redmi_totem_por_firma($cuerpo);
if ($totem === null) redmi_responder(403, ['error' => 'Clave del totem incorrecta']);

$datos = json_decode($cuerpo, true);
$pin = redmi_verificar_pin($datos['pin'] ?? null);
if ($pin === 'bloqueado') redmi_responder(429, ['error' => 'Demasiados intentos. Espere unos minutos.']);
if ($pin !== 'ok') redmi_responder(401, ['error' => 'PIN incorrecto']);

$slug = redmi_slug($totem);
redmi_responder(200, ['totem' => $totem, 'partidas' => array_values(redmi_leer_partidas($slug))]);
