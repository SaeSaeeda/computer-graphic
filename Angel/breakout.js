/////////////////////////////////////////////////////////////////
//    Sýnislausn á dæmi 5 í heimadæmum 3 í Tölvugrafík
//     Ferningur skoppar um gluggann.  Notandi stýrir spaða með
//     músinni og ferningurinn skoppar af spaðanum.
//
//    Hjálmtýr Hafsteinsson, september 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// Núverandi staðsetning miðju ferningsins
var box = vec2( 0.0, 0.0 );

// Hálf breidd/hæð ferningsins
var boxRadius = 0.03;

// Stefna (og hraði) fernings
var dX;
var dY;

// Svæðið er frá -maxX til maxX og -maxY til maxY
var maxX = 1.0;
var maxY = 1.0;

var mouseX;             // Old value of x-coordinate  
var movement = false;   // Do we move the paddle?

// Staðsetning spaða
var padMiddleX = 0.0;     // x-hnit á miðju spaða
var padRadiusX = 0.15;    // Hálf vídd spaða
var padTopY = -0.87;      // Staðsetning á efri hluta spaða

// Fylkið vertices geymir alla hnútana: "boltann" í fyrstu 6 sætunum og spaðann í næstu 6 sætum
var vertices = [vec2(-0.03, -0.03), vec2(0.03, -0.03), vec2(0.03, 0.03),
                vec2(-0.03, -0.03), vec2(0.03, 0.03), vec2(-0.03, 0.03),
                vec2( -0.15, -0.9), vec2(0.15, -0.9), vec2(0.15, -0.87),
                vec2( -0.15, -0.9), vec2(0.15, -0.87), vec2(-0.15, -0.87) ];

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
    // Gefa ferningnum slembistefnu í upphafi
    dX = Math.random()*0.1-0.03;
    dY = Math.random()*0.1-0.03;

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Meðhöndlun örvalykla
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38:	// upp ör
                dX *= 1.1;
                dY *= 1.1;
                break;
            case 40:	// niður ör
                dX /= 1.1;
                dY /= 1.1;
                break;
        }
    } );

    // Event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        mouseX = e.offsetX;
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            var xmove = 2*(e.offsetX - mouseX)/canvas.width;
            mouseX = e.offsetX;
            for(i=6; i<12; i++) {
                vertices[i][0] += xmove;
            }
            padMiddleX += xmove;
        }
    } );

    render();
}


function render() {
    
    // Athuga hvort ferningur rekst á spaða
    if ( (box[1] + dY < padTopY) &&
         (box[0] + dX > padMiddleX - padRadiusX) &&
         (box[0] + dX < padMiddleX + padRadiusX))
        dY = -dY;
    
    // Láta ferninginn skoppa af veggjunum
    if (Math.abs(box[0] + dX) > maxX - boxRadius) dX = -dX;
    if (Math.abs(box[1] + dY) > maxY - boxRadius) dY = -dY;

    // Uppfæra staðsetningu fernings
    box[0] += dX;
    box[1] += dY;
    for (i=0; i<6; i++) {
        vertices[i][0] += dX;
        vertices[i][1] += dY;
    }
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));

    gl.drawArrays( gl.TRIANGLES, 0, 12 );

    window.requestAnimFrame(render);
}
