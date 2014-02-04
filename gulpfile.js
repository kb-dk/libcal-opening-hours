var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var replace = require('gulp-replace');
var rename = require('gulp-rename');

var JSSRC = 'http-pub/*.js';
var CSSSRC = 'http-pub/*.css';
var HTMLSRC = 'http-pub/*.html';
var DEST = 'production';
var LOCALHOSTURL = 'http://localhost:8002/';
var STATICURL = 'https://static.kb.dk/libcal/';

gulp.task('default', function () {
    // move html files
    gulp.src(HTMLSRC)
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(replace('openingHours.js','openingHours_min.js')) // FIXME: This ought to be more generic, but gulp-replace does not work with regExp on streams??
    .pipe(gulp.dest(DEST));

    // minify and move js files
    gulp.src(JSSRC)
    .pipe(uglify())
    .pipe(rename(function (dir, base, ext) {
        return base + '_min' + ext;
    }))
    .pipe(replace('openingHoursStyles.css','openingHoursStyles_min.css')) // FIXME: This ought to be more generic, but gulp-replace does not work with regExp on streams??
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEST));

    // minify and move css
    gulp.src(CSSSRC)
    .pipe(cssmin())
    .pipe(rename(function (dir, base, ext) {
        return base + '_min' + ext;
    }))
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEST));
});

