#!/usr/bin/env node
/*global require, console*/

var fs = require('fs'),
    path = require('path'),
    argv = require('optimist').argv,
    uglifyJS = require('uglify-js'),
    basedir = path.resolve(__dirname, '..');

console.log('compressing http-pub/openingHours.js');


fs.readFile(path.resolve(basedir, 'http-pub') + '/openingHours.js', {
        encoding: 'utf-8'
    }, function (err, data) {
        if (err) {
            console.log('Could not open file: ' + err.message);
            process.exit(1);
        }

        if (argv.homedir) {
            var replaceStr = argv.homedir.indexOf('http') === 0 ? argv.homedir : 'http://' + argv.homedir;
            replaceStr = replaceStr.lastIndexOf('/') === replaceStr.length-1 ? replaceStr.substr(0, replaceStr.length - 1) : replaceStr;
            data = data.replace(/http:\/\/localhost:8002/, replaceStr); // This might be slow, but it works, and it is only once per deployment it is happening!
        }

        //fs.writeFile(path.resolve(basedir, 'production') + '/openingHours_min.js', uglifyJS.minify(data).code, {
        var ast = uglifyJS.parse(data),
            compressor = uglifyJS.Compressor();
        ast.figure_out_scope();
        ast = ast.transform(compressor);
        ast.figure_out_scope();
        ast.compute_char_frequency();
        ast.mangle_names();

        fs.writeFile(path.resolve(basedir, 'production') + '/openingHours_min.js', ast.print_to_string(), {
            encoding: 'utf-8'
        }, function (err) {
                if (err) {
                    console.log(err);
                    process.exit(1);
                } else {
                    console.log('MUHOHAHAHA!');
                }
        });
});



/*
fs.readFile(path.resolve(basedir, 'http-pub') + '/openingHours.js', {
        encoding: 'utf-8'
    }, function (err, data) {
        if (err) {
            console.log('Could not open file: ' + err.message);
            process.exit(1);
        }
        console.log('Minifying completed. Writing minified file.');
        fs.writeFile('../production/openingHours-min.js', pro.gen_code(ast), function (err) {
            if (err) {
                console.log(err);
                process.exit(1);
            } else {
                console.log('MUHOHAHAHA!');
            }
        });


});
*/
console.log('wating game...');
