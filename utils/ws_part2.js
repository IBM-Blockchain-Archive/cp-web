'use strict';
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * Communication between the CP browser code and this server is sent over web
 * sockets. This file has the code for processing and responding to message sent
 * to the web socket server.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *   Dale Avery
 *******************************************************************************/
// ==================================
// Part 2 - incoming messages, look for type
// ==================================
var chaincode = {};
var chain = {};
var async = require('async');
var https = require('https');
var util = require('util');
var peers = null;

module.exports.setup = function setup(ccID, c, peerHosts) {
    if(!(ccID && c && peerHosts))
        throw new Error('Web socket handler given incomplete configuration');
    chaincode = ccID;
    chain = c;
    peers = peerHosts;
};

/**
 * A handler for incoming web socket messages.
 * @param socket A socket that we can respond through.
 * @param data An object containing the incoming message data.
 */
module.exports.process_msg = function (socket, data) {

    // Clients must specify the identity to use on their network.  Needs to be someone
    // that this server has enrolled and has the enrollment cert for.
    if (!data.user || data.user === '') {
        sendMsg({type: 'error', error: 'user not provided in message'});
        return;
    }

    chain.getMember(data.user, function (err, usr) {
        var id = data.user;
        if (err) {
            console.log('Failed to get' + id + 'member ' + ' ---> ' + err);
        } else {
            var invokeRequestOptions = {
                chaincodeID: chaincode
            };
            if (data.type == 'create') {
                if (data.paper && data.paper.ticker) {
                    console.log('!', data.paper);
                    invokeRequestOptions.fcn = 'issueCommercialPaper';
                    invokeRequestOptions.args = [JSON.stringify(data.paper)];

                    var invokeTx = usr.invoke(invokeRequestOptions);

                    // Print the invoke results
                    invokeTx.on('completed', function (results) {
                        // Invoke transaction submitted successfully
                        console.log(util.format('Successfully completed chaincode invoke transaction: request=%j, response=%j', invokeRequestOptions, results));
                        cb_invoked(null, results);
                    });
                    invokeTx.on('submitted', function (results) {
                        // Invoke transaction submitted successfully
                        console.log(util.format('Successfully submitted chaincode invoke transaction: request=%j, response=%j', invokeRequestOptions, results));
                        cb_invoked(null, results);
                    });
                    invokeTx.on('error', function (err) {
                        // Invoke transaction submission failed
                        console.log(util.format('Failed to submit chaincode invoke transaction: request=%j, error=%j', invokeRequestOptions, err));
                        cb_invoked(err, null);
                    });
                }
            }
            else if (data.type == 'get_papers') {
                invokeRequestOptions.fcn = 'query';
                invokeRequestOptions.args = ['GetAllCPs', data.user];

                var queryTx = usr.query(invokeRequestOptions);

                // Print the query results
                queryTx.on('complete', function (results) {
                    // Query completed successfully
                    console.log(util.format('Successfully queried existing chaincode state: request=%j, response=%j, value=%s', invokeRequestOptions, results, results.result.toString()));
                    cb_got_papers(null, results.result.toString());
                });
                queryTx.on('error', function (err) {
                    // Query failed
                    cb_got_papers(err, null);
                    console.log(util.format('Failed to query existing chaincode state: request=%j, error=%j', invokeRequestOptions, err));
                });
            }
            else if (data.type == 'transfer_paper') {
                console.log('transfering msg', data.transfer);
                invokeRequestOptions.fcn = 'transferPaper';
                invokeRequestOptions.args = [JSON.stringify(data.transfer)];

                var invokeTx = usr.invoke(invokeRequestOptions);

                // Print the invoke results
                invokeTx.on('submitted', function (results) {
                    // Invoke transaction submitted successfully
                    console.log(util.format('Successfully submitted chaincode invoke transaction: request=%j, response=%j', invokeRequestOptions, results));
                });
                invokeTx.on('complete', function (results) {
                    // Invoke transaction submitted successfully
                    console.log(util.format('Successfully completed chaincode invoke transaction: request=%j, response=%j', invokeRequestOptions, results));
                });
                invokeTx.on('error', function (err) {
                    // Invoke transaction submission failed
                    console.log(util.format('Failed to submit chaincode invoke transaction: request=%j, error=%j', invokeRequestOptions, err));
                });
            }
            else if (data.type == 'chainstats') {
                var options = {
                    host: peers[0].api_host,
                    port: peers[0].api_port,
                    path: '/chain',
                    method: 'GET'
                };

                function success(statusCode, headers, resp) {
                    cb_chainstats(null, JSON.parse(resp));
                }

                function failure(statusCode, headers, msg) {
                    console.log('status code: ' + statusCode);
                    console.log('headers: ' + headers);
                    console.log('message: ' + msg);
                }

                var request = https.request(options, function (resp) {
                    var str = '', chunks = 0;

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
                invokeRequestOptions.fcn = 'query';
                invokeRequestOptions.args = ['GetCompany', data.company];

                var queryTx = usr.query(invokeRequestOptions);

                // Print the query results
                queryTx.on('complete', function (results) {
                    // Query completed successfully
                    console.log(util.format('Successfully queried existing chaincode state: request=%j, response=%j, value=%s', invokeRequestOptions, results, results.result.toString()));
                    cb_got_company(null, results.result.toString());
                });
                queryTx.on('error', function (err) {
                    // Query failed
                    cb_got_company(err, null);
                    console.log(util.format('Failed to query existing chaincode state: request=%j, error=%j', invokeRequestOptions, err));
                });
            }

            function cb_got_papers(e, papers) {
                if (e != null) {
                    console.log('papers error', e);
                }
                else {
                    console.log('papers', papers);
                    sendMsg({msg: 'papers', papers: papers});
                }
            }

            function cb_got_company(e, company) {
                if (e != null) {
                    console.log('company error', e);
                }
                else {
                    console.log('company', company);
                    sendMsg({msg: 'company', company: company});
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
                            host: peers[0].api_host,
                            port: peers[0].api_port,
                            path: '/chain/blocks/' + key,
                            method: 'GET'
                        };

                        function success(statusCode, headers, stats) {
                            stats = JSON.parse(stats);
                            stats.height = key;
                            sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
                            cb(null);
                        }

                        function failure(statusCode, headers, msg) {
                            console.log('chainstats block ' + key + ' failure :(');
                            console.log('status code: ' + statusCode);
                            console.log('headers: ' + headers);
                            console.log('message: ' + msg);
                            cb(null);
                        }

                        var request = https.request(options, function (resp) {
                            var str = '', chunks = 0;
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
                sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
            }

            //call back for getting open trades, lets send the trades
            function cb_got_trades(e, trades) {
                if (e != null) console.log('error:', e);
                else {
                    if (trades && trades.open_trades) {
                        sendMsg({msg: 'open_trades', open_trades: trades.open_trades});
                    }
                }
            }
        }
    });

    /**
     * Send a response back to the client.
     * @param json The content of the response.
     */
    function sendMsg(json) {
        if (socket) {
            try {
                socket.send(JSON.stringify(json));
            }
            catch (error) {
                console.error('Error sending response to client:', error.message);
            }
        }
    }
};