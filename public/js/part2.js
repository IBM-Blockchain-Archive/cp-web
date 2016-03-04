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
var panels = [
	{
		name: "trade",
		formID: "tradeFilter",
		tableID: "#tradesBody",
		filterPrefix: "trade_"
	},
	{
		name: "audit",
		formID: "auditFilter",
		tableID: "#auditBody",
		filterPrefix: "audit_"
	}
];

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	if(user.username) $("#userField").html(user.username.toUpperCase() + ' ');

	// Customize which panels show up for which user
	$(".nav").hide();
	console.log("user role", bag.session.user_role);

	// Only show tabs if a user is logged in
	if(user.username) {

		// Display tabs based on user's role
		if(bag.session.user_role && bag.session.user_role.toUpperCase() === "auditor".toUpperCase()) {
			$("#auditLink").show();
		} else if(user.username) {
			$("#createLink").show();
			$("#tradeLink").show();
		}
	}

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

	// Filter the trades whenever the filter modal changes
	$(".trade-filter").keyup(function() {
		"use strict";
		console.log("Change in trade filter detected.");
		processFilterForm(panels[0]);
	});
	$(".audit-filter").keyup(function() {
		"use strict";
		console.log("Change in audit filter detected.");
		processFilterForm(panels[1]);
	});

	//trade events
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
		var wsUri = '';
		console.log('protocol', window.location.protocol);
		if(window.location.protocol === 'https:'){
			wsUri = "wss://" + bag.setup.SERVER.EXTURI;
		}
		else{
			wsUri = "ws://" + bag.setup.SERVER.EXTURI;
		}

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
				if($('#auditPanel').is)
				for(var i in panels) {
					build_trades(JSON.parse(data.papers), panels[i]);
				}
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
/**
 * Process the list of trades from the server and displays them in the trade list.
 * This function builds the tables for multiple panels, so an object is needed to
 * identify which table it should be drawing to.
 * @param papers The list of trades to display.
 * @param panelDesc An object describing what panel the trades are being shown in.
 */
function build_trades(papers, panelDesc){
	var html = '';
	bag.papers = papers;						//store the trades for posterity
	//console.log('papers:', bag.papers);

	// If no panel is given, assume this is the trade panel
	if(!panelDesc) {
		panelDesc = panels[0];
	}
	
	papers.sort(function(a, b) {								//alpha sort me
		var textA = a.cusip.toUpperCase();
		var textB = b.cusip.toUpperCase();
		return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
	});
	
	for(var i in papers){
		console.log('!', papers[i]);
		
		for(var x in papers[i].owner){
			var style = ' ';
			var buttonStatus = '';
			
			if(papers[i].qty > 0 && papers[i].owner[x].quantity > 0){													//cannot buy when there are none

				if(excluded(papers[i], papers[i].owner[x], filter)) {
					if(user.username.toLowerCase() == papers[i].owner[x].company.toLowerCase()) style = 'invalid';			//cannot buy my own stuff
					if(papers[i].issuer.toLowerCase() != papers[i].owner[x].company.toLowerCase()) style = 'invalid';		//cannot buy stuff already bought

					// Create a row for each valid trade
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

					// Only the trade panel should allow you to interact with trades
					if(panelDesc.name === "trade") {
						html +=		'<td>';
						html +=			'<button type="button" class="buyPaper altButton" ' + buttonStatus +' trade_pos="' + i + '">';
						html +=				'<span class="fa fa-exchange"> &nbsp;&nbsp;BUY 1</span>';
						html +=			'</button>';
						html += 	'</td>';
					}

					html += '</tr>';
				}
			}
		}
	}

	// Placeholder for an empty table
	if(html == '' && panelDesc.name === "trade") html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
	if(html == '' && panelDesc.name === "audit") html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'; // No action column

	$(panelDesc.tableID).html(html);
}

// =================================================================================
//	Helpers for the filtering of trades
// =================================================================================
var filter = {};

/**
 * Describes all the fields that describe a trade.  Used to create
 * a filter that can be used to control which trades get shown in the
 * table.
 * @type {string[]}
 */
var names = [
	"cusip",
	"ticker",
	"par",
	"qty",
	"discount",
	"maturity",
	"issuer",
	"owner",
	"company"
];

/**
 * Parses the filter forms in the UI into an object for filtering
 * which trades are displayed in the table.
 * @param panelDesc An object describing which panel
 */
function processFilterForm(panelDesc) {
	"use strict";

	var form = document.forms[panelDesc.formID];

	console.log("Processing filter form");

	console.log(form.getElementsByTagName("input"));

	// Reset the filter parameters
	filter = {};

	// Build the filter based on the form inputs
	for (var i in names) {

		// Input ID example: "trade_owner"
		var name = names[i];
		var id = panelDesc.filterPrefix + name;

		if(form[id] && form[id].value !== "") {
			filter[name] = form[id].value;
		}
	}

	console.log("New filter parameters: " + JSON.stringify(filter));
	console.log("Rebuilding paper list");
	build_trades(bag.papers, panelDesc);
}

/**
 * Validates a trade object against a given set of filters.
 * @param paper The object to be validated.
 * @param owner The specific owner in the trade object that you want to validate.
 * @param filter The filter object to validate the trade against.
 * @returns {boolean} True if the trade is valid according to the filter, false otherwise.
 */
function excluded(paper, owner, filter) {
	"use strict";

	if(filter.owner && filter.owner !== "" && owner.company.toUpperCase().indexOf(filter.owner.toUpperCase()) == -1 ) return false;

	if(filter.issuer && filter.issuer !== "" && paper.issuer.toUpperCase().indexOf(filter.issuer.toUpperCase()) == -1) return false;
	
	if(filter.ticker && filter.ticker !== "" && paper.ticker.toUpperCase().indexOf(filter.ticker.toUpperCase()) == -1) return false;

	// Must be a valid trade if we reach this point
	return true;
}