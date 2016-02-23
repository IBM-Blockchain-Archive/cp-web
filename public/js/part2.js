/* global in_array */
/* global new_block */
/* global formatDate */
/* global nDig */
/* global randStr */
/* global bag */
/* global $ */
var ws = {};
var user = {username: bag.setup.USER1};
var bgcolors = ["whitebg", "blackbg", "redbg", "greenbg", "bluebg", "purplebg", "pinkbg", "orangebg", "yellowbg"];
var valid_users = ["company1", "company2", "company3"];
		
// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	$("input[name='name']").val('r' + randStr(6));
	$("select option[value='" + bag.setup.USER1 + "']").attr('selected', true);
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$("#submit").click(function(){
		if(!in_array(user.username, valid_users)){
			$("#loginWrap").fadeIn();
		}
		else{
			var obj = 	{
							type: "create",
							paper: {
								ticker: $("input[name='ticker']").val(),
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
		set_my_color_options(user.username);
		ws.send(JSON.stringify({type: "get_open_trades", v: 2}));
	});
	
	
	//marble color picker
	$(document).on("click", ".colorInput", function(){
		$('.colorOptionsWrap').hide();											//hide any others
		$(this).parent().find('.colorOptionsWrap').show();
	});
	$(document).on("click", ".colorOption", function(){
		var color = $(this).attr('color');
		var html = '<span class="fa fa-circle colorSelected ' + color + '" color="' + color +'"></span>';
		
		$(this).parent().parent().find('.colorValue').html(html);
		$(this).parent().hide();

		for(var i in bgcolors) $(".createball").removeClass(bgcolors[i]);		//remove prev color
		$(".createball").css("border", "0").addClass(color + 'bg');				//set new color
	});
	
	
	//drag and drop marble
	$("#user2wrap, #user1wrap, #trashbin").sortable({connectWith: ".sortable"}).disableSelection();
	$("#user2wrap").droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER2){
				$(ui.draggable).addClass("invalid");
				transfer($(ui.draggable).attr('id'), bag.setup.USER2);
			}
		}
	});
	$("#user1wrap").droppable({drop:
		function( event, ui ) {
			var user = $(ui.draggable).attr('user');
			if(user.toLowerCase() != bag.setup.USER1){
				$(ui.draggable).addClass("invalid");
				transfer($(ui.draggable).attr('id'), bag.setup.USER1);
			}
		}
	});
	$("#trashbin").droppable({drop:
		function( event, ui ) {
			var id = $(ui.draggable).attr('id');
			if(id){
				console.log('removing marble', id);
				var obj = 	{
								type: "remove",
								name: id,
								v: 2
							};
				ws.send(JSON.stringify(obj));
				$(ui.draggable).fadeOut();
				setTimeout(function(){
					$(ui.draggable).remove();
				}, 300);
			}
		}
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
	
	$("#loginWrap").submit(function(){
		user.username = $("input[name='username']").val();
		if(in_array(user.username, valid_users)){
			console.log('yes');
			$("input[name='username']").css("color", "#fff").val("");
			$("#loginWrap").fadeOut();
			$("#userField").html(user.username.toUpperCase() + ' ');
			
			//ws.send(JSON.stringify({type: "get_papers", v: 2}));
			//ws.send(JSON.stringify({type: 'get_company', company: user.username}));
		}
		/*else{
			console.log('no');
			$("input[name='username']").css("color", "#cc0000");
		}*/
		//return false;
	});
	
	$("input[name='username']").keydown(function(){
		$("input[name='username']").css("color", "#fff");
	});
	
	
	//trade events
	//build_trades([temp]);
	$(document).on("click", ".buyPaper", function(){
		if(!in_array(user.username, valid_users)){
			$("#loginWrap").fadeIn();
		}
		else{
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
//transfer selected ball to user
function transfer(marbleName, user){
	if(marbleName){
		console.log('transfering', marbleName);
		var obj = 	{
						type: "transfer",
						name: marbleName,
						user: user,
						v: 2
					};
		ws.send(JSON.stringify(obj));
	}
}

function sizeMe(mm){
	var size = 'Large';
	if(Number(mm) == 16) size = 'Small';
	return size;
}

function find_trade(timestamp){
	for(var i in bag.trades){
		if(bag.trades[i].timestamp){
			return bag.trades[i];
		}
	}
	return null;
}

function find_valid_marble(user, color, size){				//return true if user owns marble of this color and size
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == user.toLowerCase()){
			//console.log('!', bag.marbles[i].color, color.toLowerCase(), bag.marbles[i].size, size);
			if(bag.marbles[i].color.toLowerCase() == color.toLowerCase() && bag.marbles[i].size == size){
				return bag.marbles[i].name;
			}
		}
	}
	return null;
}

var temp = {
			cusip: 'abadf',
			ticker: 'ibm',
			par:10000,
			qty:10,
			discount: 7.5,
			maturity: 30,
			owner: 'company1',
			issuer: 'company2',
			issueDate: Date.now().toString()
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
		//ws.send(JSON.stringify({type: "get", v:2}));
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
function build_ball(data){
	var html = '';
	var colorClass = '';
	var size = 'fa-5x';
	
	if(!bag.marbles) bag.marbles = {};
	bag.marbles[data.name] = data;								//store the marble for posterity
	
	if(!$("#" + data.name).length){								//only populate if it doesn't exists
		if(data.size == 16) size = 'fa-3x';
		if(data.color) colorClass = data.color.toLowerCase();
		
		html += '<span id="' + data.name +'" class=" fa fa-file-text-o ' + size + ' ball ' + colorClass + '" title="' + data.name +'" user="' + data.user + '"></span>';
		if(data.user && data.user.toLowerCase() == bag.setup.USER1){
			$("#user1wrap").append(html);
		}
		else{
			$("#user2wrap").append(html);
		}
	}
	//console.log('marbles', bag.marbles);
	
	return html;
}

function build_trades(papers){
	var html = '';
	bag.papers = papers;						//store the trades for posterity
	//console.log('papers:', bag.papers);
	
	for(var i in papers){
		console.log('!', papers[i]);
		
		for(var x in papers[i].owner){
			var style = ' ';
			var buttonStatus = '';
			
			if(papers[i].qty > 0){	//don't show papers with myself
				if(user.username.toLowerCase() == papers[i].owner[x].company.toLowerCase()) style = 'invalid';
				console.log('building');
				html += '<tr class="' + style +'">';
				html +=		'<td>' + formatDate(Number(papers[i].issueDate ), '%M/%d %I:%m%P') + '</td>';
				html +=		'<td>' + papers[i].cusip + '</td>';
				html +=		'<td>' + papers[i].ticker.toUpperCase() + '</td>';
				html +=		'<td>' + formatMoney(papers[i].par) + '</td>';
				html +=		'<td>' + papers[i].owner[x].quantity + '</td>';
				html +=		'<td>' + papers[i].discount + '%</td>';
				html +=		'<td>' + papers[i].maturity + ' days</td>';
				html +=		'<td>' + papers[i].issuer + '</td>';
				html +=		'<td>' + papers[i].owner[x].company + '</td>';
				html +=		'<td>';
				html +=			'<button type="button" class="buyPaper altButton" ' + buttonStatus +' trade_pos="' + i + '">';
				html +=				'<span class="fa fa-exchange"> &nbsp;&nbsp;BUY</span>';
				html +=			'</button>';
				html += 	'</td>';
				html += '</tr>';
			}
		}
	}
	//console.log('html', html);
	if(html == '') html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
	
	console.log('html', html);
	$("#tradesBody").html(html);
}

function set_my_color_options(username){
	var has_colors = {};
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == username.toLowerCase()){		//mark it as needed
			has_colors[bag.marbles[i].color] = true;
		}
	}
	
	//console.log('has_colors', has_colors);
	var colors = ["white", "black", "red", "green", "blue", "purple", "pink", "orange", "yellow"];
	$(".willingWrap").each(function(){
		for(var i in colors){
			//console.log('checking if user has', colors[i]);
			if(!has_colors[colors[i]]) {
				//console.log('removing', colors[i]);
				$(this).find('.' + colors[i] + ':first').hide();
			}
			else {
				$(this).find('.' + colors[i] + ':first').show();
				//console.log('yep');
			}
		}
	});
}

function set_my_size_options(username, colorOption){
	var color = $(colorOption).attr('color');
	//console.log('color', color);
	var html = '';
	var sizes = {};
	for(var i in bag.marbles){
		if(bag.marbles[i].user.toLowerCase() == username.toLowerCase()){		//mark it as needed
			if(bag.marbles[i].color.toLowerCase() == color.toLowerCase()){
				sizes[bag.marbles[i].size] = true;
			}
		}
	}
	
	console.log('valid sizes:', sizes);
	for(var i in sizes){
		html += '<option value="' + i + '">' + sizeMe(i) + '</option>';					//build it
	}
	$(colorOption).parent().parent().next("select[name='will_size']").html(html);
}
