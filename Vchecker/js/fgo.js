(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

const _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function(window) {

    const UNDEFINED = 'undefined';
    const fgo = window['fgo'];

    if (_typeof(fgo.master) !== UNDEFINED) return;

    function init() {

        const objects = document.getElementsByTagName('object');
        const embeds = document.getElementsByTagName('embed');

        for (var i = 0; i < objects.length; i++) {
            var temp = objects[i];
            if (_typeof(temp.jsGDO) !== UNDEFINED) {
                fgo.master = new FgoAd(temp);
            }
        }
        for (var i = 0; i < embeds.length; i++) {
            var tmp = embeds[i];
            if (_typeof(tmp.jsGDO) !== UNDEFINED) {
                fgo.master = new FgoAd(tmp);
            }
        }

        if (_typeof(fgo.master) === UNDEFINED) return;

        window.requestAds = fgo.master.requestAds;
        window.jsShowBanner = fgo.master.requestAds;
    }

    init();

    function FgoAd(game) {
        const _self = this;
        const _game = game;
        const _userId = fgo.q[0][1];

        let _gameId = fgo.q[0][0];
        if (_gameId.length === 32) {
            _gameId = _gameId.substr(0, 8) + '-' +
                _gameId.substring(8, 12) + '-' + _gameId.substring(12, 16) +
                '-' + _gameId.substring(16, 20) + '-' +
                _gameId.substring(20, 32);
        }

        const position = getAbsoluteBoundingRect(_game);
        _self._container = document.createElement('div');
        _self._container.id = 'adContainer_' + _gameId;
        _self._container.style.position = 'absolute';
        _self._container.style['width'] = width() + 'px';
        _self._container.style['height'] = height() + 'px';
        _self._container.style['top'] = position.top + 'px';
        _self._container.style['left'] = position.left + 'px';
        document.body.appendChild(_self._container);

        window.addEventListener('resize', function() {
            const position = getAbsoluteBoundingRect(_game);
            _self._container.style['width'] = width() + 'px';
            _self._container.style['height'] = height() + 'px';
            _self._container.style['top'] = position.top + 'px';
            _self._container.style['left'] = position.left + 'px';
        });

        window.GD_OPTIONS = {
            gameId: _gameId.replace(/-/g, ''),
            userId: _userId,
            advertisementSettings: {
                container: '' + _self._container.id,
                autoPlay: true,
            },
            onEvent: function onEvent(event) {
                switch (event.name) {
                    case 'STARTED':
                        jsOnAdsStarted();
                        break;
                    case 'LOADED':
                        jsOnAdsLoaded();
                        break;
                    case 'USER_CLOSE':
                        jsOnAdsClosed();
                        break;
                    case 'AD_ERROR':
                        jsOnAdsError();
                        break;
                    case 'API_READY':
                        console.log('Api is ready');
                        break;
                }
            },
        };

        // HTML5 SDK
        (function(d, s, id) {
            var js,
                fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s);
            js.id = id;
            js.src = 'https://html5.api.gamedistribution.com/main.min.js';
            // js.src = 'http://localhost:3000/lib/main.js';
            fjs.parentNode.insertBefore(js, fjs);
        })(document, 'script', 'gamedistribution-jssdk');

        function width() {
            return parseInt(window.getComputedStyle(_game).width);
        }

        function height() {
            return parseInt(window.getComputedStyle(_game).height);
        }

        function requestAds() {
            gdApi.showBanner();
        }

        function jsOnAdsStarted() {
            // _self._container.style['display'] = 'block';
            _game.jsOnAdsStarted();
        }

        function jsOnAdsClosed() {
            // _self._container.style['display'] = 'none';
            _game.jsOnAdsClosed();
        }

        function jsOnAdsLoaded() {
            _game.jsOnAdsLoaded();
        }

        function jsOnAdsError() {
            // _self._container.style['display'] = 'none';
            _game.jsOnAdsError();
        }

        return {
            requestAds: requestAds,
        };
    }

    function getAbsoluteBoundingRect(el) {
        const doc = document;
        const win = window;
        const body = doc.body;

        // pageXOffset and pageYOffset work everywhere except IE <9.
        let offsetX = win.pageXOffset !== undefined
            ? win.pageXOffset
            : (doc.documentElement || body.parentNode ||
                body).scrollLeft;
        let offsetY = win.pageYOffset !== undefined
            ? win.pageYOffset
            : (doc.documentElement || body.parentNode ||
                body).scrollTop;

        const rect = el.getBoundingClientRect();

        if (el !== body) {
            let parent = el.parentNode;

            // The element's rect will be affected by the scroll
            // positions of *all* of its scrollable parents, not just
            // the window, so we have to walk up the tree and collect
            // every scroll offset. Good times.
            while (parent !== body) {
                offsetX += parent.scrollLeft;
                offsetY += parent.scrollTop;
                parent = parent.parentNode;
            }
        }

        return {
            bottom: rect.bottom + offsetY,
            height: rect.height,
            left: rect.left + offsetX,
            right: rect.right + offsetX,
            top: rect.top + offsetY,
            width: rect.width,
        };
    }
})(window);

},{}]},{},[1]);