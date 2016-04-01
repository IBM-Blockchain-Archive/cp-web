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
"use strict";
// This connector let's us register users against a CA
var connector = require('./loopback-connector-obcca');
var ibc = {};
var chaincode = {};
var ca = {};
var dataSource = {};

// Use a tag to make logs easier to find
var TAG = "user_manager";

/**
 * Mimics a login process by attempting to register a given id and secret against
 * the first peer in the network. "Successfully registered" and "already logged in"
 * are considered successes.  Everything else is a failure.
 * @param id The user to log in.
 * @param secret The secret that was given to this user when registered against the CA.
 * @param cb A callback of the form: function(err)
 */
function login(id, secret, cb) {
    if (!ibc) {
        cb && cb(new Error(TAG + ": No sdk supplied to login users"));
        return;
    }

    // Just log in users against the first peer, as it is used for all rest calls anyway.
    ibc.register(0, id, secret, function (err, data) {
        if (err) {
            console.log(TAG, "Error", JSON.stringify(err));
            cb && cb(err)
        } else {
            console.log(TAG, "Data", JSON.stringify(data));

            // Make sure an account exists for the user
            console.log(TAG, "(Re)initializing user's trading account");
            chaincode.createAccount([id], id, function (err) {
                if (err) {
                    console.error(TAG, "Account init error:", JSON.stringify(err));
                }

                console.log(TAG, "Initialized account:" + id);
                cb && cb(null);

            });
        }
    });
}

/**
 * Registers a new user against the given CA.
 * @param username The name of the user.
 * @param role The role to assign to the user.
 * @param cb A callback of the form: function(err, credentials);
 */
function registerUser(username, role, cb) {
    if (!dataSource.connector) {
        cb && cb(new Error("cannot register users before the CA connector is setup!"));
        return;
    }

    // Register the user on the CA
    var user = {
        identity: username,
        role: role
    };

    console.log(TAG, "Registering user against CA:", username, "| role:", role);
    dataSource.connector.registerUser(user, function (err, response) {
        if (err) {
            console.error(TAG, "RegisterUser failed:", username, JSON.stringify(err));
            cb && cb(err);
        } else {
            console.log(TAG, "RegisterUser succeeded:", JSON.stringify(response));
            // Send the response (username and secret) to the callback
            var creds = {
                id: response.identity,
                secret: response.token
            };

            // Log the user in so that we can initialize their account in the chaincode
            login(creds.id, creds.secret, function (err) {
                if (err) {
                    console.error(TAG, "Registration failed at login", JSON.stringify(err));
                    cb && cb(err);
                } else {
                    console.log(TAG, "user registration and initialization complete");
                    cb && cb(null, creds);
                }
            });
        }
    });

}

module.exports.login = login;
module.exports.registerUser = registerUser;

/**
 * Sets the registrar up to register/login users.
 * @param sdk The sdk object created from ibm-blockchain-js.
 * @param cc The chaincode for creating new user accounts.
 * @param cert_auth The service credentials for the networks certificate authority.
 * @param cb A callback of the form
 */
module.exports.setup = function (sdk, cc, cert_auth, cb) {
    if (sdk && cc && cert_auth) {
        console.log(TAG, "user manager properly configured");
        ibc = sdk;
        chaincode = cc;
        ca = cert_auth;

        // Initialize the connector to the CA
        dataSource.settings = {
            host: cert_auth.api_host,
            port: cert_auth.api_port_tls
        };

        console.log(TAG, "initializing ca connection to:", dataSource.settings.host, ":", dataSource.settings.port);
        connector.initialize(dataSource, cb);

    } else {
        console.error(TAG, "user manager requires all of its setup parameters to function")
    }
};
