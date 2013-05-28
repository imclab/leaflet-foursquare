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
        }).addTo(map);

        map
            .on('viewreset', this._load, this)
            .on('moveend', this._load, this);

        this._load();

        function pointToLayer(p) {
            return L.marker([
                p.geometry.coordinates[1],
                p.geometry.coordinates[0]
            ], {
                icon: this._icon(p.properties)
            }).bindPopup('<h1>' + p.properties.title + '</h1>' +
                '<div>' + p.properties.description + '</div>');
        }

        function loadSuccess(resp) {
            var g = resp.response.groups[0].items;
            for (var i = 0; i < g.length; i++) {
                this.notesLayer.addData({
                    type: 'Feature',
                    properties: g[i].venue,
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            g[i].venue.location.lng,
                            g[i].venue.location.lat
                        ]
                    }
                });
            }
        }
    },

    _template: function(p) {
        p.title =
            '<a href="http://www.openstreetmap.org/browse/note/' + p.id + '">Note #' +
            p.id + '</a>';
        p.description = '';
        p['marker-color'] = { closed: '11f', open: 'f11' }[p.status];
        p['marker-symbol'] = { closed: 'circle-stroked', open: 'circle' }[p.status];

        for (var i = 0; i < p.comments.length; i++) {
            var user_link = p.comments[i].user ?
                ('<a target="_blank" href="' + p.comments[i].user_url + '">' +
                    p.comments[i].user + '</a>') : 'Anonymous';

            p.description +=
                '<div class="comment-meta">' +
                user_link + ' - ' +
                moment(p.comments[i].date).calendar() + ' ' +
                '</div> ' + '<div class="comment-text">' +
                p.comments[i].html + '</div>';
        }

        return p;
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
