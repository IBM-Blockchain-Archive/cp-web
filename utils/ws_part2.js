// ==================================
// Part 2 - incoming messages, look for type
// ==================================
var chaincode = {};
var chain = {};
var async = require('async');
var http = require('http');
var https = require('https');
var util = require('util');
var peers = null;

function setup(ccID, c, peerHosts) {
    chaincode = ccID;
    chain = c;
    peers = peerHosts;
};

module.exports.setup = setup;

module.exports.process_msg = function (ws, data) {

    // Must have a user to invoke chaincode
    if (!data.user || data.user === '') {
        sendMsg({ type: "error", error: "user not provided in message" });
        return;
    }

    chain.getMember(data.user, function (err, usr) {
        var id = data.user;
        if (err) {
            console.log("Failed to get" + id + "member " + " ---> " + err);
        } else {
            var Request = {
                chaincodeID: chaincode
            };
            if (data.type == 'create') {
                if (data.paper && data.paper.ticker) {
                    console.log('!', data.paper);
                    Request.fcn = 'issueCommercialPaper';
                    Request.args = [JSON.stringify(data.paper)];

                    var invokeTx = usr.invoke(Request);

                    // Print the invoke results
                    invokeTx.on('completed', function (results) {
                        // Invoke transaction submitted successfully
                        console.log(util.format("Successfully completed chaincode invoke transaction: request=%j, response=%j", Request, results));
                        cb_invoked(null, results);
                    });
                    invokeTx.on('submitted', function (results) {
                        // Invoke transaction submitted successfully
                        console.log(util.format("Successfully submitted chaincode invoke transaction: request=%j, response=%j", Request, results));
                        cb_invoked(null, results);
                    });
                    invokeTx.on('error', function (err) {
                        // Invoke transaction submission failed
                        console.log(util.format("Failed to submit chaincode invoke transaction: request=%j, error=%j", Request, err));
                        cb_invoked(err, null);
                    });
                }
            }
            else if (data.type == 'get_papers') {
                Request.fcn = 'query';
                Request.args = ['GetAllCPs', data.user];

                var queryTx = usr.query(Request);

                // Print the query results
                queryTx.on('complete', function (results) {
                    // Query completed successfully
                    console.log(util.format("Successfully queried existing chaincode state: request=%j, response=%j, value=%s", Request, results, results.result.toString()));
                    cb_got_papers(null, results.result.toString());
                });
                queryTx.on('error', function (err) {
                    // Query failed
                    cb_got_papers(err, null);
                    console.log(util.format("Failed to query existing chaincode state: request=%j, error=%j", Request, err));
                });
            }
            else if (data.type == 'transfer_paper') {
                console.log('transfering msg', data.transfer);
                Request.fcn = 'transferPaper';
                Request.args = [JSON.stringify(data.transfer)];

                var invokeTx = usr.invoke(Request);

                // Print the invoke results
                invokeTx.on('submitted', function (results) {
                    // Invoke transaction submitted successfully
                    console.log(util.format("Successfully submitted chaincode invoke transaction: request=%j, response=%j", Request, results));
                });
                invokeTx.on('complete', function (results) {
                    // Invoke transaction submitted successfully
                    console.log(util.format("Successfully completed chaincode invoke transaction: request=%j, response=%j", Request, results));
                });
                invokeTx.on('error', function (err) {
                    // Invoke transaction submission failed
                    console.log(util.format("Failed to submit chaincode invoke transaction: request=%j, error=%j", Request, err));
                });
            }
            else if (data.type == 'chainstats') {
                var options = {
                    host: peers[0],
                    port: '443',
                    path: '/chain',
                    method: 'GET'
                };

                function success(statusCode, headers, resp) {
                    cb_chainstats(null, JSON.parse(resp));
                };
                function failure(statusCode, headers, msg) {
                    console.log('status code: ' + statusCode);
                    console.log('headers: ' + headers);
                    console.log('message: ' + msg);
                };

                var goodJSON = false;
                var request = https.request(options, function (resp) {
                    var str = '', temp, chunks = 0;

                    resp.setEncoding('utf8');
                    resp.on('data', function (chunk) {															//merge chunks of request
                        str += chunk;
                        chunks++;
                    });
                    resp.on('end', function () {																	//wait for end before decision
                        if (resp.statusCode == 204 || resp.statusCode >= 200 && resp.statusCode <= 399) {
                            success(resp.statusCode, resp.headers, str);
                        }
                        else {
                            failure(resp.statusCode, resp.headers, str);
                        }
                    });
                });

                request.on('error', function (e) {																//handle error event
                    failure(500, null, e);
                });

                request.setTimeout(20000);
                request.on('timeout', function () {																//handle time out event
                    failure(408, null, 'Request timed out');
                });

                request.end();
            }
            else if (data.type == 'get_company') {
                Request.fcn = 'query';
                Request.args = ['GetCompany', data.company];

                var queryTx = usr.query(Request);

                // Print the query results
                queryTx.on('complete', function (results) {
                    // Query completed successfully
                    console.log(util.format("Successfully queried existing chaincode state: request=%j, response=%j, value=%s", Request, results, results.result.toString()));
                    cb_got_company(null, results.result.toString());
                });
                queryTx.on('error', function (err) {
                    // Query failed
                    cb_got_company(err, null);
                    console.log(util.format("Failed to query existing chaincode state: request=%j, error=%j", Request, err));
                });
            }

            function cb_got_papers(e, papers) {
                if (e != null) {
                    console.log('papers error', e);
                }
                else {
                    console.log('papers', papers);
                    sendMsg({ msg: 'papers', papers: papers });
                }
            }

            function cb_got_company(e, company) {
                if (e != null) {
                    console.log('company error', e);
                }
                else {
                    console.log('company', company);
                    sendMsg({ msg: 'company', company: company });
                }
            }

            function cb_invoked(e, a) {
                console.log('response: ', e, a);
            }

            //call back for getting the blockchain stats, lets get the block height now
            var chain_stats = {};

            function cb_chainstats(e, stats) {
                chain_stats = stats;
                if (stats && stats.height) {
                    var list = [];
                    for (var i = stats.height - 1; i >= 1; i--) {								//create a list of heights we need
                        list.push(i);
                        if (list.length >= 8) break;
                    }

                    list.reverse();
                    async.eachLimit(list, 1, function (key, cb) {							//iter through each one, and send it
                        //get chainstats through REST API
                        var options = {
                            host: peers[0],
                            port: '443',
                            path: '/chain/blocks/' + key,
                            method: 'GET'
                        };

                        function success(statusCode, headers, stats) {
                            stats = JSON.parse(stats);
                            stats.height = key;
                            sendMsg({ msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats });
                            cb(null);
                        };

                        function failure(statusCode, headers, msg) {
                            console.log('chainstats block ' + key + ' failure :(');
                            console.log('status code: ' + statusCode);
                            console.log('headers: ' + headers);
                            console.log('message: ' + msg);
                            cb(null);
                        };

                        var goodJSON = false;
                        var request = https.request(options, function (resp) {
                            var str = '', temp, chunks = 0;
                            resp.setEncoding('utf8');
                            resp.on('data', function (chunk) {															//merge chunks of request
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

                        request.on('error', function (e) {																//handle error event
                            failure(500, null, e);
                        });

                        request.setTimeout(20000);
                        request.on('timeout', function () {																//handle time out event
                            failure(408, null, 'Request timed out');
                        });

                        request.end();
                    }, function () {
                    });
                }
            }

            //call back for getting a block's stats, lets send the chain/block stats
            function cb_blockstats(e, stats) {
                if (chain_stats.height) stats.height = chain_stats.height - 1;
                sendMsg({ msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats });
            }

            //call back for getting open trades, lets send the trades
            function cb_got_trades(e, trades) {
                if (e != null) console.log('error:', e);
                else {
                    if (trades && trades.open_trades) {
                        sendMsg({ msg: 'open_trades', open_trades: trades.open_trades });
                    }
                }
            }
        }
    });
    //send a message, socket might be closed...
    function sendMsg(json) {
        if (ws) {
            try {
                ws.send(JSON.stringify(json));
            }
            catch (e) {
                console.log('error ws', e);
            }
        }
    }
};