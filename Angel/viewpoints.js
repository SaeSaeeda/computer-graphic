var canvas, gl;

var TRACK_RADIUS = 100.0;
var TRACK_INNER = 90.0;
var TRACK_OUTER = 110.0;
var TRACK_PTS = 100;

var SKY_BLUE = vec4(0.65, 0.85, 1.0, 1.0);
var TRACK_GRAY = vec4(0.35, 0.35, 0.45, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var YELLOW = vec4(1.0, 1.0, 0.0, 1.0);
var GREEN = vec4(0.0, 0.6, 0.0, 1.0);
var ORANGE = vec4(1.0, 0.6, 0.0, 1.0);
var BROWN = vec4(0.45, 0.25, 0.05, 1.0);

var numCubeVertices = 36;
var numTrackVertices = 2 * TRACK_PTS + 2;

var carDirection = 0.0;
var height = 0.0;

var cars = [
  {
    radius: TRACK_RADIUS + 5.0,
    offset: 0.0,
    speed: 2.5,
    dir: 1,
    laneOffset: 4.0,
    color: ORANGE,
  },
  {
    radius: TRACK_RADIUS + 5.0,
    offset: 180.0,
    speed: 2.5,
    dir: 1,
    laneOffset: 4.0,
    color: vec4(0.0, 0.2, 0.8, 1.0),
  },
  {
    radius: TRACK_RADIUS - 5.0,
    offset: 90.0,
    speed: 3.0,
    dir: -1,
    laneOffset: -3.0,
    color: YELLOW,
  },
  {
    radius: TRACK_RADIUS - 5.0,
    offset: 270.0,
    speed: 3.0,
    dir: -1,
    laneOffset: -3.0,
    color: vec4(0.6, 0.2, 0.8, 1.0),
  },
];

var tunnelAngle = 270.0;
var tunnelMidRadius = (TRACK_INNER + TRACK_OUTER) / 2.0;
var tunnelOffsetX = 10;
var tunnelWidth = 30.0;
var tunnelLength = 40.0;
var tunnelHeight = 12.0;

var planeT = 0.0;

var fpPos = { x: 0.0, y: -TRACK_RADIUS - 20.0 };
var fpDir = 0.0;
var fpSpeed = 2.5;
var mouseDown = false;

var view = 1;

var colorLoc, mvLoc, pLoc, proj;
var cubeBuffer, trackBuffer, vPosition;

var cVertices = [
  vec3(-0.5, 0.5, 0.5),
  vec3(-0.5, -0.5, 0.5),
  vec3(0.5, -0.5, 0.5),
  vec3(0.5, -0.5, 0.5),
  vec3(0.5, 0.5, 0.5),
  vec3(-0.5, 0.5, 0.5),

  vec3(0.5, 0.5, 0.5),
  vec3(0.5, -0.5, 0.5),
  vec3(0.5, -0.5, -0.5),
  vec3(0.5, -0.5, -0.5),
  vec3(0.5, 0.5, -0.5),
  vec3(0.5, 0.5, 0.5),

  vec3(0.5, -0.5, 0.5),
  vec3(-0.5, -0.5, 0.5),
  vec3(-0.5, -0.5, -0.5),
  vec3(-0.5, -0.5, -0.5),
  vec3(0.5, -0.5, -0.5),
  vec3(0.5, -0.5, 0.5),

  vec3(0.5, 0.5, -0.5),
  vec3(-0.5, 0.5, -0.5),
  vec3(-0.5, 0.5, 0.5),
  vec3(-0.5, 0.5, 0.5),
  vec3(0.5, 0.5, 0.5),
  vec3(0.5, 0.5, -0.5),

  vec3(-0.5, -0.5, -0.5),
  vec3(-0.5, 0.5, -0.5),
  vec3(0.5, 0.5, -0.5),
  vec3(0.5, 0.5, -0.5),
  vec3(0.5, -0.5, -0.5),
  vec3(-0.5, -0.5, -0.5),

  vec3(-0.5, 0.5, -0.5),
  vec3(-0.5, -0.5, -0.5),
  vec3(-0.5, -0.5, 0.5),
  vec3(-0.5, -0.5, 0.5),
  vec3(-0.5, 0.5, 0.5),
  vec3(-0.5, 0.5, -0.5),
];

var tVertices = [];

window.onload = function () {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(SKY_BLUE[0], SKY_BLUE[1], SKY_BLUE[2], SKY_BLUE[3]);
  gl.enable(gl.DEPTH_TEST);

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  createTrack();

  trackBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, trackBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(tVertices), gl.STATIC_DRAW);

  cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(cVertices), gl.STATIC_DRAW);

  vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  colorLoc = gl.getUniformLocation(program, "fColor");
  mvLoc = gl.getUniformLocation(program, "modelview");
  pLoc = gl.getUniformLocation(program, "projection");

  var aspect = canvas.width / canvas.height;
  proj = perspective(50.0, aspect, 1.0, 800.0);
  gl.uniformMatrix4fv(pLoc, false, flatten(proj));

  document.getElementById("Viewpoint").innerHTML = "1: Distant view";
  document.getElementById("Height").innerHTML = "Extra height: " + height;

  window.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 48:
        view = 0;
        document.getElementById("Viewpoint").innerHTML =
          "0: On foot (first-person)";
        break;
      case 49:
        view = 1;
        document.getElementById("Viewpoint").innerHTML = "1: Distant view";
        break;
      case 50:
        view = 2;
        document.getElementById("Viewpoint").innerHTML =
          "2: Inside the track (watch the car)";
        break;
      case 51:
        view = 3;
        document.getElementById("Viewpoint").innerHTML =
          "3: Outside the track (watch the car)";
        break;
      case 52:
        view = 4;
        document.getElementById("Viewpoint").innerHTML = "4: Driver's view";
        break;
      case 53:
        view = 5;
        document.getElementById("Viewpoint").innerHTML =
          "5: From car, always looking at a house";
        break;
      case 54:
        view = 6;
        document.getElementById("Viewpoint").innerHTML =
          "6: Behind and above the car";
        break;
      case 55:
        view = 7;
        document.getElementById("Viewpoint").innerHTML =
          "7: Looking backwards from the front car";
        break;
      case 56:
        view = 8;
        document.getElementById("Viewpoint").innerHTML =
          "8: Side view of the car";
        break;
      case 38:
        height += 2.0;
        document.getElementById("Height").innerHTML = "Extra height: " + height;
        break;
      case 40:
        height -= 2.0;
        document.getElementById("Height").innerHTML = "Extra height: " + height;
        break;
      case 87:
        moveFP("forward");
        break;
      case 83:
        moveFP("back");
        break;
      case 65:
        moveFP("left");
        break;
      case 68:
        moveFP("right");
        break;
    }
  });

  canvas.addEventListener("mousedown", function () {
    mouseDown = true;
  });
  canvas.addEventListener("mouseup", function () {
    mouseDown = false;
  });
  canvas.addEventListener("mouseleave", function () {
    mouseDown = false;
  });
  canvas.addEventListener("mousemove", function (e) {
    if (view !== 0) return;
    if (!mouseDown) return;
    var dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    fpDir += dx * 0.2;
  });

  render();
};

