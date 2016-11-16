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

var TAG = 'web_socket:';

// ==================================
// Part 2 - incoming messages, look for type
// ==================================
var chaincode = {};
var chain = {};
var async = require('async');
var https = require('https');
var util = require('util');
var peers = null;
var chaincodeHelper;

module.exports.setup = function setup(ccID, c, peerHosts, chaincode_helper) {
    if (!(ccID && c && peerHosts && chaincode_helper))
        throw new Error('Web socket handler given incomplete configuration');
    chaincode = ccID;
    chain = c;
    peers = peerHosts;
    chaincodeHelper = chaincode_helper;
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
        var invokeRequestOptions = {
            chaincodeID: chaincode
        };
        if (err) {
            console.log('Failed to get member:', id + ':', err);
        } else {

            if (data.type == 'create') {

                if (data.paper && data.paper.ticker) {
                    console.log(TAG, 'creating paper:', data.paper);
                    chaincodeHelper.createPaper(data.user, data.paper, function (err, result) {
                        if (err != null) {
                            console.error(TAG, 'Error in create. No response will be sent. error:', err);
                        }
                        else {
                            console.log(TAG, 'paper created.  No response will be sent. result:', result);
                        }
                    });
                }
            }
            else if (data.type == 'get_papers') {

                console.log(TAG, 'getting papers');
                chaincodeHelper.getPapers(data.user, function (err, papers) {
                    if (err != null) {
                        console.error(TAG, 'Error in get_papers. No response will be sent. error:', err);
                    }
                    else {
                        console.log(TAG, 'got papers:', papers);
                        sendMsg({msg: 'papers', papers: papers});
                    }
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

                console.log(TAG, 'getting company information');
                chaincodeHelper.getCompany(data.user, data.company, function (e, company) {
                    if (e != null) {
                        console.error(TAG, 'Error in get_company. No response will be sent. error:', e);
                    }
                    else {
                        console.log(TAG, 'get_company result:', company);
                        sendMsg({msg: 'company', company: company});
                    }
                });
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