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
    window.L.tileImageOverlay = factory(L);
  }
}((L) => {
  const { Util } = L;
  const TileImageOverlay = L.LayerGroup.extend({

    options: {
      // 左上角坐标(经纬度))
      leftTop: [0, 0],
      // 右下角坐标(经纬度))
      rightBottom: undefined,
      // 瓦片层级
      z: '',
      // 是否根据瓦片整体和地图大小，将地图缩放至合适层级并设置最大最小层级以及边界
      autoFit: false,
      // autoFit为true时有效，传回参数{minZoom, z, maxZoom, center, maxBounds}
      // 不传入onAutoFit则应用所有建议
      onAutoFit: undefined,
      // 瓦片地址
      tileUrl: '',
      // 瓦片服务子域名Subdomains of the tile service
      subdomains: 'abc',
      // 瓦片x开始位置
      startX: 0,
      // 瓦片y开始位置
      startY: 0,
      // 瓦片列数
      col: 1,
      // 瓦片行数
      row: 1,
      // 单个瓦片显示的像素大小，与瓦片实际大小无关
      blockSize: 128,
      // 整体宽度(可选)， 不传入则使用blockSize*col
      width: undefined,
      // 整体宽度(可选)， 不传入则使用blockSize*row
      height: undefined,
    },

    initialize(options) {
      Util.setOptions(this, options);
      const { blockSize } = this.options;
      if (this.options.images || this.options.tileUrl) {
        this.options.width = this.options.width || blockSize * this.options.col;
        this.options.height = this.options.height || blockSize * this.options.row;
        this._addImages(false);
      } else if (L.canvasOverlay) {
        this.options.width = this.options.width || this.options.image.width;
        this.options.height = this.options.height || this.options.image.height;
        this.options.col = Math.ceil(this.options.image.width / blockSize);
        this.options.row = Math.ceil(this.options.image.height / blockSize);
        this._addImages(true);
      } else {
        console.warn('do you forget to add script L.canvasOverlay?');
      }
    },

    _addImages(isSingle) {
      const opts = this.options;
      const images = [];
      this._images = [];
      const { subdomains, blockSize } = opts;
      const [sY, sX] = this.options.leftTop;

      // 如果有设置边界那么使用设置的边界
      if (this.options.rightBottom) {
        const [eY, eX] = this.options.rightBottom;
        this._pxLatRate = Math.abs(sY - eY) / this.options.height;
        this._pxLngRate = Math.abs(sX - eX) / this.options.width;
        this._bounds = [
          [sY, sX],
          [eY, eX],
        ];
        this._center = [(sY + eY) / 2, (sX + eX) / 2];
      } else {
        // 否则按照宽高计算出边界
        this._pxLatRate = 1;
        this._pxLngRate = 1;
        this._bounds = [
          [sY, sX],
          [sY - this.options.height, sX + this.options.width],
        ];
        this._center = [sY - this.options.height / 2, sX + this.options.width / 2];
      }
      const blockSizeX = blockSize * this._pxLngRate;
      const blockSizeY = blockSize * this._pxLatRate;
      for (let rowIdx = 0; rowIdx < opts.row; rowIdx += 1) {
        for (let colIdx = 0; colIdx < opts.col; colIdx += 1) {
          const imageBounds = [
            [sY - blockSizeY * rowIdx, sX + blockSizeX * colIdx],
            [sY - blockSizeY * (rowIdx + 1), sX + blockSizeX * (colIdx + 1)],
          ];
          if (isSingle) {
            const sx = blockSize * colIdx;
            const sy = blockSize * rowIdx;
            images.push(L.canvasOverlay(
              imageBounds,
              {
                drawFn(ctx, canvas) {
                  const rate = 1.2;
                  // eslint-disable-next-line no-param-reassign
                  canvas.width = blockSize * rate;
                  // eslint-disable-next-line no-param-reassign
                  canvas.height = blockSize * rate;
                  ctx.drawImage(opts.image, sx, sy, blockSize, blockSize,
                    0, 0, canvas.width, canvas.height);
                },
              },
            ));
          } else {
            const x = opts.startX + colIdx;
            const y = opts.startY + rowIdx;
            const imgUrl = opts.images ? opts.images[rowIdx * opts.col + colIdx] : opts.tileUrl
              .replace('{x}', x)
              .replace('{y}', y)
              .replace('{z}', opts.z)
              .replace('{s}', subdomains[(x + y) % subdomains.length]);
            this._images.push(imgUrl);
            images.push(L.imageOverlay(imgUrl, imageBounds));
          }
        }
      }
      L.LayerGroup.prototype.initialize.call(this, images);
      this.setZIndex(0);
      this.on('add', function () {
        if (opts.autoFit) this._autoFit();
      });
    },

    // 找到最大最小的缩放层级
    // 居中并自动缩放到最适层级
    _autoFit() {
      const map = this._map;
      const mapSize = map.getSize();
      const mapWHRate = mapSize.x / mapSize.y; // 地图宽高比
      const imgHeight = Math.abs(this._bounds[0][0] - this._bounds[1][0]);
      const imgWidth = Math.abs(this._bounds[0][1] - this._bounds[1][1]);
      const imgWHRate = imgWidth / imgHeight;
      const center = this._center;
      const r = Math.min(
        Math.abs(this._bounds[0][0] - this._bounds[1][0]),
        Math.abs(this._bounds[0][1] - this._bounds[1][1]),
      ) / 2;
      let targetBounds;
      const imgWHRateSmaller = imgWHRate < mapWHRate;
      if (imgWHRateSmaller) {
        const ratedHeight = imgWidth / mapWHRate;
        targetBounds = [
          [center[0] + ratedHeight / 2, center[1] - imgWidth / 2],
          [center[0] - ratedHeight / 2, center[1] + imgWidth / 2],
        ];
      } else {
        const ratedWidth = imgHeight * mapWHRate;
        targetBounds = [
          [center[0] + imgHeight / 2, center[1] - ratedWidth / 2],
          [center[0] - imgHeight / 2, center[1] + ratedWidth / 2],
        ];
      }
      const z = map.getBoundsZoom(targetBounds, imgWHRateSmaller);
      // const minZoom = map.getBoundsZoom(this._bounds, false);
      const minZoom = z;
      const maxZoom = Math.max(z, minZoom + 3);
      if (this.options.onAutoFit) {
        const recommendCfg = {
          minZoom,
          z,
          maxZoom,
          center,
          maxBounds: this._bounds,
        };
        this.options.onAutoFit(recommendCfg);
      } else {
        map.setView(center, z)
          .setMaxBounds(this._bounds)
          .setMinZoom(minZoom)
          .setMaxZoom(maxZoom);
      }
      if (this.options.debug) {
        L.marker(center).addTo(map);
        this._addPolygon(this._bounds);
        this._addPolygon(targetBounds, 'blue');
      }
    },
    // 调试用，用于检查边界
    _addPolygon(bounds, color = 'red') {
      const pt1 = bounds[0];
      const pt2 = bounds[1];
      const latlngs = [
        pt1,
        [pt1[0], pt2[1]],
        pt2,
        [pt2[0], pt1[1]],
      ];
      L.polygon(latlngs, { color }).addTo(this._map);
    },
  });

  return function (options) {
    return new TileImageOverlay(options);
  };
}, window));
