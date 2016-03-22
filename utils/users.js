/**
 * Created by davery on 3/16/2016.
 */
"use strict";
// This connector let's us register users against a CA
var connector = require('./loopback-connector-obcca');
var dataSource = {};

var roles = {
    auditor: 4,
    user: 1
};

module.exports.registerUsers = function registerUsers(user_list, ca_host, ca_port, cb) {
    // Separate the user credentials into lists based on the user role
    var user_creds = [];
    var auditor_creds = [];
    for (var i = 0; i < user_list.length; i++) {
        var current = user_list[i];

        if (!current.role || current.role === "user") {
            current.role = "user"; // Make sure everyone has an explicit role
            user_creds.push(current);
        } else if (current.role === "auditor") {
            auditor_creds.push(current);
        } else {
            var msg = util.format("Skipped user '%s': role '%s' is not defined.", current.username, current.role);
            console.log(msg);
        }
    }

    // Register users against the CA
    var processed = 0;
    var all_users = auditor_creds.concat(user_creds);
    var aliased_users = [];     // User's who have been newly registered against the CA, register with peers
    for (var user in all_users) {
        var current = all_users[user];

        var role = roles[current.role];
        registerUser(current.username, current.password, role, current.role, ca_host, ca_port, function (err, user) {
            if (err) {
                // Just eat errors until this user login process is more developed
                console.log("Trouble registering user:", current.username, err.message);
                if (++processed == all_users.length) {
                    cb(null, aliased_users);
                }
            }
            
            aliased_users.push(user);
            if (++processed == all_users.length) {
                cb(null, aliased_users);
            }
        })
    }
};

function registerUser(username, password, role, role_name, ca_host, ca_port, cb) {
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

    console.log("Registering user against CA:", JSON.stringify(user));
    dataSource.connector.registerUser(user, function (err, response) {
        if (err) {
            console.error("RegisterUser failed:", username, err.message);
            // Pass up a user, in case the error was that they were already registered
            var unaliased_user = {
                username: username,
                name: username,
                password: password,
                role: role_name
            };
            cb(err, unaliased_user);
        } else {
            console.log("RegisterUser succeeded:", JSON.stringify(response));
            // Send the response (username and secret) to the callback
            var aliased_user = {
                username: username,
                name: response.username,
                password: password,
                secret: response.token,
                role: role_name
            };
            cb(null, aliased_user);
        }
    });
}