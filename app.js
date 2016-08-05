"use strict";
/* global process */
/* global __dirname */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *   Dale Avery
 *******************************************************************************/
/////////////////////////////////////////
///////////// Setup Node.js /////////////
/////////////////////////////////////////

process.env.GOPATH = __dirname;   //set the gopath to current dir and place chaincode inside src folder

var express = require('express');
var session = require('express-session');
var compression = require('compression');
var serve_static = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var app = express();
var setup = require('./setup');
var cors = require("cors");
var fs = require("fs");

//// Set Server Parameters ////
var host = setup.SERVER.HOST;
var port = setup.SERVER.PORT;

// For logging
var TAG = "app.js:";

////////  Pathing and Module Setup  ////////
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('.html', require('jade').__express);
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use('/cc/summary', serve_static(path.join(__dirname, 'cc_summaries')));												//for chaincode investigator
app.use(serve_static(path.join(__dirname, 'public'), { maxAge: '1d', setHeaders: setCustomCC }));							//1 day cache
app.use(session({ secret: 'Somethignsomething1234!test', resave: true, saveUninitialized: true }));
function setCustomCC(res, path) {
    if (serve_static.mime.lookup(path) === 'image/jpeg') res.setHeader('Cache-Control', 'public, max-age=2592000');		//30 days cache
    else if (serve_static.mime.lookup(path) === 'image/png') res.setHeader('Cache-Control', 'public, max-age=2592000');
    else if (serve_static.mime.lookup(path) === 'image/x-icon') res.setHeader('Cache-Control', 'public, max-age=2592000');
}
// Enable CORS preflight across the board.
app.options('*', cors());
app.use(cors());

///////////  Configure Webserver  ///////////
app.use(function (req, res, next) {
    var keys;
    console.log('------------------------------------------ incoming request ------------------------------------------');
    req.bag = {};											//create my object for my stuff
    req.session.count = eval(req.session.count) + 1;
    req.bag.session = req.session;

    var url_parts = require('url').parse(req.url, true);
    req.parameters = url_parts.query;
    keys = Object.keys(req.parameters);
    keys = Object.keys(req.body);
    next();
});

//// Router ////
var router = require('./routes/site_router');
app.use('/', router);

////////////////////////////////////////////
////////////// Error Handling //////////////
////////////////////////////////////////////
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function (err, req, res, next) {		// = development error handler, print stack trace
    console.log("Error Handler -", req.url);
    var errorCode = err.status || 500;
    res.status(errorCode);
    req.bag.error = { msg: err.stack, status: errorCode };
    if (req.bag.error.status == 404) req.bag.error.msg = "Sorry, I cannot locate that file";
    res.render('template/error', { bag: req.bag });
});

// Track the application deployments
require("cf-deployment-tracker-client").track();

// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function () { });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_ENV = 'production';
server.timeout = 240000;
// Ta-da.
console.log('------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if (process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');

// Track the application deployments
console.log('- Tracking Deployment');
require("cf-deployment-tracker-client").track();

// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================

// ============================================================================================================================
// 														Warning
// ============================================================================================================================

// ============================================================================================================================
// 														Entering
// ============================================================================================================================

// ============================================================================================================================
// 														Test Area
// ============================================================================================================================
var part2 = require('./utils/ws_part2');
var ws = require('ws');
var wss = {};
var user_manager = require('./utils/users');
var testChaincodeID = "cp";
var hfc = require('hfc');
var chaincodeName = 'cp_chaincode'
var chain = hfc.newChain(chaincodeName);
var WebAppAdmin;

// Configure the KeyValStore which is used to store sensitive keys
// as so it is important to secure this storage.
chain.setKeyValStore(hfc.newFileKeyValStore('/tmp/keyValStore'));
chain.setDeployWaitTime(100);
chain.setECDSAModeForGRPC(true);
// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================

var peerURLs = [];
var caURL = null;
var users = null;
var registrar = null; //user used to register other users and deploy chaincode
var peerHosts = [];

