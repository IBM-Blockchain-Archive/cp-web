# Commercial Paper Demo

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/IBM-Blockchain/cp-web.git)

## Description
This application is a demonstration of how a commercial paper trading network might be implemented
on IBM Blockchain.  The components of the demo are:

* An interface for creating new users on the network.
* An interface for creating new commercial papers to trade.
* A Trade Center for buying and selling existing trades.
* A special interface just for auditors of the network to examine all trades

## Getting Started

1. Deploy the demo to your [IBM Bluemix](https://www.bluemix.net/) account using the button above.

##### OR

1. Clone this repository.
2. Create an instance of the IBM Blockchain service in the Bluemix catalog.
3. Copy the credentials from the service into the file 'my_creds.json'
4. Run these commands in the cloned directory:


    > npm install
    > gulp

These credentials can be obtained from the "Service Credentials" tab of the Bluemix service. They are
in the form:

```json
    {
      "credentials": {
        "peers": [
          {
            "discovery_host": "169.53.62.121",
            "discovery_port": "40275",
            "api_host": "169.53.62.121",
            "api_port": "40276",
            "type": "peer",
            "network_id": "4b21f2f9-4d10-4946-a0df-f91ac09dbc03",
            "id": "4b21f2f9-4d10-4946-a0df-f91ac09dbc03_vp1",
            "api_url": "http://169.53.62.121:40276"
          }
        ],
        "users": [
          {
            "username": "user_type0_b7c7a1e545",
            "secret": "89ce33e4e6"
          }
        ]
      }
    }
```

## Using the Demo

1. Open the file user_creds.json and pick a user.
2. Use the user's credentials to log in to the application.  The UI you see will be determined by the role
that was assigned to each user.
3. Visit the Create and Trade panels in order to interact with the commercial paper network.  Auditors
can only view existing trades, using the Audit panel.

## Privacy Notice

This web application includes code to track deployments to [IBM Bluemix](https://www.bluemix.net/) and other Cloud Foundry platforms. The following information is sent to a [Deployment Tracker](https://github.com/cloudant-labs/deployment-tracker) service on each deployment:

* Application Name (`application_name`)
* Space ID (`space_id`)
* Application Version (`application_version`)
* Application URIs (`application_uris`)

This data is collected from the `VCAP_APPLICATION` environment variable in IBM Bluemix and other Cloud Foundry platforms. This data is used by IBM to track metrics around deployments of sample applications to IBM Bluemix to measure the usefulness of our examples, so that we can continuously improve the content we offer to you. Only deployments of sample applications that include code to ping the Deployment Tracker service will be tracked.

### Disabling Deployment Tracking

Deployment tracking can be disabled by deleting the following code in app.js:
```javascript
// Track the application deployments
require("cf-deployment-tracker-client").track();
```
