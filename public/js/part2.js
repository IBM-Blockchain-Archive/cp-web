/* global clear_blocks */
/* global formatMoney */
/* global in_array */
/* global new_block */
/* global formatDate */
/* global nDig */
/* global randStr */
/* global bag */
/* global $ */
var ws = {};
var user = {username: bag.session.username};
var valid_users = ["company1", "company2", "company3", "company4", "company5", "company6","company7","company8", "company9", "company10" ];
		
// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	if(user.username) $("#userField").html(user.username.toUpperCase() + ' ');
	//$("#tradesTable").tablesorter(); 

	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$("#submit").click(function(){
		if(user.username){
			var obj = 	{
							type: "create",
							paper: {
								ticker: escapeHtml($("input[name='ticker']").val()),
								par: Number($("select[name='par']").val()),
								qty: Number($("select[name='qty']").val()),
								discount: Number($("select[name='discount']").val()),
								maturity: Number($("select[name='maturity']").val()),
								owner: [],
								issuer: user.username,
								issueDate: Date.now().toString()
							}
						};
			if(obj.paper && obj.paper.ticker){
				obj.paper.ticker = obj.paper.ticker.toUpperCase();
				console.log('creating paper, sending', obj);
				ws.send(JSON.stringify(obj));
				$(".panel").hide();
				$("#tradePanel").show();
			}
		}
		return false;
	});

	$("#homeLink").click(function(){
		console.log('marbles:', bag.marbles);
	});
	
	$("#createLink").click(function(){
		$("input[name='name']").val('r' + randStr(6));
	});
	
	$("#tradeLink").click(function(){
		ws.send(JSON.stringify({type: "get_open_trades", v: 2}));
	});
	
	
	//login events
	$("#whoAmI").click(function(){													//drop down for login
		if($("#loginWrap").is(":visible")){
			$("#loginWrap").fadeOut();
		}
		else{
			$("#loginWrap").fadeIn();
		}
	});
	
	//trade events
	//build_trades([temp]);
	$(document).on("click", ".buyPaper", function(){
		if(user.username){
			console.log('trading...');
			var i = $(this).attr('trade_pos');

			var msg = 	{
							type: 'transfer_paper',
							transfer: {
								CUSIP: bag.papers[i].cusip,
								fromCompany: bag.papers[i].issuer,
								toCompany: user.username,
								quantity: 1
							}
						};
			console.log('sending', msg);
			ws.send(JSON.stringify(msg));
			$("#notificationPanel").animate({width:'toggle'});
		}
	});
});


// =================================================================================
// Helper Fun
// =================================================================================
function escapeHtml(str) {
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(str));
	return div.innerHTML;
};

// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	var connected = false;
	connect();
		
	function connect(){
		var wsUri = "ws://" + bag.setup.SERVER.EXTURI;
		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log("WS CONNECTED");
		connected = true;
		clear_blocks();
		$("#errorNotificationPanel").fadeOut();
		ws.send(JSON.stringify({type: "chainstats", v:2}));
		ws.send(JSON.stringify({type: "get_papers", v: 2}));
		if(user.username) ws.send(JSON.stringify({type: 'get_company', company: user.username}));
	}

	function onClose(evt){
		console.log("WS DISCONNECTED", evt);
		connected = false;
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var data = JSON.parse(msg.data);
			console.log('rec', data);
			if(data.msg === 'papers'){
				//console.log('!', data.papers);
				build_trades(JSON.parse(data.papers));
			}
			else if(data.msg === 'chainstats'){
				var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				$("#blockdate").html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp = { 
								id: data.blockstats.height, 
								blockstats: data.blockstats
							};
				new_block(temp);									//send to blockchain.js
			}
			else if(data.msg === 'company'){							//clear marble knowledge, prepare of incoming marble states
				$("#accountBalance").html(formatMoney(data.company.cashBalance));
			}
			else if(data.msg === 'reset'){							//clear marble knowledge, prepare of incoming marble states
				ws.send(JSON.stringify({type: "get_papers", v: 2}));
				ws.send(JSON.stringify({type: 'get_company', company: user.username}));
			}
		}
		catch(e){
			console.log('ERROR', e);
			//ws.close();
		}
	}

	function onError(evt){
		console.log('ERROR ', evt);
		if(!connected && bag.e == null){											//don't overwrite an error message
			$("#errorName").html("Warning");
			$("#errorNoticeText").html("Waiting on the node server to open up so we can talk to the blockchain. ");
			$("#errorNoticeText").append("This app is likely still starting up. ");
			$("#errorNoticeText").append("Check the server logs if this message does not go away in 1 minute. ");
			$("#errorNotificationPanel").fadeIn();
		}
	}

	function sendMessage(message){
		console.log("SENT: " + message);
		ws.send(message);
	}
}


// =================================================================================
//	UI Building
// =================================================================================
function build_trades(papers){
	var html = '';
	bag.papers = papers;						//store the trades for posterity
	//console.log('papers:', bag.papers);
	
	for(var i in papers){
		console.log('!', papers[i]);
		
		for(var x in papers[i].owner){
			var style = ' ';
			var buttonStatus = '';
			
			if(papers[i].qty > 0 && papers[i].owner[x].quantity > 0){													//cannot buy when there are none
				if(user.username.toLowerCase() == papers[i].owner[x].company.toLowerCase()) style = 'invalid';			//cannot buy my own stuff
				if(papers[i].issuer.toLowerCase() != papers[i].owner[x].company.toLowerCase()) style = 'invalid';		//cannot buy stuff already bought
				
				html += '<tr class="' + style +'">';
				html +=		'<td>' + formatDate(Number(papers[i].issueDate ), '%M/%d %I:%m%P') + '</td>';
				html +=		'<td>' + papers[i].cusip + '</td>';
				html +=		'<td>' + escapeHtml(papers[i].ticker.toUpperCase()) + '</td>';
				html +=		'<td>' + formatMoney(papers[i].par) + '</td>';
				html +=		'<td>' + papers[i].owner[x].quantity + '</td>';
				html +=		'<td>' + papers[i].discount + '%</td>';
				html +=		'<td>' + papers[i].maturity + ' days</td>';
				html +=		'<td>' + papers[i].issuer + '</td>';
				html +=		'<td>' + papers[i].owner[x].company + '</td>';
				html +=		'<td>';
				html +=			'<button type="button" class="buyPaper altButton" ' + buttonStatus +' trade_pos="' + i + '">';
				html +=				'<span class="fa fa-exchange"> &nbsp;&nbsp;BUY 1</span>';
				html +=			'</button>';
				html += 	'</td>';
				html += '</tr>';
			}
		}
	}
	//console.log('html', html);
	if(html == '') html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
	$("#tradesBody").html(html);
	$("#tradesTable").tablesorter({sortList: [[1,0]]});
}
