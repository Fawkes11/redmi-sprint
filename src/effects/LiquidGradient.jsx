import { useEffect, useRef } from 'react'
import { effectsEnabled } from './enabled.js'

// Fondo naranja "vivo": shader WebGL que ondula lento entre los dos colores del gradiente de marca.
// Se dibuja a media resolución para no cargar la GPU del totem. Si no hay WebGL, el contenedor
// conserva la clase de respaldo (gradiente estático).
const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
const vec3 DEEP = vec3(0.922, 0.392, 0.110);  // #EB641C
const vec3 LIGHT = vec3(0.961, 0.655, 0.275); // #F5A746

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * 0.25;
  // Ondas suaves superpuestas: se ve como tela o luz líquida
  float w = sin(uv.x * 3.0 + t) * 0.5
          + sin(uv.y * 4.0 - t * 1.3 + sin(uv.x * 2.0 + t)) * 0.35
          + sin((uv.x + uv.y) * 5.0 + t * 0.7) * 0.15;
  float mixv = clamp(uv.y * 0.8 + w * 0.22, 0.0, 1.0);
  vec3 color = mix(DEEP, LIGHT, mixv);
  // Brillo suave que cruza la superficie
  color += 0.06 * smoothstep(0.6, 1.0, sin(uv.x * 6.0 - uv.y * 3.0 + t * 2.0));
  gl_FragColor = vec4(color, 1.0);
}
`

const RESOLUTION = 0.5

export default function LiquidGradient({ className = '', fallback = 'bg-brand-gradient-v' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return // sin WebGL queda el gradiente de respaldo

    const compile = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }
    const program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    gl.useProgram(program)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')

    canvas.width = canvas.clientWidth * RESOLUTION
    canvas.height = canvas.clientHeight * RESOLUTION
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(uRes, canvas.width, canvas.height)

    let frame
    const start = performance.now()
    const draw = () => {
      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      frame = requestAnimationFrame(draw)
    }
    draw()

    // Sin loseContext(): en el doble montaje de StrictMode el mismo canvas recibiría el contexto
    // perdido y quedaría en blanco. Al desmontar, el canvas se elimina y el navegador libera el contexto.
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className={`${fallback} ${className}`}>
      {effectsEnabled && <canvas ref={canvasRef} className="block size-full" />}
    </div>
  )
}