function createTrack() {
  var theta = 0.0;
  for (var i = 0; i <= TRACK_PTS; i++) {
    var p1 = vec3(
      TRACK_OUTER * Math.cos(radians(theta)),
      TRACK_OUTER * Math.sin(radians(theta)),
      0.0
    );
    var p2 = vec3(
      TRACK_INNER * Math.cos(radians(theta)),
      TRACK_INNER * Math.sin(radians(theta)),
      0.0
    );
    tVertices.push(p1);
    tVertices.push(p2);
    theta += 360.0 / TRACK_PTS;
  }
}

function moveFP(dir) {
  var rad = radians(fpDir);
  var forward = { x: Math.cos(rad), y: Math.sin(rad) };
  var right = {
    x: Math.cos(rad + Math.PI / 2),
    y: Math.sin(rad + Math.PI / 2),
  };
  if (dir === "forward") {
    fpPos.x += forward.x * fpSpeed;
    fpPos.y += forward.y * fpSpeed;
  } else if (dir === "back") {
    fpPos.x -= forward.x * fpSpeed;
    fpPos.y -= forward.y * fpSpeed;
  } else if (dir === "left") {
    fpPos.x += right.x * fpSpeed;
    fpPos.y += right.y * fpSpeed;
  } else if (dir === "right") {
    fpPos.x -= right.x * fpSpeed;
    fpPos.y -= right.y * fpSpeed;
  }
}

