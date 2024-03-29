## Leaflet.tiledImageOverlay
[![npm version](https://badge.fury.io/js/leaflet.tiled-image-overlay.svg)](https://www.npmjs.com/package/leaflet.tiled-image-overlay)
![license](https://badgen.net/npm/license/leaflet.tiled-image-overlay)  
Leaflet插件，实现单图的瓦片形式加载，缩放不切换层级  
a Leaflet plugin providing a layer extended from L.LayerGroup.  
it can be used to show a single zoom tileLayer, you can zoom in and out.

## why this
高分辨率图片 __在移动端浏览器比如微信浏览器中有时候会显示不出来__ ，于是L.imageOverlay满足不了需要  
a high resolution pic __will not show in some moblie phones__ from time to time using L.imageOverlay.

## demo
[click me](https://asherwang.github.io/Leaflet.tiledImageOverlay)

## requirements
- Leaflet 版本: 不小于1.0.0
- Leaflet version: above 1.0.0
- 无其他外部依赖
- no other external dependencies

## usage
在leafet脚本加载之后加载L.tiledImageOverlay即可  
just import script L.tiledImageOverlay after leaflet  

use with `options.tileUrl`
``` javascript
const map = L.map(...args);
const options = {
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    z: 13, // 某一层级， 可以考虑不传，那么tileUrl中也不要留z的位置
    startX: 4091, // 横向
    startY: 2723, // 竖向
    row: 4,
    col: 4,
    leftTop: [0, 0], // latlng
    // rightBottom: [-10, 10], // latlng, required when map crs is not L.CRS.Simple
    blockSize: 64, // 单个瓦片显示在手机屏幕上的尺寸，与实际瓦片大小无关
    autoFit: true,
    onAutoFit: function ({ minZoom, z, maxZoom, center, maxBounds }) {
        console.log('custom init here...');
        map.setView(center, z);
        map.setMaxBounds(maxBounds);
        map.setMinZoom(minZoom);
        map.setMaxZoom(maxZoom);
    },
    // debug: true,
};
L.tileImageOverlay(options).addTo(map);
```

u can also use with use with `options.images` or `options.image`, check files `docs/demo-images.html` and `docs/demo-image.html`

### example
see `docs/index.html`

### options

#### options.tileUrl
一个url模板字符串，用来结合x,y,z为每个瓦片拼出一个完整的图片地址, 和参数`startX`, `startY`, `col`, `row`, `z`配合使用  
a url pattern to build an image url for per tile, working with`startX`, `startY`, `col`, `row`, `z`  

#### options.startX, options.col
决定tileUrl中x的取值: [options.startX, options.startX+options.col]  
determine the range of x in tileUrl: [options.startX, options.startX+options.col]  

#### options.startY, options.row
决定tileUrl中y的取值: [options.startY, options.startY+options.row]  
determine the range of y in tileUrl: [options.startY, options.startY+options.row]  

#### options.z
可选，如果tileUrl中有`z`，则需要传入此参数  
only required when the tileUrl contains `z`

#### options.blockSize
单位是像素，每个瓦片实际上是一个L.imageOverlay，blockSize为其宽高  
unit: px, the size of each tile as a L.imageOverlay

#### options.width, options.height
单位是像素，决定整个大图的宽高, 如果不传默认`width=blockSize*col`,`height=blockSize*row`  
unit: px, the size of the big image, use `width=blockSize*col`,`height=blockSize*row` if omitted

#### options.leftTop
左上角坐标，默认[0,0]  
leftTop corner latlng, default is [0, 0]

#### options.rightBottom
右下角坐标。 地图的crs 不是 L.CRS.Simple的时候需要设定，如果不设定将会使用`options.leftTop`和`options.width, options.height`算出`options.rightBottom`  
rightBottom corner latlng, required when map crs is not L.CRS.Simple, will be calculated with `options.leftTop` and `options.width, options.height` if omitted

#### options.autoFit, options.onAutoFit
`autoFit`为真则地图会自动缩放至最合适层级(根据当前窗口大小和大图大小)，并限制最大最小层级和最大边界， 若需自定义则传入`onAutoFit`，接收参数为推荐层级和边界(`{minZoom, z, maxZoom, center, maxBounds}`)  
if `autoFit` is true, the map will auto fixbounds , set min and max zoom,  and set maxbounds. if u dont like it, use `onAutoFit` to do your logic with your map, which accept recommended args like `{minZoom, z, maxZoom, center, maxBounds}`

#### options.images
一个包含所有(用到的)瓦片地址的数组  
an array of url string  
e.g. [row1col1,row1col2,...,row2col1,...]  
如果你不喜欢`tileUrl`，可以使用`images，row，col`组合来决定所有的瓦片来源  
if u dont like `tileUrl`, u can use `images, row, col`  

#### options.image (type: Image)
只要一张图
just one single image
如果你也不喜欢`images`,可以使用`image，blockSize`组合，将自动将大图切片，然后使用canvas呈现出来  
注意需要额外引入`L.canvasOverlay.min.js`, 而且你需要在image加载完成之后传入，见`docs/demo-image.html`   
if u dont like `images` either, u can use `image, blockSize`, the image will be cut into pieces according to `blockSize` and show in canvas  
attention: u should import `L.canvasOverlay.min.js` before using `opt.image`, and u need to call `L.tiledImageOverlay` after your image is loaded, see `docs/demo-image.html` for details

### dev
just run `gulp`