//hard-coded the peers and CA addresses.
//added for reading configs from file
try {
    var manual = JSON.parse(fs.readFileSync('mycreds.json', 'utf8'));
    var peers = manual.credentials.peers;
    for (var i in peers) {
        peerURLs.push("grpcs://" + peers[i].discovery_host + ":" + peers[i].discovery_port);
        peerHosts.push("" + peers[i].discovery_host);
    }
    var ca = manual.credentials.ca;
    for (var i in ca) {
        caURL = "grpcs://" + ca[i].url;
    }
    console.log('loading hardcoded peers');
    var users = null;																			//users are only found if security is on
    if (manual.credentials.users) users = manual.credentials.users;
    console.log('loading hardcoded users');
}
catch (e) {
    console.log('Error - could not find hardcoded peers/users, this is okay if running in bluemix');
}

if (process.env.VCAP_SERVICES) {
    //load from vcap, search for service, 1 of the 3 should be found...
    var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
    for (var i in servicesObject) {
        if (i.indexOf('ibm-blockchain') >= 0) {											//looks close enough
            if (servicesObject[i][0].credentials.error) {
                console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
                peers = null;
                users = null;
                process.error = { type: 'network', msg: 'Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date.' };
            }
            if (servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers) {
                console.log('overwritting peers, loading from a vcap service: ', i);
                peers = servicesObject[i][0].credentials.peers;
                peerURLs = [];
                peerHosts = [];
                for (var j in peers) {
                    peerURLs.push("grpcs://" + peers[j].discovery_host + ":" + peers[j].discovery_port);
                    peerHosts.push("" + peers[j].discovery_host);
                }
                if (servicesObject[i][0].credentials.ca) {
                    console.log('overwritting ca, loading from a vcap service: ', i);
                    ca = servicesObject[i][0].credentials.ca;
                    for (var z in ca) {
                        caURL = "grpcs://" + ca[z].discovery_host + ":" + ca[z].discovery_port;
                    }
                    if (servicesObject[i][0].credentials.users) {
                        console.log('overwritting users, loading from a vcap service: ', i);
                        users = servicesObject[i][0].credentials.users;
                        //TODO extract registrar from users once user list has been updated to new SDK
                    }
                    else users = null;													//no security	
                }
                else ca = null;
                break;
            }
        }
    }
}

var pwd = "";
for (var z in users) {
    if (users[z].username == "WebAppAdmin") {
        pwd = users[z].secret;
    }
}
console.log("calling network config");
configure_network();
// ==================================
// configure ibm-blockchain-js sdk
// ==================================

function configure_network() {
    var pem = fs.readFileSync('us.blockchain.ibm.com.cert');
    if (fs.existsSync('us.blockchain.ibm.com.cert')) {
        console.log("found cert us.blockchain.ibm.com");
        chain.setMemberServicesUrl(caURL, { pem: pem });
    }
    else {
        console.log("Failed to get the certificate....");
    }

    for (var i in peerURLs) {
        chain.addPeer(peerURLs[i], { pem: pem });
    }

    chain.getMember("WebAppAdmin", function (err, WebAppAdmin) {
        if (err) {
            console.log("Failed to get WebAppAdmin member " + " ---> " + err);
        } else {
            console.log("Successfully got WebAppAdmin member" + " ---> " /*+ JSON.stringify(crypto)*/);

            // Enroll the WebAppAdmin member with the certificate authority using
            // the one time password hard coded inside the membersrvc.yaml.
            WebAppAdmin.enroll(pwd, function (err, crypto) {
                if (err) {
                    console.log("Failed to enroll WebAppAdmin member " + " ---> " + err);
                    //t.end(err);
                } else {
                    console.log("Successfully enrolled WebAppAdmin member" + " ---> " /*+ JSON.stringify(crypto)*/);

                    // Confirm that the WebAppAdmin token has been created in the key value store
                    path = chain.getKeyValStore().dir + "/member." + WebAppAdmin.getName();

                    fs.exists(path, function (exists) {
                        if (exists) {
                            console.log("Successfully stored client token for" + " ---> " + WebAppAdmin.getName());
                        } else {
                            console.log("Failed to store client token for " + WebAppAdmin.getName() + " ---> " + err);
                        }
                    });
                }
                chain.setRegistrar(WebAppAdmin);
                deploy(WebAppAdmin);
            });
        }
    });
}

