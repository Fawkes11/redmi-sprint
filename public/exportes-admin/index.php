<?php
// Descarga de los rankings de los totems, protegida con PIN de 6 dígitos.
// Un archivo por totem (actual + anterior como copia de seguridad) y un consolidado de todos.
// Seguridad: PIN guardado como hash, bloqueo por IP tras 5 intentos fallidos (15 min) y bloqueo
// general tras 30 fallos en una hora (frena ataques repartidos), sesión que expira a los 30 min.
require __DIR__ . '/../api/_comun.php';

const INTENTOS_POR_IP = 5;
const INTENTOS_GLOBALES = 30;
const BLOQUEO = 900;
const SESION = 1800;

// Fechas en hora de Colombia (lista y nombre del archivo descargado)
date_default_timezone_set('America/Bogota');

$https = ($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off';
session_set_cookie_params(['lifetime' => 0, 'path' => dirname($_SERVER['SCRIPT_NAME']) . '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_name('redmi_admin');
session_start();

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'");

// Totems configurados, por su carpeta (slug) => nombre
$totems = [];
foreach (redmi_totems() as $nombre) $totems[redmi_slug($nombre)] = $nombre;

$marcado = isset($totems[$_GET['totem'] ?? '']) ? $_GET['totem'] : '';
$autenticado = isset($_SESSION['desde']) && time() - $_SESSION['desde'] < SESION;
$error = '';

if (isset($_POST['salir'])) {
    session_destroy();
    header('Location: ./');
    exit;
}

if (!$autenticado && isset($_POST['pin'])) {
    $ip = redmi_ip();
    if (redmi_contar('pin:' . $ip, BLOQUEO, false) >= INTENTOS_POR_IP || redmi_contar('pin:*', 3600, false) >= INTENTOS_GLOBALES) {
        $error = 'Demasiados intentos. Espere unos minutos e intente de nuevo.';
    } elseif (preg_match('/^\d{6}$/', $_POST['pin']) && password_verify($_POST['pin'], redmi_config()['pin_hash'])) {
        redmi_limpiar('pin:' . $ip);
        session_regenerate_id(true);
        $_SESSION['desde'] = time();
        header('Location: ./' . ($marcado ? '?totem=' . $marcado : ''));
        exit;
    } else {
        redmi_contar('pin:' . $ip, BLOQUEO, true);
        redmi_contar('pin:*', 3600, true);
        $error = 'PIN incorrecto.';
    }
}

function enviar_csv(string $contenido, string $nombre): void
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $nombre . '"');
    header('Content-Length: ' . strlen($contenido));
    echo $contenido;
    exit;
}

$lista = [];
if ($autenticado) {
    $sello = date('Y-m-d-Hi');

    // Consolidado: la unión de las partidas de todos los totems, con una columna "Totem"
    if (isset($_GET['consolidado'])) {
        $todas = [];
        foreach ($totems as $slug => $nombre) {
            foreach (redmi_leer_partidas($slug) as $p) $todas[] = $p + ['totem' => $nombre];
        }
        enviar_csv(redmi_csv($todas, true), "ranking-redmi-consolidado-$sello.csv");
    }

    // Archivo de un totem: solo slugs configurados y solo "actual" o "anterior" (sin rutas libres)
    $slug = $_GET['descargar'] ?? '';
    $version = ($_GET['version'] ?? '') === 'anterior' ? 'anterior' : 'actual';
    if (isset($totems[$slug]) && is_file($ruta = redmi_carpeta() . "/$slug/$version.csv")) {
        enviar_csv(file_get_contents($ruta), "ranking-redmi-$slug" . ($version === 'anterior' ? '-anterior' : '') . "-$sello.csv");
    }

    foreach ($totems as $slug => $nombre) {
        $actual = redmi_carpeta() . "/$slug/actual.csv";
        $lista[] = [
            'slug' => $slug,
            'nombre' => $nombre,
            'jugadores' => count(redmi_leer_partidas($slug)),
            'fecha' => is_file($actual) ? filemtime($actual) : null,
            'anterior' => is_file(redmi_carpeta() . "/$slug/anterior.csv"),
        ];
    }
}

$e = fn ($texto) => htmlspecialchars((string) $texto, ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Rankings · Trivia REDMI</title>
<style>
  :root { --deep: #eb641c; --light: #f5a746; --ink: #444; --paper: #fafafa; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; font-family: system-ui, sans-serif; color: var(--ink);
         background: linear-gradient(180deg, var(--light), var(--deep)); display: flex; justify-content: center; align-items: flex-start; padding: 24px 16px; }
  main { width: 100%; max-width: 560px; background: var(--paper); border-radius: 20px; padding: 28px 24px; box-shadow: 0 4px 40px rgb(0 0 0 / .15); }
  h1 { margin: 0 0 4px; font-size: 26px; background: linear-gradient(90deg, var(--deep), var(--light)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { margin: 0 0 18px; }
  input { width: 100%; font-size: 32px; letter-spacing: 12px; text-align: center; padding: 14px; border: 2px solid var(--light); border-radius: 14px; color: var(--deep); background: #fff; }
  button, .boton { display: block; width: 100%; margin-top: 14px; padding: 14px; border: 0; border-radius: 14px; font-size: 18px; font-weight: 700;
                   color: #fff; text-align: center; text-decoration: none; background: linear-gradient(90deg, var(--deep), var(--light)); cursor: pointer; }
  .error { color: #eb1c1f; font-weight: 600; margin: 12px 0 0; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 14px 0; border-bottom: 1px solid #eee; }
  li.actual { background: #fff3e8; border-radius: 12px; padding: 14px 12px; }
  .fila { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .fila .boton { width: auto; margin: 0; padding: 10px 16px; font-size: 15px; }
  .copia { display: inline-block; margin-top: 6px; font-size: 14px; color: var(--deep); }
  small { color: #888; }
  .salir { background: none; color: var(--ink); font-weight: 600; font-size: 15px; }
</style>
</head>
<body>
<main>
<?php if (!$autenticado): ?>
  <h1>Rankings de la trivia</h1>
  <p>Ingrese el PIN de 6 dígitos para descargar.</p>
  <form method="post" action="./<?= $marcado ? '?totem=' . $e($marcado) : '' ?>">
    <input name="pin" inputmode="numeric" pattern="\d{6}" maxlength="6" autocomplete="off" required autofocus aria-label="PIN">
    <button type="submit">ENTRAR</button>
    <?php if ($error): ?><p class="error"><?= $e($error) ?></p><?php endif ?>
  </form>
<?php else: ?>
  <h1>Rankings por totem</h1>
  <p><small>Cada archivo tiene todas las partidas del totem. Hora de Colombia.</small></p>
  <ul>
    <?php foreach ($lista as $t): ?>
      <li class="<?= $t['slug'] === $marcado ? 'actual' : '' ?>">
        <div class="fila">
          <span><strong><?= $e($t['nombre']) ?></strong><br>
            <small><?= $t['fecha'] ? $e($t['jugadores'] . ' jugadores · ' . date('d/m/Y H:i', $t['fecha'])) : 'Sin exportaciones aún' ?></small></span>
          <?php if ($t['fecha']): ?><a class="boton" href="./?descargar=<?= $e($t['slug']) ?>">Descargar</a><?php endif ?>
        </div>
        <?php if ($t['anterior']): ?>
          <a class="copia" href="./?descargar=<?= $e($t['slug']) ?>&amp;version=anterior">Copia de seguridad (exportación anterior)</a>
        <?php endif ?>
      </li>
    <?php endforeach ?>
  </ul>
  <a class="boton" href="./?consolidado=1">Descargar todo consolidado</a>
  <form method="post"><button class="salir" name="salir" value="1">Cerrar sesión</button></form>
<?php endif ?>
</main>
</body>
</html>
