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
var express = require('express');
var session = require('express-session');
var compression = require('compression');
var serve_static = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var app = express();
var url = require('url');
var async = require('async');
var setup = require('./setup');
var cors = require("cors");
var fs = require("fs");
var util = require('util');

//// Set Server Parameters ////
var host = setup.SERVER.HOST;
var port = setup.SERVER.PORT;

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
app.use(serve_static(path.join(__dirname, 'public'), {maxAge: '1d', setHeaders: setCustomCC}));							//1 day cache
//app.use( serve_static(path.join(__dirname, 'public')) );
app.use(session({secret: 'Somethignsomething1234!test', resave: true, saveUninitialized: true}));
function setCustomCC(res, path) {
    if (serve_static.mime.lookup(path) === 'image/jpeg')  res.setHeader('Cache-Control', 'public, max-age=2592000');		//30 days cache
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
    console.log('New ' + req.method + ' request for', req.url);
    req.bag = {};											//create my object for my stuff
    req.session.count = eval(req.session.count) + 1;
    req.bag.session = req.session;

    var url_parts = url.parse(req.url, true);
    req.parameters = url_parts.query;
    keys = Object.keys(req.parameters);
    if (req.parameters && keys.length > 0) console.log({parameters: req.parameters});		//print request parameters
    keys = Object.keys(req.body);
    if (req.body && keys.length > 0) console.log({body: req.body});						//print request body
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
    console.log("Error Handeler -", req.url);
    var errorCode = err.status || 500;
    res.status(errorCode);
    req.bag.error = {msg: err.stack, status: errorCode};
    if (req.bag.error.status == 404) req.bag.error.msg = "Sorry, I cannot locate that file";
    res.render('template/error', {bag: req.bag});
});

// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function () {
});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_ENV = 'production';
server.timeout = 240000;																							// Ta-da.
console.log('------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if (process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');


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
var Ibc1 = require('ibm-blockchain-js');
var ibc = new Ibc1();

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
var manual = {
    "credentials": {
        "peers": [
            {
                "discovery_host": "169.44.38.111",
                "discovery_port": "33901",
                "api_host": "169.44.38.111",
                "api_port": "33902",
                "type": "peer",
                "network_id": "4eaf14f9-65fd-4396-a446-7e84d9b46d40",
                "id": "4eaf14f9-65fd-4396-a446-7e84d9b46d40_vp1",
                "api_url": "http://169.44.38.111:33902"
            },
            {
                "discovery_host": "169.44.38.111",
                "discovery_port": "33903",
                "api_host": "169.44.38.111",
                "api_port": "33904",
                "type": "peer",
                "network_id": "4eaf14f9-65fd-4396-a446-7e84d9b46d40",
                "id": "4eaf14f9-65fd-4396-a446-7e84d9b46d40_vp2",
                "api_url": "http://169.44.38.111:33904"
            }
        ],
        "users": [
            {
                "username": "user_type0_9da1a8be2f",
                "secret": "61dcec682d"
            },
            {
                "username": "user_type0_0ef7ba06ef",
                "secret": "dc71226a54"
            },
            {
                "username": "user_type1_1a83a1fc44",
                "secret": "4e81d75356"
            },
            {
                "username": "user_type1_ac9d718c38",
                "secret": "17e5db093e"
            },
            {
                "username": "user_type2_43c7145b8e",
                "secret": "3c518652c9"
            },
            {
                "username": "user_type2_9a6a57fe70",
                "secret": "ba5412269b"
            },
            {
                "username": "user_type3_585408d022",
                "secret": "d96888adca"
            },
            {
                "username": "user_type3_7d48e0e1a9",
                "secret": "7dab248416"
            },
            {
                "username": "user_type4_a781d72759",
                "secret": "4f31b2b008"
            },
            {
                "username": "user_type4_43748f2eb6",
                "secret": "90c08320e8"
            }
        ]
    }
};

var peers = manual.credentials.peers;
console.log('loading hardcoded peers');
var users = null;																		//users are only found if security is on
if (manual.credentials.users) users = manual.credentials.users;
console.log('loading hardcoded users');

if (process.env.VCAP_SERVICES) {															//load from vcap, search for service, 1 of the 3 should be found...
    var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
    for (var i in servicesObject) {
        if (i.indexOf('ibm-blockchain') >= 0) {											//looks close enough
            if (servicesObject[i][0].credentials.error) {
                console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
                peers = null;
                users = null;
                process.error = {
                    type: 'network',
                    msg: "Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date."
                };
            }
            if (servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers) {
                console.log('overwritting peers, loading from a vcap service: ', i);
                peers = servicesObject[i][0].credentials.peers;
                if (servicesObject[i][0].credentials.users) {
                    console.log('overwritting users, loading from a vcap service: ', i);
                    users = servicesObject[i][0].credentials.users;
                }
                else users = null;														//no security
                break;
            }
        }
    }
}

// Credentials from user_creds.json should work as aliases for service users
var user_list = require('./user_creds.json');

// Separate the user credentials into lists based on the user role
var user_creds = [];
var auditor_creds = [];
for (var i = 0; i < user_list.length; i++) {
    var current = user_list[i];

    if (!current.role || current.role === "user") {
        user_creds.push(current);
    } else if (current.role === "auditor") {
        auditor_creds.push(current);
    } else {
        var msg = util.format("Skipped user '%s': role '%s' is not defined.", current.username, current.role);
        console.log(msg);
    }
}