var gccID = {};
function deploy(WebAppAdmin) {
    var deployRequest = {
        fcn: "init",
        args: ['a', '100'],
        chaincodePath: "chain_code/",
        certificatePath: "/certs/blockchain-cert.pem"
    };
    var deployTx = WebAppAdmin.deploy(deployRequest);

    deployTx.on('submitted', function (results) {
        console.log("Successfully submitted chaincode deploy transaction" + " ---> " + "function: " + deployRequest.fcn + ", args: " + deployRequest.args + " : " + results.chaincodeID);
    });

    deployTx.on('complete', function (results) {
        console.log("Successfully completed chaincode deploy transaction" + " ---> " + "function: " + deployRequest.fcn + ", args: " + deployRequest.args + " : " + results.chaincodeID);
        part2.setup(results.chaincodeID, chain, peerHosts);
        user_manager.setup(results.chaincodeID, chain, cb_deployed);
    });

    deployTx.on('error', function (err) {
        // Invoke transaction submission failed
        console.log("Failed to submit chaincode deploy transaction" + " ---> " + "function: " + deployRequest.function + ", args: " + deployRequest.arguments + " : " + err);
    });
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(e, d) {
    if (e != null) {
        //look at tutorial_part1.md in the trouble shooting section for help
        console.log('! looks like the final configuration failed, holding off on the starting the socket\n', e);
        if (!process.error) process.error = { type: 'deploy', msg: e.details };
    }
    else {
        console.log('------------------------------------------ Websocket Up ------------------------------------------');
        var gws = {};														//save it here for chaincode investigator
        wss = new ws.Server({ server: server });												//start the websocket now
        wss.on('connection', function connection(ws) {
            ws.on('message', function incoming(message) {
                console.log('received ws msg:', message);
                var data = JSON.parse(message);
                part2.process_msg(ws, data);

            });
            ws.on('close', function () {
            });
        });

        wss.broadcast = function broadcast(data) {											//send to all connections
            wss.clients.forEach(function each(client) {
                try {
                    data.v = '2';
                    client.send(JSON.stringify(data));
                }
                catch (e) {
                    console.log('error broadcast ws', e);
                }
            });
        };
        //clients will need to know if blockheight changes 
        setInterval(function () {
            var options = {
                host: peerHosts[0],
                port: '443',
                path: '/chain',
                method: 'GET'
            };

            function success(statusCode, headers, resp) {
                resp = JSON.parse(resp);
                if (resp && resp.height) {
                    wss.broadcast({ msg: 'reset' });
                }
            };
            function failure(statusCode, headers, msg) {
                console.log('chainstats failure :(');
                console.log('status code: ' + statusCode);
                console.log('headers: ' + headers);
                console.log('message: ' + msg);
            };

            var goodJSON = false;
            var request = https.request(options, function (resp) {
                var str = '', temp, chunks = 0;
                resp.setEncoding('utf8');
                resp.on('data', function (chunk) {                                                            //merge chunks of request
                    str += chunk;
                    chunks++;
                });
                resp.on('end', function () {
                    if (resp.statusCode == 204 || resp.statusCode >= 200 && resp.statusCode <= 399) {
                        success(resp.statusCode, resp.headers, str);
                    }
                    else {
                        failure(resp.statusCode, resp.headers, str);
                    }
                });
            });

            request.on('error', function (e) {                                                                //handle error event
                failure(500, null, e);
            });

            request.setTimeout(20000);
            request.on('timeout', function () {                                                                //handle time out event
                failure(408, null, 'Request timed out');
            });

            request.end();
        }, 5000);
    }
}
