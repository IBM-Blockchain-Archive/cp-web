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
var dataSource = {};
var ibc = {};

// Use a tag to make logs easier to find
var TAG = "login_handler";

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
        cb(new Error(TAG + ": No sdk supplied to login users"));
        return;
    }

    ibc.register(0, id, secret, function(err, data) {
        if(err) {
            console.log(TAG, "Error", JSON.stringify(err));
            cb(err)
        } else {
            console.log(TAG, "Data", JSON.stringify(data));
            cb(null, data);
        }
    });
}

/**
 * Registers a new user against the given CA.
 * @param username The name of the user.
 * @param role The role to assign to the user.
 * @param ca_host The host for the CA.
 * @param ca_port The port for the CA API.
 * @param cb A callback of the form: function(err, credentials);
 */
function registerUser (username, role, ca_host, ca_port, cb) {
    // Initialize the connector to the CA
    dataSource.settings = {
        host: ca_host,
        port: ca_port
    };
    connector.initialize(dataSource);
    
    // Register the user on the CA
    var user = {
        identity: username,
        role: role
    };

    console.log(TAG, "Registering user against CA:", JSON.stringify(user));
    dataSource.connector.registerUser(user, function (err, response) {
        if (err) {
            console.error(TAG, "RegisterUser failed:", username, err.message);
            cb(err);
        } else {
            console.log(TAG, "RegisterUser succeeded:", JSON.stringify(response));
            // Send the response (username and secret) to the callback
            var creds = {
                id: response.id,
                secret: response.token,
            };

            cb(null, creds);
        }
    });
}

module.exports.login = login;
module.exports.registerUser = registerUser;

/**
 * Sets the registrar up to register/login users.
 * @param sdk The sdk object created from ibm-blockchain-js.
 */
module.exports.setup = function(sdk) {
    ibc = sdk;
};
