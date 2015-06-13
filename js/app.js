var map, infowindow, service;
var zoom = 13;
var SQid = "Y55TSVC1TXZIPPF235A52J5FW5TOE4UWCYQBV0AGLLJ13AIQ";
var SQsecret = "V3OJZGHJ3P3FPZI1RMIPJUZPTZU413WEGOYLKIIG2E4ZKRKT";

var mapViewModel = {
    mapLat: ko.observable("32.9889692"),
    mapLng: ko.observable("-96.5990308"),
    results: ko.observableArray([]),
    addResult: function (value) {
        this.results.push(value);
    },
    clearResults: function () {
        this.results.removeAll();
    },
    markers: ko.observableArray([]),
    addMarker: function (value) {
        this.markers.push(value);
    },
    clearMarkers: function () {
        this.markers.removeAll();
    },
    searchTerm: ko.observable(""),
    doSearch: function () {
        reset();
        search(this.mapLat(), this.mapLng(), this.searchTerm());
        var latlng = new google.maps.LatLng(mapViewModel.mapLat(), mapViewModel.mapLng());
        map.setCenter(latlng);
    }
};

function highlightPin(data) {
    map.panTo(data.position);
    map.setZoom(zoom);
    data.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () {
        data.marker.setAnimation(null);
    }, 750);
    infowindow.setContent(data.content);
    infowindow.open(map, data.marker);
    //console.log(data);
}

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

function reset() {
    for (var i = 0; i < mapViewModel.markers().length; i++) {
        mapViewModel.markers()[i].setMap(null);
    }
    mapViewModel.clearMarkers();
    mapViewModel.clearResults();
}

function createMarkers(results) {
    var items = results.response.groups[0].items;
    for (var i = 0; i < items.length; i++) {
        createMarker(items[i]);
    }
}

function createMarker(place) {
    //map view
    var position = new google.maps.LatLng(place.venue.location.lat, place.venue.location.lng);
    var marker = new MarkerWithLabel({
        map: map,
        position: position,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });

    var address = place.venue.location.formattedAddress[0] + "<br>" + place.venue.location.formattedAddress[1] + "<br>";
    var phone = (place.venue.contact.formattedPhone) ? place.venue.contact.formattedPhone + "<br>" : "";
    var menu = (place.venue.hasMenu) ? "<br><strong><a href=\"" + place.venue.menu.url + "\" target=\"_blank\">" + place.venue.menu.label + "</a></strong>" : "";
    var website = (place.venue.url) ? "<br><a href=\"" + place.venue.url + "\" target=\"_blank\">" + place.venue.url + "</a>" : "";
    var tipsdata = place.tips;
    var tips = "";
    if (tipsdata) {
        tips = "<br><br><strong>Tips:</strong><br>";
        for (var i = 0; i < tipsdata.length; i++) {
            var text = tipsdata[i].text;
            var url = tipsdata[i].canonicalUrl;
            var name = tipsdata[i].user.firstName;
            if (text) {
                tips += "<a href=\"" + url + "\" target=\"_blank\">" + text + "</a> - " + name + "<br>";
            }
        }
    }
    var content = "<strong>" + place.venue.name + "</strong><br>" + address + phone + menu + website + tips;

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(content);
        infowindow.open(map, this);
    });

    mapViewModel.addMarker(marker);

    //listview
    var result = {
        name: place.venue.name,
        marker: marker,
        content: content,
        position: position
    };
    mapViewModel.addResult(result);
}

function search(lat, lng, term) {
    if (term) {
        var date = moment().format("YYYYMMDD");
        var url = "https://api.foursquare.com/v2/venues/explore" +
            "?client_id=" + SQid +
            "&client_secret=" + SQsecret +
            "&v=" + date +
            "&radius=5000" +
            "&ll=" + lat + "," + lng +
            "&query=" + term;

        $.ajax({
            url: url,
            success: function (result) {
                createMarkers(result);
                //console.log(mapViewModel.markers());
            },
            error: function () {
                alert("Foursquare request failed. Please try again.");
            }
        });
    }
}

$(document).ready(function () {
    ko.applyBindings(mapViewModel);
    buildMap();
});