'use strict';
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * Handles the site routing and also handles the calls for user registration
 * and logging in.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *   Dale Avery
 *******************************************************************************/
var express = require('express');
var router = express.Router();
var setup = require('../setup.js');

// Load our modules.
var user_manager = require('../utils/users');
var chaincode_ops;

// Use tags to make logs easier to find
var TAG = "router:";

// ============================================================================================================================
// Home
// ============================================================================================================================
router.route("/").get(function (req, res) {
    check_login(res, req);
    res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}});
});

router.route("/home").get(function (req, res) {
    check_login(res, req);
    res.redirect("/trade");
});
router.route("/create").get(function (req, res) {
    check_login(res, req);
    res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}});
});
router.route("/trade").get(function (req, res) {
    check_login(res, req);
    res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}});
});
router.route("/audit").get(function (req, res) {
    check_login(res, req);
    res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}});
});

router.route("/login").get(function (req, res) {
    res.render('login', {title: 'Login/Register', bag: {setup: setup, e: process.error, session: req.session}});
});

router.route("/logout").get(function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});

router.route("/:page").post(function (req, res) {
    if (req.body.password) {
        login(req, res);
    } else {
        register(req, res);
    }
});

module.exports = router;

module.exports.setup_helpers = function(configured_chaincode_ops) {
    if(!configured_chaincode_ops)
        throw new Error('Router needs a chaincode helper in order to function');
    chaincode_ops = configured_chaincode_ops;
};

function check_login(res, req) {
    if (!req.session.username || req.session.username === '') {
        console.log(TAG, '! not logged in, redirecting to enrollUser');
        res.redirect('/login');
    }
}

/**
 * Handles form posts for registering new users.
 * @param req The request containing the registration form data.
 * @param res The response.
 */
function register(req, res) {
    console.log('site_router.js register() - fired');
    req.session.reg_error_msg = "Registration failed";
    req.session.error_msg = null;

    // Determine the user's role from the username, for now
    console.log(TAG, "Validating username and assigning role for:", req.body.username);
    var role = 1;
    if (req.body.username.toLowerCase().indexOf('auditor') > -1) {
        role = 3;
    }

    user_manager.registerUser(req.body.username, function (err, creds) {
        //console.log('! do i make it here?');
        if (err) {
            req.session.reg_error_msg = "Failed to register user:" + err.message;
            req.session.registration = null;
            console.error(TAG, req.session.reg_error_msg);
        } else {
            console.log(TAG, "Registered user:", JSON.stringify(creds));
            req.session.registration = "Username: " + creds.id + "\nPassword: " + creds.secret;
            req.session.reg_error_msg = null;
        }
        res.redirect('/login');
    });
}

/**
 * Handles form posts for enrollUser requests.
 * @param req The request containing the enrollUser form data.
 * @param res The response.
 */
function login(req, res) {
    console.log('site_router.js enrollUser() - fired');
    req.session.error_msg = 'Invalid username or password';
    req.session.reg_error_msg = null;

    // Registering the user against a peer can serve as a enrollUser checker, for now
    console.log(TAG, "attempting enrollUser for:", req.body.username);
    user_manager.enrollUser(req.body.username, req.body.password, function (err) {
        if (err) {
            console.error(TAG, "User enrollUser failed:", err.message);
            res.redirect('/login');
        } else {
            console.log(TAG, "User enrollUser successful:", req.body.username);

            // TODO Need to create the user account in here somewhere.
            chaincode_ops.createCompany(req.body.username, function(err) {
                if(err) {
                    console.error(TAG, 'failed to initialize user account:', err.message);
                    // TODO set an error and return to the login screen
                    res.redirect('/login');
                    return;
                }

                // Determine the user's role and enrollUser by adding the user info to the session.
                if (req.body.username.toLowerCase().indexOf('auditor') > -1) {
                    req.session.role = 'auditor';
                } else {
                    req.session.role = 'user';
                }
                req.session.username = req.body.username;
                req.session.name = req.body.username;
                req.session.error_msg = null;

                // Redirect to the appropriate UI based on role
                if (req.session.role.toLowerCase() === 'auditor'.toLowerCase()) {
                    res.redirect('/audit');
                } else {
                    res.redirect('/trade');
                }
            });
        }
    });
}