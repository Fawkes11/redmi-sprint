<?php
// Utilidades compartidas por exportar.php y la página de descarga. No se abre directamente.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

// Avisos de PHP (p. ej. en otra versión del servidor) al registro de errores, nunca en la respuesta:
// un aviso impreso antes del JSON hace que el totem no pueda leerla
ini_set('display_errors', '0');

// La configuración vive FUERA de la carpeta pública del subdominio (no hay URL que llegue a ella):
// /home/<usuario>/redmi-config/config.php, al lado de la carpeta del subdominio.
function redmi_config(): array
{
    static $config = null;
    if ($config !== null) return $config;
    $ruta = dirname($_SERVER['DOCUMENT_ROOT']) . '/redmi-config/config.php';
    if (!is_file($ruta)) {
        http_response_code(500);
        exit('Servidor sin configurar: falta redmi-config/config.php');
    }
    $config = require $ruta;
    return $config;
}

// Carpeta privada de los rankings (también fuera de la carpeta pública)
function redmi_carpeta(): string
{
    $carpeta = redmi_config()['carpeta_exportes'] ?? dirname($_SERVER['DOCUMENT_ROOT']) . '/redmi-exportes';
    if (!is_dir($carpeta)) mkdir($carpeta, 0750, true);
    return $carpeta;
}

// Totems configurados: clave => nombre. El nombre en minúsculas y sin tildes es su carpeta.
function redmi_totems(): array
{
    return redmi_config()['totems'] ?? [];
}

function redmi_slug(string $nombre): string
{
    // Tabla explícita (iconv con TRANSLIT da resultados distintos según el servidor)
    $sinTildes = strtr($nombre, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
        'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ü' => 'u', 'Ñ' => 'n',
        'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u', 'ç' => 'c',
    ]);
    return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($sinTildes)), '-') ?: 'totem';
}

function redmi_carpeta_totem(string $slug): string
{
    $carpeta = redmi_carpeta() . '/' . $slug;
    if (!is_dir($carpeta)) mkdir($carpeta, 0750, true);
    return $carpeta;
}

// Partidas guardadas de un totem (unión de todo lo recibido), indexadas por id de partida
function redmi_leer_partidas(string $slug): array
{
    $ruta = redmi_carpeta_totem($slug) . '/partidas.json';
    return is_file($ruta) ? (json_decode(file_get_contents($ruta), true) ?: []) : [];
}

// Partidas eliminadas desde el totem: id => {name, score, eliminada}. Nunca se vuelven a aceptar.
function redmi_leer_excluidas(string $slug): array
{
    $ruta = redmi_carpeta_totem($slug) . '/excluidas.json';
    return is_file($ruta) ? (json_decode(file_get_contents($ruta), true) ?: []) : [];
}

// Qué totem firmó el cuerpo: el que tenga la clave con la que coincide la firma HMAC (o null)
function redmi_totem_por_firma(string $cuerpo): ?string
{
    $firma = strtolower($_SERVER['HTTP_X_FIRMA'] ?? '');
    if (!preg_match('/^[0-9a-f]{64}$/', $firma)) return null;
    foreach (redmi_totems() as $clave => $nombre) {
        if (hash_equals(hash_hmac('sha256', $cuerpo, $clave), $firma)) return $nombre;
    }
    return null;
}

// PIN de 6 dígitos con bloqueo: 5 fallos por IP en 15 min o 30 fallos en total en una hora.
// Lo usan la página de descarga y la administración del totem (mismos contadores).
// Devuelve 'ok', 'incorrecto' o 'bloqueado'.
function redmi_verificar_pin($pin): string
{
    $ip = redmi_ip();
    if (redmi_contar('pin:' . $ip, 900, false) >= 5 || redmi_contar('pin:*', 3600, false) >= 30) return 'bloqueado';
    if (is_string($pin) && preg_match('/^\d{6}$/', $pin) && password_verify($pin, redmi_config()['pin_hash'])) {
        redmi_limpiar('pin:' . $ip);
        return 'ok';
    }
    redmi_contar('pin:' . $ip, 900, true);
    redmi_contar('pin:*', 3600, true);
    return 'incorrecto';
}

// Cabeceras y respuesta de los endpoints que usa el totem. Se permite cualquier origen porque el
// paquete local (index.html abierto como archivo) tiene origen "null"; la autorización es la firma.
function redmi_api_inicio(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Firma');
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') redmi_responder(204, []);
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') redmi_responder(405, ['error' => 'Método no permitido']);
}

function redmi_responder(int $codigo, array $datos): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Escritura atómica: se escribe un temporal y se renombra, así nunca queda un archivo a medias
function redmi_escribir(string $ruta, string $contenido): void
{
    $temporal = $ruta . '.tmp';
    file_put_contents($temporal, $contenido, LOCK_EX);
    chmod($temporal, 0640);
    rename($temporal, $ruta);
}

// IP real del cliente: solo REMOTE_ADDR (las cabeceras tipo X-Forwarded-For se pueden falsificar)
function redmi_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
}

// Contador por clave en una ventana de tiempo, guardado en disco con bloqueo.
// Devuelve cuántos eventos hay en la ventana; si $sumar, registra uno nuevo.
function redmi_contar(string $clave, int $ventana, bool $sumar): int
{
    $archivo = redmi_carpeta() . '/.limites.json';
    $fp = fopen($archivo, 'c+');
    flock($fp, LOCK_EX);
    $datos = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
    $ahora = time();
    foreach ($datos as $k => $marcas) {
        $datos[$k] = array_values(array_filter($marcas, fn ($t) => $t > $ahora - 86400));
        if (!$datos[$k]) unset($datos[$k]);
    }
    $enVentana = count(array_filter($datos[$clave] ?? [], fn ($t) => $t > $ahora - $ventana));
    if ($sumar) {
        $datos[$clave][] = $ahora;
        $enVentana++;
    }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($datos));
    flock($fp, LOCK_UN);
    fclose($fp);
    return $enVentana;
}

function redmi_limpiar(string $clave): void
{
    $archivo = redmi_carpeta() . '/.limites.json';
    $fp = fopen($archivo, 'c+');
    flock($fp, LOCK_EX);
    $datos = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
    unset($datos[$clave]);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($datos));
    flock($fp, LOCK_UN);
    fclose($fp);
}
