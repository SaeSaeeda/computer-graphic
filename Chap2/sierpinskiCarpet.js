"use strict";

var canvas;
var gl;
var points = [];
var NumTimesToSubdivide = 5;

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  // Square corners
  var vertices = [
    vec2(-1, -1), 
    vec2(1, -1), // bottom right
    vec2(1, 1), // top right
    vec2(-1, 1), // top left
  ];

  divideSquare(
    vertices[0],
    vertices[1],
    vertices[2],
    vertices[3],
    NumTimesToSubdivide
  );

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 1.0, 0.9, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  render();
};

function square(a, b, c, d) {
  // Two triangles for a square
  points.push(a, b, c);
  points.push(a, c, d);
}

function divideSquare(a, b, c, d, count) {
  if (count === 0) {
    square(a, b, c, d);
  } else {
    // Calculate 12 new points (2 on each side, 4 inside)
    var ab1 = mix(a, b, 1 / 3);
    var ab2 = mix(a, b, 2 / 3);
    var bc1 = mix(b, c, 1 / 3);
    var bc2 = mix(b, c, 2 / 3);
    var cd1 = mix(c, d, 1 / 3);
    var cd2 = mix(c, d, 2 / 3);
    var da1 = mix(d, a, 1 / 3);
    var da2 = mix(d, a, 2 / 3);

    var left1 = mix(a, d, 1 / 3);
    var left2 = mix(a, d, 2 / 3);
    var right1 = mix(b, c, 1 / 3);
    var right2 = mix(b, c, 2 / 3);

    // 4 inner points
    var p1 = mix(ab1, da1, 1 / 3);
    var p2 = mix(ab2, da2, 1 / 3);
    var p3 = mix(bc1, cd1, 1 / 3);
    var p4 = mix(bc2, cd2, 1 / 3);

    // Actually, for the 9 sub-squares, we need the grid points:
    var x0 = a;
    var x1 = ab1;
    var x2 = ab2;
    var x3 = b;
    var y0 = d;
    var y1 = da1;
    var y2 = da2;
    var y3 = c;

    // Compute all 16 grid points
    var p = [];
    for (var i = 0; i < 4; ++i) {
      var row = [];
      for (var j = 0; j < 4; ++j) {
        var s = i / 3;
        var t = j / 3;
        row.push(mix(mix(a, b, t), mix(d, c, t), s));
      }
      p.push(row);
    }
    --count;
    // 8 recursive calls (skip center)
    for (var i = 0; i < 3; ++i) {
      for (var j = 0; j < 3; ++j) {
        if (i === 1 && j === 1) continue; // skip center
        divideSquare(p[i][j], p[i][j + 1], p[i + 1][j + 1], p[i + 1][j], count);
      }
    }
  }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, points.length);
}
