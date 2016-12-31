# Commercial Paper Demo

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/IBM-Blockchain/cp-web.git)

## Description
This application is a demonstration of how a commercial paper trading network might be implemented
on IBM Blockchain.  The components of the demo are:

* An interface for creating new users on the network.
* An interface for creating new commercial papers to trade.
* A Trade Center for buying and selling existing trades.
* A special interface just for auditors of the network to examine trades

## Getting Started

1. Deploy the demo to your [IBM Bluemix](https://www.bluemix.net/) account using the button above.

##### OR

You need to create a blockchain network to run this demo. 

**You have two options:** 

- **Option 1:** Create a Bluemix IBM Blockchain network - [instructions](./docs/use_bluemix_hyperledger.md)

1. Clone this repository.
2. Create an instance of the IBM Blockchain service in the Bluemix catalog.
3. Copy the credentials from the service into the file 'mycreds.json'.
4. Make sure the key/value store only has values for your current network (See below).
5. Run these commands in the cloned directory:

```shell
npm install
gulp
```

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
- **Option 2:** Use a locally hosted Hyperledger Network (such as one from docker-compose) - [instructions](./docs/use_local_hyperledger.md)

1. Clone this repository.
2. Create an instance of the IBM Blockchain on your local Hyperledger network.
3. Copy the credentials from the service into the file 'mycreds.json'.
4. Make sure the key/value store only has values for your current network (See below).
5. In users.js, change the ```affiliation``` in the registration request on **line 89**.  
   Depending upon your registrar user's affiliation, it should look something like this:
```
 var registrationRequest = {
                enrollmentID: enrollID,
                affiliation: 'institution_a'    //change from "group1" to registrar's affiliation
            };
```
6. Since the peers on the local network are listening using http, you need to make a few changes (see below).
  - In [ws_part2.js](./utils/ws_part2.js), 
    1. add ```var http = require('http');```
    2. change ```https``` to ```http``` on **line 146**. It should look like this:
    ```var request = http.request(options, function (resp) {```
    3. change ```https``` to ```http``` on **line 215**. It should look like this:
    ```var request = http.request(options, function (resp) {```
  - In [app.js](./app.js),
    1. change ```https``` to ```http``` on **line 304**. It should look like this:
    ```var request = http.request(options, function (resp) {```
    2. change ```grpcs``` headers to ```grpc``` on **line 137** and **line 142**. It should look like this:  
       ```peerURLs.push('grpc://' + peers[i].discovery_host + ':' + peers[i].discovery_port);```
       and 
       ```caURL = 'grpc://' + ca[i].url;```
7. Run these commands in the cloned directory:

```shell
npm install
gulp
```
To debug the code, run these commands:

```shell
npm install
DEBUG=hfc GRPC_TRACE=all gulp
```


## Using the Demo
1. Register some users using the registration form on the login page.
2. Save the credentials that are created for the users you register.  They appear just above the
registration form.
3. Use the credentials to log in to the application.  The UI you see will be determined by the role
that was assigned to each user.
4. Open the 'CREATE' tab to create new trades.
5. Open the 'TRADE' tab to participate in your commercial paper trading network.
6. Open the 'AUDIT' tab to view all of the trades on the network.

## Notes on the Key Value Store

When the fabric SDK is used to enroll users, the enrollment certificate for the user is downloaded from the CA and the
secret for the user you enrolled is invalidated.  Basically, nobody will be able to enroll the user again.  By default,
the SDK will download this certificate into a local key value store.  So, the only apps that will be able to use the
enrolled users are those that have access to the enrollment certificate.

#### Why is this a problem?

When this demo is initialized, it attempts to enroll one of the blockchain networks registrar users, `WebAppAdmin`, 
downloading the enrollment certificate for that user into the demo applications filesystem on Bluemix.  This will
prevent other demos or apps on that network from being able to use the `WebAppAdmin` user.  The message to take away
from all of this is that you should only use this demo on it's own blockchain network, for now.  

## Limitations

* Passwords don't mean anything in the demo.  We're working on it.  You still need to register users to interact with
the demo, but you can use anything in the password field to log in.

* Having the string 'auditor' in the username will cause the user to be registered as an auditor, while anything else
will register the user as a regular user, meaning that they can create and trade paper.  These limitations
will be fixed in future versions of the demo.

* Nothing happens when papers mature.

* For now, the permissions for auditors and regular users are only enforced within the web application.
An updated user architecture will be coming to the
fabric to fix this in the future.

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

### Troubleshooting
Solutions for common problems with running this demo locally are included below.

#### `npm install` fails with `node-gyp` errors in the output
First, make sure you are running this demo with the latest LTS versions of Node.js and NPM.  You can check your versions of these two tools using these commands:

```bash
$ node -v
v6.9.1

$ npm -v
3.10.8
```

Second, this demo uses modules that must be compiled, which requires you to have certain build tools on your machine.  If you are running on Windows, you should install the package here:

https://github.com/felixrieseberg/windows-build-tools

Finally, delete the node modules folder and give `npm install` another try.

#### `Error creating deployment archive`

Do your logs have a message similar to this one?
```text
chain_setup.js Failed to deploy chaincode: EventTransactionError {
  error:
   Error: Error creating deployment archive [/tmp/deployment-package.tar.gz]: Error: Error on fs.createWriteStream
       at Error (native)
       at C:\Users\IBM_ADMIN\Documents\obc\git\demos\cp-web\node_modules\hfc\lib\hfc.js:1411:31
       at WriteStream.<anonymous> (C:\Users\IBM_ADMIN\Documents\obc\git\demos\cp-web\node_modules\hfc\lib\sdk_util.js:163:16)
       at emitOne (events.js:101:20)
       at WriteStream.emit (events.js:188:7)
       at WriteStream.<anonymous> (fs.js:2109:12)
       at FSReqWrap.oncomplete (fs.js:123:15),
  msg: 'Error: Error creating deployment archive [/tmp/deployment-package.tar.gz]: Error: Error on fs.createWriteStream' }
chain_setup.js chaincode deployment failed: undefined
```

This often happens because the `/tmp` directory is not present on your machine. `hfc` uses this folder to temporarily store and package this demo's chaincode for deployment.  Create the directory, and you should be fine.  This directory will be `C:\tmp` on Windows machines.