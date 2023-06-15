const gulp = require('gulp');
const shell = require('gulp-shell');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');

function clean(cb) {
    import('del')
        .then((del) => del.deleteSync(['lib']))
        .then(() => cb());
}

function compile(cb) {
    tsProject
        .src()
        .pipe(tsProject()).js
        .pipe(gulp.dest('lib'));
    cb();
}

exports.clean = clean;
exports.compile = compile;
exports.build = gulp.series(clean, compile);
exports.default = exports.build;