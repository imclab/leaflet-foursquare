var reqwest = require('reqwest'),
    pad = require('pad'),
    qs = require('qs');

var maki = { 'circle-stroked': true,
  circle: true,
  'square-stroked': true,
  square: true,
  'triangle-stroked': true,
  triangle: true,
  'star-stroked': true,
  star: true,
  cross: true,
  'marker-stroked': true,
  marker: true,
  'religious-jewish': true,
  'religious-christian': true,
  'religious-muslim': true,
  cemetery: true,
  airport: true,
  heliport: true,
  rail: true,
  'rail-underground': true,
  'rail-above': true,
  bus: true,
  fuel: true,
  parking: true,
  'parking-garage': true,
  airfield: true,
  roadblock: true,
  ferry: true,
  harbor: true,
  bicycle: true,
  park: true,
  park2: true,
  museum: true,
  lodging: true,
  monument: true,
  zoo: true,
  garden: true,
  campsite: true,
  theatre: true,
  'art-gallery': true,
  pitch: true,
  soccer: true,
  'america-football': true,
  tennis: true,
  basketball: true,
  baseball: true,
  golf: true,
  swimming: true,
  cricket: true,
  skiing: true,
  school: true,
  college: true,
  library: true,
  post: true,
  'fire-station': true,
  'town-hall': true,
  police: true,
  prison: true,
  embassy: true,
  beer: true,
  restaurant: true,
  cafe: true,
  shop: true,
  'fast-food': true,
  bar: true,
  bank: true,
  grocery: true,
  cinema: true,
  pharmacy: true,
  hospital: true,
  danger: true,
  industrial: true,
  warehouse: true,
  commercial: true,
  building: true,
  'place-of-worship': true,
  'alcohol-shop': true,
  logging: true,
  'oil-well': true,
  slaughterhouse: true,
  dam: true,
  water: true,
  wetland: true,
  disability: true,
  telephone: true,
  'emergency-telephone': true,
  toilets: true,
  'waste-basket': true,
  music: true,
  'land-use': true,
  city: true,
  town: true,
  village: true,
  farm: true };


module.exports = window.L.LayerGroup.extend({

    _loadedIds: {},

    initialize: function(options) {
        if (!options.client_id || !options.client_secret) {
            throw Error('Foursquare API ID and Secret required');
        }

        L.LayerGroup.prototype.initialize.call(this, options);
        L.Util.setOptions(this, options);

        this._pointToLayer = L.bind(pointToLayer, this);

        this.layer = L.geoJson({
            type: 'FeatureCollection',
            features: []
        } , { pointToLayer: this._pointToLayer });

        this.addLayer(this.layer);

        function makiIcon(f) {
            var fp = f.properties || {};
            var sizes = {
                    small: [20, 50],
                    medium: [30, 70],
                    large: [35, 90]
                },
                size = fp['marker-size'] || 'medium',
                symbol = (fp['marker-symbol']) ? '-' + fp['marker-symbol'] : '',
                color = (fp['marker-color'] || '7e7e7e').replace('#', '');
            return L.icon({
                iconUrl: 'http://a.tiles.mapbox.com/v3/marker/' +
                    'pin-' + size.charAt(0) + symbol + '+' + color +
                    // detect and use retina markers, which are x2 resolution
                    ((L.Browser.retina) ? '@2x' : '') + '.png',
                iconSize: sizes[size],
                iconAnchor: [sizes[size][0] / 2, sizes[size][1] / 2],
                popupAnchor: [0, -sizes[size][1] / 2]
            });
        }

        function pointToLayer(p) {
            return L.marker([
                p.geometry.coordinates[1],
                p.geometry.coordinates[0]
            ], { icon: makiIcon(p) })
            .bindPopup('<h1><a target="_blank" href="' +
                p.properties.canonicalUrl + '">' +
                p.properties.name + '</a></h1>');
        }

        this._loadSuccess = L.bind(function(resp) {
            var g = resp.response.groups[0].items;
            for (var i = 0; i < g.length; i++) {
                var v = g[i].venue;
                if (!this._loadedIds[v.id]) {
                    this.layer.addData(this._template({
                        type: 'Feature',
                        properties: v,
                        geometry: {
                            type: 'Point',
                            coordinates: [
                                v.location.lng, v.location.lat
                            ]
                        }
                    }));
                    this._loadedIds[v.id] = true;
                }
            }
        }, this);
    },

    onAdd: function(map) {
        this._map = map;
        map.on('viewreset', this._load, this)
            .on('moveend', this._load, this);
        this._load();
    },

    _template: function(p) {
        function getMaki(p) {
            var ic = '', cats = p.properties.categories;
            for (var i = 0; i < cats.length; i++) {
                if (maki[cats[i].name.toLowerCase()]) {
                    ic = cats[i].name.toLowerCase();
                }
            }
            return ic;
        }
        p.properties['marker-color'] = '#1b6db5';
        p.properties['marker-symbol'] = getMaki(p);
        return p;
    },

    _load: function() {
        var API = 'https://api.foursquare.com/v2/venues/explore',
            d = new Date();

        reqwest({
            url: API + '?' + qs.stringify({
                ll: this._map.getCenter().lat + ',' + this._map.getCenter().lng,
                v: '' + d.getFullYear() +
                    pad(2, d.getMonth(), '0') +
                    pad(2, d.getDate(), '0'),
                client_id: this.options.client_id,
                client_secret: this.options.client_secret
            }),
            type: 'json',
            success: this._loadSuccess,
            error: this._loadSuccess,
            crossOrigin: true
        });
    }
});
