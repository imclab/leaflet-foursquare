var reqwest = require('reqwest'),
    qs = require('qs');

module.exports = window.L.LayerGroup.extend({

    API: 'https://api.foursquare.com/v2/venues/explore',

    _loadedIds: {},

    initialize: function(id, secret) {
        this._id = id;
        this._secret = secret;
    },

    onAdd: function(map) {
        this._map = map;
        this._loadSuccess = L.bind(loadSuccess, this);
        this._pointToLayer = L.bind(pointToLayer, this);
        this.notesLayer = L.geoJson({
            type: 'FeatureCollection',
            features: []
        }, { pointToLayer: this._pointToLayer }).addTo(map);

        map
            .on('viewreset', this._load, this)
            .on('moveend', this._load, this);

        this._load();

        function pointToLayer(p) {
            return L.marker([
                p.geometry.coordinates[1],
                p.geometry.coordinates[0]
            ], { icon: this._icon(p) })
            .bindPopup('<h1><a target="_blank" href="' + p.properties.canonicalUrl + '">' +
                p.properties.name + '</a></h1>');
        }

        function loadSuccess(resp) {
            var g = resp.response.groups[0].items;
            for (var i = 0; i < g.length; i++) {
                var v = g[i].venue;

                if (!this._loadedIds[v.id]) {

                    this.notesLayer.addData(this._template({
                        type: 'Feature',
                        properties: v,
                        geometry: {
                            type: 'Point',
                            coordinates: [
                                v.location.lng,
                                v.location.lat
                            ]
                        }
                    }));

                    this._loadedIds[v.id] = true;
                }
            }
        }
    },

    _template: function(p) {
        p['marker-color'] = { closed: '11f', open: 'f11' }[p.status];
        p['marker-symbol'] = this._maki(p);

        return p;
    },

    _maki: function(p) {
        var cat = p.properties.categories[0].name.toLowerCase();
        var supported = { bar: true };
        return (cat in supported) ? cat : '';
    },

    _icon: function(fp) {
        fp = fp || {};

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
    },

    _load: function(map) {
        function ll(map) {
            return map.getCenter().lat + ',' +
                map.getCenter().lng;
        }
        reqwest({
            url: this.API + '?' + qs.stringify({
                ll: ll(this._map),
                client_id: this._id,
                client_secret: this._secret
            }),
            type: 'json',
            success: this._loadSuccess,
            crossOrigin: true,
            error: function() { }
        });
    }
});
