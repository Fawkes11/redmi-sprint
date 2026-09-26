// Genera el paquete para los totems: dist-kiosko/ con index.html (app completa en un archivo)
// + "Iniciar Trivia.bat", y lo comprime en Trivia-REDMI.zip.
import { execSync } from 'node:child_process'
import { copyFileSync, rmSync } from 'node:fs'

const OUT = 'dist-kiosko'
const ZIP = 'Trivia-REDMI.zip'

execSync('npm run questions', { stdio: 'inherit' })
execSync('npx vite build --mode kiosko', { stdio: 'inherit' })
copyFileSync('kiosko/Iniciar Trivia.bat', `${OUT}/Iniciar Trivia.bat`)

rmSync(ZIP, { force: true })
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${OUT}/*' -DestinationPath '${ZIP}'"`, { stdio: 'inherit' })
console.log(`\nPaquete listo: ${ZIP}  (descomprimir en una ruta fija, p. ej. C:\\Trivia-REDMI)`)
