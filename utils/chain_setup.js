/**
 * Created by davery on 11/8/2016.
 */

var TAG = 'chain_setup.js';
var hfc = require('hfc');

// Things that don't really need to change
var chain_name = 'cp_chaincode';
var chaincode_path = 'chain_code/';

module.exports.setupChain = function (keyValStoreDir, users, peerURLs, caURL, certificate, certificate_path, cb) {
    console.log(TAG, 'setting up chain object');
    var chain = hfc.newChain(chain_name);

    // The keyValStore will hold our user ECerts and TCerts, which we need to send transactions
    // as these users.
    console.log(TAG, 'creating keyValStore in:', keyValStoreDir);
    chain.setKeyValStore(hfc.newFileKeyValStore(keyValStoreDir));
    chain.setDeployWaitTime(80);
    chain.setECDSAModeForGRPC(true);

    // We need the WebAppAdmin user in order to register new users.
    var registrarID = 'WebAppAdmin';
    var registrarCredentials;
    for (var z in users) {
        if (users[z].enrollId === registrarID)
            registrarCredentials = users[z];
    }
    if (!registrarCredentials) {
        console.error(TAG, 'Registrar not found in user list:', JSON.stringify(users));
        cb(new Error('Could not locate a registrar user for the chain'));
    }

    // Setup the chain object
    configure_network(chain, peerURLs, caURL, registrarCredentials, certificate, function (err, registrar) {
        if (err) {
            console.error(TAG, 'couldn\'t configure the network');
            return cb(err);
        }

        console.log(TAG, 'using registrar to deploy chaincode');
        deploy(registrar, chaincode_path, certificate_path, function (err, chaincodeID) {
            if (err) {
                console.error(TAG, 'chaincode deployment failed:', err.message);
                return cb(err);
            }

            console.log(TAG, 'chaincode deployment successful');
            cb(null, chain, chaincodeID);
        });
    });
};

/**
 * Configure the chain with all network credentials it will need.  Also, set up a registrar for this
 * chain so that we can register new users in the user manager.
 *
 * @param chain A chain object from the hfc SDK.
 * @param peerURLs An array of peer URLs, ex. 'grpcs://vp0.blockchain.ibm.com'
 * @param caURL A URL for the membership service, ex. 'grpcs://ca.blockchain.ibm.com'
 * @param registrarCredentials The enrollID and enrollSecret for a registrar registered in the membership service.
 * @param certificate The certificate to connect to the peers and membership service.
 * @param cb A callback of the form: function(error, registrar_user)
 */
function configure_network(chain, peerURLs, caURL, registrarCredentials, certificate, cb) {
    console.log(TAG, 'configuring the blockchain network');

    console.log(TAG, 'Setting membership service url:', caURL);
    if (certificate) {
        console.log(TAG, 'Using certificate for membership service connection');
        chain.setMemberServicesUrl(caURL, {pem: certificate});
    }
    else {
        chain.setMemberServicesUrl(caURL);
    }

    console.log(TAG, 'setting peer urls:', peerURLs);
    if (certificate) console.log(TAG, 'using certificate for peer connections');
    for (var i in peerURLs) {
        if (certificate)
            chain.setMemberServicesUrl(peerURLs[i], {pem: certificate});
        else
            chain.setMemberServicesUrl(peerURLs[i]);
    }

    console.log(TAG, 'Getting registrar:', registrarCredentials.enrollId);
    chain.getMember(registrarCredentials.enrollId, function (err, WebAppAdmin) {
        if (err) {
            console.error(TAG, 'failed to get registrar:', err.message);
            cb(err);
        } else {
            console.log(TAG, 'successfully got registrar. Enrolling with secret:', registrarCredentials.enrollSecret);
            WebAppAdmin.enrollUser(registrarCredentials.enrollSecret, function (err, crypto) {
                if (err) {
                    console.error(TAG, 'failed to enroll registrar:', err.message);
                    return cb(err);
                }

                console.log(TAG, 'Successfully enrolled registrar');
                chain.setRegistrar(WebAppAdmin);
                cb(null, WebAppAdmin);
            });
        }
    });
}

/**
 * Deploys chaincode to the blockchain network. Calls back with the ID of the chaincode if deployment is successful.
 * @param enrolledUser The user to deploy chaincode as.
 * @param chaincode_path The path to the chaincode under $GOPATH/src
 * @param cert_path The path to the chaincode certificate in the peer's filesystem.
 * @param cb A callback of the form: function(error, chaincodeID)
 */
function deploy(enrolledUser, chaincode_path, cert_path, cb) {
    console.log(TAG, 'Deploying commercial paper chaincode as:', enrolledUser.name);

    process.env.GOPATH = __dirname;   //set the gopath to current dir and place chaincode inside src folder TODO move this?
    var deployRequest = {
        fcn: 'init',
        args: ['a', '100'],
        chaincodePath: chaincode_path,
        certificatePath: cert_path
    };
    var deployTx = enrolledUser.deploy(deployRequest);
    console.log(TAG, 'Deployment request:', JSON.stringify(deployRequest));

    deployTx.on('submitted', function (results) {
        console.log(TAG, 'Successfully submitted chaincode deploy transaction', results.chaincodeID); // TODO does the chaincode ID come back here?
    });

    deployTx.on('complete', function (results) {
        console.log(TAG, 'Deploy \'complete\'. Chaincode ID:', results.chaincodeID);
        cb(null, results.chaincodeID);
    });

    deployTx.on('error', function (err) {
        console.error(TAG, 'Failed to deploy chaincode:', err.message);
        cb(err);
    });
}