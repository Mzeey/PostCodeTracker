const savedPostCodes = [
    "M1 1AA",
    "M1 1AD",
    "M1 1BB",
    "M1 1LQ",
]

let UserPostCode = document.querySelector("#postcode");
let savedPostCodesMarkers = [];
let customerLatLng = null;
let closest = [];


function initMap(){
    var position = {lat: 53.4530, lng: -2.0268}
    var geocoder =  new google.maps.Geocoder();
    var mapOptions = {
        zoom: 13,
        center: position
    }

    var map = new google.maps.Map(document.getElementById("map"), mapOptions);

    function addMarker(props){
        var marker = new google.maps.Marker({
            position: props.coords,
            map: map
        })
        if(props.iconImg){
            marker.setIcon(props.iconImg)
        }

        if (props.content){
            var infowindow = new google.maps.InfoWindow({
                content: props.content
            })
        }
    }

    let autocomplete = new google.maps.places.Autocomplete(UserPostCode);

    document.querySelector("#search").addEventListener("submit", function(e){
        e.preventDefault();
        findPostCode();
        
    });

    function findPostCode(){
        let postcode = UserPostCode.value;
        geocoder.geocode({address: postcode}, function(results, status){
            if(status == "OK"){
                customerLatLng = results[0].geometry.location
                addMarker({coords: customerLatLng });
                map.setCenter(customerLatLng);
                map.setZoom(16);

                savedPostCodes.forEach(function(postcode){
                    geocoder.geocode({address: postcode}, function(results, status){
                        if(status == "OK"){
                            let marker = new google.maps.Marker({
                                position: results[0].geometry.location,
                                map: map,
                                title: postcode
                            });
                            savedPostCodesMarkers.push(marker);
                            closest.push({
                                postcode:postcode,
                                distance: google.maps.geometry.spherical.computeDistanceBetween(customerLatLng, results[0].geometry.location)
                            })

                            if(savedPostCodes.length == closest.length){
                                closest.sort(function(a,b){
                                    return a.distance - b.distance;
                                });
                                let closestdistance = (closest[0].distance/1609.344).toFixed(2);
                                let closestPostcode = closest[0].postcode;
                
                                console.log(`${closestPostcode} is the closest to ${UserPostCode.value} with a distance of ${closestdistance} miles`);
                            }
                        }
                    })
                })
                
                
            }
        })
    }
}

