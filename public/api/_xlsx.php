<?php
// Genera el ranking como Excel (.xlsx) sin librerías ni extensiones de PHP: un .xlsx es un ZIP con
// unos pocos XML. Cabecera en negrilla naranja, primera fila fija, filtros, números como números
// y fechas como fechas. Los textos van como texto plano, así un nombre nunca se ejecuta como fórmula.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

function redmi_xlsx(array $partidas, bool $conTotem = false): string
{
    // Mayor puntaje primero y, en empate, la partida más reciente (igual que en el totem)
    usort($partidas, fn ($a, $b) => [$b['score'], $b['playedAt']] <=> [$a['score'], $a['playedAt']]);

    $titulos = ['Puesto', 'Nombre', 'Puntaje', 'Respuestas', 'Aciertos', 'Fecha'];
    $anchos = [9, 32, 11, 13, 11, 18];
    if ($conTotem) {
        $titulos[] = 'Totem';
        $anchos[] = 22;
    }
    $letras = range('A', 'G');
    $ultima = $letras[count($titulos) - 1];
    $filas = count($partidas) + 1;

    $texto = fn ($valor) => htmlspecialchars(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', (string) $valor), ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $celdaTexto = fn ($ref, $valor, $estilo = 0) => "<c r=\"$ref\" t=\"inlineStr\"" . ($estilo ? " s=\"$estilo\"" : '') . "><is><t xml:space=\"preserve\">{$texto($valor)}</t></is></c>";
    $celdaNumero = fn ($ref, $valor, $estilo = 0) => "<c r=\"$ref\"" . ($estilo ? " s=\"$estilo\"" : '') . "><v>$valor</v></c>";

    // Fecha como número de serie de Excel, en hora de Colombia
    $zona = new DateTimeZone('America/Bogota');
    $serie = function ($iso) use ($zona) {
        $fecha = (new DateTime($iso))->setTimezone($zona);
        return ($fecha->getTimestamp() + $fecha->getOffset()) / 86400 + 25569;
    };

    $xmlFilas = '<row r="1">';
    foreach ($titulos as $i => $titulo) $xmlFilas .= $celdaTexto($letras[$i] . '1', $titulo, 1);
    $xmlFilas .= '</row>';
    foreach (array_values($partidas) as $i => $p) {
        $r = $i + 2;
        $xmlFilas .= "<row r=\"$r\">"
            . $celdaNumero("A$r", $i + 1)
            . $celdaTexto("B$r", $p['name'])
            . $celdaNumero("C$r", (int) $p['score'])
            . $celdaNumero("D$r", (int) $p['answered'])
            . $celdaNumero("E$r", (int) $p['correct'])
            . $celdaNumero("F$r", round($serie($p['playedAt']), 8), 2)
            . ($conTotem ? $celdaTexto("G$r", $p['totem']) : '')
            . '</row>';
    }
    $cols = '';
    foreach ($anchos as $i => $ancho) $cols .= '<col min="' . ($i + 1) . '" max="' . ($i + 1) . '" width="' . $ancho . '" customWidth="1"/>';

    $ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
    $nsR = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    $cabecera = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n";

    return redmi_zip([
        '[Content_Types].xml' => $cabecera . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            . '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            . '</Types>',
        '_rels/.rels' => $cabecera . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            . '</Relationships>',
        'xl/workbook.xml' => $cabecera . "<workbook $ns $nsR><sheets><sheet name=\"Ranking\" sheetId=\"1\" r:id=\"rId1\"/></sheets>"
            . "<definedNames><definedName name=\"_xlnm._FilterDatabase\" localSheetId=\"0\" hidden=\"1\">Ranking!\$A\$1:\$$ultima\$$filas</definedName></definedNames>"
            . '</workbook>',
        'xl/_rels/workbook.xml.rels' => $cabecera . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            . '</Relationships>',
        'xl/styles.xml' => $cabecera . "<styleSheet $ns>"
            . '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/></numFmts>'
            . '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>'
            . '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FFEB641C"/><bgColor indexed="64"/></patternFill></fill></fills>'
            . '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            . '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            . '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
            . '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>'
            . '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
            . '</styleSheet>',
        'xl/worksheets/sheet1.xml' => $cabecera . "<worksheet $ns $nsR>"
            . '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
            . "<cols>$cols</cols><sheetData>$xmlFilas</sheetData><autoFilter ref=\"A1:$ultima$filas\"/>"
            . '</worksheet>',
    ]);
}

// ZIP mínimo (formato estándar) para no depender de la extensión zip del hosting.
// Comprime con deflate si está disponible zlib; si no, guarda sin comprimir.
function redmi_zip(array $archivos): string
{
    $zip = '';
    $central = '';
    [$hora, $dia] = [0, (2026 - 1980) << 9 | 1 << 5 | 1];
    foreach ($archivos as $nombre => $contenido) {
        $crc = crc32($contenido);
        $comprimido = function_exists('gzdeflate') ? gzdeflate($contenido) : false;
        [$metodo, $datos] = $comprimido === false ? [0, $contenido] : [8, $comprimido];
        $inicio = strlen($zip);
        $zip .= pack('VvvvvvVVVvv', 0x04034b50, 20, 0, $metodo, $hora, $dia, $crc, strlen($datos), strlen($contenido), strlen($nombre), 0) . $nombre . $datos;
        $central .= pack('VvvvvvvVVVvvvvvVV', 0x02014b50, 20, 20, 0, $metodo, $hora, $dia, $crc, strlen($datos), strlen($contenido), strlen($nombre), 0, 0, 0, 0, 0, $inicio) . $nombre;
    }
    return $zip . $central . pack('VvvvvVVv', 0x06054b50, 0, 0, count($archivos), count($archivos), strlen($central), strlen($zip), 0);
}
