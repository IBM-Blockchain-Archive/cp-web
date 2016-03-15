// ==================================
// Part 2 - incoming messages, look for type
// ==================================
"use strict";
var ibc = {};
var chaincode = {};
var async = require('async');
var credentials = {};

module.exports.setup = function (sdk, cc, creds) {
    ibc = sdk;
    chaincode = cc;
    credentials = creds;
};

module.exports.process_msg = function (ws, data) {

    // Must have a user to invoke chaincode
    if (!data.user || data.user === '') {
        sendMsg({type: "error", error: "user not provided in message"});
        return;
    }

    // Verify that we actually have this user
    var user_creds;
    if (!(user_creds = getCredentials(credentials, data.user))) {
        sendMsg({type: "error", error: "username not found"});
        return;
    }

    // Process the message
    console.log('message type:', data.type);
    console.log('message user:', data.user);
    if (data.type == 'create') {
        if (data.paper && data.paper.ticker) {
            console.log('!', data.paper);
            chaincode.issueCommercialPaper([JSON.stringify(data.paper)], data.user, cb_invoked);				//create a new paper
        }
    }
    else if (data.type == 'get_papers') {
        chaincode.read('GetAllCPs', data.user, cb_got_papers);
    }
    else if (data.type == 'transfer_paper') {
        console.log('transfering msg', data.transfer);
        chaincode.transferPaper([JSON.stringify(data.transfer)], data.user);
    }
    else if (data.type == 'chainstats') {
        ibc.chain_stats(cb_chainstats);
    }
    else if (data.type == 'get_company') {
        chaincode.query(['GetCompany', data.company], data.user, cb_got_company);
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
            for (var i = stats.height - 1; i >= 1; i--) {										//create a list of heights we need
                list.push(i);
                if (list.length >= 8) break;
            }
            list.reverse();																//flip it so order is correct in UI
            console.log(list);
            async.eachLimit(list, 1, function (key, cb) {								//iter through each one, and send it
                ibc.block_stats(key, function (e, stats) {
                    if (e == null) {
                        stats.height = key;
                        sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
                    }
                    cb(null);
                });
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

/**
 * Searches a list of user credentials for the given user.  Used
 * to provide the username and secret for registering a user with a
 * peer.
 * @param list The list of user credentials to search.
 * @param name The name of the user to search for.
 * @returns {{}} The username and secret for the given user if found, undefined otherwise.
 */
function getCredentials(list, name) {
    "use strict";
    var ret;
    for (var i = 0; i < list.length; i++) {
        if (list[i].username === name) {
            ret = list[i];
            break;
        }
    }
    return ret;
}
