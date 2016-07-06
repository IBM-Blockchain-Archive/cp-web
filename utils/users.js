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
//var ibc = {};
var chain = {};
var chaincodeID = {};
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
function getUser1(name, cb) {
    chain.getUser1(name, function (err, user) {
        if (err) return cb(err);
        if (user.isEnrolled()) return cb(null, user);
        // User is not enrolled yet, so perform both registration and enrollment
        // The chain registrar is already set inside 'Set chain registrar' test
        var registrationRequest = {
            enrollmentID: name,
            account: "bank_a",
            affiliation: "00001"
        };
        user.registerAndEnroll(registrationRequest, function (err) {
            if (err) cb(err, null)
            cb(null, user)
        });
    });
}

function getUser2(name, cb) {
    chain.getUser2(name, function (err, user) {
        if (err) return cb(err);
        if (user.isEnrolled()) return cb(null, user);
        // User is not enrolled yet, so perform both registration and enrollment
        // The chain registrar is already set inside 'Set chain registrar' test
        var registrationRequest = {
            enrollmentID: name,
            account: "bank_a",
            affiliation: "00001"
        };
        user.register(registrationRequest, function (err,enrollsecret) {
            if (err) cb(err, null)
            cb(null, user, enrollsecret);
        });
    });
}
/*
function login(id, secret, cb) {
    if (!ibc) {
        cb && cb(new Error(TAG + ": No sdk supplied to login users"));
        return;
    }

    // Just log in users against the first peer, as it is used for all rest calls anyway.
    ibc.register(0, id, secret, 2, function (err, data) {
        if (err) {
            console.log(TAG, "Error", JSON.stringify(err));
            cb && cb(err)
        } else {
            console.log(TAG, "Data", JSON.stringify(data));

            // Make sure an account exists for the user
            console.log(TAG, "(Re)initializing user's trading account");
            chaincode.invoke.createAccount([id], id, function (err) {
                if (err) {
                    console.error(TAG, "Account init error:", JSON.stringify(err));
                }

                console.log(TAG, "Initialized account:" + id);
                cb && cb(null);

            });
        }
    });
}
*/
function login(id, secret, cb) {
    chain.getMember(id, function (err, usr) {
        if (err) {
            console.log("Failed to get" + id + "member " + " ---> " + err);
            ////t.end(err);
        } else {
            console.log("Successfully got " + id + " member" /*+ " ---> " + JSON.stringify(crypto)*/);

            // Enroll the user member with the certificate authority using
            // the one time password hard coded inside the membersrvc.yaml.
            pw = secret;
            usr.enroll(pw, function (err, crypto) {
                if (err) {
                    console.log("Failed to enroll" + id + "member " + " ---> " + err);
                    ////t.end(err);
                } else {
                    console.log("Successfully enrolled" + id + "member" /*+ " ---> " + JSON.stringify(crypto)*/);

                    // Confirm that the user token has been created in the key value store
                    path = chain.getKeyValStore().dir + "/member." + usr.getName();

                    fs.exists(path, function (exists) {
                        if (exists) {
                            console.log("Successfully stored client token" /*+ " ---> " + user.getName()*/);
                        } else {
                            console.log("Failed to store client token for " + usr.getName() + " ---> " + err);
                        }
                    });
                }
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
/*
function registerUser(username, role, cb) {
    if (!dataSource.connector) {
        cb && cb(new Error("cannot register users before the CA connector is setup!"));
        return;
    }

    // Register the user on the CA
    var user = {
        identity: username,
        role: role,
        account: "group1",
        affiliation: "00001"
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
*/
function registerUser(username, role, cb) {
    var test_user1 = {
        name: username,
        role: role, // Client
    };
    getUser2(test_user1.name, function (err, user, enrollsecret) {
        if (err) {
            console.log(t, "Failed to get " + test_user1.name + " ---> ", err);
        } else {
            test_user_Member1 = user;

            console.log("Successfully registered and enrolled " + test_user_Member1.getName());

            // Confirm that the user token has been created in the key value store
            path = chain.getKeyValStore().dir + "/member." + test_user1.name;
            fs.exists(path, function (exists) {
                if (exists) {
                    console.log("Successfully stored client token" /*+ " ---> " + test_user1.name*/);
                    //t.end()
                } else {
                    console.log("Failed to store client token for " + test_user1.name + " ---> " + err);
                    //t.end(err)
                }
            });
        }
        user.login(test_user1.name, enrollsecret, cb);
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
module.exports.setup = function (ccID, ch, cb) {
    if (chain && ccID) {
        console.log(TAG, "user manager properly configured");
        chaincodeID = ccID;
        chain = ch;
        cb();
    } else {
        console.error(TAG, "user manager requires all of its setup parameters to function")
    }
};
