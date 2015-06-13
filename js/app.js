/* app.js
 *
 * This is the map application. It uses a Google map to render locations
 * based off a Foursquare search. The results are drawn as blue pins on
 * the Google map and also written into the results list. Clicking on a
 * blue pin opens and infowindow. Clicking on a result in the list view
 * slides the pin into the center of the map view and opens the infowindow.
 *
 * The radius is set to 5000 meters or about 3 miles to focus on the business
 * area in my immediate area.
 */

var map, infowindow, service;
var zoom = 13;
var SQid = "Y55TSVC1TXZIPPF235A52J5FW5TOE4UWCYQBV0AGLLJ13AIQ";
var SQsecret = "V3OJZGHJ3P3FPZI1RMIPJUZPTZU413WEGOYLKIIG2E4ZKRKT";

/* This variable in the model for the application. It holds the center of the search,
 * lists for search results for both the list view and map, helper functions to both
 * add and clear the lists, and the main search function.
 */
var mapViewModel = {
    mapLat: ko.observable("32.9889692"),
    mapLng: ko.observable("-96.5990308"),
    results: ko.observableArray([]), //list holding list view data for search results
    addResult: function (value) {
        this.results.push(value);
    },
    clearResults: function () {
        this.results.removeAll();
    },
    markers: ko.observableArray([]), //list holding Google map markers for search results
    addMarker: function (value) {
        this.markers.push(value);
    },
    clearMarkers: function () {
        this.markers.removeAll();
    },
    searchTerm: ko.observable(""),
    doSearch: function () {
        reset(); //reset both the map pins and list results data
        search(this.mapLat(), this.mapLng(), this.searchTerm()); //perform the search
        var latlng = new google.maps.LatLng(mapViewModel.mapLat(), mapViewModel.mapLng());
        map.setCenter(latlng); //reset the view to the search center in case the map view was reset
    }
};

/* This function is called by clicking on one of the items in the results list
 */
function highlightPin(data) {
    map.panTo(data.position); //use pan animation to bring the marker into the map center
    map.setZoom(zoom); //reset the zoom in case it was changed
    data.marker.setAnimation(google.maps.Animation.BOUNCE); //start the marker bouncing to help indicate the location
    setTimeout(function () {
        data.marker.setAnimation(null);
    }, 750); //kill the bouncing animation after 750 ms
    infowindow.setContent(data.content); //set the infowindow content
    infowindow.open(map, data.marker); //pop open the infowindow
}

/* This function is called on document ready to build the Google map
 */
function buildMap() {
    var latlng = new google.maps.LatLng(mapViewModel.mapLat(), mapViewModel.mapLng());

    var mapOptions = {
        center: latlng,
        zoom: zoom
    };

    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);
}

/* This function resets both the Google maps markers list and list view data
 */
function reset() {
    for (var i = 0; i < mapViewModel.markers().length; i++) {
        mapViewModel.markers()[i].setMap(null);
    }
    mapViewModel.clearMarkers();
    mapViewModel.clearResults();
}

/* This function is called when data is successfully retrieved from Foursquare
 * Each result is iterated into a function to create each individual marker
 */
function createMarkers(results) {
    var items = results.response.groups[0].items;
    for (var i = 0; i < items.length; i++) {
        createMarker(items[i]);
    }
}

/* This function creates each individual marker data set
 */
function createMarker(place) {
    /* Create Google map markers
     */
    var position = new google.maps.LatLng(place.venue.location.lat, place.venue.location.lng);
    var marker = new MarkerWithLabel({
        map: map,
        position: position,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });

    //format the data for the infowindow
    //only show data if it exists
    var name = "<strong>" + place.venue.name + "</strong><br>";
    var address = place.venue.location.formattedAddress[0] + "<br>" + place.venue.location.formattedAddress[1] + "<br>";
    var phone = (place.venue.contact.formattedPhone) ? place.venue.contact.formattedPhone + "<br>" : "";
    var menu = (place.venue.hasMenu) ? "<br><strong><a href=\"" + place.venue.menu.url + "\" target=\"_blank\">" + place.venue.menu.label + "</a></strong><br>" : "";
    var website = (place.venue.url) ? "<br><strong>Website:</strong><br><a href=\"" + place.venue.url + "\" target=\"_blank\">" + place.venue.url + "</a>" : "";
    var tipsdata = place.tips;
    var tips = "";
    if (tipsdata) {
        tips = "<br><br><strong>Tips:</strong><br>";
        for (var i = 0; i < tipsdata.length; i++) {
            var text = tipsdata[i].text;
            var url = tipsdata[i].canonicalUrl;
            var firstName = tipsdata[i].user.firstName;
            if (text) {
                tips += "<a href=\"" + url + "\" target=\"_blank\">" + text + "</a> - " + firstName + "<br>";
            }
        }
    }
    //gather all data and concatenate into the content view
    var content =  name + address + phone + menu + website + tips;

    //add a click listener to pop open the infowindow for each marker
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(content);
        infowindow.open(map, this);
    });

    //add the Google map marker to the model
    mapViewModel.addMarker(marker);

    /* Create list view data
     * Copy in the marker and content data so it can be used to populate the infowindow
     */
    var result = {
        name: place.venue.name,
        marker: marker,
        content: content,
        position: position
    };
    //add the list view data to the model
    mapViewModel.addResult(result);
}

/* This function performs the search query to Foursquare
 */
function search(lat, lng, term) {
    //only perform the request if there is a search term
    if (term) {
        var date = moment().format("YYYYMMDD");
        var url = "https://api.foursquare.com/v2/venues/explore" +
            "?client_id=" + SQid +
            "&client_secret=" + SQsecret +
            "&v=" + date +
            "&radius=5000" + //set radius to 5000 meters (about 3 miles)
            "&ll=" + lat + "," + lng +
            "&query=" + term;

        $.ajax({
            url: url,
            success: function (result) {
                createMarkers(result); //when data is returned create the Google map markers and list data
            },
            error: function () {
                alert("Foursquare request failed. Please try again."); //data request to Foursquare fails so throw up an alert
            }
        });
    }
}

/* This initializes the view model and builds the map as soon as the page is ready
 */
$(document).ready(function () {
    ko.applyBindings(mapViewModel);
    buildMap();
});