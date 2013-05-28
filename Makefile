all: leaflet-foursquare.js

leaflet-foursquare.js: index.js package.json
	browserify -s leafletFoursquare index.js > leaflet-foursquare.js
