function toggleSelect(event) {
	event.preventDefault();

	var polygon = $(this).children('polygon');

	if ( polygon.css('stroke-width') == '1px' ) {
		polygon.css('stroke-width', '0px');
	} else {
		polygon.css('stroke-width', '1px');
	}
}

function toggleHover(event, obj, enter) {
	event.preventDefault();

	var coords = getCoords(obj);
	var ring = coords[0];

	if ( enter ) {
		var hex = getHexSpace([coords[0],coords[1]]);
		if ( hex !== undefined && hex !== null ) {
			for ( var side = 0; side < 6; side++ ) {
				if ( hex.neighbors[side] !== undefined && hex.neighbors[side] !== null ) {
					hex.neighbors[side].jqobj.children('polygon').css('stroke-width', '1px');
				}
			}
		}
//		$('.ring' + ring + ' polygon').css('stroke-width', '1px');
	} else {
		var hex = getHexSpace([coords[0],coords[1]]);
		if ( hex !== undefined && hex !== null ) {
			for ( var side = 0; side < 6; side++ ) {
				if ( hex.neighbors[side] !== undefined && hex.neighbors[side] !== null ) {
					hex.neighbors[side].jqobj.children('polygon').css('stroke-width', '0px');
				}
			}
		}
//		$('.ring' + ring + ' polygon').css('stroke-width', '0px');
	}
}

$(document).ready( function() {
	drawGrid();
	$('.svghex').click(toggleSelect);
	$('.svghex').hover(
		function(event) { toggleHover(event, this, true); },
		function(event) { toggleHover(event, this, false); }
	);
} );
