var VERSION = "0.0.3";

// TODO
// - segregate visual and logical functionality
// - add coordinate conversions

// deg2rad: helper function to convert degrees to radians
function deg2rad (degrees) {
	return ( degrees * Math.PI / 180 );
}

function getCoords(obj) {
	var coords = $(obj).attr('id').split(',');

	return [ parseInt(coords[0]), parseInt(coords[1]) ];
}

// Object Grid: start of this object to hold the game board and keep track of the spaces
function Grid(rings,hexspacesize,jqselector) {
	this.rings = typeof rings !== 'undefined' ? rings : 8;
	this.hexspacesize = typeof hexspacesize !== 'undefined' ? hexspacesize : 32;
	this.jqselector = typeof jqselector !== 'undefined' ? jqselector : '#grid';

	this.hexRing = new Array();	// two-dimensional (ring,position) array of hex objects
	this.jqobj = $(this.jqselector);
}

Grid.prototype.getHexByCoords = function(coords) {
	if ( coords === undefined || coords.length === 0 ) {
		return null;
	}
	var ring = coords[0];
	var pos = coords[1];

	if ( ring !== 0 ) {
		var posmax = ring * 6;	// pos needs to be from 0 to posmax-1

		pos = (pos + posmax) % posmax;	// convert negatives and too big of positions

		if ( this.hexRing[ring] !== undefined && this.hexRing[ring][pos] !== undefined ) {
			return this.hexRing[ring][pos];
		} else {
			return null;
		}
	} else {
		return this.hexRing[0][0];
	}
};

// drawHexSpace does the actual jQuery to place the hex on the Grid visually
Grid.prototype.drawHex = function(hex, x, y) {
	hex.gridx = Math.round(x);
	hex.gridy = Math.round(y);

	// add positioning to the jQuery object of the HexSpace
	hex.jqobj
		.css('position', 'absolute')
		.css('left', Math.round(x - this.hexspacesize / 2))
		.css('top', Math.round(y - this.hexspacesize / 2));

	this.jqobj.append(hex.jqobj);
}

// drawGrid creates the Grid of HexSpaces arranged in rings.  The starting position of a HexSpace
//   is far-right with new HexSpaces created clockwise around the ring.  Because the Grid is
//   ring-based, the Grid itself is one big hexagon.
Grid.prototype.draw = function() {
	var gridcenterx = Math.round(this.jqobj.position().left + this.jqobj.width() / 2);
	var gridcentery = Math.round(this.jqobj.position().top + this.jqobj.height() / 2);

	// Create rings.  Ring 0 is just the central hex.
	for ( var ring = 0; ring < this.rings; ring++ ) {
		this.hexRing[ring] = new Array();
		if ( ring === 0 ) {	// draw central hex only
			var hex = new HexSpace(this, ring, 0);
			this.drawHex(hex, gridcenterx, gridcentery);
			this.hexRing[ring].push(hex);
		} else {	// draw rings of hexes
			var offsetx = 0, offsety = 0, voffsetx = 0, voffsety = 0;
			var angle = 360 / ( ring * 6 );

			// each ring has 6 positions times the ring number
			for ( var pos = 0; pos < ring * 6; pos++ ) {	// foreach position
				var hex = new HexSpace(this, ring, pos);
				this.hexRing[ring].push(hex);
				if ( hex.isGridVertex() ) {	// this position is a vertex
					// we need to keep track of the vertex's offset to place non-vertex hexes
					voffsetx = offsetx = ring * hex.shortRadius * Math.cos( deg2rad(pos * angle) );
					voffsety = offsety = ring * hex.shortRadius * Math.sin( deg2rad(pos * angle) );
				} else {
					var whichside = hex.getGridSide();	// which side of the hex
					var anglefromvertex = whichside * 60 + 120;	// how this side angles from vertex
					// based on previous vertex position, we calculate the position of the non-vertex
					offsetx = voffsetx + (pos % ring) * hex.shortRadius * Math.cos( deg2rad(anglefromvertex) )
					offsety = voffsety + (pos % ring) * hex.shortRadius * Math.sin( deg2rad(anglefromvertex) )
				}
				this.drawHex(hex, gridcenterx + offsetx, gridcentery + offsety);	// show hex on the Grid
			}
		}
	}

	this.assignNeighbors();
}

