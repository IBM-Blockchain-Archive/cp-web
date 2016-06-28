// Licensed under the Apache 2.0 License. See footer for details.

'use strict';

var restler = require('restler'),
    path = require('path');

function track() {
    var pkg = require(path.join(path.dirname(module.parent.filename), 'package.json')),
        vcapApplication;

    if (process.env.VCAP_APPLICATION) {
        vcapApplication = JSON.parse(process.env.VCAP_APPLICATION);
    }

    if (vcapApplication) {
        var event = {
            date_sent: new Date().toJSON()
        };
        if (pkg.version) {
            event.code_version = pkg.version;
        }
        if (pkg.repository && pkg.repository.url) {
            event.repository_url = pkg.repository.url;
        }
        if (vcapApplication.application_name) {
            event.application_name = vcapApplication.application_name;
        }
        if (vcapApplication.space_id) {
            event.space_id = vcapApplication.space_id;
        }
        if (vcapApplication.application_version) {
            event.application_version = vcapApplication.application_version;
        }
        if (vcapApplication.application_uris) {
            event.application_uris = vcapApplication.application_uris;
        }

        var url = 'https://deployment-tracker.mybluemix.net/api/v1/track';
        restler.postJson(url, event).on('complete', function (data) {
            console.log('Uploaded stats', data);
        });
    }
}

module.exports.track = track;
