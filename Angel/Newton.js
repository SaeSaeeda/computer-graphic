/////////////////////////////////////////////////////////////////
//    Sýnislausn á dæmi 5 í Heimadæmum 4 í Tölvugrafík
//     Vagga Newtons með tveimur "kúlum"
//
//    Hjálmtýr Hafsteinsson, september 2025
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -2.0;

var lSwing = 0.0;          // Núverandi sveiflugráður
var rSwing = 0.0;
var swingIncr = 1.0       // Sveifluhraði
var swingDir = 1.0        // Sveifluátt
var maxSwing = 60.0       // Mesta sveifla
var leftSwing = true      // Á vinstri kúla að sveiflast?

var mvLoc;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    mvLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = perspective( 60.0, 1.0, 0.1, 100.0 );
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );


    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    // Event listener for keyboard
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38:	// upp ör
                swingIncr += 0.2;
                break;
            case 40:	// niður ör
                swingIncr -= 0.2;
                break;
            case 33:	// PageUp
                maxSwing += 5.0;
                break;
            case 34:	// PageDown
                maxSwing -= 5.0;
                break;
        }
    } );

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
     }  );  


    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    if (leftSwing) {
        lSwing += swingDir*swingIncr;
        if (lSwing > maxSwing ) swingDir *= -1.0;
        if (lSwing < 0.0 ) leftSwing = false;
    } else {
        rSwing += swingDir*swingIncr;
        if (rSwing < -maxSwing ) swingDir *= -1.0;
        if (rSwing > 0.0 ) leftSwing = true;
    }   
    
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) ) ;

    
    // Teikna fyrri "kúluna" ...
    mv1 = mult( mv, translate( -0.1, 0.42, 0.0 ) );
    mv1 = mult( mv1, rotateZ( rSwing ) );
    mv1 = mult( mv1, translate( 0.1, -0.42, 0.0 ) );
    
    // Bandið
    mv2 = mult( mv1, translate( -0.1, 0.1, 0.0 ) );
    mv2 = mult( mv2, scalem( 0.02, .6, 0.02 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Loks kúlan
    mv2 = mult( mv1, translate( -0.1, -0.25, 0.0 ) );
    mv2 = mult( mv2, scalem( 0.2, 0.2, 0.2 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    
    
    // Teikna seinni "kúluna" ...
    mv1 = mult( mv, translate( 0.1, 0.42, 0.0 ) );
    mv1 = mult( mv1, rotateZ( lSwing ) );
    mv1 = mult( mv1, translate( -0.1, -0.42, 0.0 ) );
    
    // Bandið
    mv2 = mult( mv1, translate( 0.1, 0.1, 0.0 ) );
    mv2 = mult( mv2, scalem( 0.02, .6, 0.02 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    // Loks kúlan
    mv2 = mult( mv1, translate( 0.1, -0.25, 0.0 ) );
    mv2 = mult( mv2, scalem( 0.2, 0.2, 0.2 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    

    requestAnimFrame( render );
}
