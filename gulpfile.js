const { series, src, dest, watch } = require('gulp');
const rimraf = require('rimraf');
const uglify = require('gulp-uglify');
const pipeline = require('readable-stream').pipeline;

function clean(cb) {
    rimraf('docs/L.tileImageOverlay.js', function () {
        rimraf('dist', cb);
    });
}

function cpDist() {
    return pipeline(
        src('dist/L.tileImageOverlay.js'),
        dest('docs')
    );
}

function build() {
    return pipeline(
        src('src/L.tileImageOverlay.js'),
        uglify(),
        dest('dist')
    );
}

exports.build = series(clean, build, cpDist);


exports.default = function () {
    watch(['src/L.tileImageOverlay.js'], exports.build);
};