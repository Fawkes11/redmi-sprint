# Plan de Desarrollo — Kiosko Trivia Xiaomi

## 1. Resumen del proyecto

App de trivia para totem táctil, modo **individual únicamente** (sin modo por
equipos). Debe correr **100% local**, sin depender de conexión a internet, y
desplegarse en **varios totems** de forma independiente (cada uno con su
propio historial, sin sincronización entre ellos).

- 50 preguntas de selección múltiple, suministradas por el cliente en un
  archivo Excel (incluido en la carpeta compartida junto al diseño de Figma).
- Diseño de referencia: archivo de Figma (acceso compartido), con iconografía
  de **Material Design Icons**.
- Ranking **histórico** desde que inicia la sesión del totem (no se reinicia
  por partida), con Top 7 visible y botón "mostrar más" para ver el historial
  completo de participantes.

## 2. Stack técnico propuesto

- **Frontend**: **Vite + React**. Se descarta Next.js: no aporta nada en un
  kiosko local sin SEO ni rutas públicas, y su modo `output: 'export'` añade
  restricciones innecesarias para este caso. Vite da build estático nativo
  (`dist/`) sin configuración especial, ideal para el flujo de 5 pantallas
  manejado por estado interno (no por rutas).
- **Estilos**: Tailwind CSS, configurado con la paleta de colores y gradientes
  definidos en la sección "Colores" de Figma (ver sección 6).
- **Animaciones**: GSAP para la transición entre pantalla 03 y 04.
- **Persistencia local**: IndexedDB o localStorage (a definir según volumen
  esperado de participantes por evento) — debe sobrevivir a recargas y
  reinicios del totem.
- **Datos de preguntas**: se parsea el Excel a JSON en tiempo de build (no en
  runtime), quedando empaquetado dentro del build estático.
- **Modo kiosko**: la app se abre en pantalla completa sin barra de
  navegación (vía flags del navegador o un wrapper tipo Electron, según defina
  el cliente/hardware del totem).

## 3. Pantallas

### 01 — Inicio
Pantalla de bienvenida / estado de reposo del totem. Punto de entrada antes de
que un participante inicie una partida.

### 02 — Tutorial de uso
Explica cómo se juega (referencia visual: sección "¿Cómo se juega?" del
mockup original — pasos ilustrados con iconos).

### 03 — Poner nombre
El participante ingresa su nombre/alias antes de comenzar. Este dato es el
identificador que aparecerá en el ranking histórico.

### 04 — Inicio de preguntas
Flujo de las 50 preguntas: selección múltiple, temporizador, acumulación de
puntaje por acierto.

### 05 — Resultados
Muestra el puntaje final del participante y su posición en el ranking
histórico del totem (Top 7 + botón "mostrar más").

## 4. Animación 03 → 04 (prioridad alta)

Al confirmar el nombre en la pantalla 03, transición fluida hacia la pantalla
04, usando GSAP:

- El "mobile" (frame/dispositivo) de la pantalla 03 se **oculta deslizándose
  hacia abajo**.
- El "mobile" de la pantalla 04 **entra y se posiciona correctamente** en su
  lugar final.
- Movimiento suave, con timing/easing de nivel premium (evitar linear;
  usar easing tipo `power2.inOut` o similar, ajustando según se vea en
  pruebas).
- Debe sentirse como una sola transición coherente, no dos animaciones
  independientes solapadas.

## 5. Datos y persistencia

- **Preguntas**: importadas desde el Excel del cliente → convertidas a JSON
  en build time. Estructura sugerida: id, pregunta, opciones (4), respuesta
  correcta.
- **Ranking histórico**: por totem, no compartido entre dispositivos.
  - Cada partida agrega: nombre del participante, puntaje, fecha/hora.
  - Top 7 ordenado por puntaje descendente.
  - Botón "mostrar más" → lista completa de todos los participantes
    registrados en ese totem, ordenados igual.
- **Persistencia**: debe sobrevivir a cierre/recarga del navegador y a
  reinicio del equipo (localStorage/IndexedDB, no memoria de sesión).

## 6. Estilos: colores y gradientes (Tailwind)

- Extraer la sección **"Colores"** de Figma y mapearla a `tailwind.config`
  como colores custom (no usar hex sueltos en los componentes).
