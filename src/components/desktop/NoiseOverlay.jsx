import { useEffect, useRef } from 'react';

const VERT = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.0,1.0);}`;
const FRAG = `
  #ifdef GL_ES precision mediump float; #endif
  const float PHI = 1.61803398874989484820459;
  uniform float u_time;
  float noise(vec2 xy, float seed) { return fract(tan(distance(xy * PHI, xy) * seed) * xy.x); }
  void main() {
    float n = noise(gl_FragCoord.xy, fract(u_time) + 1.0);
    gl_FragColor = vec4(n * 0.9, n * 0.9, n * 0.9, 0.035);
  }
`;

const NoiseOverlay = ({ w, h }) => {
  const ref = useRef();

  useEffect(() => {
    const canvas = ref.current;
    canvas.width = w;
    canvas.height = h;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
    if (!gl) return;

    const mkShader = (src, type) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(VERT, gl.VERTEX_SHADER));
    gl.attachShader(prog, mkShader(FRAG, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const t0 = performance.now();
    let raf;
    const draw = () => {
      gl.uniform1f(uTime, (performance.now() - t0) * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [w, h]);

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
    />
  );
};

export default NoiseOverlay;
