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
 *******************************************************************************/
var express = require('express');
var router = express.Router();
var fs = require("fs");
var setup = require('../setup.js');
var path = require('path');

// Load our modules.
var aux = require("./site_aux.js");
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

    for (var i in creds) {
        if (creds[i].username == req.body.username) {

            // Don't let type0's log in
            if (req.body.username.toLowerCase().indexOf("type0") > -1) {
                req.session.error_msg = 'Cannot log in as a Type0 user';
            } else {

                // This is the login for user_creds.json
                if (creds[i].password && creds[i].password == req.body.password) {
                    console.log('user has logged in', req.body.username);
                    req.session.username = req.body.username;
                    req.session.company = req.body.username;
                    req.session.error_msg = null;

                    // Roles are used to control access to various UI elements
                    if (creds[i].role) {
                        console.log("user has specific role:", creds[i].role);
                        req.session.user_role = creds[i].role;
                    } else {
                        console.log("user role not specified, assuming:", "user");
                        req.session.user_role = "user";
                    }

                    // Redirect to the appropriate UI based on role
                    if (req.session.user_role.toUpperCase() === 'auditor'.toUpperCase()) {
                        res.redirect('/audit');
                    } else {
                        res.redirect('/trade');
                    }
                    return;
                }

                // The login for the service-given user
                if (creds[i].secret && creds[i].secret == req.body.password) {
                    console.log('user has logged in', req.body.username);
                    req.session.username = req.body.username;
                    req.session.error_msg = null;

                    // Roles are used to control access to various UI elements
                    // Roles are a result of the type defined in the user name
                    if (req.body.username.toLowerCase().indexOf("type4") > -1) {
                        console.log("user role:", "auditor");
                        req.session.user_role = "auditor";
                    } else {
                        console.log("user role:", "user");
                        req.session.user_role = "user";
                    }

                    // Store which company this user maps to
                    req.session.company = mapToCompany(creds, req.session.username);

                    // Redirect to the appropriate UI based on role
                    if (req.session.user_role.toUpperCase() === 'auditor'.toUpperCase()) {
                        res.redirect('/audit');
                    } else {
                        res.redirect('/trade');
                    }
                    return;
                }
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

/**
 * Translates a given username from an obcca (user_typeX_nonsense) to the format "companyX" that
 * accounts are stored in in the chaincode.
 * TODO this is obviously not ideal and needs to be replaced once we have a better way
 * @param userList The full list of credentials from the CA.
 * @param user The username that we are trying to map.
 * @returns The "companyX" if the username was valid, null otherwise.
 */
function mapToCompany(userList, user) {
    "use strict";
    // Ignore type0 users, those should be peers, shouldn't be logged in anyway
    if (user.toLowerCase().indexOf("type0") > -1) {
        console.error("Cannot map Type0 user to account:", user);
        return null;
    }

    // Find the user's position in the list
    var type0s = 0;
    for (var i = 0; i < userList.length; i++) {
        // Count the number of type0's so we have an offset
        if (userList[i].username.toLowerCase().indexOf("type0") > -1)
            type0s++;

        if (userList[i].username.indexOf(user) > -1) {
            // Type0 users are peers, ignore them
            var name = "company" + (i - type0s + 1); // companies start at 1, not 0
            return name;
        }
    }
    return null;
}