- Extraer la sección **"Gradiente"** de Figma y definirla también como
  utilidades/tokens reutilizables (ya sea como clases de Tailwind con
  `backgroundImage` custom, o como variables CSS consumidas por Tailwind).
- Los iconos deben tomarse de la librería **Material Design Icons** (verificar
  nombres exactos de cada ícono contra el diseño de Figma).

## 7. Checklist de materiales pendientes

Antes de dar por cerrada la fase de diseño, generar un cuadro con **borde
azul** listando lo que falta exportar/confirmar desde Figma. Ejemplo de
formato a producir automáticamente durante el desarrollo:

```
┌─ PENDIENTE DE FIGMA ───────────────────────────┐
│ - [ ] Asset X sin exportar (pantalla 0X)       │
│ - [ ] Color "nombre" sin valor hex definido     │
│ - [ ] Ícono "nombre" no encontrado en MDI       │
└─────────────────────────────────────────────────┘
```

Este cuadro debe actualizarse cada vez que se detecte un recurso faltante
durante la implementación, no solo al final.

## 8. Fuera de alcance (explícitamente descartado)

- Modo por equipos / parejas.
- Base de datos externa o backend remoto.
- Sincronización de ranking entre distintos totems.
- Panel de edición de preguntas para el cliente.
- Dependencia de conexión a internet en tiempo de ejecución.

## 9. Preguntas abiertas antes de iniciar

- ¿Cuántos totems en total? (define si el build es idéntico para todos o si
  hay alguna variable por sitio/ciudad).
- ¿Se consolidan los resultados de todos los totems en algún momento, o cada
  uno es completamente aislado?
- ¿El nombre del participante permite duplicados en el ranking, o se valida
  de alguna forma?

## 10. Fases de implementación sugeridas

1. **Setup base**: proyecto (Vite/Next export), Tailwind con colores/gradientes
   de Figma, estructura de carpetas, parseo del Excel a JSON.
2. **Pantallas estáticas**: 01, 02, 03, 05 sin animación aún — maquetado fiel
   al Figma, iconos de Material Design Icons.
3. **Lógica de juego**: pantalla 04 completa (preguntas, temporizador,
   puntaje), persistencia del ranking histórico local.
4. **Animación 03→04**: implementación con GSAP, pulido de timing/easing.
5. **Pruebas de kiosko**: modo pantalla completa, comportamiento tras
   recarga/reinicio, verificación de que el ranking persiste correctamente.
6. **Checklist final de assets**: revisar que no queden pendientes marcados
   del cuadro de la sección 7 antes de empaquetar el build final.
7. **Efectos especiales** (agregado durante el desarrollo, rama
   `efectos-especiales`, en prueba):
   - Confeti en Resultados solo la primera vez que se muestra, cuando el
     jugador queda 1.º, 2.º o 3.º del ranking histórico; colores según el
     puesto (oro, plata, bronce).
   - Brillo que recorre los móviles (CSS).
   - Fondo naranja animado con un shader WebGL en la pantalla de inicio,
     con respaldo al gradiente estático si no hay WebGL.
   - Destello de luz cuando el rodillo de "¡Tiempo finalizado!" se detiene.
   - Validar rendimiento en un totem real antes de pasar a `main`.
8. **Export del ranking a cPanel** (agregado durante el desarrollo):
   - Desde la vista de ranking (botón en Inicio) se exporta al servidor del subdominio.
   - Cada totem tiene su propia clave (`npm run configurar-servidor`), que lo identifica;
     el servidor suma solo las partidas nuevas (por id de partida), guarda `actual.csv`
     y `anterior.csv` (copia de seguridad) por totem y nunca borra lo ya recibido.
   - Descarga en `/exportes-admin/` con PIN de 6 dígitos (bloqueo tras 5 intentos),
     un archivo por totem y un consolidado de todos. El QR del totem abre esa página.
   - Eliminar puntajes desde el totem (vista de ranking → Administrar, con el PIN validado por el
     servidor): se borran del totem y del servidor y quedan en excluidas.json, así no reaparecen.
   - Responde §9 (consolidación): se consolidan solo en la descarga; cada totem sigue
     mostrando únicamente su propio ranking (§8 se mantiene: no hay sincronización).
