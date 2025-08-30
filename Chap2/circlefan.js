/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//    Teikna nálgun á hring sem TRIANGLE_FAN + slider
//    (minimal changes: keeps names & structure)
//    Hjálmtýr Hafsteinsson, ágúst 2025  -- tweaked slightly
/////////////////////////////////////////////////////////////////
"use strict";

var canvas;
var gl;

// numCirclePoints is number of perimeter points (fan has +2: center + repeat)
var numCirclePoints = 20;

var radius = 0.5;
var center = vec2(0, 0);

var points = [];
var vBuffer;   // keep buffer handle so we can re-upload on slider

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); return; }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);  // white background

  // Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Initial circle
  createCirclePoints(center, radius, numCirclePoints);

  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Slider: update N, rebuild, re-upload, redraw
  var slider = document.getElementById("segments");
  var val = document.getElementById("val");
  slider.addEventListener("input", function (e) {
    numCirclePoints = Math.max(3, Math.min(50, parseInt(e.target.value, 10) || 20));
    val.textContent = numCirclePoints;

    createCirclePoints(center, radius, numCirclePoints);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW);
    render();
  });

  // label & first draw
  document.getElementById("val").textContent = numCirclePoints;
  render();
};

// Create the points of the circle (center + k perimeter + repeat first)
function createCirclePoints(cent, rad, k) {
  points = [];
  points.push(cent);

  var dAngle = (2 * Math.PI) / k;
  for (var i = 0; i <= k; i++) {
    var a = (i % k) * dAngle;
    // (cos, sin) order keeps 0 radians at +X; use rad*sin/cos if you prefer your original
    var p = vec2(rad * Math.cos(a) + cent[0], rad * Math.sin(a) + cent[1]);
    points.push(p);
  }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, numCirclePoints + 2);
}
