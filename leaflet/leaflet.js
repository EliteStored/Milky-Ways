// Simplified Leaflet-like library for this project
(function (window, document, undefined) {
    'use strict';

    var L = {};

    // Map class
    L.Map = function(id, options) {
        this.container = typeof id === 'string' ? document.getElementById(id) : id;
        this.options = options || {};
        this.layers = [];
        this.markers = [];
        this.popups = [];
        
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.className += ' leaflet-container';
        
        this.panes = {};
        this.createPanes();
        
        this.setupEvents();
        
        return this;
    };

    L.Map.prototype = {
        createPanes: function() {
            var container = this.container;
            
            this.panes.mapPane = this.createPane('leaflet-map-pane', container);
            this.panes.tilePane = this.createPane('leaflet-tile-pane', this.panes.mapPane);
            this.panes.overlayPane = this.createPane('leaflet-overlay-pane', this.panes.mapPane);
            this.panes.shadowPane = this.createPane('leaflet-shadow-pane', this.panes.mapPane);
            this.panes.markerPane = this.createPane('leaflet-marker-pane', this.panes.mapPane);
            this.panes.tooltipPane = this.createPane('leaflet-tooltip-pane', this.panes.mapPane);
            this.panes.popupPane = this.createPane('leaflet-popup-pane', this.panes.mapPane);
        },

        createPane: function(className, container) {
            var pane = document.createElement('div');
            pane.className = className;
            pane.style.position = 'absolute';
            pane.style.pointerEvents = className === 'leaflet-tile-pane' ? 'none' : '';
            container.appendChild(pane);
            return pane;
        },

        setupEvents: function() {
            var that = this;
            this.container.addEventListener('click', function(e) {
                if (that.options.onclick) {
                    var rect = that.container.getBoundingClientRect();
                    var lat = (rect.height / 2 - (e.clientY - rect.top)) / rect.height * 180;
                    var lng = ((e.clientX - rect.left) - rect.width / 2) / rect.width * 360;
                    that.options.onclick({latlng: {lat: lat, lng: lng}});
                }
                if (that._clickHandler) {
                    var rect = that.container.getBoundingClientRect();
                    var lat = (rect.height / 2 - (e.clientY - rect.top)) / rect.height * 180;
                    var lng = ((e.clientX - rect.left) - rect.width / 2) / rect.width * 360;
                    that._clickHandler({latlng: {lat: lat, lng: lng}});
                }
            });
        },

        on: function(event, handler) {
            if (event === 'click') {
                this._clickHandler = handler;
            }
        },

        fitBounds: function(bounds) {
            // Simple implementation - just store bounds
            this._bounds = bounds;
            return this;
        },

        addLayer: function(layer) {
            this.layers.push(layer);
            if (layer.addTo) {
                layer.addTo(this);
            }
            return this;
        }
    };

    // Static method for creating maps
    L.map = function(id, options) {
        return new L.Map(id, options);
    };

    // ImageOverlay class
    L.ImageOverlay = function(imageUrl, bounds, options) {
        this.imageUrl = imageUrl;
        this.bounds = bounds;
        this.options = options || {};
    };

    L.ImageOverlay.prototype = {
        addTo: function(map) {
            this.map = map;
            
            var img = document.createElement('img');
            img.src = this.imageUrl;
            img.style.position = 'absolute';
            img.style.left = '0';
            img.style.top = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            map.panes.tilePane.appendChild(img);
            this.element = img;
            
            return this;
        }
    };

    L.imageOverlay = function(imageUrl, bounds, options) {
        return new L.ImageOverlay(imageUrl, bounds, options);
    };

    // Marker class
    L.Marker = function(latlng, options) {
        this.latlng = latlng;
        this.options = options || {};
        this.popup = null;
    };

    L.Marker.prototype = {
        addTo: function(map) {
            this.map = map;
            
            var marker = document.createElement('div');
            marker.className = 'leaflet-marker-icon';
            marker.style.position = 'absolute';
            marker.style.width = '25px';
            marker.style.height = '25px';
            marker.style.marginLeft = '-12px';
            marker.style.marginTop = '-25px';
            marker.style.backgroundImage = 'none';
            marker.style.backgroundColor = '#ff6b6b';
            marker.style.border = '3px solid #fff';
            marker.style.borderRadius = '50% 50% 50% 0';
            marker.style.transform = 'rotate(-45deg)';
            marker.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            marker.style.cursor = 'pointer';
            marker.style.zIndex = '1000';
            
            // Calculate position based on lat/lng
            var rect = map.container.getBoundingClientRect();
            var x = (this.latlng[1] / 360 + 0.5) * 100; // Use percentage
            var y = (0.5 - this.latlng[0] / 180) * 100; // Use percentage
            
            marker.style.left = x + '%';
            marker.style.top = y + '%';
            
            var that = this;
            marker.addEventListener('click', function(e) {
                e.stopPropagation();
                if (that.popup) {
                    that.openPopup();
                }
            });
            
            map.panes.markerPane.appendChild(marker);
            this.element = marker;
            map.markers.push(this);
            
            return this;
        },

        bindPopup: function(content) {
            this.popup = {content: content};
            return this;
        },

        openPopup: function() {
            if (!this.popup || !this.map) return;
            
            // Close existing popups
            this.map.closePopup();
            
            var popup = document.createElement('div');
            popup.className = 'leaflet-popup';
            popup.style.position = 'absolute';
            popup.style.zIndex = '1000';
            
            var wrapper = document.createElement('div');
            wrapper.className = 'leaflet-popup-content-wrapper';
            
            var content = document.createElement('div');
            content.className = 'leaflet-popup-content';
            content.innerHTML = this.popup.content;
            
            var close = document.createElement('a');
            close.className = 'leaflet-popup-close-button';
            close.innerHTML = '×';
            close.href = '#close';
            close.onclick = function(e) {
                e.preventDefault();
                popup.remove();
            };
            
            wrapper.appendChild(close);
            wrapper.appendChild(content);
            popup.appendChild(wrapper);
            
            // Position popup
            var x = (this.latlng[1] / 360 + 0.5) * 100; // Use percentage
            var y = (0.5 - this.latlng[0] / 180) * 100; // Use percentage
            
            popup.style.left = x + '%';
            popup.style.top = (y - 10) + '%';
            
            this.map.panes.popupPane.appendChild(popup);
            this.map._currentPopup = popup;
        }
    };

    L.marker = function(latlng, options) {
        return new L.Marker(latlng, options);
    };

    // Popup class
    L.Popup = function() {
        this.content = '';
        this.latlng = null;
    };

    L.Popup.prototype = {
        setLatLng: function(latlng) {
            this.latlng = latlng;
            return this;
        },

        setContent: function(content) {
            this.content = content;
            return this;
        },

        openOn: function(map) {
            // Close existing popup
            map.closePopup();
            
            var popup = document.createElement('div');
            popup.className = 'leaflet-popup';
            popup.style.position = 'absolute';
            popup.style.zIndex = '1000';
            
            var wrapper = document.createElement('div');
            wrapper.className = 'leaflet-popup-content-wrapper';
            
            var content = document.createElement('div');
            content.className = 'leaflet-popup-content';
            content.innerHTML = this.content;
            
            var close = document.createElement('a');
            close.className = 'leaflet-popup-close-button';
            close.innerHTML = '×';
            close.href = '#close';
            close.onclick = function(e) {
                e.preventDefault();
                popup.remove();
            };
            
            wrapper.appendChild(close);
            wrapper.appendChild(content);
            popup.appendChild(wrapper);
            
            // Position popup
            var rect = map.container.getBoundingClientRect();
            var x = (this.latlng[1] / 360 + 0.5) * 100; // Use percentage
            var y = (0.5 - this.latlng[0] / 180) * 100; // Use percentage
            
            popup.style.left = x + '%';
            popup.style.top = (y - 10) + '%';
            
            map.panes.popupPane.appendChild(popup);
            map._currentPopup = popup;
            
            return this;
        }
    };

    L.popup = function() {
        return new L.Popup();
    };

    // Add closePopup method to map
    L.Map.prototype.closePopup = function() {
        if (this._currentPopup) {
            this._currentPopup.remove();
            this._currentPopup = null;
        }
    };

    // Expose L globally
    window.L = L;

})(window, document);