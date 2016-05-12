//Initiates Google Maps
var googleMap;
function setupMap() {
	googleMap = new google.maps.Map(document.getElementById('map-container'), {
		center: {lat: 44.9804828, lng: -93.2710153},
		zoom: 13
	});
	ko.applyBindings(new ViewModel());
};

// Array that holds the content from the JSON request
var locationContent = [];
// Foursquare API
	var ClientID = 'DRLQ34KZ55LGAESUIWHHQ32URBO135Q3MGESZPKJ3VDO13R3';
	var ClientSecret = 'SUCLRPH2RYTNUNTBYNVWDDJNAL5KNEG04L5U2TI4Y4FFAWVE';
	var city = 'Minneapolis, MN';
	var fullURL = 'https://api.foursquare.com/v2/venues/search?client_id='+ ClientID +
		'&client_secret='+ ClientSecret +
		'&v=20160115'+
		'&near='+ city +
		'&radius=5000'+
		'&query=music';
// Popup info content function
function popupInfo(venue, phone, address) {
	return '<div><h2>' + venue + '</h2></div><div><h4>' + phone + '</h4></div><div><p>' + address + '</p></div>';
}

//Error handling for Google Maps
function googleError() {
	alert("ERROR: Google Maps failed to load");
};

var ViewModel = function() {
	var vm = this;
	var venue, lat, lng, address, phone;
	// JSON request to FourSquare's API
	$.getJSON(fullURL, function( data ) {
		var venuesLength = data.response.venues.length;
		for (var i = 0; i < venuesLength; i++) {			
			venue = data.response.venues[i].name;
			lat = data.response.venues[i].location.lat;
			lng = data.response.venues[i].location.lng;
			address = data.response.venues[i].location.address;
			phone = data.response.venues[i].contact.formattedPhone;
			if (address && phone) {
				locationContent.push({locationName: venue, latLng: {lat: lat, lng: lng}, locationAddress: address, locationPhone: phone});
			};
		};
		populate();
	})
	// Error handling for FourSquare
	.error(function() {
		alert("ERROR: Failed to get location resources");
	});
	// New infowindow
	var InfoWindow = new google.maps.InfoWindow();
	// Array that stores all spawnLocation objects
	vm.locationsList = [];
	// Array that stores the filtered locations 
	vm.filteredLocations = ko.observableArray([]);
	// Searchbox listener
	vm.query = ko.observable(''); 
	// Filter that uses an observable array and checks conditions from the searchbox
	vm.markerFilter = function(spawnLocation) {
		var filter = vm.query().toLowerCase();
		vm.filteredLocations.removeAll();
		vm.locationsList.forEach(function(spawnLocation) {
			// Sets all the markers to not visible
			spawnLocation.marker.setVisible(false);
			if (spawnLocation.locationName.toLowerCase().indexOf(filter) !== -1) {
				vm.filteredLocations.push(spawnLocation);
			}
		});
		// Sets all the markers to visible from the filteredLocations array
		vm.filteredLocations().forEach(function(spawnLocation) {
		  spawnLocation.marker.setVisible(true);
		});
	};

	// Marker animation
	function markerAnimate(marker){
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			marker.setAnimation(null);
		},700);
	};

	function populate() {
		// Creates an instance of Location
		vm.Location = function (data) {
			var self = this;
			self.locationName = data.locationName;
			self.latLng = data.latLng;
			self.address = data.locationAddress;
			self.phone = data.locationPhone;
			self.marker = null;
			self.InfoWindowOptions = {
				position: data.latLng,
				pixelOffset: new google.maps.Size(0, -20),
				content: popupInfo(data.locationName, data.locationPhone, data.locationAddress)
			};
			self.selectLocation = function() {
				InfoWindow.setOptions(self.InfoWindowOptions);
				InfoWindow.open(googleMap, self.marker);
				markerAnimate(self.marker);
			};
		};
		// Stores spawnLocation into array
		locationContent.forEach(function(spawnLocation) {
			vm.locationsList.push(new vm.Location(spawnLocation));
		});
		// Set location and options for each spawnLocation in Array
		vm.locationsList.forEach(function(spawnLocation) {
			var markerOptions = {
				map: googleMap,
				position: spawnLocation.latLng,
				draggable: false,
				animation: google.maps.Animation.DROP,
				icon: 'images/music.png'
			};
			var InfoWindowOptions = {
				position: spawnLocation.latLng,
				pixelOffset: new google.maps.Size(0, -20),
				content: popupInfo(spawnLocation.locationName, spawnLocation.phone, spawnLocation.address)
			};
			// Marker creation with options
			spawnLocation.marker = new google.maps.Marker(markerOptions);
			// listener that opens the infoWindow and toggles BOUNCE animation
			spawnLocation.marker.addListener('click', function() {
				// InfoWindowOptions that are set for spawnLocation
				InfoWindow.setOptions(InfoWindowOptions);
				InfoWindow.open(googleMap, spawnLocation.marker);
				markerAnimate(spawnLocation.marker);
			});
		});
		vm.locationsList.forEach(function(spawnLocation) {
			vm.filteredLocations.push(spawnLocation);
		});
	};

};
