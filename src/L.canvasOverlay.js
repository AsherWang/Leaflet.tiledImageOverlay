/* eslint-disable no-underscore-dangle */
(function (factory, window) {
  // define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
    define(['leaflet'], factory);

    // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === 'object') {
    module.exports = factory(require('leaflet'));
  }

  // attach your plugin to the global 'L' variable
  if (typeof window !== 'undefined' && window.L) {
    // eslint-disable-next-line no-param-reassign
    window.L.canvasOverlay = factory(L);
  }
}((L) => {
  const { DomUtil } = L;
  const { Util } = L;
  const CanvasOverlay = L.ImageOverlay.extend({
    // @section
    // @aka ImageOverlay options
    options: {
      drawFn: Util.falseFn,
    },
    _onZoomEnd(canvasCxt) {
      const vid = this.getElement();
      this._canvas.width = vid.clientWidth;
      this._canvas.height = vid.clientHeight;
      this.options.drawFn.call(this, canvasCxt, vid.clientWidth, vid.clientHeight);
    },
    _initImage() {
      const wasElementSupplied = this._url.tagName === 'div';
      this._image = wasElementSupplied ? this._url : DomUtil.create('div');
      const vid = this._image;
      const canvas = DomUtil.create('canvas');
      vid.appendChild(canvas);
      DomUtil.addClass(vid, 'leaflet-image-layer');
      if (this._zoomAnimated) { DomUtil.addClass(vid, 'leaflet-zoom-animated'); }
      if (this.options.className) { DomUtil.addClass(vid, this.options.className); }
      const canvasCxt = canvas.getContext('2d');
      this._canvas = canvas;
      // this.options.drawFn.call(this, canvasCxt);
      const zoomendHandler = this._onZoomEnd.bind(this, canvasCxt);
      this.on('add', (evt) => {
        const map = evt.target._map;
        map.on('zoomend', zoomendHandler);
        zoomendHandler();
      });
      this.on('remove', (evt) => {
        const map = evt.target._map;
        map.off('zoomend', zoomendHandler);
      });
    },
  });

  return function (bounds, options) {
    return new CanvasOverlay('', bounds, options);
  };
}, window));
