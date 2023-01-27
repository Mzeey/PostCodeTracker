// const { kdTree } = require("./kd-tree");


let savedPostCodes = [];

async function getSavedPostCodes() {
	fetch("../Places.json")
		.then((response) => response.json())
		.then(async function (data) {
			savedPostCodes = await data;
			savedPostCodes.forEach((item) => {
				item = new PlaceLocation(item.postcode, item.lat, item.lng);
				places.push(item);
			})
		});
}
getSavedPostCodes();

let UserPostCode = document.querySelector("#postcode");
let savedPostCodesMarkers = [];
let customerLatLng = null;
let customerMarker = null;
let closestLocations = [];
let places = [];
let CustomerLocation = null;
let map = null;
const TOMILES = 1609.344;
const FROMCARTESIANTOMILES = 0.000621371;

function initMap() {
	var position = { lat: 53.453, lng: -2.0268 };
	var geocoder = new google.maps.Geocoder();
	var mapOptions = {
		zoom: 13,
		center: position,
	};
	var distanceMatrixservice = new google.maps.DistanceMatrixService();

	//Initialize map
	map = new google.maps.Map(document.getElementById("map"), mapOptions);

	

	//implement autocomplete function
	let autocomplete = new google.maps.places.Autocomplete(UserPostCode);

	document.querySelector("#search").addEventListener("submit", function (e) {
		e.preventDefault();
		resetValues();
		findClosestPostCode();
	});

	//this function gets the latitude and longitudinal values of the Places using google map
	function getLatLngOfSavedPlaces(){
		let promises = [];
		savedPostCodes.forEach(function(item){
			promises.push(new Promise((resolve) =>{
				geocoder.geocode({address: item}, async function (results, status){
					if(status == google.maps.GeocoderStatus.OK){
						places.push({postcode: item, lat : results[0].geometry.location.lat(), Lng: results[0].geometry.location.lng()});
						resolve();
					}
				})
			}));
		});
		Promise.all(promises).then(() => {
			// let jsonObject = JSON.parse(places);
			console.log(JSON.stringify(places));
			console.log(places)
		});
	}

	function findClosestPostCode() {
		return new Promise((resolve) => {
			let postcode = UserPostCode.value;
			geocoder.geocode({ address: postcode }, function (results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					customerLatLng = results[0].geometry.location;
					CustomerLocation = new PlaceLocation(postcode, customerLatLng.lat(), customerLatLng.lng());
					// map.setZoom(14);

					let tree = new kdTree(places, (a,b) => calculateDistanceInMiles(a,b), ["Latitude", "Longitude"])

					closestLocations = tree.nearest({Latitude:CustomerLocation.Latitude, Longitude: CustomerLocation.Longitude}, 10)
					console.log(closestLocations)
					closestLocations.forEach((location) =>{
						location[0].DistanceInMiles = calculateDistanceInMiles(CustomerLocation, location[0]).toFixed(2);
					})
					closestLocations.sort((a,b) => a[1] - b[1]);
					renderClosetLocations(closestLocations, CustomerLocation);
				}
			});
		});
	}
}

//Funciton adds marker to map
function addMarker(props) {
	var marker = new google.maps.Marker({
		position: props.coords,
		map: map,
	});
	if (props.iconImg) {
		marker.setIcon(props.iconImg);
	}

	if(props.title){
		marker.setTitle(props.title);
	}

	if (props.content) {
		var infowindow = new google.maps.InfoWindow({
			content: props.content,
		});
	}

	return marker;
	
}

function renderClosetLocations(closestLocations, CustomerLocation){
	let ClosetLocation = closestLocations[0][0];
	renderPlacesHTML(closestLocations);
	document.querySelector(".desc").innerHTML = `${ClosetLocation.Title} is the closest to ${CustomerLocation.Title} with a distance of ${ClosetLocation.DistanceInMiles} miles`;
}

