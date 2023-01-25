let savedPostCodes = [];

async function getSavedPostCodes() {
	fetch("../PostCodes.json")
		.then((response) => response.json())
		.then(async function (data) {
			savedPostCodes = await data.SavedPostcodes;
		});
}
getSavedPostCodes();

let UserPostCode = document.querySelector("#postcode");
let savedPostCodesMarkers = [];
let customerLatLng = null;
let closest = [];
let map = null;
const TOMILES = 1609.344;

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

	//Funciton adds marker to map
	function addMarker(props) {
		var marker = new google.maps.Marker({
			position: props.coords,
			map: map,
		});
		if (props.iconImg) {
			marker.setIcon(props.iconImg);
		}

		if (props.content) {
			var infowindow = new google.maps.InfoWindow({
				content: props.content,
			});
		}
	}

	//implement autocomplete function
	let autocomplete = new google.maps.places.Autocomplete(UserPostCode);

	document.querySelector("#search").addEventListener("submit", function (e) {
		e.preventDefault();
		resetValues();
		findClosestPostCode().then(() => {
			renderClosestPostCodes();
			console.log("HI");
		});
	});

	function findClosestPostCode() {
		return new Promise((resolve) => {
			let postcode = UserPostCode.value;
			geocoder.geocode({ address: postcode }, function (results, status) {
				if (status == "OK") {
					customerLatLng = results[0].geometry.location;
					addMarker({ coords: customerLatLng });
					map.setCenter(customerLatLng);
					map.setZoom(16);

					let promises = [];
					savedPostCodes.forEach(function (postcode) {
						promises.push(
							new Promise((resolve, reject) => {
								geocoder.geocode({ address: postcode }, async function (results, status) {
									if (status == "OK") {
										let marker = new google.maps.Marker({
											position: results[0].geometry.location,
											map: map,
											title: postcode,
										});
										await savedPostCodesMarkers.push(marker);
										await distanceMatrixservice.getDistanceMatrix(
											{
												origins: [customerLatLng],
												destinations: [results[0].geometry.location],
												travelMode: "DRIVING",
											},
											async (response, status) => {
												if (status == "OK") {
													let distance = await response.rows[0].elements[0].distance.value;
													closest.push(
														await {
															postcode: postcode,
															distance: distance,
															latLng: results[0].geometry.location,
														}
													);
													resolve();
												}
											}
										);
									}
								});
							})
						);
					});
					Promise.all(promises).then(() => {
						resolve();
					});
				}
			});
		});
	}
}

function renderClosestPostCodes() {
	if (savedPostCodes.length == closest.length) {
		closest.sort(function (a, b) {
			return a.distance - b.distance;
		});
		let closestdistance = (closest[0].distance / TOMILES).toFixed(2);
		let closestPostcode = closest[0].postcode;
		displayPostcode(closest);

		document.querySelector(".desc").innerHTML = `${closestPostcode} is the closest to ${UserPostCode.value} with a distance of ${closestdistance} miles`;
	}
}

function resetValues() {
	document.querySelector(".postcode-list").innherHTML = "";
	closest = [];
	savedPostCodesMarkers = [];
}

function displayPostcode(closest) {
	let postcodeList = document.querySelector(".postcode-list");
	let content = "";

	closest.forEach(function (item, index) {
		if (index > 10) {
			return;
		}
		content += `
            <li id="${index + 1}"> 
                <p>Post Code: ${item.postcode}</p>
                <p>Distance: ${(item.distance / TOMILES).toFixed(2)} miles</p>
            </li>
        `;
	});
	postcodeList.innerHTML = content;
	applyListeners();
}

function applyListeners() {
	let descListItems = document.querySelectorAll(".postcode-list li");
	for (let i = 0; i < descListItems.length; i++) {
		descListItems[i].addEventListener("click", function () {
			let itemIndex = this.id - 1;
			let itemMarker = savedPostCodesMarkers[itemIndex];
			savedPostCodesMarkers.forEach(function (item) {
				clearBounce(item);
			});
			toogleBounce(itemMarker);
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
