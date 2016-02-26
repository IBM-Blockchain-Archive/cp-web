// ==================================
// Part 2 - incoming messages, look for type
// ==================================
var ibc = {};
var chaincode = {};
var async = require('async');

module.exports.setup = function(sdk, cc){
	ibc = sdk;
	chaincode = cc;
};

module.exports.process_msg = function(ws, data){
	if(data.type == 'create'){
		console.log('its a create!');
		if(data.paper && data.paper.ticker){
			console.log('!', data.paper);
			chaincode.issueCommercialPaper([JSON.stringify(data.paper)], cb_invoked);				//create a new paper
		}
	}
	else if(data.type == 'get_papers'){
		console.log('get papers msg');
		chaincode.read('GetAllCPs', cb_got_papers);
	}
	else if(data.type == 'transfer_paper'){
		console.log('transfering msg', data.transfer);
		chaincode.transferPaper([JSON.stringify(data.transfer)]);
	}
	else if(data.type == 'chainstats'){
		console.log('chainstats msg');
		ibc.chain_stats(cb_chainstats);
	}
	else if(data.type == 'get_company'){
		console.log('get company msg');
		chaincode.query(['GetCompany', data.company], cb_got_company);
	}
	
	function cb_got_papers(e, papers){
		if(e != null){
			console.log('papers error', e);
		}
		else{
			console.log('papers', papers);
			sendMsg({msg: 'papers', papers: papers});
		}
	}
	
	function cb_got_company(e, company){
		if(e != null){
			console.log('company error', e);
		}
		else{
			console.log('company', company);
			sendMsg({msg: 'company', company: company});
		}
	}
	
	function cb_invoked(e, a){
		console.log('response: ', e, a);
	}
	
	//call back for getting the blockchain stats, lets get the block height now
	var chain_stats = {};
	function cb_chainstats(e, stats){
		chain_stats = stats;
		if(stats && stats.height){
			var list = [];
			for(var i = stats.height - 1; i >= 1; i--){										//create a list of heights we need
				list.push(i);
				if(list.length >= 8) break;
			}
			list.reverse();																//flip it so order is correct in UI
			console.log(list);
			async.eachLimit(list, 1, function(key, cb) {								//iter through each one, and send it
				ibc.block_stats(key, function(e, stats){
					if(e == null){
						stats.height = key;
						sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
					}
					cb(null);
				});
			}, function() {
			});
		}
	}

	//call bacak for getting a block's stats, lets send the chain/block stats
	function cb_blockstats(e, stats){
		if(chain_stats.height) stats.height = chain_stats.height - 1;
		sendMsg({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
	}
	
	//call back for getting open trades, lets send the trades
	function cb_got_trades(e, trades){
		if(e != null) console.log('error:', e);
		else {
			if(trades && trades.open_trades){
				sendMsg({msg: 'open_trades', open_trades: trades.open_trades});
			}
		}
	}

	//send a message, socket might be closed...
	function sendMsg(json){
		if(ws){
			try{
				ws.send(JSON.stringify(json));
			}
			catch(e){
				console.log('error ws', e);
			}
		}
	}
};
