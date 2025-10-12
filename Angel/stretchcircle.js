/////////////////////////////////////////////////////////////////
//    Sýnislausn á dæmi 1 í Heimadæmum 3 í Tölvugrafík
//     Hringur sem er teygður uppá við á reglubundinn hátt
//     í hnútalitara.  Líka hægt að breyta um teygjustefnu
//     með því að smella með músinni.
//
//    Hjálmtýr Hafsteinsson, september 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// numCirclePoints er fjöldi punkta á hringnum
// Heildarfjöldi punkta er tveimur meiri (miðpunktur + fyrsti punktur kemur tvisvar)
var numCirclePoints = 50;       

var radius = 0.2;
var center = vec2(0, 0);

var points = [];
var locTime;
var iniTime;
var turn = 0;

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	// Create the circle
    createCirclePoints( center, radius, numCirclePoints );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    locTime = gl.getUniformLocation( program, "time" );
    iniTime = Date.now();

    locTurn = gl.getUniformLocation( program, "turn" );
    gl.uniform1i( locTurn, turn );
    
    canvas.addEventListener("mousedown", function(e){
        if (turn == 1) turn = 0;
        else turn =1;
        gl.uniform1i( locTurn, turn);
    } );

    render();
}


// Create the points of the circle
function createCirclePoints( cent, rad, k )
{
    points = [];
    points.push( center );
    
    var dAngle = 2*Math.PI/k;
    for( i=k; i>=0; i-- ) {
    	a = i*dAngle;
    	var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
    	points.push(p);
    }
}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );

    var msek = Date.now() - iniTime;
    gl.uniform1f( locTime, msek );
    
    gl.drawArrays( gl.TRIANGLE_FAN, 0, numCirclePoints+2 );

    window.requestAnimFrame(render);
}
