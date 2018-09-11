/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";

    var https = require("https");
    var _domainManager=null;

    /**
     * @private
     * Handler function for the simple.getMemory command.
     * @param {boolean} total If true, return total memory; if false, return free memory only.
     * @return {number} The amount of memory.
     */
    function httpRequest(options,callback){
        var post_data = JSON.stringify(options.body);
        var post_options = {
            host:options.host,
            path:options.path,
            method: 'POST',
            headers:options.headers
        };
        if(!!options.headers) post_options.headers=options.headers;
        else post_options.headers={};
        post_options.headers['Content-Length']=Buffer.byteLength(post_data);
        var post_req = https.request(post_options, function(res) {
            res.setEncoding('utf8');
            console.log(res.statusCode);
            if(res.statusCode==204){
                let bee={"status":200,"msg":"ok"};
                _domainManager.emitEvent("httpsDomain","httpsresponseok",['scope',res.statusCode,JSON.parse(bee)]);
            }
            res.on('data', function (chunk) {
                //_domainManager.emitEvent("httpsDomain","httpsresponse",['scope','message',JSON.parse(chunk)]);
                _domainManager.emitEvent("httpsDomain","httpsresponse",['scope',res.statusCode,JSON.parse(chunk)]);
            }).on('error',function(e){
                _domainManager.emitEvent("httpsDomain","httpserror",[e]);
            });
        });
        post_req.write(post_data);
        post_req.end();
    }

    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        _domainManager=domainManager;
        if (!domainManager.hasDomain("httpsDomain")) {
            domainManager.registerDomain("httpsDomain", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "httpsDomain",       // domain name
            "getHttps",    // command name
            httpRequest,   // command handler function
            true,          // this command is asynchronous in Node
            "send https request",
            [{
                    name:"options",
                    type:"string",
                    description:"options to pass"}/*,{
                        name:"callback",
                        type:"object",
                        description:"callack function"}*/],
            []
        );
        domainManager.registerEvent(
            "httpsDomain",     // domain name
            "httpsresponse",         // event name
            [{
                name: "scope",
                type: "string",
                description: "message scope"
            }, {
                name: "message",
                type: "string",
                description: "message body"
            }, {
                name: "payload",
                type: "object",
                description: "log message payload"
            }]
        );
        domainManager.registerEvent(
            "httpsDomain",     // domain name
            "httpsresponseok",         // event name
            [{
                name: "scope",
                type: "string",
                description: "message scope"
            }, {
                name: "message",
                type: "string",
                description: "message body"
            }, {
                name: "payload",
                type: "object",
                description: "log message payload"
            }]
        );
        domainManager.registerEvent(
            "httpsDomain",     // domain name
            "httpserror",         // event name
            [{
                name: "scope",
                type: "string",
                description: "message scope"
            }]
        );
    }

    exports.init = init;

}());
