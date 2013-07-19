#!/usr/bin/env node

var argv = require('optimist').argv,
    express = require('express'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    http = require('http'),
    util = require('util'),
    app = express(),
    app2 = express();

function createResponseFunction(port) {
    return function(req, res){
        var fileName = path.join(__dirname + '/http-pub/' + req.params);
        if (fileName.lastIndexOf('/') === (fileName.length - 1)) {
            fileName += 'index.html';
        }
        logMsg(port + ' requested file: "' + fileName + '"');
        fs.exists(fileName, function(exists) {
            if (exists) {
                fs.readFile(fileName, {encoding: 'UTF-8'}, function (err, data) {
                    if (err) {
                        res.send(500, '<h3>Error</h3>' + err);
                    }
                    if (req.query.callback) {
                        // JSONP call
                        logMsg('returning a jsonp object for ' + fileName);
                        res.set('Content-Type', 'Application/javascript');
                        res.send(200, req.query.callback + '(' + data + ');');
                    } else {
                        logMsg('returning a normal file request ' + fileName);
                        res.set('Content-Type', mime.lookup(path.extname(fileName)));
                        res.send(200, data);
                    }
                });
            } else {
                logMsg('returning 404 - file "' + fileName + '" does not exist');
                res.send(404, '404 - ressource "' + fileName + '" was not found.');
            }
        });
    }
}

app.get('*', createResponseFunction(8001));
app.listen(8001);
app2.get('*', createResponseFunction(8002));
app2.listen(8002);

console.log('Webservers now listening to port 8001 and port 8002');

function logMsg(msg) {
    if ((argv.verbose) && (msg.indexOf('favicon.ico') < 0)) { // favicons requests just clutter up the log for no reason!
        console.log(new Date().getTime() + ': ' + msg);
    }
}

