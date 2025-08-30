var canvas;
var gl;

var maxNumTriangles = 66; // 3 points per triangle, so 66*3 = 198 < 200
var index = 0;

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.95, 1.0, 1.0, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumTriangles * 3, gl.DYNAMIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  canvas.addEventListener("mousedown", function (e) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var cx = (2 * e.offsetX) / canvas.width - 1;
    var cy = (2 * (canvas.height - e.offsetY)) / canvas.height - 1;
    var r = 0.05; // triangle size
    var angle = Math.PI / 2;
    var verts = [];
    for (var i = 0; i < 3; ++i) {
      verts.push(vec2(cx + r * Math.cos(angle), cy + r * Math.sin(angle)));
      angle -= (2 * Math.PI) / 3;
    }
    for (var i = 0; i < 3; ++i) {
      if (index < maxNumTriangles * 3) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(verts[i]));
        index++;
      }
    }
  });
  render();
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, index);
  window.requestAnimFrame(render);
}
