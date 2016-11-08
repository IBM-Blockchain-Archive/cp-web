'use strict';
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * This module assists with the user management for the blockchain network. It has
 * code for registering a new user on the network and logging in existing users.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *   Dale Avery
 *
 * Created by davery on 3/16/2016.
 *******************************************************************************/
var chain;
var chaincodeID;
var util = require('util');
var fs = require('fs');

// Use a tag to make logs easier to find
var TAG = 'user_manager:';

/**
 * Mimics a login process by attempting to register a given id and secret against
 * the first peer in the network. 'Successfully registered' and 'already logged in'
 * are considered successes.  Everything else is a failure.
 * @param id The user to log in.
 * @param secret The secret that was given to this user when registered against the CA.
 * @param cb A callback of the form: function(err)
 */
module.exports.login = function(id, secret, cb) {
    chain.getMember(id, function (err, usr) {
        if (err) {
            console.log(TAG, 'Failed to get' + id + 'member ' + ' ---> ' + err);
            if(cb) cb(err);
        } else {
            console.log(TAG, 'Successfully got ' + id + ' member' /*+ ' ---> ' + JSON.stringify(crypto)*/);

            // Enroll the user member with the certificate authority using
            // the one time password hard coded inside the membersrvc.yaml.
            usr.enroll(secret, function (err, crypto) {
                if (err) {
                    console.log('Failed to enroll' + id + 'member ' + ' ---> ' + err);
                    if(cb) cb(err);
                } else {
                    console.log('Successfully enrolled' + id + 'member' /*+ ' ---> ' + JSON.stringify(crypto)*/);

                    // Confirm that the user token has been created in the key value store
                    var path = chain.getKeyValStore().dir + '/member.' + usr.getName();

                    fs.exists(path, function (exists) {
                        if (exists) {
                            console.log('Successfully stored client token' /*+ ' ---> ' + user.getName()*/);
                        } else {
                            console.log('Failed to store client token for ' + usr.getName() + ' ---> ' + err);
                        }
                    });
                    var Request = {
                        chaincodeID: chaincodeID,
                        fcn: 'createAccount',
                        args: [id]
                    };
                    var invokeTx = usr.invoke(Request);
                    invokeTx.on('submitted', function (results) {
                        // Invoke transaction submitted successfully
                        console.log(util.format('Successfully submitted chaincode invoke transaction: request=%j, response=%j', Request, results));
                        if(cb) cb(null);
                    });
                    invokeTx.on('error', function (err) {
                        // Invoke transaction submission failed
                        console.log(util.format('Failed to submit chaincode invoke transaction: request=%j, error=%j', Request, err));
                        if(cb) cb(err);
                    });
                }
            });
        }
    });
};

/**
 * Registers a new user in the membership service for the blockchain network.
 * @param username The name of the user we want to register.
 * @param cb A callback of the form: function(error, user_credentials)
 */
module.exports.registerUser = function (username, cb) {
    chain.getMember(username, function (err, usr) {
        if (!usr.isRegistered()) {
            console.log(TAG, 'registering user..........');
            var registrationRequest = {
                enrollmentID: username,
                account: 'group1',
                affiliation: '00001'
            };
            usr.register(registrationRequest, function (err, enrollsecret) {
                if (err) {
                    cb(err);
                } else {
                    var cred = {
                        id: username,
                        secret: enrollsecret
                    };
                    module.exports.login(cred.id, cred.secret, function (err) {
                        if (err != null) {
                            cb(err);
                        } else {
                            cb(null, cred);
                        }
                    });

                }
            });
        } else {
            cb(new Error('Cannot register an existing user'));
        }
    });
};

/**
 * Whoever configures the hfc chain object needs to send it here in order for this user manager to function.
 * @param ccID The chaincode ID where 'new company' invokes should be sent.
 * @param ch The object representing our chain.
 * @param cb A callback of the form: function(error)
 */
module.exports.setup = function (ccID, ch, cb) {
    if (ch && ccID) {
        console.log(TAG, 'user manager properly configured');
        chaincodeID = ccID;
        chain = ch;
        cb(null);
    } else {
        console.error(TAG, 'user manager was not given proper configuration');
        var err = new Error('User manager requires both a chain object and ' +
            'a chaincode object before it can function.');
        cb(err);
    }
};
