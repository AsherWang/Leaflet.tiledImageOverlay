const {
  series, src, dest, watch,
} = require('gulp');
const rimraf = require('rimraf');
const uglify = require('gulp-uglify-es').default;
const rename = require('gulp-rename');
const { pipeline } = require('readable-stream');

function clean(cb) {
  rimraf('docs/L.*.js', () => {
    rimraf('dist', cb);
  });
}

function cpDist() {
  return pipeline(
    src('dist/L.*.js'),
    dest('docs'),
  );
}

function build() {
  return pipeline(
    src('src/L.*.js'),
    uglify(),
    rename({ suffix: '.min' }),
    dest('dist'),
  );
}

exports.build = series(clean, build, cpDist);

exports.default = function () {
  watch(['src/L.*.js'], exports.build);
};
