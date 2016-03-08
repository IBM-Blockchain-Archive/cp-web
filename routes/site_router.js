/* global __dirname */
"use strict";
/* global process */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *   Dale Avery
 *******************************************************************************/
var express = require('express');
var router = express.Router();
var fs = require("fs");
var setup = require('../setup.js');
var path = require('path');
var util = require('util');

// Load our modules.
var rest = require("../utils/rest.js");
var creds = require("../user_creds.json");

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
    res.render('login', {title: 'Login', bag: {setup: setup, e: process.error, session: req.session}});
});

router.route("/logout").get(function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});

router.route("/:page").post(function (req, res) {
    req.session.error_msg = 'Invalid username or password';

    var msg = util.format("Checking login: %s | %s",
        req.body.username, req.body.password);
    console.log(msg);

    for (var i in creds) {
        var current = creds[i];

        console.log("Checking against user:", JSON.stringify(current));

        // Use the friendly name and password to log in to the app
        if (current.name === req.body.username) {
            if (current.password && current.password === req.body.password) {
                var msg = util.format("User %s has logged in as network user %s",
                    current.name, current.username);
                console.log(msg);
                req.session.username = current.username;
                req.session.name = current.name;
                req.session.role = current.role;
                req.session.error_msg = null;

                // Redirect to the appropriate UI based on role
                if (req.session.role.toLowerCase() === 'auditor'.toLowerCase()) {
                    res.redirect('/audit');
                } else {
                    res.redirect('/trade');
                }
                return;
            }
            break;
        }
    }
    res.redirect('/login');
});

module.exports = router;

/**
 * Have app.js pass in credentials instead of checking the environment.  This
 * lets us pass hardcoded credentials through the app whenever we aren't running
 * on Bluemix.
 * @param vcap_credentials The credentials to extract the users.
 */
module.exports.setupCreds = function setupCreds(vcap_users) {
    if (vcap_users != null) {
        console.log("Loading credentials into router");
        creds = vcap_users;
    } else {
        console.log("Credentials not given to router.  Using user_creds.json");
    }
};

function check_login(res, req) {
    if (!req.session.username || req.session.username == '') {
        console.log('! not logged in, redirecting to login');
        res.redirect('/login');
    }
}