Grid.prototype.assignNeighbors = function() {
	for ( var ring = 0; ring < this.hexRing.length; ring++ ) {
		if ( ring === 0 ) {	// ring 0 is a special case
			for ( var side = 0; side < 6; side++ ) {
				this.hexRing[0][0].neighbors[side] = this.hexRing[1][side];
			}
		} else {
			for ( var pos = 0; pos < ring * 6; pos++ ) {	// foreach position
				var hex = this.getHexByCoords([ring,pos]);

				// using ratios, find the ring+/-1 positions, with respect to origin
				var outerringpos = pos * (ring+1) / ring;	// int for vertices; float for others
				var innerringpos = pos * (ring-1) / ring;	// int for vertices; float for others

				if ( hex.isGridVertex() ) {
					hex.neighbors[0] = this.getHexByCoords([ring+1,outerringpos-1]);
					hex.neighbors[1] = this.getHexByCoords([ring+1,outerringpos]);
					hex.neighbors[2] = this.getHexByCoords([ring+1,outerringpos+1]);
					hex.neighbors[3] = this.getHexByCoords([ring,pos+1]);
					hex.neighbors[4] = this.getHexByCoords([ring-1,innerringpos]);
					hex.neighbors[5] = this.getHexByCoords([ring,pos-1]);
				} else {
					// using modulus to rotate as we rotate around the origin
					var gridside = hex.getGridSide();
					hex.neighbors[(0 + gridside) % 6] = this.getHexByCoords([ring+1,Math.floor(outerringpos)]);
					hex.neighbors[(1 + gridside) % 6] = this.getHexByCoords([ring+1,Math.ceil(outerringpos)]);
					hex.neighbors[(2 + gridside) % 6] = this.getHexByCoords([ring,pos+1]);
					hex.neighbors[(3 + gridside) % 6] = this.getHexByCoords([ring-1,Math.ceil(innerringpos)]);
					hex.neighbors[(4 + gridside) % 6] = this.getHexByCoords([ring-1,Math.floor(innerringpos)]);
					hex.neighbors[(5 + gridside) % 6] = this.getHexByCoords([ring,pos-1]);
				}
			}
		}
	}
}

// Object HexSpace: represents a pointy (vertex upward) hex on the Grid
function HexSpace(grid, ring, pos) {
	var coords = new Array();	// array of coordinates joined in polygon definition
	
	var minx = 0, miny = 0, maxx = 0, maxy = 0; // later used to calculate the actual size of the hex
	for ( var i = 0; i < 360; i += 60 ) {	// for each vertex angle, determine the coordinates
		var x = Math.round((Math.sin(deg2rad(i)) + 1) * grid.hexspacesize / 2);
		var y = Math.round((Math.cos(deg2rad(i)) + 1) * grid.hexspacesize / 2);

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

	// jQuery object used to insert hexes into the Grid object
	this.jqobj = $('<svg id="' + ring + ',' + pos + '" xmlns="http://www.w3.org/2000/svg" version="1.1" class="svghex ring' + this.ring + '"><polygon points="' + coords.join(' ') + '" /><text x="10" y="20">' + this.ring + ',' + this.pos + '</text></svg>').css('width', grid.hexspacesize).css('height', grid.hexspacesize);

	this.shortRadius = maxx - minx;	// from side to opposite side
	this.longRadius = maxy - miny;	// from vertext to opposite vertex
	this.sideLength = 2 * Math.sqrt(Math.pow(this.longRadius, 2) - Math.pow(this.shortRadius, 2))	// Pathagorean Theorem

	// coordinates for center of hex
	this.centerx = Math.floor(this.shortRadius / 2);
	this.centery = Math.floor(this.longRadius / 2);

	// coordinates on grid for this hex
	this.gridx = this.gridy = 0;

	this.neighbors = new Array();	// array of adjacent hexes
}

HexSpace.prototype.isGridVertex = function() {
	if ( this.ring !== 0 ) {
		return ( this.pos % this.ring === 0 )
	} else {
		return null;
	}
}

HexSpace.prototype.getGridSide = function() {
	if ( this.ring !== 0 ) {
		return ( Math.floor(this.pos / this.ring) % 6 );
	} else {
		return null;
	}
}