function house(x, y, size, mv, type, colorBody, colorRoof) {
  gl.uniform4fv(colorLoc, colorBody);
  var mvBody = mult(mv, translate(x, y, size / 2));
  if (type === 0) mvBody = mult(mvBody, scalem(size, size * 0.8, size));
  else if (type === 1)
    mvBody = mult(mvBody, scalem(size * 0.7, size * 0.7, size * 1.2));
  else if (type === 2)
    mvBody = mult(mvBody, scalem(size * 1.2, size * 0.9, size));
  else mvBody = mult(mvBody, scalem(size, size, size));
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(mvLoc, false, flatten(mvBody));
  gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

  gl.uniform4fv(colorLoc, colorRoof);
  var mvRoof = mult(mv, translate(x, y, size + size * 0.4));
  mvRoof = mult(mvRoof, rotateZ(15));
  mvRoof = mult(mvRoof, scalem(size * 1.05, size * 1.05, size * 0.5));
  gl.uniformMatrix4fv(mvLoc, false, flatten(mvRoof));
  gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function drawScenery(mv) {
  var tallBuildings = [
    { x: -20.0, y: 0.0, w: 18.0, h: 60.0, d: 18.0 },
    { x: 20.0, y: 0.0, w: 18.0, h: 90.0, d: 18.0 },
    { x: 0.0, y: -20.0, w: 12.0, h: 60.0, d: 10.0 },
    { x: 0.0, y: 20.0, w: 15.0, h: 70.0, d: 15.0 },
  ];
  var tallBuildingColor = vec4(0.25, 0.25, 0.35, 1.0);
  var tallWindowColor = vec4(0.85, 0.95, 1.0, 1.0);
  for (var b = 0; b < tallBuildings.length; b++) {
    var tb = tallBuildings[b];
    var mvTall = mult(mv, translate(tb.x, tb.y, tb.h / 2));
    mvTall = mult(mvTall, scalem(tb.w, tb.d, tb.h));
    gl.uniform4fv(colorLoc, tallBuildingColor);
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvTall));
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

    var numRows = 8,
      numCols = 3;
    var windowW = 2.5,
      windowH = 5.0;

    for (var row = 0; row < numRows; row++) {
      for (var col = 0; col < numCols; col++) {
        var wx = tb.x - tb.w / 2 + (col + 0.5) * (tb.w / numCols);
        var wy = tb.y + tb.d / 2 + 0.1;
        var wz = (row + 1.5) * (tb.h / (numRows + 2));
        var mvW = mult(mv, translate(wx, wy, wz));
        mvW = mult(mvW, scalem(windowW, 0.5, windowH));
        gl.uniform4fv(colorLoc, tallWindowColor);
        gl.uniformMatrix4fv(mvLoc, false, flatten(mvW));
        gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
      }
    }
    for (var row2 = 0; row2 < numRows; row2++) {
      for (var col2 = 0; col2 < numCols; col2++) {
        var wx2 = tb.x - tb.w / 2 + (col2 + 0.5) * (tb.w / numCols);
        var wy2 = tb.y - tb.d / 2 - 0.1;
        var wz2 = (row2 + 1.5) * (tb.h / (numRows + 2));
        var mvW2 = mult(mv, translate(wx2, wy2, wz2));
        mvW2 = mult(mvW2, scalem(windowW, 0.5, windowH));
        gl.uniform4fv(colorLoc, tallWindowColor);
        gl.uniformMatrix4fv(mvLoc, false, flatten(mvW2));
        gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
      }
    }
    for (var row3 = 0; row3 < numRows; row3++) {
      for (var col3 = 0; col3 < numCols; col3++) {
        var wx3 = tb.x + tb.w / 2 + 0.1;
        var wy3 = tb.y - tb.d / 2 + (col3 + 0.5) * (tb.d / numCols);
        var wz3 = (row3 + 1.5) * (tb.h / (numRows + 2));
        var mvW3 = mult(mv, translate(wx3, wy3, wz3));
        mvW3 = mult(mvW3, scalem(0.5, windowW, windowH));
        gl.uniform4fv(colorLoc, tallWindowColor);
        gl.uniformMatrix4fv(mvLoc, false, flatten(mvW3));
        gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
      }
    }
    for (var row4 = 0; row4 < numRows; row4++) {
      for (var col4 = 0; col4 < numCols; col4++) {
        var wx4 = tb.x - tb.w / 2 - 0.1;
        var wy4 = tb.y - tb.d / 2 + (col4 + 0.5) * (tb.d / numCols);
        var wz4 = (row4 + 1.5) * (tb.h / (numRows + 2));
        var mvW4 = mult(mv, translate(wx4, wy4, wz4));
        mvW4 = mult(mvW4, scalem(0.5, windowW, windowH));
        gl.uniform4fv(colorLoc, tallWindowColor);
        gl.uniformMatrix4fv(mvLoc, false, flatten(mvW4));
        gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
      }
    }
  }

  gl.uniform4fv(colorLoc, TRACK_GRAY);
  gl.bindBuffer(gl.ARRAY_BUFFER, trackBuffer);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, numTrackVertices);

  var houses = [
    { x: 0.0, y: 0.0, s: 10.0, t: 0, body: RED, roof: BROWN },
    {
      x: 1.0,
      y: 80.0,
      s: 10.0,
      t: 2,
      body: vec4(0.7, 0.2, 0.9, 1),
      roof: GREEN,
    },
    { x: 56.6, y: 56.6, s: 10.0, t: 3, body: YELLOW, roof: ORANGE },
    //{ x: 80.0,  y: 0.0,   s: 10.0, t: 2, body: vec4(0.2, 0.6, 0.2, 1), roof: vec4(0.6, 0.2, 0.2, 1) },
    {
      x: -56.6,
      y: -56.6,
      s: 10.0,
      t: 1,
      body: vec4(0.9, 0.7, 0.6, 1),
      roof: vec4(0.3, 0.2, 0.1, 1),
    },
    //{ x: 0.0,   y: -80.0, s: 10.0, t: 0, body: vec4(0.95, 0.75, 0.5, 1), roof: vec4(0.6, 0.25, 0.15, 1) },
    {
      x: 50.6,
      y: -56.6,
      s: 10.0,
      t: 1,
      body: vec4(0.6, 0.4, 0.8, 1),
      roof: vec4(0.2, 0.1, 0.2, 1),
    },

    {
      x: 40.0,
      y: 40.0,
      s: 12.0,
      t: 2,
      body: vec4(1.0, 0.7, 0.7, 1),
      roof: vec4(0.7, 0.2, 0.2, 1),
    },
    {
      x: -40.0,
      y: 40.0,
      s: 12.0,
      t: 3,
      body: vec4(0.85, 0.8, 0.25, 1),
      roof: vec4(0.5, 0.2, 0.2, 1),
    },
    {
      x: 40.0,
      y: -40.0,
      s: 12.0,
      t: 1,
      body: vec4(0.5, 0.3, 0.7, 1),
      roof: vec4(0.7, 0.7, 0.2, 1),
    },
    {
      x: -40.0,
      y: -50.0,
      s: 15.0,
      t: 0,
      body: vec4(0.9, 0.55, 0.3, 1),
      roof: vec4(0.8, 0.2, 0.2, 1),
    },
    {
      x: -120.0,
      y: 60.0,
      s: 15.0,
      t: 3,
      body: vec4(0.7, 0.7, 0.7, 1),
      roof: vec4(0.3, 0.3, 0.3, 1),
    },
  ];

  for (var i = 0; i < houses.length; i++) {
    var h = houses[i];
    house(h.x, h.y, h.s, mv, h.t, h.body, h.roof);
  }

  drawTunnel(mv);
}

