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
  const TileImageOverlay = L.LayerGroup.extend({
    /**
     * 为了解决室内地图单图尺寸过大的时候，移动端有时候无法显示的问题
     * 解决思路: 像加载固定层级瓦片一样加载瓦片图，拼合成一个整体，但是地图缩放时不会加载其他层级的瓦片而是直接缩放已有的图片
     * startX和col决定横向瓦片数量
     * startY和row决定纵向瓦片数量
     * tileUrl 和 images 至少需要有一个
     * @param  opts.tileUrl String 瓦片地址
     * @param  opts.subdomains String 瓦片服务子域名Subdomains of the tile service
     * @param  opts.blockSize Integer 单个瓦片显示的大小，与瓦片实际大小无关
     * @param  opts.col Integer 瓦片列数
     * @param  opts.row Integer 瓦片行数
     * @param  opts.startX Integer 瓦片x开始位置
     * @param  opts.startY Integer 瓦片y开始位置
     * @param  opts.z Integer 瓦片层级(可选)
     * @param  opts.images Array<string> 所有瓦片图片,如果传入此参数，则无需传入tileUrl,startX,startY,z
     * @param  opts.width Number 整体宽度(可选)， 不传入则使用blockSize*col
     * @param  opts.height Number 整体高度(可选)， 不传入则使用blockSize*row
     * @param  opts.autoFit Boolean 根据瓦片整体和地图大小，将地图缩放至合适层级并设置最大最小层级以及边界
     * @param  opts.onAutoFit Function autoFit为true时有效，
     * 传回参数{minZoom, z, maxZoom, center, maxBounds}
     * 不传入onAutoFit则应用所有建议
     */
    initialize(opts) {
      // eslint-disable-next-line no-underscore-dangle
      this._opts = opts;
      if (opts.images || opts.tileUrl) {
        this._opts.width = opts.width || opts.blockSize * opts.col;
        this._opts.height = opts.height || opts.blockSize * opts.row;
        this._addImages(false);
      } else if (L.canvasOverlay) {
        this._opts.width = opts.width || opts.image.width;
        this._opts.height = opts.height || opts.image.height;
        this._opts.col = Math.ceil(opts.image.width / opts.blockSize);
        this._opts.row = Math.ceil(opts.image.height / opts.blockSize);
        this._addImages(true);
      } else {
        console.warn('do you forget to add script L.canvasOverlay?');
      }
    },

    _addImages(isSingle) {
      const opts = this._opts;
      const images = [];
      this._images = [];
      const subdomains = opts.subdomains || 'abc';
      const { blockSize } = opts;
      for (let rowIdx = 0; rowIdx < opts.row; rowIdx += 1) {
        for (let colIdx = 0; colIdx < opts.col; colIdx += 1) {
          const imageBounds = [
            [-blockSize * rowIdx, blockSize * colIdx],
            [-blockSize * (rowIdx + 1), blockSize * (colIdx + 1)],
          ];
          if (isSingle) {
            const sx = blockSize * colIdx;
            const sy = blockSize * rowIdx;
            images.push(L.canvasOverlay(
              imageBounds,
              {
                drawFn(ctx, width, height) {
                  ctx.drawImage(opts.image, sx, sy, blockSize, blockSize, 0, 0, width, height);
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
      const maxBounds = [
        [0, 0],
        [-this._opts.height, this._opts.width],
      ];
      const center = [-this._opts.height / 2, this._opts.width / 2];
      const r = Math.min(
        Math.abs(maxBounds[0][0] - maxBounds[1][0]),
        Math.abs(maxBounds[0][1] - maxBounds[1][1]),
      ) / 2;
      const targetBounds = [
        [center[0] + r, center[1] - r],
        [center[0] - r, center[1] + r],
      ];
      const z = map.getBoundsZoom(targetBounds, true);
      const minZoom = map.getBoundsZoom(maxBounds, false);
      const maxZoom = Math.max(z, minZoom + 3);
      if (this._opts.onAutoFit) {
        const recommendCfg = {
          minZoom,
          z,
          maxZoom,
          center,
          maxBounds,
        };
        this._opts.onAutoFit(recommendCfg);
      } else {
        map.setView(center, z)
          .setMaxBounds(maxBounds)
          .setMinZoom(minZoom)
          .setMaxZoom(maxZoom);
      }
      if (this._opts.debug) {
        L.marker(center).addTo(map);
        this._addPolygon(maxBounds);
        this._addPolygon(targetBounds, 'blue');
        console.log('_images', this._images);
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
