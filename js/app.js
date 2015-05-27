var map, infowindow, service;
var SQid = "Y55TSVC1TXZIPPF235A52J5FW5TOE4UWCYQBV0AGLLJ13AIQ";
var SQsecret = "V3OJZGHJ3P3FPZI1RMIPJUZPTZU413WEGOYLKIIG2E4ZKRKT";

var mapViewModel = {
    mapLat: ko.observable("32.9889692"),
    mapLng: ko.observable("-96.5990308"),
    googleResults: ko.observableArray([]),
    addGoogleResult: function (value) {
        this.googleResults.push(value);
    },
    foursquareResults: ko.observableArray([]),
    addFoursquareResult: function (value) {
        this.foursquareResults.push(value);
    },
    markers: ko.observableArray([]),
    addMarker: function (value) {
        this.markers.push(value);
    },
    clearMarkers: function () {
        this.markers = [];
    },
    searchTerm: ko.observable(""),
    doSearch: function () {
        mapSearch(this.mapLat(), this.mapLng(), this.searchTerm(), this.searchCategories());
        SQsearch(this.mapLat(), this.mapLng(), this.searchTerm(), this.foursquareSearchCategories());
    },
    categories: ko.observableArray(places),
    searchCategories: ko.observableArray([]),
    foursquareCategories: ko.observableArray([
        {
            name: "Food",
            type: "food"
        },
        {
            name: "Drinks",
            type: "drinks"
        },
        {
            name: "Coffee",
            type: "coffee"
        },
        {
            name: "Shops",
            type: "shops"
        },
        {
            name: "Arts",
            type: "arts"
        },
        {
            name: "Outdoors",
            type: "outdoors"
        },
        {
            name: "Sights",
            type: "sights"
        },
        {
            name: "Trending",
            type: "trending"
        },
        {
            name: "Specials",
            type: "specials"
        }
]),
    foursquareSearchCategories: ko.observableArray([]),
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
    for (var i = 0; i < mapViewModel.markers.length; i++) {
        mapViewModel.markers[i].setMap(null);
    }
    mapViewModel.clearMarkers();
};

function createMarker(place) {
    var marker = new MarkerWithLabel({
        map: map,
        position: place.geometry.location
    });

    var content = '<strong>' + place.name + '</strong><br>' + place.vicinity;

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(content);
        infowindow.open(map, this);
    });

    mapViewModel.addMarker(marker);

    //listview
    var result = {
        name: place.name,
        loc: place.vicinity
    };
    mapViewModel.addGoogleResult(result);
}

function createSQMarker(place) {
    var marker = new MarkerWithLabel({
        map: map,
        position: new google.maps.LatLng(place.venue.location.lat, place.venue.location.lng),
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });

    var address = place.venue.location.formattedAddress[0] + "<br>" + place.venue.location.formattedAddress[1];
    var website = (place.venue.url != null) ? "<br><br><a href='" + place.venue.url + "' target='_blank'>" + place.venue.url + "</a>" : "";
    var phone = (place.venue.contact.formattedPhone != null) ? "<br>" + place.venue.contact.formattedPhone : "";
    var menu = (place.venue.hasMenu) ? "<br><a href='" + place.venue.menu.url + "' target='_blank'>" + place.venue.menu.label + "</a>" : "";
    var content = "<strong>" + place.venue.name + "</strong><br>" + address + website + phone + menu;

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(content);
        infowindow.open(map, this);
    });

    mapViewModel.addMarker(marker);

    //listview
    var result = {
        name: place.venue.name,
        loc: address
    };
    mapViewModel.addFoursquareResult(result);

}

function SQsearch(lat, lng, term, categories) {
    if (term) {
        var url = "https://api.foursquare.com/v2/venues/explore" +
            "?client_id=" + SQid +
            "&client_secret=" + SQsecret +
            "&v=20150504" +
            "&section=" + categories +
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
}

function buildCategoryList() {
    $('#categories-google').multiselect({
        includeSelectAllOption: true,
        buttonClass: 'btn btn-link',
        buttonText: function (options, select) {
            return 'Google categories...';
        },
        maxHeight: Math.floor($('#map-canvas').height() / 2),
        onChange: function (option, checked, select) {
            mapViewModel.doSearch();
        },
        nonSelectedText: "Google categories..."
    });
}

function buildfoursquareCategoryList() {
    $('#categories-SQ').multiselect({
        buttonClass: 'btn btn-link',
        buttonText: function (options, select) {
            return 'Foursquare categories...';
        },
        maxHeight: Math.floor($('#map-canvas').height() / 2),
        onChange: function (option, checked, select) {
            mapViewModel.doSearch();
        },
        nonSelectedText: "Foursquare categories..."
    });
}

$(document).ready(function () {
    ko.applyBindings(mapViewModel);
    buildCategoryList();
    buildfoursquareCategoryList();
    buildMap();


});