/////////////////////////////////////////////////////////////////
//    Sýnislausn á dæmi 2 í heimadæmum 2 í Tölvugrafík
//     Nota sleða til að stilla nákvæmni hrings
//
//    Hjálmtýr Hafsteinsson, ágúst 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numCirclePoints = 3;           // Getum byrjað með þríhyrning!
var radius = 0.5;
var center = vec2(0, 0);

var points = [];

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	
	// Tökum frá pláss í grafíkminni fyrir 102 punkta
    gl.bufferData(gl.ARRAY_BUFFER, 8*102, gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    document.getElementById("slider").onchange = function(event) {
        numCirclePoints = Number(event.target.value);
        render();
    };

    render();
}


// Create the points of the circle
function createCirclePoints( cent, rad, k )
{
    points.push( cent );

    var dAngle = 2*Math.PI/k;
    for( i=k; i>=0; i-- ) {
    	a = i*dAngle;
    	var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
    	points.push(p);
    }
}

function render() {
    
	// Búa til nýtt punktafylki af réttri stærð og flytja það í grafíkminni
	points = [];
    createCirclePoints( center, radius, numCirclePoints );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    gl.clear( gl.COLOR_BUFFER_BIT );
    
    // Draw circle using Triangle Fan
    gl.drawArrays( gl.TRIANGLE_FAN, 0, numCirclePoints+2 );
}
