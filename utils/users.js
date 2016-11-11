'use strict';
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * This module assists with the user management for the blockchain network. It has
 * code for registering a new user on the network and logging in existing users.
 *
 * TODO refactor this into an object.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *   Dale Avery
 *
 * Created by davery on 3/16/2016.
 *******************************************************************************/

var chain;

// Use a tag to make logs easier to find
var TAG = 'user_manager:';

/**
 * Whoever configures the hfc chain object needs to send it here in order for this user manager to function.
 * @param myChain The object representing our chain.
 */
module.exports.setup = function (myChain) {
    console.log(TAG, 'setup() called');
    if (!myChain)
        throw new Error('User manager requires a chain object');
    chain = myChain;
};

/**
 * Mimics a enrollUser process by attempting to register a given id and secret against
 * the first peer in the network. 'Successfully registered' and 'already logged in'
 * are considered successes.  Everything else is a failure.
 * @param enrollID The user to log in.
 * @param enrollSecret The secret that was given to this user when registered against the CA.
 * @param cb A callback of the form: function(err)
 */
module.exports.enrollUser = function (enrollID, enrollSecret, cb) {
    console.log(TAG, 'enrollUser() called');

    if (!chain) {
        cb(new Error('Cannot enrollUser a user before setup() is called.'));
        return;
    }

    chain.getMember(enrollID, function (getError, usr) {
        if (getError) {
            console.log(TAG, 'getMember() failed for \"' + enrollID + '\":', getError.message);
            if (cb) cb(getError);
        } else {
            console.log(TAG, 'Successfully got member:', enrollID);

            usr.enroll(enrollSecret, function (enrollError, crypto) {
                if (enrollError) {
                    console.error(TAG, 'enroll() failed for \"', enrollID, '\":', enrollError.message);
                    if (cb) cb(enrollError);
                } else {
                    console.log(TAG, 'Successfully enrolled \"', enrollID, '\"');
                    if (cb) cb();
                }
            });
        }
    });
};

/**
 * Registers a new user in the membership service for the blockchain network.
 * @param enrollID The name of the user we want to register.
 * @param cb A callback of the form: function(error, user_credentials)
 */
module.exports.registerUser = function (enrollID, cb) {
    console.log(TAG, 'registerUser() called');

    if (!chain) {
        cb(new Error('Cannot register a user before setup() is called.'));
        return;
    }

    chain.getMember(enrollID, function (err, usr) {
        if (!usr.isRegistered()) {
            console.log(TAG, 'Sending registration request for:', enrollID);
            var registrationRequest = {
                enrollmentID: enrollID,
                affiliation: 'group1'
            };
            usr.register(registrationRequest, function (err, enrollSecret) {
                if (err) {
                    cb(err);
                } else {
                    var cred = {
                        id: enrollID,
                        secret: enrollSecret
                    };
                    console.log(TAG, 'Registration request completed successfully!');
                    cb(null, cred);
                }
            });
        } else {
            cb(new Error('Cannot register an existing user'));
        }
    });
};
