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
var aux     = require("./site_aux.js");
var rest    = require("../utils/rest.js");
var creds	= require("../user_creds.json");

// ============================================================================================================================
// Home
// ============================================================================================================================
router.route("/").get(function(req, res){
	check_login(res, req);
	res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}} );
});

router.route("/home").get(function(req, res){
	check_login(res, req);
	res.redirect("/trade");
});
router.route("/create").get(function(req, res){
	check_login(res, req);
	res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}} );
});
router.route("/trade").get(function(req, res){
	check_login(res, req);
	res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}} );
});
router.route("/audit").get(function(req, res){
	check_login(res, req);
	res.render('part2', {title: 'Commercial Paper Demo', bag: {setup: setup, e: process.error, session: req.session}} );
});

router.route("/login").get(function(req, res){
	res.render('login', {title: 'Login', bag: {setup: setup, e: process.error, session: req.session}} );
});

router.route("/logout").get(function(req, res){
	req.session.destroy();
	res.redirect("/login");
});

router.route("/:page").post(function(req, res){
	req.session.error_msg = 'Invalid username or password';
	
	for(var i in creds){
		if(creds[i].username == req.body.username){
			if(creds[i].password == req.body.password){
				console.log('user has logged in', req.body.username);
				req.session.username = req.body.username;
				req.session.error_msg = null;

				// Roles are used to control access to various UI elements
				if(creds[i].role) {
					console.log("user has specific role:", creds[i].role);
					req.session.user_role = creds[i].role;
				} else {
					console.log("user role not specified, assuming:", "user");
					req.session.user_role = "user";
				}

				// Redirect to the appropriate UI based on role
				if(req.session.user_role.toUpperCase() === 'auditor'.toUpperCase()) {
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



function check_login(res, req){
	if(!req.session.username || req.session.username == ''){
		console.log('! not logged in, redirecting to login');
		res.redirect('/login');
	}
}