# Use Local Hyperledger Network

## Creating a Local Hyperledger Network

It's easy to stand up a local hyperledger network using docker compose.

1. Follow the docker compose [Setup Instructions](https://hub.docker.com/r/ibmblockchain/fabric-peer).
1. Make sure your network is alive and reachable by testing the HTTP `/chain` endpoint served up by your peer(s). You can do this using your browser.
  - If you are running Windows with docker-toolbox then click [http://192.168.99.100:7050/chain](http://192.168.99.100:7050/chain)
	- If you are running Linux/OS X/Windows 10 with native docker then click [http://localhost:7050/chain](http://localhost:7050/chain)
	- If you changed the default port for peer 0 then you will need to edit the URL above to use that port instead of `7050`.
1. You should see a response like:

	```json
	{
		"height": 1,
		"currentBlockHash": "lJ5dfqGBmhpkn1yHgbpbLnK9GEzrzsAnCm0AJZCIr0GaYznWDCt7j9yC09fGUe2MNXS+HEooKBbajHb+T40kIg==",
		"previousBlockHash": "UYTfnosVy6PqW59Gs4roQTLZ5av/t8sMrkWDKetAwFzoueZ3SkIcW6qPVLQPHuxCJO17AxLYsjzmYNN1fNtwFg=="
	}
	```

	- It will not be identical, but as long as you see some JSON response things are good and you can continue
	- If you get a timeout or some other error message then your network is not yet running or you are not entering the correct URL.

## Running Commercial Paper

The network is all setup. 

Next we need to configure the cp-web app to connect to the local peer(s).
This is done by editing the `mycreds.json` file which lives in the root of the cp-web app.

All we must do is edit the file with information about your network.

You may see other example JSON files that include much more information. 
Those extra fields are either legacy or simply extra. 
You only need to set the fields that are in the sample below:

__Sample mycreds.json__

```js
{
  "credentials": {
    "peers": [
      {
        "discovery_host": "192.168.99.100",    //replace with your hostname or ip of a peer
        "discovery_port": 7051,                //replace with your grpc port
        "api_host": "192.168.99.100",          //replace with your hostname or ip of a peer
        "api_port_tls": 7050,                  //replace with your rest port
        "api_port": 7050,                      //replace with your rest port
        "type": "peer",
        "id": "vp0"                            //unique name to identify peer (anything you want)
      }
    ],
    "ca": {
      "sub-ca": {
        "url": "192.168.99.100:7054",          //replace with your hostname or ip of ca with the port
        "discovery_host": "192.168.99.100",    //replace with your hostname or ip of can
        "discovery_port": 7054,                //replace with your grpc port
        "type": "ca",
        "newUsersObj": [
          {
            "enrollId": "WebAppAdmin",         //Registrar
            "enrollSecret": "DJY27pEnl16d",    //Registrar secret
            "group": "1",                      //Registrar group
            "affiliation": "institution_a",    //Registrar affiliation
            "username": "WebAppAdmin",         //Registrar username
            "secret": "DJY27pEnl16d"           //Registrar secret
          }
        ]
      }
    },
    "users": [
      {
        "username": "WebAppAdmin",
        "secret": "DJY27pEnl16d",
        "enrollId": "WebAppAdmin",
        "enrollSecret": "DJY27pEnl16d"
      }
    ]
  }
}
```

Remove any comments in your json file

Note that only one user (Registrar) is added to the `users` section because cp-web allows you to create new users. 
However, you are welcome to add new users by referring to [Fabric's documentation](https://github.com/hyperledger/fabric/blob/v0.6/membersrvc/membersrvc.yaml)

You can omit the field `api_port_tls` if the network does not support TLS. 
The default docker-compose example does not support TLS. 
Once you have edited `mycreds.json` you are ready to run cp-web. 

1. Continue where you left off in [cp-web](../README.md).
