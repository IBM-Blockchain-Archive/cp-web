/**
 * Copyright 2015 IBM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
*/
/**
 * Licensed Materials - Property of IBM
 * © Copyright IBM Corp. 2015
 */
var connector = require('../..');
var assert = require('assert');
var test = require('tape');

var OBCCAConnector = require('../..').OBCCAConnector;
var dataSource = {};


test('Test #initialize Method', function(t) {
    t.plan(1);  
    
    var settings = {
        host: "localhost",
        port: 50051
    };
    dataSource.settings = settings;
    connector.initialize(dataSource);
    
    t.equal(dataSource.connector instanceof OBCCAConnector, true, 'should be instance of OBCCAConnector');
    
 
});


var testUser = {
    identity: "testUser"+Date.now(),
    role: 1
};

var registeredUser;

test('Register User',function(t){
    t.plan(1);
    
    dataSource.connector.registerUser(testUser,function(err,response){
        
        if (err)
        {
            t.fail('registerUser failed: ' + err);
        }
        else
        {
            registeredUser = response;
            t.pass('should return token');
        }
        
    });
        
});

test('Register Duplicate User',function(t){
    t.plan(1);
    
    dataSource.connector.registerUser(testUser,function(err,token){
        
        if (err)
        {
            t.pass('should not be able to register user twice');
        }
        else
        {
            t.fail('should not be able to register user twice');
        }
        
    });
    
});

test('Get ECA Root Certificate',function(t){
    t.plan(1);
    
    dataSource.connector.getECACertificate(function(){
        t.pass('retrieved ECA root certificate');
    })
    
});

test('Get Enrollment Certificate From ECA',function(t){
    t.plan(1);
    
    dataSource.connector.getEnrollmentCertificateFromECA({identity: registeredUser.identity,token: registeredUser.token},function(){
        t.pass('retrieved enrollment certficate');
    })
    
});



test('Loopback integration', function (t) {

    t.plan(2);


    var dsOptions = {
        connector: require("../.."),
        host: "localhost",
        port: 50051
    };

    var DataSource = require('loopback-datasource-juggler').DataSource;

    var ds = new DataSource(dsOptions);
    
    //get models
    var model1 = ds.getModel('RegisterUserRequest');
    
    if (model1)
    {
        t.pass('successfully registered RegisterUserRequest model');
    }
    else
    {
        t.fail('failed to register RegisterUserRequest model');
    };
    
    var model2 = ds.getModel('RegisterUserResponse');
    
    if (model2)
    {
        t.pass('successfully registered RegisterUserResponse model');
    }
    else
    {
        t.fail('failed to register RegisterUserResponse model');
    };
    

})

