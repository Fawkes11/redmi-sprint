<?php
// Recibe las partidas de un totem y las SUMA a las que ya tiene guardadas ese totem.
// - Identidad: la firma HMAC dice qué totem envía (cada totem tiene su propia clave).
// - Sin duplicados: cada partida tiene un id único; solo se agregan ids que el servidor no tenía.
// - Las partidas eliminadas desde el totem (excluidas.json) nunca se vuelven a aceptar; se le
//   devuelven al totem para que también las quite de su ranking local.
// - Si no hay partidas nuevas, no se escribe nada.
// - Si hay, la lista actual pasa a anterior.json (copia de seguridad) y se guarda la nueva en
//   partidas.json. El Excel se genera al descargar (exportes-admin).
// Un totem con el ranking borrado no hace perder nada: lo ya recibido nunca se elimina.
require __DIR__ . '/_comun.php';

const TAMANO_MAXIMO = 2 * 1024 * 1024;
const ENVIOS_POR_HORA = 30;
const PARTIDAS_MAXIMAS = 20000;

redmi_api_inicio();

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > TAMANO_MAXIMO) redmi_responder(413, ['error' => 'Envío demasiado grande']);
if (redmi_contar('envio:' . redmi_ip(), 3600, false) >= ENVIOS_POR_HORA) {
    redmi_responder(429, ['error' => 'Demasiados envíos, intente más tarde']);
}
redmi_contar('envio:' . redmi_ip(), 3600, true);

$cuerpo = file_get_contents('php://input', false, null, 0, TAMANO_MAXIMO + 1);
if ($cuerpo === false || $cuerpo === '' || strlen($cuerpo) > TAMANO_MAXIMO) redmi_responder(400, ['error' => 'Contenido inválido']);

$totem = redmi_totem_por_firma($cuerpo);
if ($totem === null) redmi_responder(403, ['error' => 'Clave del totem incorrecta']);

// Formato estricto: {"partidas": [{id, name, score, answered, correct, playedAt}, ...]}
$datos = json_decode($cuerpo, true);
$recibidas = $datos['partidas'] ?? null;
if (!is_array($recibidas) || count($recibidas) > PARTIDAS_MAXIMAS) redmi_responder(422, ['error' => 'Formato de ranking inválido']);
// Una partida con datos incompletos (p. ej. sin nombre) se omite y se informa; no bloquea al resto
$validas = [];
$omitidas = 0;
foreach ($recibidas as $p) {
    $ok = is_array($p)
        && is_string($p['id'] ?? null) && preg_match('/^[A-Za-z0-9-]{1,64}$/', $p['id'])
        && is_string($p['name'] ?? null) && preg_match('/^.{1,60}$/us', $p['name'])
        && is_string($p['playedAt'] ?? null) && strtotime($p['playedAt']) !== false;
    foreach (['score', 'answered', 'correct'] as $campo) {
        $ok = $ok && is_int($p[$campo] ?? null) && $p[$campo] >= 0 && $p[$campo] <= 1000000;
    }
    if (!$ok) {
        $omitidas++;
        continue;
    }
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

$excluidasEnviadas = array_keys(array_intersect_key($validas, redmi_leer_excluidas($slug)));
$validas = array_diff_key($validas, array_flip($excluidasEnviadas));
$guardadas = redmi_leer_partidas($slug);
$nuevas = array_diff_key($validas, $guardadas);

if ($nuevas) {
    $todas = $guardadas + $nuevas;
    if ($guardadas) redmi_escribir($carpeta . '/anterior.json', json_encode($guardadas, JSON_UNESCAPED_UNICODE));
    redmi_escribir($carpeta . '/partidas.json', json_encode($todas, JSON_UNESCAPED_UNICODE));
} else {
    $todas = $guardadas;
}

flock($bloqueo, LOCK_UN);
fclose($bloqueo);

redmi_responder(200, [
    'totem' => $totem, 'slug' => $slug, 'nuevas' => count($nuevas), 'total' => count($todas),
    'omitidas' => $omitidas, 'excluidas' => $excluidasEnviadas,
]);
