// Genera los paquetes para los totems a partir de un único build (index.html con toda la app):
//   Trivia-REDMI.zip             → index.html + "Iniciar Trivia.bat" (con efectos especiales)
//   Trivia-REDMI-sin-efectos.zip → index.html + "Iniciar Trivia (sin efectos).bat" (?efectos=no)
// Ambos comparten el ranking: Edge guarda el mismo almacenamiento para todos los archivos locales.
import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, rmSync } from 'node:fs'

const OUT = 'dist-kiosko'
const PACKAGES = [
  { zip: 'Trivia-REDMI.zip', bat: 'Iniciar Trivia.bat' },
  { zip: 'Trivia-REDMI-sin-efectos.zip', bat: 'Iniciar Trivia (sin efectos).bat' },
]

execSync('npm run questions', { stdio: 'inherit' })
execSync('npx vite build --mode kiosko', { stdio: 'inherit' })

for (const { zip, bat } of PACKAGES) {
  const dir = `${OUT}/${zip.replace('.zip', '')}`
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  copyFileSync(`${OUT}/index.html`, `${dir}/index.html`)
  copyFileSync(`kiosko/${bat}`, `${dir}/${bat}`)
  rmSync(zip, { force: true })
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${dir}/*' -DestinationPath '${zip}'"`, { stdio: 'inherit' })
  console.log(`Paquete listo: ${zip}`)
}
// El index.html suelto es solo la salida del build: ya está copiado en cada carpeta
rmSync(`${OUT}/index.html`)
console.log('Descomprimir en una ruta fija, p. ej. C:\\Trivia-REDMI')
