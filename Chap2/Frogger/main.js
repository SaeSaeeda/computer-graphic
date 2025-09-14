let gl;
let program;
let attribs = {};
let uniforms = {};
let buffers = {};

const canvas = document.getElementById("glcanvas");

const COLORS = {
  sky:      [0.937, 0.902, 0.839, 1], 
  sidewalk: [0.792, 0.729, 0.612, 1], 
  road:     [0.302, 0.176, 0.094, 1], 
  lane:     [0.831, 0.627, 0.090, 1], 
  frog:     [0.298, 0.392, 0.267, 1], 

  cars: [
  [0.676, 0.286, 0.035, 0.914], 
  [0.788, 0.243, 0.039, 1.000], 
  [0.604, 0.337, 0.137, 1.000], 
  [0.430, 0.255, 0.172, 1.000], 
  [0.984, 0.714, 0.027, 1.000], 
  [0.561, 0.435, 0.322, 1.000], 
],

  death: [0.980, 0.300, 0.250, 1], 
  life:  [0.198, 0.392, 0.267, 1], 
};

const HUD = { h: 0.05, pad: 0.02, gap: 0.03 };
const TOP_BAR_Y =  1 - HUD.pad - HUD.h/2;
const BOT_BAR_Y = -1 + HUD.pad + HUD.h/2;


const LAYOUT = {
  sidewalkH: 0.25,
  roadYMin: -0.75,
  roadYMax: 0.75,
};

function laneHeight(lanes = 5) {
  return (LAYOUT.roadYMax - LAYOUT.roadYMin) / lanes;
}

function drawFrog() {
  const rot = frog.dir > 0 ? 0 : Math.PI;
  drawTri(frog.x, frog.y, frog.w, frog.h, rot, COLORS.frog);
}

function drawCars() {
  for (const c of cars) drawRect(c.x, c.y, c.w, c.h, c.color);
}

const LANES = 5;
const frog = {
  x: 0,
  y: -1 + LAYOUT.sidewalkH / 2 + 0.025,
  w: 0.08,
  h: 0.1,
  dir: +1,
};
function rand(min, max) {
  return min + Math.random() * (max - min);
}
let laneSpeeds = Array.from({ length: LANES }, () => rand(0.4, 0.7));
let wins = 0;
let deaths = 0;
let running = true;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function laneCenter(i) {
  return LAYOUT.roadYMin + laneHeight(LANES) * (i + 0.5);
}

function makeLaneCars(i, n){
  const arr = [];
  const y = laneCenter(i);
  const dir = i % 2 ? -1 : +1;
  const spacing = 2.2 / n;
  const speed = laneSpeeds[i];
  for (let k = 0; k < n; k++){
    const startX = dir > 0 ? -1.1 + k*spacing : 1.1 - k*spacing;
    arr.push({ x:startX, y, w:0.18, h:laneHeight(LANES)*0.7, dir, speed, color: COLORS.cars[(i*7 + k) % COLORS.cars.length] });
  }
  return arr;
}

const CARS_PER_LANE = 2;
const cars = [];
for (let i = 0; i < LANES; i++) cars.push(...makeLaneCars(i, CARS_PER_LANE));

function M2D(tx, ty, sx, sy, rotRad = 0) {
  const c = Math.cos(rotRad),
    s = Math.sin(rotRad);
  return new Float32Array([c * sx, -s * sy, 0, s * sx, c * sy, 0, tx, ty, 1]);
}

function createShader(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh));
  }
  return sh;
}

function createProgram(vsSrc, fsSrc) {
  const vs = createShader(gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog));
  }
  return prog;
}

function createBuffers() {
  const rectVerts = new Float32Array([
    -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5,
  ]);
  const rect = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rect);
  gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.STATIC_DRAW);

  const triVerts = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  const tri = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tri);
  gl.bufferData(gl.ARRAY_BUFFER, triVerts, gl.STATIC_DRAW);

  buffers.rect = { buf: rect, count: 4, mode: gl.TRIANGLE_STRIP };
  buffers.tri = { buf: tri, count: 3, mode: gl.TRIANGLES };
}

function useProgram() {
  program = createProgram(SHADERS.vs2d, SHADERS.fs_solid);
  gl.useProgram(program);
  attribs.a_pos = gl.getAttribLocation(program, "a_pos");
  uniforms.u_M = gl.getUniformLocation(program, "u_M");
  uniforms.u_color = gl.getUniformLocation(program, "u_color");
}

function bindBufferAndPos(bufferObj) {
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.buf);
  gl.enableVertexAttribArray(attribs.a_pos);
  gl.vertexAttribPointer(attribs.a_pos, 2, gl.FLOAT, false, 0, 0);
}

function drawRect(x, y, w, h, color) {
  bindBufferAndPos(buffers.rect);
  gl.uniformMatrix3fv(uniforms.u_M, false, M2D(x, y, w, h, 0));
  gl.uniform4fv(uniforms.u_color, color);
  gl.drawArrays(buffers.rect.mode, 0, buffers.rect.count);
}

function drawTri(x, y, w, h, rot, color) {
  bindBufferAndPos(buffers.tri);
  gl.uniformMatrix3fv(uniforms.u_M, false, M2D(x, y, w, h, rot));
  gl.uniform4fv(uniforms.u_color, color);
  gl.drawArrays(buffers.tri.mode, 0, buffers.tri.count);
}

