# Commercial Paper Demo

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/IBM-Blockchain/cp-web.git)

## Description
This application is a demonstration of how a commercial paper trading network might be implemented
on IBM Blockchain.  The components of the demo are:

* An interface for creating new users on the network.
* An interface for creating new commercial papers to trade.
* A Trade Center for buying and selling existing trades.
* A special interface just for auditors of the network to examine trades

##### Versions and Supported Platforms
On November 9th, 2016, we released the IBM Blockchain Service v1.0 based on HyperLedger fabric v0.6.  All new networks created in bluemix will be this version.  Support of the v0.4.2.x Bluemix Service based on the 0.5.3 Hyperledger Fabric has been deprecated.  It is strongly recommended that if you have an existing network based on 0.5.3, you redeploy a new network and follow the instructions in the 2.0 branch.

- [CP-Web - Branch v2.0](https://github.com/ibm-blockchain/cp-web/tree/v2.0)
	- Works with Hyperledger fabric `v0.6-developer-preview`

If for some reason you need instructions for the v0.4.2+ level of the service, they are here, but support of these instructions is
best effort only.

- [CP-Web - Branch v1.0](https://github.com/ibm-blockchain/cp-web/tree/v1.0) (Deprecated)
	- Works with Hyperledger fabric `v0.5-developer-preview`
	- IBM Bluemix Blockchain Service `v0.4.2+`

## Getting Started

1. Deploy the demo to your [IBM Bluemix](https://www.bluemix.net/) account using this button [![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/IBM-Blockchain/cp-web.git)  

`OR`  

1. Deploy the app on my local machine, connecting to an IBM Blockchain network running in Bluemix  - [instructions](#manbluenetwork)


# <a name="manbluenetwork"></a>Deploy the CP-Web App locally and connect to an IBM Blockchain Network running in Bluemix:

1.  Follow these instructions to [Set up your environment for running the demos](https://github.com/ptippett/marbles/blob/break_out_common_sections/demo_prereqs)

1.  Clone the CP-Web app to your local system so you can run it here
To do this, run ```git clone http://gopkg.in/ibm-blockchain/cp-web.v2``` to clone the v2.0 branch to your local system.  

1.  Follow the instructions to [Set up a new bluemix network or grab credentials from an existing network](https://github.com/ptippett/marbles/blob/break_out_common_sections/create_blockchain_bluemix.md)


1. Make sure the key/value store only has values for your current network (See below).
1. Run these commands in the cloned directory (typically ```<git location>/cp-web```).
  1.  If you're running on windows, you need to install some additional dependencies.
    1.  Run ```npm install --global windows-build-tools``` to install the dependencies listed [here](https://github.com/felixrieseberg/windows-build-tools)
    1.  Verify you have a `c:\tmp` directory and create it if not.  `hfc` uses this folder to temporarily store and package this demo's chaincode for deployment.
  2. On linux, or after you've installed build tools on windows, then run  
     `npm install`  
     `gulp`  
     
1. If all goes well you should see this message in the console:
	
		--------------------------------- Server Up - localhost:3000 ------------------------------------
		
1. The app is already coded to auto deploy the chaincode.  You should see further message about it deploying.
 **[IMPORTANT]** You will need to wait about 60 seconds for the cc to fully deploy. The SDK will do the waiting for us by stalling our callback.
 
1. Once you see this message you are good to go: 

  `chain_setup.js Deployment request: {"fcn":"init","args":  ["a","100"],"chaincodePath":"chaincode/","certificatePath":"/certs/peer/cert.pem"}`  
  `chain_setup.js Successfully submitted chaincode deploy transaction 15b1c8e2c30a5a22fcdec456fa917332e5f070c75d3a7e73fd23500f2a4d80e4`  
  `chain_setup.js Will wait for 80 seconds after deployment for chaincode to startup`  
  `chain_setup.js Deploy 'complete'. Chaincode ID: 15b1c8e2c30a5a22fcdec456fa917332e5f070c75d3a7e73fd23500f2a4d80e4`  
  `user_manager: setup() called`  
  `------------------------------------------ Websocket Up ------------------------------------------`  

1. Continue by [using the CP-Web App](#use)

##<a name="use"></a> Using the CP Web App  
1. Register some users using the registration form on the login page.  If you installed the app on your local system, you can [log in here](http://localhost:3000).  
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

If you've installed new levels of node.js and npm, or want to try the install again, delete the node modules folder and give `npm install` another try.