console.log("Merging the blockchain and user_creds.json users");
var aliased_users = [];
var vcap_ind = 0, user_ind = 0, auditor_ind = 0;
var user_logged = false, auditor_logged = false;
while (vcap_ind < users.length && (user_ind < user_creds.length || auditor_ind < auditor_creds.length)) {

    // Ignore Type0's, as they should only be associated with peers
    if (users[vcap_ind].username.toLowerCase().indexOf('type0') < 0) {

        // Combine the users!
        var new_user = {
            username: users[vcap_ind].username,
            secret: users[vcap_ind].secret,
            name: "",
            password: "",
            role: ""
        };

        // Check for auditors (type4 users)
        if (new_user.username.toLowerCase().indexOf('type4') > -1) {

            // Can't make a user if we don't have enough aliases
            if (auditor_ind < auditor_creds.length) {

                // Add the use user to the list
                new_user.name = auditor_creds[auditor_ind].username;
                new_user.password = auditor_creds[auditor_ind].password;
                new_user.role = "auditor";
                aliased_users.push(new_user);
                auditor_ind++;
            } else {
                if (!user_logged) {
                    console.log("Didn't provide enough auditors to cover type4 service credentials");
                    user_logged = true;
                }
            }
        } else {

            // Must be a regular user
            if (user_ind < user_creds.length) {
                // Add the use user to the list
                new_user.name = user_creds[user_ind].username;
                new_user.password = user_creds[user_ind].password;
                new_user.role = "user";
                aliased_users.push(new_user);
                user_ind++;
            } else {
                if (!auditor_logged) {
                    console.log("Didn't provide enough users to cover service credentials");
                    auditor_logged = true;
                }
            }
        }
    }
    vcap_ind++;
}
if (aliased_users.length < 1) {
    console.error("There aren't enough users for the app to work!");
}

// Make sure the router has all these credentials.  It actually lets users log in to
// the app.  Also, give it a handler for switching peer users on logins.
/**
 * Switches the user that chaincode requests are sent with.  Should be
 * called whenever a different user logs in to the website.
 * @param user The user that logged in.
 */
function loginHandler(user, callback) {
    if(user.username && user.secret) {
        console.log("Switching to peer user")
        // TODO call the SDK's switch user function here
        ibc.register(ibc.selectedPeer, user.username, user.secret, function(err, data) {
            if(err) {
                var msg = util.format("Error when logging in user: '%s': $s", JSON.stringify(user), JSON.stringify(err));
                console.log(msg);
            }
            else {
                console.log("Registered user:", JSON.stringify(user), JSON.stringify(data));
            }
        });
    }
}
router.setupRouter(aliased_users, loginHandler);

// ==================================
// configure ibm-blockchain-js sdk
// ==================================
var options = {
    network: {
        peers: peers,
        users: users
    },
    chaincode: {
        zip_url: 'https://github.com/IBM-Blockchain/cp-chaincode/archive/master.zip',
        unzip_dir: 'cp-chaincode-master',									//subdirectroy name of chaincode after unzipped
        git_url: 'https://github.com/IBM-Blockchain/cp-chaincode',			//GO git http url

        //hashed cc name from prev deployment
        //deployed_name: 'aa9912b29e0778ee09fda59d381e43453a9fcf6260b8b0ec6b625830636f79d770845fe2e3a4f47d4a1f3fdc17e4d45d809faa8b15993173db289678734e2a40'
    }
};
if (process.env.VCAP_SERVICES) {
    console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok budddy\n');
    options.chaincode.deployed_name = "";
}
ibc.load(options, cb_ready);																//parse/load chaincode

var chaincode = null;
function cb_ready(err, cc) {																	//response has chaincode functions
    if (err != null) {
        console.log('! looks like an error loading the chaincode, app will fail\n', err);
        if (!process.error) process.error = {type: 'load', msg: err.details};				//if it already exist, keep the last error
    }
    else {
        chaincode = cc;
        part2.setup(ibc, cc);
        if (!cc.details.deployed_name || cc.details.deployed_name === "") {												//decide if i need to deploy
            cc.deploy('createAccounts', ['50'], './cc_summaries', cb_deployed);
        }
        else {
            console.log('chaincode summary file indicates chaincode has been previously deployed');
            cb_deployed();
        }
    }
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(e, d) {
    if (e != null) {
        //look at tutorial_part1.md in the trouble shooting section for help
        console.log('! looks like a deploy error, holding off on the starting the socket\n', e);
        if (!process.error) process.error = {type: 'deploy', msg: e.details};
    }
    else {
        console.log('------------------------------------------ Websocket Up ------------------------------------------');
        ibc.save('./cc_summaries');															//save it here for chaincode investigator
        wss = new ws.Server({server: server});												//start the websocket now
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

        // ========================================================
        // Part 2 Code - Monitor the height of the blockchain
        // =======================================================
        ibc.monitor_blockheight(function (chain_stats) {										//there is a new block, lets refresh everything that has a state
            if (chain_stats && chain_stats.height) {
                console.log('hey new block, lets refresh and broadcast to all');
                ibc.block_stats(chain_stats.height - 1, cb_blockstats);
                wss.broadcast({msg: 'reset'});
                chaincode.read('GetAllCPs', cb_got_papers);
            }

            //got the block's stats, lets send the statistics
            function cb_blockstats(e, stats) {
                if (chain_stats.height) stats.height = chain_stats.height - 1;
                wss.broadcast({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
            }

            function cb_got_papers(e, papers) {
                if (e != null) {
                    console.log('papers error', e);
                }
                else {
                    //console.log('papers', papers);
                    wss.broadcast({msg: 'papers', papers: papers});
                }
            }

            //call back for getting open trades, lets send the trades
            function cb_got_trades(e, trades) {
                if (e != null) console.log('error:', e);
                else {
                    if (trades && trades.open_trades) {
                        wss.broadcast({msg: 'open_trades', open_trades: trades.open_trades});
                    }
                }
            }
        });
    }
}