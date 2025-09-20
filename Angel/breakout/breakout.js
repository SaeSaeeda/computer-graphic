var score = 0;
var gameOver = false;
var messageDiv;
var box = vec2(0.0, 0.0);
var dX = 0.01,
  dY = 0.012;
var boxRad = 0.05;
var paddle = vec2(0.0, -0.85);
var paddleWidth = 0.2,
  paddleHeight = 0.04;
var verticesBox = new Float32Array([
  -0.05, -0.05, 0.05, -0.05, 0.05, 0.05, -0.05, 0.05,
]);
var verticesPaddle = new Float32Array([
  -paddleWidth / 2,
  -paddleHeight / 2,
  paddleWidth / 2,
  -paddleHeight / 2,
  paddleWidth / 2,
  paddleHeight / 2,
  -paddleWidth / 2,
  paddleHeight / 2,
]);
var locBox, locPaddle, locDrawMode;

window.onload = function () {
  var canvas = document.getElementById("gl-canvas");
  messageDiv = document.createElement("div");
  messageDiv.className = "breakout-message";
  document.body.appendChild(messageDiv);

  var gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 0.972, 0.882, 1.0);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Box buffer
  var bufferBox = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferBox);
  gl.bufferData(gl.ARRAY_BUFFER, verticesBox, gl.STATIC_DRAW);

  // Paddle buffer
  var bufferPaddle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferPaddle);
  gl.bufferData(gl.ARRAY_BUFFER, verticesPaddle, gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);

  locBox = gl.getUniformLocation(program, "boxPos");
  locPaddle = gl.getUniformLocation(program, "paddlePos");
  locDrawMode = gl.getUniformLocation(program, "drawMode");

  function resetGame() {
    box = vec2(0.0, 0.0);
    dX = 0.01 * (Math.random() > 0.5 ? 1 : -1);
    dY = 0.012;
    paddle = vec2(0.0, -0.85);
    score = 0;
    gameOver = false;
    messageDiv.textContent = "";
  }

  // Keyboard controls
  window.addEventListener("keydown", function (e) {
    if (gameOver && e.keyCode === 32) {
      resetGame();
      render();
      return;
    }
    if (e.keyCode == 37) paddle[0] -= 0.05; // left
    if (e.keyCode == 39) paddle[0] += 0.05; // right
    // Clamp paddle
    paddle[0] = Math.max(
      -1 + paddleWidth / 2,
      Math.min(1 - paddleWidth / 2, paddle[0])
    );
  });

  function render() {
    // Show score
    messageDiv.textContent = "Score: " + score;

    if (gameOver) {
      messageDiv.textContent =
        "You lost! Try again.\nScore: " +
        score +
        "\n(Press Spacebar to restart)";
      return;
    }

    // Move box
    box[0] += dX;
    box[1] += dY;

    // Wall collision (left/right)
    if (box[0] - boxRad < -1) {
      box[0] = -1 + boxRad;
      dX = -dX;
    }
    if (box[0] + boxRad > 1) {
      box[0] = 1 - boxRad;
      dX = -dX;
    }
    // Wall collision (top)
    if (box[1] + boxRad > 1) {
      box[1] = 1 - boxRad;
      dY = -dY;
    }

    var margin = 0.03;
    if (
      box[1] - boxRad < paddle[1] + paddleHeight / 2 &&
      box[1] - boxRad > paddle[1] - paddleHeight / 2 &&
      box[0] > paddle[0] - paddleWidth / 2 - margin &&
      box[0] < paddle[0] + paddleWidth / 2 + margin &&
      dY < 0
    ) {
      dY = -dY;
      box[1] = paddle[1] + paddleHeight / 2 + boxRad;
      score++;
    }

    if (box[1] - boxRad < -1) {
      gameOver = true;
      messageDiv.textContent =
        "Oh no! Do better. Try again.\nScore: " +
        score +
        "\n(press space, try again)";
      return;
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(locDrawMode, 1.0);
    gl.uniform2fv(locBox, box);
    gl.uniform2fv(locPaddle, [0, 0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferBox);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.uniform1f(locDrawMode, 0.0);
    gl.uniform2fv(locBox, [0, 0]);
    gl.uniform2fv(locPaddle, paddle);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferPaddle);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    window.requestAnimFrame(render);
  }
  render();
};