function drawCarGeneric(mv, color) {
  gl.uniform4fv(colorLoc, color);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

  var mvBase = mult(mv, scalem(10.0, 3.0, 2.0));
  mvBase = mult(mvBase, translate(0.0, 0.0, 0.5));
  gl.uniformMatrix4fv(mvLoc, false, flatten(mvBase));
  gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

  var mvTop = mult(mv, scalem(4.0, 3.0, 2.0));
  mvTop = mult(mvTop, translate(-0.2, 0.0, 1.5));
  gl.uniformMatrix4fv(mvLoc, false, flatten(mvTop));
  gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function drawPlane(mv) {
  gl.uniform4fv(colorLoc, vec4(0.9, 0.9, 0.9, 1.0));
  var body = mult(mv, scalem(6.0, 1.2, 1.0));
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(mvLoc, false, flatten(body));
  gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

  gl.uniform4fv(colorLoc, vec4(0.2, 0.2, 0.8, 1.0));
  var wing = mult(mv, scalem(1.0, 8.0, 0.2));
  gl.uniformMatrix4fv(mvLoc, false, flatten(wing));
  gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

  var tail = mult(mv, translate(3.0, 0.0, 1.2));
  tail = mult(tail, scalem(0.2, 1.0, 1.4));
  gl.uniformMatrix4fv(mvLoc, false, flatten(tail));
  gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function drawTunnel(baseMv) {
  var aRad = radians(tunnelAngle);
  var tx = tunnelMidRadius * Math.cos(aRad) + tunnelOffsetX;
  var ty = tunnelMidRadius * Math.sin(aRad);
  var tangentDeg = tunnelAngle;

  var mvTunnel = mult(baseMv, translate(tx, ty, tunnelHeight / 2.0));
  mvTunnel = mult(mvTunnel, rotateZ(-tangentDeg));

  var archSegments = 14;
  var archRadius = tunnelWidth / 1.5;
  var archThickness = 2.5;
  var archHeight = tunnelHeight + 4.0;

  for (var i = 0; i < archSegments; i++) {
    var theta1 = Math.PI * (i / archSegments);
    var theta2 = Math.PI * ((i + 1) / archSegments);
    var x1 = archRadius * Math.cos(theta1);
    var z1 = archHeight * Math.sin(theta1);
    var x2 = archRadius * Math.cos(theta2);
    var z2 = archHeight * Math.sin(theta2);
    var archMidX = (x1 + x2) / 2.0;
    var archMidZ = (z1 + z2) / 2.0 + tunnelHeight / 2.0;
    var archLength = tunnelLength;
    gl.uniform4fv(colorLoc, BROWN);
    var mvArch = mult(mvTunnel, translate(archMidX, 0.0, archMidZ));
    mvArch = mult(mvArch, scalem(archThickness, archLength, archThickness));
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvArch));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
  }

  for (var side = -1; side <= 1; side += 2) {
    gl.uniform4fv(colorLoc, vec4(0.35, 0.18, 0.1, 1.0));
    var mvPillar = mult(
      mvTunnel,
      translate(side * archRadius, 0.0, tunnelHeight / 2.0)
    );
    mvPillar = mult(
      mvPillar,
      scalem(archThickness * 1.2, archLength, tunnelHeight)
    );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvPillar));
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
  }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  carDirection += 1.2;
  if (carDirection > 360.0) carDirection -= 360.0;

  planeT += 0.01;
  if (planeT > Math.PI * 2) planeT -= Math.PI * 2;

  var mv = mat4();

  switch (view) {
    case 0: {
      var eye = vec3(fpPos.x, fpPos.y, 2.0);
      var lookDir = radians(fpDir);
      var center = vec3(
        fpPos.x + Math.cos(lookDir) * 10.0,
        fpPos.y + Math.sin(lookDir) * 10.0,
        2.0
      );
      mv = lookAt(eye, center, vec3(0.0, 0.0, 1.0));
      break;
    }
    case 1:
      mv = lookAt(
        vec3(250.0, 0.0, 100.0 + height),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 0.0, 1.0)
      );
      break;
    case 2: {
      var car0pos = computeCarPos(cars[0], carDirection);
      mv = lookAt(
        vec3(75.0, 0.0, 5.0 + height),
        vec3(car0pos.x, car0pos.y, 0.0),
        vec3(0.0, 0.0, 1.0)
      );
      break;
    }
    case 3: {
      var car1pos = computeCarPos(cars[0], carDirection);
      mv = lookAt(
        vec3(125.0, 0.0, 5.0 + height),
        vec3(car1pos.x, car1pos.y, 0.0),
        vec3(0.0, 0.0, 1.0)
      );
      break;
    }
    case 4: {
      var cp = computeCarPos(cars[0], carDirection);
      mv = lookAt(
        vec3(-3.0, 0.0, 5.0 + height),
        vec3(12.0, 0.0, 2.0 + height),
        vec3(0.0, 0.0, 1.0)
      );
      drawCarGeneric(mv, cars[0].color);
      mv = mult(mv, rotateZ(cp.angle));
      mv = mult(mv, translate(-cp.x, -cp.y, 0.0));
      break;
    }
    case 5: {
      var cp5 = computeCarPos(cars[0], carDirection);
      mv = rotateY(-cp5.angle);
      mv = mult(
        mv,
        lookAt(
          vec3(3.0, 0.0, 5.0 + height),
          vec3(40.0 - cp5.x, 120.0 - cp5.y, 0.0),
          vec3(0.0, 0.0, 1.0)
        )
      );
      drawCarGeneric(mv, cars[0].color);
      mv = mult(mv, rotateZ(cp5.angle));
      mv = mult(mv, translate(-cp5.x, -cp5.y, 0.0));
      break;
    }
    case 6: {
      var cp6 = computeCarPos(cars[0], carDirection);
      mv = lookAt(
        vec3(-12.0, 0.0, 10.0 + height),
        vec3(15.0, 0.0, 4.0),
        vec3(0.0, 0.0, 1.0)
      );
      drawCarGeneric(mv, cars[0].color);
      mv = mult(mv, rotateZ(cp6.angle));
      mv = mult(mv, translate(-cp6.x, -cp6.y, 0.0));
      break;
    }
    case 7: {
      var cp7 = computeCarPos(cars[0], carDirection);
      mv = lookAt(
        vec3(25.0, 5.0, 5.0 + height),
        vec3(0.0, 0.0, 2.0),
        vec3(0.0, 0.0, 1.0)
      );
      drawCarGeneric(mv, cars[0].color);
      mv = mult(mv, rotateZ(cp7.angle));
      mv = mult(mv, translate(-cp7.x, -cp7.y, 0.0));
      break;
    }
    case 8: {
      var cp8 = computeCarPos(cars[0], carDirection);
      mv = lookAt(
        vec3(8.0, 25.0, 5.0 + height),
        vec3(2.0, 0.0, 2.0),
        vec3(0.0, 0.0, 1.0)
      );
      mv = mult(mv, rotateZ(cp8.angle));
      mv = mult(mv, translate(-cp8.x, -cp8.y, 0.0));
      drawCarGeneric(mv, cars[0].color);
      break;
    }
  }

  drawScenery(mv);
  drawAllCars(mv);
  drawPlaneOnPath(mv);

  requestAnimFrame(render);
}

