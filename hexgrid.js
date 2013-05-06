var gridRings = 8;			// number of rings of hexes on the Grid
var hexSpaceSize = 24;		// the size of the hexes
var hexRing = new Array();	// two-dimensional (ring,position) array of hex objects

// Object HexSpace: represents a pointy (vertex upward) hex on the Grid
function HexSpace(ring, pos) {
	var coords = new Array();	// array of coordinates joined in polygon definition
	
	var minx = 0, miny = 0, maxx = 0, maxy = 0; // later used to calculate the actual size of the hex
	for ( var i = 0; i < 360; i += 60 ) {	// for each vertex angle, determine the coordinates
		var x = Math.round((Math.sin(i * Math.PI / 180) + 1) * hexSpaceSize / 2);
		var y = Math.round((Math.cos(i * Math.PI / 180) + 1) * hexSpaceSize / 2);

		if ( x > maxx )
			maxx = x;
		if ( y > maxy )
			maxy = y;
		if ( x < minx )
			minx = x;
		if ( y < miny )
			miny = y;

		coords.push(x + ',' + y)
	}

	/* Set member variables of object */

	// jQuery object used to insert hexes into the Grid object
	this.jqobj = $('<svg xmlns="http://www.w3.org/2000/svg" version="1.1"><polygon class="svghex" points="' + coords.join(' ') + '" /><text class="svgtext" x="10" y="20">' + pos + '</text></svg>').css('width', hexSpaceSize).css('height', hexSpaceSize);

	// if ring is not given, assume 0
	if ( ring !== undefined && ring >= 0 ) {
		this.ring = ring;
	} else {
		this.ring = 0;
	}

	// if position is not given, assume 0
	if ( pos !== undefined && pos >= 0 ) {
		this.pos = pos;
	} else {
		this.pos = 0;
	}

	this.shortRadius = maxx - minx;	// from side to opposite side
	this.longRadius = maxy - miny;	// from vertext to opposite vertex
	this.sideLength = 2 * Math.sqrt(Math.pow(this.longRadius, 2) - Math.pow(this.shortRadius, 2))	// Pathagorean Theorem

	// coordinates for center of hex
	this.centerx = Math.floor(this.shortRadius / 2);
	this.centery = Math.floor(this.longRadius / 2);

	this.neighbors = new Array();	// array of adjacent hexes
}

// drawHexSpace does the actual jQuery to place the hex on the Grid visually
function drawHexSpace(hex, x, y) {
	var grid = $('#grid');

	// add positioning to the jQuery object of the HexSpace
	hex.jqobj
		.css('position', 'absolute')
		.css('left', Math.round(x - hexSpaceSize / 2))
		.css('top', Math.round(y - hexSpaceSize / 2));

	$('#grid').append(hex.jqobj);
}

// drawGrid creates the Grid of HexSpaces arranged in rings.  The starting position of a HexSpace
//   is far-right with new HexSpaces created clockwise around the ring.  Because the Grid is
//   ring-based, the Grid itself is one big hexagon.
function drawGrid() {
	var gridcenterx = Math.round($('#grid').position().left + $('#grid').width() / 2);
	var gridcentery = Math.round($('#grid').position().top + $('#grid').height() / 2);

	// Create rings.  Ring 0 is just the central hex.
	for ( var ring = 0; ring < gridRings; ring++ ) {
		hexRing[ring] = new Array();
		if ( ring === 0 ) {	// draw central hex only
			var hex = new HexSpace(ring, 0);
			drawHexSpace(hex, gridcenterx, gridcentery);
			hexRing[ring].push(hex);
		} else {	// draw rings of hexes
			var offsetx = 0, offsety = 0, voffsetx = 0, voffsety = 0;
			var angle = 360 / ( ring * 6 );

			// each ring has 6 positions times the ring number
			for ( var pos = 0; pos < ring * 6; pos++ ) {	// foreach position
				var hex = new HexSpace(ring, pos);
				if ( pos % ring === 0 ) {	// this position is a vertex
					// we need to keep track of the vertex's offset to place non-vertex hexes
					voffsetx = offsetx = ring * hex.shortRadius * Math.cos( (pos * angle) * Math.PI / 180 );
					voffsety = offsety = ring * hex.shortRadius * Math.sin( (pos * angle) * Math.PI / 180 );
				} else {
					var whichside = Math.floor(pos / ring);	// which side of the hex
					var anglefromvertex = whichside * 60 + 120;	// how this side angles from vertex
					// based on previous vertex position, we calculate the position of the non-vertex
					offsetx = voffsetx + (pos % ring) * hex.shortRadius * Math.cos( anglefromvertex * Math.PI / 180 )
					offsety = voffsety + (pos % ring) * hex.shortRadius * Math.sin( anglefromvertex * Math.PI / 180 )
				}
				drawHexSpace(hex, gridcenterx + offsetx, gridcentery + offsety);	// show hex on the Grid
			}
		}
	}
}

$(document).ready( function() {
	drawGrid();
} );
