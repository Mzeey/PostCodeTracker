var map, tree;
var numMarkers = 30;
var markers = [];
var bounds = {
	south: -179,
	west: -88,
	north: 179,
	east: 88,
};

function initialize() {
	map = new google.maps.Map(document.getElementById("map_canvas"), {
		zoom: 4,
		center: new google.maps.LatLng(51.164181, 10.45415),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
	});
	buildPhotoTree();
}

function distance(a, b) {
	var lat1 = a.latitude,
		lon1 = a.longitude,
		lat2 = b.latitude,
		lon2 = b.longitude;
	var rad = Math.PI / 180;

	var dLat = (lat2 - lat1) * rad;
	var dLon = (lon2 - lon1) * rad;
	var lat1 = lat1 * rad;
	var lat2 = lat2 * rad;

	var x = Math.sin(dLat / 2);
	var y = Math.sin(dLon / 2);

	var a = x * x + y * y * Math.cos(lat1) * Math.cos(lat2);
	return Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildPhotoTree() {
	for (var i = 0; i < numMarkers; i++) {
		markers[i] = new google.maps.Marker({ map: map });
	}

	tree = new kdTree(photos, distance, ["latitude", "longitude"]);
	google.maps.event.addListener(map, "mousemove", function (e) {
		var point = { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
		var nearest = tree.nearest(point, numMarkers);
		for (var i = 0; i < numMarkers; i++) {
			var photo = nearest[i][0];
			markers[i].setPosition(new google.maps.LatLng(photo.latitude, photo.longitude));
			markers[i].setTitle(photo.title);
		}
	});
}

google.maps.event.addDomListener(window, "load", initialize);
