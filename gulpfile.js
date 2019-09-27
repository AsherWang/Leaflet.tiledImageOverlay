const { series, src, dest } = require('gulp');
const rimraf = require('rimraf');
const uglify = require('gulp-uglify');
const pipeline = require('readable-stream').pipeline;

function clean(cb) {
    rimraf('dist', cb);
}

function build() {
    return pipeline(
        src('src/L.tileImageOverlay.js'),
        uglify(),
        dest('dist')
    );
}

exports.default = series(clean, build);
