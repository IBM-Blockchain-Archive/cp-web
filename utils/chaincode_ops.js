'use strict';
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved.
 *
 * This module provides wrappers for the operations on chaincode that this demo
 * needs to perform.
 *
 * Contributors:
 *   Dale Avery - Initial implementation
 *
 * Created by davery on 11/8/2016.
 *******************************************************************************/

// For logging
var TAG = 'chaincode_ops:';

function CPChaincode(chain, chaincodeID) {
    if(!(chain && chaincodeID))
        throw new Error('Cannot create chaincode helper without both a chain object and the chaincode ID!');
    this.chain = chain;
    this.chaincodeID = chaincodeID;
}

CPChaincode.prototype.createCompany = function (enrollID, cb) {

    // Submit the invoke transaction as the given user.
    this.chain.getMember(enrollID, function (getMemberError, usr) {
        if (getMemberError) {
            console.error(TAG, 'Failed to get ' + enrollID + ' member: ' + getMemberError.message);
            if (cb) cb(getMemberError);
        } else {
            console.log(TAG, 'Successfully got member: ' + enrollID);

            // Accounts will be named after the enrolled users
            var Request = {
                chaincodeID: this.chaincodeID,
                fcn: 'createAccount',
                args: [enrollID]
            };
            var invokeTx = usr.invoke(Request);
            invokeTx.on('submitted', function (results) {
                // Invoke transaction submitted successfully
                console.log(TAG, 'Successfully submitted chaincode invoke transaction:', results);
                if (cb) cb(null);
            });
            invokeTx.on('error', function (err) {
                // Invoke transaction submission failed
                console.error(TAG, 'Failed to submit chaincode invoke transaction:', err.message);
                if (cb) cb(err);
            });
        }
    });
};

module.exports.CPChaincode = CPChaincode;
