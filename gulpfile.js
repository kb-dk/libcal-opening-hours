var gulp = require('gulp');
var gutil = require('gulp-util');
var changed = require('gulp-changed');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var replace = require('gulp-replace');

var JSSRC = 'http-pub/*.js';
var CSSSRC = 'http-pub/*.css';
var HTMLSRC = 'http-pub/*.html';
var DEST = 'production';
var LOCALHOSTURL = 'http://localhost:8002/';
var STATICURL = 'http://static.kb.dk/libcal/';

gulp.task('default', function () {
    return gulp.src(JSSRC)
        .pipe(changed(DEST))
        .pipe(uglify())
        .pipe(gulp.dest(DEST));
});

gulp.task('minifyAndMoveJs', function (cb) {
    gulp.src(JSSRC)
    .pipe(uglify())
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEST));
    cb();
});

gulp.task('minifyAndMoveCss', function (cb) {
    gulp.src(CSSSRC)
    .pipe(cssmin())
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEST));
    cb();
});

gulp.task('moveHtml', function (cb) {
    gulp.src(HTMLSRC)
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEST));
    cb();
});

gulp.task('prod', ['minifyAndMoveJs', 'minifyAndMoveCss', 'moveHtml']);