function renderPlacesHTML(closestLocations){
	let postcodeList = document.querySelector(".postcode-list");
	let content = "";
	closestLocations.forEach(function(item, index){
		item = item[0];
		let itemCoords = new google.maps.LatLng(item.Latitude, item.Longitude);
		item.Marker = addMarker({coords: itemCoords, title: item.Title});
		let googleMapRedirectLink = getRedirectToGoogleMapsLink(CustomerLocation, item)
		content += `
		<li id="${index + 1}"> 
			<p>Post Code: ${item.Title}</p>
			<p>Distance: ${item.DistanceInMiles} miles</p>
			<a href="${googleMapRedirectLink}" target="_blank"> View Direction</a>
		</li>
	`;
	});
	postcodeList.innerHTML = content;
	applyListeners(closestLocations);
	fitBoundsToMap(closestLocations);
}

function renderClosestPostCodes() {
	if (savedPostCodes.length == closest.length) {
		closest.sort(function (a, b) {
			return a.distance - b.distance;
		});
		let closestdistance = (closest[0].distance / TOMILES).toFixed(2);
		let closestPostcode = closest[0].postcode;
		displayPostcode(closest);
	}
}

//refactor this
function resetValues() {
	document.querySelector(".postcode-list").innherHTML = "";
	if(closestLocations){
		closestLocations.forEach(function(item){
			item = item[0];
			item.Marker.setMap(null);
		})
		closestLocations = [];
	}
	if(customerMarker){
		customerMarker.setMap(null);
	}
}


function applyListeners(closestLocations) {
	let descListItems = document.querySelectorAll(".postcode-list li");
	for (let i = 0; i < descListItems.length; i++) {
		descListItems[i].addEventListener("click", function () {
			let itemIndex = this.id - 1;
			console.log(closestLocations[itemIndex][0], itemIndex);
			closestLocations.forEach(function(item){
				item = item[0];
				clearBounce(item.Marker);
			})
			toogleBounce(closestLocations[itemIndex][0].Marker)
		});
	}
}
function toogleBounce(itemMarker) {
	if (itemMarker.getAnimation() != google.maps.Animation.BOUNCE) {
		itemMarker.setAnimation(google.maps.Animation.BOUNCE);
	} else {
		itemMarker.setAnimation(null);
	}
}

function clearBounce(itemMarker) {
	if (itemMarker.getAnimation() == google.maps.Animation.BOUNCE) {
		itemMarker.setAnimation(null);
	}
}


function distanceInMiles(lat1, lon1, lat2, lon2) {
    var R = 3959; // radius of Earth in miles
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    return dist
}


class PlaceLocation{
	constructor(title, latitude, longitude){
		this.Title = title;
		this.Latitude = latitude;
		this.Longitude = longitude
	}

	setMarker(marker){
		this.Marker = marker;
	}
	
	clearMarker(){
		this.Marker.setMap(null);
		this.Marker = null;
	}
}


function calculateDistanceInMiles(Origin = new PlaceLocation(), Destination = new PlaceLocation()){
	const EARTHRADIUSINMILES = 3959;
	let originRadiusLat = Math.PI * Origin.Latitude/180;
	let destinationRadiusLat = Math.PI * Destination.Latitude/180;
	let theta = Origin.Longitude - Destination.Longitude;
	let radiusTheta = Math.PI * theta/180;
	let distance = Math.sin(originRadiusLat) * Math.sin(destinationRadiusLat) + Math.cos(originRadiusLat) * Math.cos(destinationRadiusLat) * Math.cos(radiusTheta);
	distance = Math.acos(distance);
	distance = distance * 180/Math.PI;
	distance = distance * 60 * 1.1515;
	return distance;
}

function fitBoundsToMap(closestLocations){
	var bounds = new google.maps.LatLngBounds();
	closestLocations.forEach(function(item){
		item = item[0];
		bounds.extend(item.Marker.getPosition());
	})
	map.fitBounds(bounds);
}


function getRedirectToGoogleMapsLink(Origin, Destination) {
  const url = `https://www.google.com/maps?saddr=${Origin.Latitude},${Origin.Longitude}&daddr=${Destination.Latitude},${Destination.Longitude}`;
  return url
}