function drawBackground() {
  gl.clearColor(...COLORS.sky);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const roadYMin = LAYOUT.roadYMin;
  const roadYMax = LAYOUT.roadYMax;
  const sidewalkH = LAYOUT.sidewalkH;
  drawRect(0, 1 - sidewalkH / 2, 2.0, sidewalkH, COLORS.sidewalk);
  drawRect(0, -1 + sidewalkH / 2, 2.0, sidewalkH, COLORS.sidewalk);
  const roadH = roadYMax - roadYMin;
  drawRect(0, (roadYMin + roadYMax) / 2, 2.0, roadH, COLORS.road);
  const h = laneHeight(LANES);
  for (let i = 1; i < LANES; i++) {
    const y = roadYMin + h * i;
    drawRect(0, y, 2.0, 0.01, COLORS.lane);
  }
}

function render() {
  drawBackground();
  drawCars();
  drawCounters();
  drawFrog();
}

function onKey(e) {
  if (!running) return;
  const k = e.key;
  let moved = false;
  const stepX = 0.08;
  const stepY = laneHeight(LANES);
  if (k === "ArrowLeft") {
    frog.x -= stepX;
    moved = true;
  } else if (k === "ArrowRight") {
    frog.x += stepX;
    moved = true;
  } else if (k === "ArrowUp") {
    frog.y += stepY;
    frog.dir = +1;
    moved = true;
  } else if (k === "ArrowDown") {
    frog.y -= stepY;
    frog.dir = -1;
    moved = true;
  }
if (moved){
  const minY = BOT_BAR_Y + HUD.h/2 + HUD.gap + frog.h/2;
  const maxY = TOP_BAR_Y - HUD.h/2 - HUD.gap - frog.h/2;
  frog.x = clamp(frog.x, -1 + frog.w/2, 1 - frog.w/2);
  frog.y = clamp(frog.y,  minY,          maxY);
  e.preventDefault();
  render();
}
}

function overlap(a, b) {
  return (
    Math.abs(a.x - b.x) < a.w / 2 + b.w / 2 &&
    Math.abs(a.y - b.y) < a.h / 2 + b.h / 2
  );
}

function drawCounters(){
  const w = 0.15, h = HUD.h, gap = 0.02, start = -1 + w/2 + 0.02;
  const yTop = TOP_BAR_Y, yBottom = BOT_BAR_Y;
  const nRed = Math.min(deaths, 10);
  const nGreen = Math.min(wins, 10);
  for (let i = 0; i < nRed;   i++) drawRect(start + i*(w+gap), yTop,    w, h, COLORS.death);
  for (let i = 0; i < nGreen; i++) drawRect(start + i*(w+gap), yBottom, w, h, COLORS.life);
}

function onHit(){
  deaths += 1;
  resetFrogAfterHit();
  if (deaths >= 10){
    running = false;
    showOverlay("Ooh nooo! Lil Frogger bled to death because it was not fit for survival!");
  }
}

function checkCrossing() {
  const topCross = TOP_BAR_Y - HUD.h/2 - HUD.gap;
  const botCross = BOT_BAR_Y + HUD.h/2 + HUD.gap;
  if (frog.dir > 0 && frog.y + frog.h/2 >= topCross) updateScore();
  else if (frog.dir < 0 && frog.y - frog.h/2 <= botCross) updateScore();
}

function updateScore(){
  wins += 1;
  frog.dir *= -1;
  frog.x = 0;
  const minY = BOT_BAR_Y + HUD.h/2 + HUD.gap + frog.h/2;
  const maxY = TOP_BAR_Y - HUD.h/2 - HUD.gap - frog.h/2;
  frog.y = frog.dir > 0 ? minY : maxY;
  if (wins >= 10){
    running = false;
    showOverlay("You won! Fríða crossed safely 10 times. Such a survivor!");
  }
}


function collidesAny() {
  for (const c of cars) if (overlap(frog, c)) return true;
  return false;
}

function resetFrogAfterHit(){
  frog.x = 0;
  const minY = BOT_BAR_Y + HUD.h/2 + HUD.gap + frog.h/2;
  const maxY = TOP_BAR_Y - HUD.h/2 - HUD.gap - frog.h/2;
  if (frog.dir > 0) frog.y = minY; else frog.y = maxY;
}



function update(dt) {
  for (const c of cars) {
    c.x += c.dir * c.speed * dt;
    if (c.dir > 0 && c.x - c.w / 2 > 1.1) c.x = -1.1 - c.w / 2;
    if (c.dir < 0 && c.x + c.w / 2 < -1.1) c.x = 1.1 + c.w / 2;
  }
}

let last = 0;
function tick(t) {
  if (!last) last = t;
  const dt = (t - last) / 1000;
  last = t;
  if (running) {
    update(dt);
    if (collidesAny()) onHit();
    checkCrossing();
  }
  render();
  requestAnimationFrame(tick);
}

function showOverlay(msg){
  const t = document.querySelector('#overlay .title');
  if (t && msg) t.textContent = msg;
  document.getElementById('overlay').style.display = 'flex';
}
function hideOverlay(){
  document.getElementById('overlay').style.display = 'none';
}

function restartGame(){
  wins = 0;
  deaths = 0;
  laneSpeeds = Array.from({ length: LANES }, () => rand(0.4, 0.7));
  cars.length = 0;
  for (let i = 0; i < LANES; i++) cars.push(...makeLaneCars(i, CARS_PER_LANE));
  frog.x = 0; frog.y = -1 + LAYOUT.sidewalkH/2 + 0.025; frog.dir = +1;
  running = true;
  hideOverlay();
}

function init() {
  gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL not supported");
    return;
  }
  useProgram();
  createBuffers();
  render();
  window.addEventListener("keydown", onKey, { passive: false });
  document.getElementById("restartBtn").addEventListener("click", restartGame);
  requestAnimationFrame(tick);
}

window.addEventListener("load", init);
