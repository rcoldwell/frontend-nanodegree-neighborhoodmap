var map, infowindow, service;
var markers = [];
var SQid = "Y55TSVC1TXZIPPF235A52J5FW5TOE4UWCYQBV0AGLLJ13AIQ";
var SQsecret = "V3OJZGHJ3P3FPZI1RMIPJUZPTZU413WEGOYLKIIG2E4ZKRKT";

var mapViewModel = {
    mapLat: ko.observable("32.9889692"),
    mapLng: ko.observable("-96.5990308"),
    searchTerm: ko.observable(""),
    searchCategories: ko.observableArray([]),
    search: function () {
        mapSearch(this.mapLat(), this.mapLng(), this.searchTerm(), this.searchCategories());
        SQsearch(this.mapLat(), this.mapLng(), this.searchTerm(), this.searchCategories());
    },
    categories: ko.observableArray(places)
};

function buildMap() {
    var latlng = new google.maps.LatLng(mapViewModel.mapLat(), mapViewModel.mapLng());

    var mapOptions = {
        center: latlng,
        zoom: 13
    };

    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);
}

function mapSearch(lat, lng, term, categories) {
    if (term) {
        deleteMarkers();
        var latlng = new google.maps.LatLng(lat, lng);
        var request = {
            location: latlng,
            keyword: term,
            radius: 5000,
            types: categories
        };
        service.nearbySearch(request, updateMarkers);
    }
}

function updateMarkers(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}

function updateSQMarkers(results) {
    var items = results.response.groups[0].items;
    for (var i = 0; i < items.length; i++) {
        createSQMarker(items[i]);
    }
}

function deleteMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
};

function createMarker(place) {
    var icon = {
        url: place.icon,
        scaledSize: new google.maps.Size(20, 20),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 0)
    };

    /*  var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: icon
    });
*/
    var marker = new MarkerWithLabel({
        map: map,
        position: place.geometry.location,
        icon: ' ',
        labelContent: '<i class="fa fa-google"></i>',
        labelClass: "labels"
    });

    var content = '<div><strong>' + place.name + '</strong><br>' + place.vicinity;

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(content);
        infowindow.open(map, this);
    });

    markers.push(marker);
}

function createSQMarker(place) {
    /*
    var icon = {
        url: place.venue.categories[0].icon.prefix + "bg_64" + place.venue.categories[0].icon.suffix,
        scaledSize: new google.maps.Size(30, 30),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 0)
    };
*/

    var marker = new MarkerWithLabel({
        map: map,
        position: new google.maps.LatLng(place.venue.location.lat, place.venue.location.lng),
        icon: ' ',
        labelContent: '<i class="fa fa-foursquare"></i>',
        labelClass: "labels"
    });

    var content = '<div><strong>' + place.venue.name + '</strong><br>' + place.venue.location.address;

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(content);
        infowindow.open(map, this);
    });

    markers.push(marker);
}

function SQsearch(lat, lng, term, categories) {
    var url = "https://api.foursquare.com/v2/venues/explore" +
        "?client_id=" + SQid +
        "&client_secret=" + SQsecret +
        "&v=20150504" +
        "&radius=5000" +
        "&ll=" + lat + "," + lng +
        "&query=" + term;

    $.ajax({
        url: url,
        success: function (result) {
            updateSQMarkers(result);
        },
        error: function () {
            alert("Foursquare failed.");
        }
    });
}

function buildCategoryList() {
    $('#categories-select').multiselect({
        includeSelectAllOption: true,
        buttonClass: 'btn btn-link',
        maxHeight: Math.floor($('#map-canvas').height() / 2),
        onChange: function (option, checked, select) {
            mapViewModel.search();
        },
        nonSelectedText: "Google categories..."
    });
}

function buildSQCategoryList() {
    $('#SQcategories-select').multiselect({
        includeSelectAllOption: true,
        buttonClass: 'btn btn-link',
        maxHeight: Math.floor($('#map-canvas').height() / 2),
        onChange: function (option, checked, select) {
            mapViewModel.search();
        },
        nonSelectedText: "Foursquare categories..."
    });
}

$(document).ready(function () {
    ko.applyBindings(mapViewModel);
    buildCategoryList();
    buildMap();
});