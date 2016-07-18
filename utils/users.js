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
var util = require('util');
var fs = require('fs');

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
/*
function getUser(name, cb) {
    chain.getUser(name, function (err, user) {
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
    chain.getUser(name, function (err, user) {
        if (err) return cb(err);
        if (user.isEnrolled()) return cb(null, user);
        // User is not enrolled yet, so perform both registration and enrollment
        // The chain registrar is already set inside 'Set chain registrar' test
        var registrationRequest = {
            enrollmentID: name,
            account: "bank_a",
            affiliation: "00001"
        };
        user.register(registrationRequest, function (err, enrollsecret) {
            if (err) cb(err, null)
            cb(null, user, enrollsecret);
        });
    });
}
*/
function login(id, secret, cb) {
    chain.getMember(id, function (err, usr) {
        if (err) {
            console.log("Failed to get" + id + "member " + " ---> " + err);
            cb && cb(err);
            ////t.end(err);
        } else {
            console.log("Successfully got " + id + " member" /*+ " ---> " + JSON.stringify(crypto)*/);

            // Enroll the user member with the certificate authority using
            // the one time password hard coded inside the membersrvc.yaml.
            var pw = secret;
            usr.enroll(pw, function (err, crypto) {
                if (err) {
                    console.log("Failed to enroll" + id + "member " + " ---> " + err);
                    cb && cb(err);
                    ////t.end(err);
                } else {
                    console.log("Successfully enrolled" + id + "member" /*+ " ---> " + JSON.stringify(crypto)*/);

                    // Confirm that the user token has been created in the key value store
                    var path = chain.getKeyValStore().dir + "/member." + usr.getName();

                    fs.exists(path, function (exists) {
                        if (exists) {
                            console.log("Successfully stored client token" /*+ " ---> " + user.getName()*/);
                        } else {
                            console.log("Failed to store client token for " + usr.getName() + " ---> " + err);
                        }
                    });
                    var Request = {
                        chaincodeID: chaincodeID,
                        fcn: 'createAccount',
                        args: [id]
                    }
                    var invokeTx = usr.invoke(Request);
                    invokeTx.on('submitted', function (results) {
                        // Invoke transaction submitted successfully
                        console.log(util.format("Successfully submitted chaincode invoke transaction: request=%j, response=%j", Request, results));
                        cb && cb(null);
                    });
                    invokeTx.on('error', function (err) {
                        // Invoke transaction submission failed
                        console.log(util.format("Failed to submit chaincode invoke transaction: request=%j, error=%j", Request, err));
                        cb && cb(err);
                    });
                }
            });
        }
    });
}
/*
function login2(id, secret, cb) {
    chain.getMember(id, function (err, usr) {
        if (err) {
            console.log("Failed to get" + id + "member " + " ---> " + err);
            cb && cb(null, null);
            ////t.end(err);
        } else {
            console.log("Successfully got " + id + " member" /*+ " ---> " + JSON.stringify(crypto));

            // Enroll the user member with the certificate authority using
            // the one time password hard coded inside the membersrvc.yaml.
            var pw = secret;
            var cred = {
                id: id,
                secret: pw
            };
            usr.enroll(pw, function (err, crypto) {
                if (err) {
                    console.log("Failed to enroll" + id + "member " + " ---> " + err);
                    cb && cb(null, cred);
                    ////t.end(err);
                } else {
                    console.log("Successfully enrolled" + id + "member" /*+ " ---> " + JSON.stringify(crypto));

                    // Confirm that the user token has been created in the key value store
                    var path = chain.getKeyValStore().dir + "/member." + usr.getName();

                    fs.exists(path, function (exists) {
                        if (exists) {
                            console.log("Successfully stored client token" /*+ " ---> " + user.getName());
                        } else {
                            console.log("Failed to store client token for " + usr.getName() + " ---> " + err);
                        }
                    });
                    var Request = {
                        chaincodeID: chaincodeID,
                        fcn: 'createAccount',
                        args: [id]
                    }
                    var invokeTx = usr.invoke(Request);
                    invokeTx.on('submitted', function (results) {
                        // Invoke transaction submitted successfully
                        console.log(util.format("Successfully submitted chaincode invoke transaction: request=%j, response=%j", Request, results));
                        cb && cb(null, cred);
                    });
                    invokeTx.on('error', function (err) {
                        // Invoke transaction submission failed
                        console.log(util.format("Failed to submit chaincode invoke transaction: request=%j, error=%j", Request, err));
                    });
                }
            });
        }
    });
}
*/
function registerUser(username, role, cb) {
    chain.getMember(username, function (err, usr) {
        if (!usr.isRegistered()) {
            console.log("registering user..........");
            var registrationRequest = {
                enrollmentID: username,
                account: "bank_a",
                affiliation: "00001"
            };
            usr.register(registrationRequest, function (err, enrollsecret) {
                if (err) {
                    cb(err, null);
                } else {
                    var cred = {
                        id: username,
                        secret: enrollsecret
                    }
                    login(cred.id, cred.secret, function (err){
                        if(err != null) {
                            cb(err, null);
                        } else {
                            cb(null, cred);
                        }
                    });     

                }
            });
        } else {
            console.log("User alreay exists. Please login.");
            cb("not ok", null);
        }
    });
}
/*
function registerUser(username, role, cb) {
    var test_user1 = {
        name: username,
        role: role, // Client
    };
    getUser2(test_user1.name, function (err, user, enrollsecret) {
        if (err) {
            console.log("Failed to get " + test_user1.name + " ---> ", err);
        } else {
            var test_user_Member1 = user;

            console.log("Successfully registered and enrolled " + test_user_Member1.getName());

            // Confirm that the user token has been created in the key value store
            var path = chain.getKeyValStore().dir + "/member." + test_user1.name;
            fs.exists(path, function (exists) {
                if (exists) {
                    console.log("Successfully stored client token");
                    //t.end()
                } else {
                    console.log("Failed to store client token for " + test_user1.name + " ---> " + err);
                    //t.end(err)
                }
            });
        }
        login2(test_user1.name, enrollsecret, cb);
    });
}
*/
module.exports.login = login;
module.exports.registerUser = registerUser;

module.exports.setup = function (ccID, ch, cb) {
    if (ch && ccID) {
        console.log(TAG, "user manager properly configured");
        chaincodeID = ccID;
        chain = ch;
        cb(null, null);
    } else {
        console.error(TAG, "user manager requires all of its setup parameters to function")
        cb("user manager requires all of its setup parameters to function", null);
    }
};
