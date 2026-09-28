<?php
// Utilidades compartidas por exportar.php y la página de descarga. No se abre directamente.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

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

// Escritura atómica: se escribe un temporal y se renombra, así nunca queda un archivo a medias
function redmi_escribir(string $ruta, string $contenido): void
{
    $temporal = $ruta . '.tmp';
    file_put_contents($temporal, $contenido, LOCK_EX);
    chmod($temporal, 0640);
    rename($temporal, $ruta);
}

// CSV para Excel en español: punto y coma, BOM UTF-8, mayor puntaje primero y, en empate, la
// partida más reciente. Los nombres que empiezan como fórmula se neutralizan con un apóstrofo.
function redmi_csv(array $partidas, bool $conTotem = false): string
{
    usort($partidas, fn ($a, $b) => [$b['score'], $b['playedAt']] <=> [$a['score'], $a['playedAt']]);
    $celda = function ($valor) {
        $valor = (string) $valor;
        if (preg_match('/^[=+\-@\t\r]/', $valor)) $valor = "'" . $valor;
        return '"' . str_replace('"', '""', $valor) . '"';
    };
    $zona = new DateTimeZone('America/Bogota');
    $titulos = ['Puesto', 'Nombre', 'Puntaje', 'Respuestas', 'Aciertos', 'Fecha'];
    if ($conTotem) $titulos[] = 'Totem';
    $filas = [implode(';', array_map($celda, $titulos))];
    foreach (array_values($partidas) as $i => $p) {
        $fecha = (new DateTime($p['playedAt']))->setTimezone($zona)->format('d/m/Y H:i:s');
        $fila = [$i + 1, $p['name'], $p['score'], $p['answered'], $p['correct'], $fecha];
        if ($conTotem) $fila[] = $p['totem'];
        $filas[] = implode(';', array_map($celda, $fila));
    }
    return "\xEF\xBB\xBF" . implode("\r\n", $filas);
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
