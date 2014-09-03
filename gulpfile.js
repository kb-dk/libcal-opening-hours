/* global require, console */
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var argv = require('optimist').argv;

var JSSRC = 'http-pub/*.js';
var CSSSRC = 'http-pub/*.css';
var HTMLSRC = 'http-pub/*.html';
var DEST = 'production';
var DEVDEST = 'development';
var LOCALHOSTURL = 'http://localhost:8002/';
var STATICURL = argv.dest || 'https://static.kb.dk/libcal/';

if (STATICURL.charAt(STATICURL.length - 1) !== '/') {
    STATICURL = STATICURL + '/';
}

if (argv.help) {
    console.log('Build libcal-opening-hours project.');
    console.log('USAGE:');
    console.log('gulp [development|production][--dest=<destinationURL>]');
    console.log('');
    console.log('gulp production - build production files for the KB libcal openinghours widget.');
    console.log('gulp --dest=https://static.kb.dk/libcal/ - build productionfiles with all static urls pointing at https://static.kb.dk/libcal/');
    console.log('gulp development - build a development setup with neither minification nor obfuscation.');
    console.log('gulp --help - print this message.');
    process.exit();
}

gulp.task('default', ['production'], function () {});

gulp.task('development', function () {
    gutil.log('Building a ', gutil.colors.cyan('development'), 'build for', gutil.colors.green('"' + STATICURL + '"'));
    // move html files
    gutil.log('Moving html...');
    gulp.src(HTMLSRC)
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEVDEST));

    // minify and move js files
    gutil.log('Moving js ...');
    gulp.src(JSSRC)
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEVDEST));

    // minify and move css
    gutil.log('Moving css ...');
    gulp.src(CSSSRC)
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEVDEST));
});

gulp.task('production', function () {
    gutil.log('Building a ', gutil.colors.cyan('production'), 'build for', gutil.colors.green('"' + STATICURL + '"'));
    // move html files
    gutil.log('Moving html...');
    gulp.src(HTMLSRC)
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(replace('openingHours.js','openingHours_min.js')) // FIXME: This ought to be more generic, but gulp-replace does not work with regExp on streams??
    .pipe(gulp.dest(DEST));

    // minify and move js files
    gutil.log('Minifying and moving js ...');
    gulp.src(JSSRC)
    .pipe(uglify())
    .pipe(rename(function (dir, base, ext) {
        return base + '_min' + ext;
    }))
    .pipe(replace('openingHoursStyles.css','openingHoursStyles_min.css')) // FIXME: This ought to be more generic, but gulp-replace does not work with regExp on streams??
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEST));

    // minify and move css
    gutil.log('Minifying and moving css ...');
    gulp.src(CSSSRC)
    .pipe(cssmin())
    .pipe(rename(function (dir, base, ext) {
        return base + '_min' + ext;
    }))
    .pipe(replace(LOCALHOSTURL, STATICURL))
    .pipe(gulp.dest(DEST));
});
