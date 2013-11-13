#!/usr/bin/env node
/*global require, console*/

var fs = require('fs'),
    path = require('path'),
    argv = require('optimist').argv,
    uglifyJS = require('uglify-js'),
    uglifyCSS = require('uglifycss'),
    basedir = path.resolve(__dirname, '..'),
    homedir = argv.homedir ? argv.homedir : null;

if (homedir) {
    homedir = homedir.indexOf('http') === 0 ? argv.homedir : 'http://' + argv.homedir; // prefix 'http://' if lacking
    homedir = homedir.lastIndexOf('/') === homedir.length-1 ? homedir.substr(0, homedir.length - 1) : homedir;  // remove last '/' if present
}

function compressJSFile(fileUri, cb) {
    console.log('compressing file: ' + fileUri);

    fs.readFile(path.resolve(basedir, 'http-pub') + path.resolve('/', fileUri), {
            encoding: 'utf-8'
        }, function (err, data) {
            if (err) {
                console.log('ERROR: Could not open file. ' + err.message);
                process.exit(1);
            }

            if (homedir) {
                data = data.replace(/http:\/\/localhost:8002/, homedir); // This might be slow, but it works, and it is only once per link under deployment it is happening!
            }

            var ast = uglifyJS.parse(data),
                compressor = uglifyJS.Compressor(),
                minifiedFilename = path.basename(fileUri, '.js') + '_min.js';
            minifiedFilename = path.resolve(basedir, 'production') + path.resolve('/', minifiedFilename);

            ast.figure_out_scope();
            ast = ast.transform(compressor);
            ast.figure_out_scope();
            ast.compute_char_frequency();
            ast.mangle_names();

            fs.writeFile(
                minifiedFilename,
                ast.print_to_string(),
                {
                    encoding: 'utf-8'
                },
                function (err) {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    } else {
                        if (cb) {
                            cb();
                        }
                    }
                }
            );
    });
}

function compressCSSFile(fileUri, cb) {
    console.log('compressing file: ' + fileUri);

    fs.readFile(path.resolve(basedir, 'http-pub') + path.resolve('/', fileUri), {
            encoding: 'utf-8'
        }, function (err, data) {
            if (err) {
                console.log('ERROR: Could not open file. ' + err.message);
                process.exit(1);
            }

            if (homedir) {
                data = data.replace(/http:\/\/localhost:8002/, homedir); // This might be slow, but it works, and it is only once per link under deployment it is happening!
            }

            var minifiedFilename = path.basename(fileUri, '.css') + '_min.css';
            minifiedFilename = path.resolve(basedir, 'production') + path.resolve('/', minifiedFilename);

            fs.writeFile(
                minifiedFilename,
                uglifyCSS.processString(data),
                {
                    encoding: 'utf-8'
                },
                function (err) {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    } else {
                        if (cb) {
                            cb();
                        }
                    }
                }
            );
        }
    );
}

function copyFile(fileUri, cb) {
    fs.readFile(path.resolve(basedir, 'http-pub') + path.resolve('/', fileUri), {
            encoding: 'utf-8',
        }, function (err, data) {
            if (err) {
                console.log('ERROR: Could not open file. ' + err.message);
                process.exit(1);
            }

            if (homedir) {
                data = data.replace(/http:\/\/localhost:8002/, homedir); // This might be slow, but it works, and it is only once per link under deployment it is happening!
            }

            fs.writeFile(
                path.resolve(basedir, 'production') + path.resolve('/', fileUri),
                data,
                {
                    encoding: 'utf-8'
                },
                function (err) {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    } else {
                        if (cb) {
                            cb();
                        }
                    }
                }
            );
        }
    );
}

// Compress and move files for production
compressJSFile('openingHours.js', function () {
    console.log('openingHours.js all done!');
});

compressCSSFile('openingHoursStyles.css', function () {
    console.log('openingHoursStyles.css all done!');
});

copyFile('index.html', function () {
    console.log('index.html all done!');
});

copyFile('openingHours.js');
copyFile('openingHoursStyles.css');

console.log('working...');
