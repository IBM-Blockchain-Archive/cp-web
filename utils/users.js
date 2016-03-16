/**
 * Created by davery on 3/16/2016.
 */
"use strict";

module.exports = function parseUsers(user_list, service_list) {
    // Separate the user credentials into lists based on the user role
    var user_creds = [];
    var auditor_creds = [];
    for (var i = 0; i < user_list.length; i++) {
        var current = user_list[i];

        if (!current.role || current.role === "user") {
            user_creds.push(current);
        } else if (current.role === "auditor") {
            auditor_creds.push(current);
        } else {
            var msg = util.format("Skipped user '%s': role '%s' is not defined.", current.username, current.role);
            console.log(msg);
        }
    }

    console.log("Merging the service and user_creds.json users");
    // User tags from blockchain service
    var auditor_tag = "type4";
    var user_tag = "type0";
    // (HACK) User tags from the interconnect demo
    var ict_auditor_tag = "auditor";
    var ict_user_tag = "company";

    var aliased_users = [];
    var vcap_ind = 0, user_ind = 0, auditor_ind = 0;
    var user_logged = false, auditor_logged = false;
    var unrecognized = [];
    while (vcap_ind < service_list.length && (user_ind < user_creds.length || auditor_ind < auditor_creds.length)) {

        // Combine the users!
        var new_user = {
            username: service_list[vcap_ind].username,
            secret: service_list[vcap_ind].secret,
            name: "",
            password: "",
            role: ""
        };

        // Check for auditors
        if (new_user.username.toLowerCase().indexOf(auditor_tag) > -1) {

            // Can't make a user if we don't have enough aliases
            if (auditor_ind < auditor_creds.length) {

                // Add the use user to the list
                new_user.name = auditor_creds[auditor_ind].username;
                new_user.password = auditor_creds[auditor_ind].password;
                new_user.role = "auditor";
                aliased_users.push(new_user);
                auditor_ind++;
            } else {
                if (!auditor_logged) {
                    console.log("Didn't provide enough auditors to cover type4 service credentials");
                    auditor_logged = true;
                }
            }
        } else if (new_user.username.toLowerCase().indexOf(user_tag) > -1) {

            // Must be a regular user
            if (user_ind < user_creds.length) {
                // Add the use user to the list
                new_user.name = user_creds[user_ind].username;
                new_user.password = user_creds[user_ind].password;
                new_user.role = "user";
                aliased_users.push(new_user);
                user_ind++;
            } else {
                if (!user_logged) {
                    console.log("Didn't provide enough users to cover service credentials");
                    user_logged = true;
                }
            }
        } else {
            // (HACK) Untagged usernames probably means these are the interconnect users
            // company[1-45] will be the users
            // auditor[1-5] should be the auditors
            if (new_user.username.toLowerCase().indexOf(ict_auditor_tag) > -1) {
                // Can't make a user if we don't have enough aliases
                if (auditor_ind < auditor_creds.length) {

                    // Add the use user to the list
                    new_user.name = auditor_creds[auditor_ind].username;
                    new_user.password = auditor_creds[auditor_ind].password;
                    new_user.role = "auditor";
                    aliased_users.push(new_user);
                    auditor_ind++;
                } else {
                    if (!user_logged) {
                        console.log("Didn't provide enough auditors to cover auditor service credentials");
                        user_logged = true;
                    }
                }
            } else if (new_user.username.toLowerCase().indexOf(ict_user_tag) > -1) {
                // Must be a regular user
                if (user_ind < user_creds.length) {
                    // Add the use user to the list
                    new_user.name = user_creds[user_ind].username;
                    new_user.password = user_creds[user_ind].password;
                    new_user.role = "user";
                    aliased_users.push(new_user);
                    user_ind++;
                } else {
                    if (!user_logged) {
                        console.log("Didn't provide enough users to cover service credentials");
                        user_logged = true;
                    }
                }
            } else {

                // No idea where this user came from
                unrecognized.push(new_user.username);
            }
        }

        vcap_ind++;
    }
    if (unrecognized.length > 0) {
        console.log("unrecognized users:", unrecognized);
    }

    return aliased_users;
};