function computeCarPos(car, globalAngle) {
  var angle = globalAngle * car.dir + car.offset;
  var rad = radians(angle);
  var x = car.radius * Math.sin(rad);
  var y = car.radius * Math.cos(rad);
  return { x: x, y: y, angle: angle };
}

function drawAllCars(baseMv) {
  for (var i = 0; i < cars.length; i++) {
    var c = cars[i];
    var cp = computeCarPos(c, carDirection);
    var angRad = radians(cp.angle);
    var px = -Math.cos(angRad);
    var py = Math.sin(angRad);
    var cx = cp.x + px * c.laneOffset;
    var cy = cp.y + py * c.laneOffset;
    var mvCar = mult(baseMv, translate(cx, cy, 0.0));
    mvCar = mult(mvCar, rotateZ(-cp.angle));
    drawCarGeneric(mvCar, c.color);
  }
}

function drawPlaneOnPath(baseMv) {
  var A = 160.0;
  var B = 100.0;
  var t = planeT;
  var x = A * Math.sin(t);
  var y = B * Math.sin(2.0 * t);
  var dx = A * Math.cos(t);
  var dy = 2.0 * B * Math.cos(2.0 * t);
  var angle = (Math.atan2(dy, dx) * 180.0) / Math.PI;
  var mvPlane = mult(baseMv, translate(x, y, 60.0));
  mvPlane = mult(mvPlane, rotateZ(angle));
  mvPlane = mult(mvPlane, rotateX(-20));
  drawPlane(mvPlane);
}

function radians(d) {
  return (d * Math.PI) / 180.0;
}
