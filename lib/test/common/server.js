"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var http = require("http");
var finalhandler = require("finalhandler");
var serveStatic = require("serve-static");
var staticFiles = serveStatic(path.join(__dirname, '../../../data/'));
var serverHandler = function (req, res) {
    var done = finalhandler(req, res);
    return staticFiles(req, res, done);
};
exports.createSampleServer = function () { return http.createServer(serverHandler); };
//# sourceMappingURL=server.js.map