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
var TAG = 'router:';

// ============================================================================================================================
// Home
// ============================================================================================================================
router.get('/', isAuthenticated, function (req, res) {
    res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}});
});

router.get('/home', isAuthenticated, function (req, res) {
    res.redirect('/trade');
});
router.get('/create', isAuthenticated, function (req, res) {
    res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}});
});
router.get('/trade', isAuthenticated, function (req, res) {
    res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}});
});
router.get('/audit', isAuthenticated, function (req, res) {
    res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}});
});

router.get('/login', function (req, res) {
    res.render('login', {title: 'Enroll/Register', bag: {setup: setup, e: process.error, session: req.session}});
});

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');
});

router.post('/:page', function (req, res) {
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

function isAuthenticated(req, res, next) {
    if (!req.session.username || req.session.username === '') {
        console.log(TAG, '! not logged in, redirecting to login');
        return res.redirect('/login');
    }

    console.log(TAG, 'user is logged in');
    next();
}

/**
 * Handles form posts for registering new users.
 * @param req The request containing the registration form data.
 * @param res The response.
 */
function register(req, res) {
    console.log('site_router.js register() - fired');
    req.session.reg_error_msg = 'Registration failed';
    req.session.error_msg = null;

    // Determine the user's role from the username, for now
    console.log(TAG, 'Validating username and assigning role for:', req.body.username);
    var role = 1;
    if (req.body.username.toLowerCase().indexOf('auditor') > -1) {
        role = 3;
    }

    user_manager.registerUser(req.body.username, function (err, creds) {
        //console.log('! do i make it here?');
        if (err) {
            req.session.reg_error_msg = 'Failed to register user:' + err.message;
            req.session.registration = null;
            console.error(TAG, req.session.reg_error_msg);
        } else {
            console.log(TAG, 'Registered user:', JSON.stringify(creds));
            req.session.registration = 'Enroll ID: ' + creds.id + '  Secret: ' + creds.secret;
            req.session.reg_error_msg = null;
        }
        res.redirect('/login');
    });
}

/**
 * Handles form posts for enrollment requests.
 * @param req The request containing the enroll form data.
 * @param res The response.
 */
function login(req, res) {
    console.log('site_router.js login() - fired');
    req.session.error_msg = 'Invalid username or password';
    req.session.reg_error_msg = null;

    // Registering the user against a peer can serve as a login checker, for now
    console.log(TAG, 'attempting login for:', req.body.username);
    user_manager.enrollUser(req.body.username, req.body.password, function (err) {
        if (err) {
            console.error(TAG, 'User enrollment failed:', err.message);
            return res.redirect('/login');
        } else {
            console.log(TAG, 'User enrollment successful:', req.body.username);

            // Go ahead and create an 'account' for this ID in the chaincode
            chaincode_ops.createCompany(req.body.username, function(err) {
                if(err) {
                    console.error(TAG, 'failed to initialize user account:', err.message);
                    // TODO set an error and return to the login screen
                    return res.redirect('/login');
                }

                // Determine the user's role and login by adding the user info to the session.
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