window.SHADERS = {
  vs2d: `
    attribute vec2 a_pos;     // model-space vertex
    uniform mat3 u_M;         // 2D transform matrix
    void main() {
      vec3 p = u_M * vec3(a_pos, 1.0);
      gl_Position = vec4(p.xy, 0.0, 1.0);
    }
  `,
  fs_solid: `
    precision mediump float;
    uniform vec4 u_color;
    void main() { gl_FragColor = u_color; }
  `
};
