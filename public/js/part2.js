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
var user = {
    username: bag.session.username,
    name: bag.session.name,
    role: bag.session.role
};
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
$(document).on('ready', function () {
    connect_to_server();
    if (user.name) $("#userField").html(user.name.toUpperCase() + ' ');

    // Customize which panels show up for which user
    $(".nav").hide();
    console.log("user role", bag.session.user_role);

    // Only show tabs if a user is logged in
    if (user.username) {

        // Display tabs based on user's role
        if (user.role && user.role.toUpperCase() === "auditor".toUpperCase()) {
            $("#auditLink").show();
        } else if (user.username) {
            $("#createLink").show();
            $("#tradeLink").show();
        }
    } else {

        // Display the login and user registration links
        $("#loginLink").show();
        $("#registerLink").show();
    }

    // =================================================================================
    // jQuery UI Events
    // =================================================================================
    $("#submit").click(function () {
        if (user.username) {
            var obj = {
                type: "create",
                paper: {
                    ticker: escapeHtml($("input[name='ticker']").val()),
                    par: Number($("select[name='par']").val()),
                    qty: Number($("select[name='qty']").val()),
                    discount: Number($("select[name='discount']").val()),
                    maturity: Number($("select[name='maturity']").val()),
                    owner: [],
                    issuer: user.name,
                    issueDate: Date.now().toString()
                },
                user: user.username
            };
            if (obj.paper && obj.paper.ticker) {
                obj.paper.ticker = obj.paper.ticker.toUpperCase();
                console.log('creating paper, sending', obj);
                ws.send(JSON.stringify(obj));
                $(".panel").hide();
                $("#tradePanel").show();
            }
        }
        return false;
    });

    $("#createLink").click(function () {
        $("input[name='name']").val('r' + randStr(6));
    });

    $("#tradeLink").click(function () {
        ws.send(JSON.stringify({type: "get_open_trades", v: 2, user: user.username}));
    });

    //login events
    $("#whoAmI").click(function () {													//drop down for login
        if ($("#loginWrap").is(":visible")) {
            $("#loginWrap").fadeOut();
        }
        else {
            $("#loginWrap").fadeIn();
        }
    });

    // Filter the trades whenever the filter modal changes
    $(".trade-filter").keyup(function () {
        "use strict";
        console.log("Change in trade filter detected.");
        processFilterForm(panels[0]);
    });
    $(".audit-filter").keyup(function () {
        "use strict";
        console.log("Change in audit filter detected.");
        processFilterForm(panels[1]);
    });

    // Click events for the columns of the table
    $('.sort-selector').click(function () {
        "use strict";
        var sort = $(this).attr('sort');

        // Clear any sort direction arrows
        $('span').remove('.sort-indicator');

        // Clicking the column again should reverse the sort
        if(sort_papers[sort] === sort_selected) {
            console.log("Reversing the table");
            sort_reversed = !sort_reversed;
        }
        else sort_reversed = false;

        // Add the appropriate arrow to the current selector
        var arrow_icon = (sort_reversed ? 'fa-arrow-up' : 'fa-arrow-down');
        var span = document.createElement('span');
        span.classList.add('fa');
        span.classList.add(arrow_icon);
        span.classList.add('sort-indicator');
        $(this).append(span);

        // Change to the sort corresponding to that column
        sort_selected = sort_papers[sort];
        console.log("Sorting by:", sort);
        for (var i in panels) {
            build_trades(bag.papers, panels[i]);
        }
    });

    //trade events
    $(document).on("click", ".buyPaper", function () {
        if (user.username) {
            console.log('trading...');
            var i = $(this).attr('trade_pos');
            var cusip = $(this).attr('data_cusip');
            var issuer = $(this).attr('data_issuer');

            // TODO Map the trade_pos to the correct button
            var msg = {
                type: 'transfer_paper',
                transfer: {
                    //CUSIP: bag.papers[i].cusip,
                    //fromCompany: bag.papers[i].issuer,
                    CUSIP: cusip,
                    fromCompany: issuer,
                    toCompany: user.name,
                    quantity: 1
                },
                user: user.username
            };
            console.log('sending', msg);
            ws.send(JSON.stringify(msg));
            $("#notificationPanel").animate({width: 'toggle'});
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
}

// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server() {
    var connected = false;
    connect();

    function connect() {
        var wsUri = '';
        console.log('protocol', window.location.protocol);
        if (window.location.protocol === 'https:') {
            wsUri = "wss://" + bag.setup.SERVER.EXTURI;
        }
        else {
            wsUri = "ws://" + bag.setup.SERVER.EXTURI;
        }

        ws = new WebSocket(wsUri);
        ws.onopen = function (evt) {
            onOpen(evt);
        };
        ws.onclose = function (evt) {
            onClose(evt);
        };
        ws.onmessage = function (evt) {
            onMessage(evt);
        };
        ws.onerror = function (evt) {
            onError(evt);
        };
    }

    function onOpen(evt) {
        console.log("WS CONNECTED");
        connected = true;
        clear_blocks();
        $("#errorNotificationPanel").fadeOut();
        ws.send(JSON.stringify({type: "chainstats", v: 2, user: user.username}));
        ws.send(JSON.stringify({type: "get_papers", v: 2, user: user.username}));
        if (user.name && user.role !== "auditor") {
            ws.send(JSON.stringify({type: 'get_company', company: user.name, user: user.username}));
        }
    }

    function onClose(evt) {
        console.log("WS DISCONNECTED", evt);
        connected = false;
        setTimeout(function () {
            connect();
        }, 5000);					//try again one more time, server restarts are quick
    }

    function onMessage(msg) {
        try {
            var data = JSON.parse(msg.data);
            console.log('rec', data);
            if (data.msg === 'papers') {
                console.log('!', data.papers);
                if ($('#auditPanel').is)
                    for (var i in panels) {
                        build_trades(JSON.parse(data.papers), panels[i]);
                    }
            }
            else if (data.msg === 'chainstats') {
                console.log(JSON.stringify(data));
                var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
                $("#blockdate").html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
                var temp = {
                    id: data.blockstats.height,
                    blockstats: data.blockstats
                };
                new_block(temp);									//send to blockchain.js
            }
            else if (data.msg === 'company') {
                $("#accountBalance").html(formatMoney(data.company.cashBalance));
            }
            else if (data.msg === 'reset') {
                // Ask for all available trades and information for the current company
                ws.send(JSON.stringify({type: "get_papers", v: 2, user: user.username}));
                if (user.role !== "auditor") {
                    ws.send(JSON.stringify({type: 'get_company', company: user.name, user: user.username}));
                }
            }
            else if (data.type === 'error') {
                console.log("Error:", data.error);
            }
        }
        catch (e) {
            console.log('ERROR', e);
            //ws.close();
        }
    }

    function onError(evt) {
        console.log('ERROR ', evt);
        if (!connected && bag.e == null) {											//don't overwrite an error message
            $("#errorName").html("Warning");
            $("#errorNoticeText").html("Waiting on the node server to open up so we can talk to the blockchain. ");
            $("#errorNoticeText").append("This app is likely still starting up. ");
            $("#errorNoticeText").append("Check the server logs if this message does not go away in 1 minute. ");
            $("#errorNotificationPanel").fadeIn();
        }
    }

    function sendMessage(message) {
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
function build_trades(papers, panelDesc) {
    bag.papers = papers;						//store the trades for posterity
    //console.log('papers:', bag.papers);

    if(papers && papers.length > 0) {

        // Break the papers down into entries
        console.log('breaking papers into individual entries');
        var entries = [];
        for (var paper in papers) {
            var broken_up = paper_to_entries(papers[paper]);
            entries = entries.concat(broken_up);
        }
        console.log("Displaying", papers.length, "papers as", entries.length, "entries");

        // If no panel is given, assume this is the trade panel
        if (!panelDesc) {
            panelDesc = panels[0];
        }

        entries.sort(sort_selected);
        if (sort_reversed) entries.reverse();

        // Display each entry as a row in the table
        var rows = [];
        for (var i in entries) {
            console.log('!', entries[i]);

            if (entries[i].quantity > 0) {													//cannot buy when there are none

                if (excluded(entries[i], filter)) {
                    var style;
                    if (user.name.toLowerCase() === entries[i].owner.toLowerCase()) {
                        //cannot buy my own stuff
                        style = 'invalid';
                    }
                    else if (entries[i].issuer.toLowerCase() !== entries[i].owner.toLowerCase()) {
                        //cannot buy stuff already bought
                        style = 'invalid';
                    } else {
                        style = null;
                    }

                    // Create a row for each valid trade
                    var data = [
                        formatDate(Number(entries[i].issueDate), '%M/%d %I:%m%P'),
                        entries[i].cusip,
                        escapeHtml(entries[i].ticker.toUpperCase()),
                        formatMoney(entries[i].par),
                        entries[i].quantity,
                        entries[i].discount,
                        entries[i].maturity,
                        entries[i].issuer,
                        entries[i].owner
                    ];

                    var row = createRow(data);
                    style && row.classList.add(style);

                    // Only the trade panel should allow you to interact with trades
                    if (panelDesc.name === "trade") {
                        var disabled = false
                        if (user.name.toLowerCase() === entries[i].owner.toLowerCase()) disabled = true;			//cannot buy my own stuff
                        if (entries[i].issuer.toLowerCase() !== entries[i].owner.toLowerCase()) disabled = true;
                        var button = buyButton(disabled, entries[i].cusip, entries[i].issuer);
                        row.appendChild(button);
                    }
                    rows.push(row);
                }
            }

        }

        // Placeholder for an empty table
        var html = '';
        if (rows.length == 0) {
            if (panelDesc.name === 'trade')
                html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
            else if (panelDesc.name === 'audit')
                html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'; // No action column
            $(panelDesc.tableID).html(html);
        } else {
            // Remove the existing table data
            console.log("clearing existing table data");
            var tableBody = $(panelDesc.tableID);
            tableBody.empty();


            // Add the new rows to the table
            console.log("populating new table data");
            var row;
            while (rows.length > 0) {
                row = rows.shift();
                tableBody.append(row);
            }
        }
    } else {
        if (panelDesc.name === 'trade')
            html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
        else if (panelDesc.name === 'audit')
            html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'; // No action column
        $(panelDesc.tableID).html(html);
    }
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

        if (form[id] && form[id].value !== "") {
            filter[name] = form[id].value;
        }
    }

    console.log("New filter parameters: " + JSON.stringify(filter));
    console.log("Rebuilding paper list");
    build_trades(bag.papers, panelDesc);
}

/**
 * Validates a trade object against a given set of filters.
 * @param entry The object to be validated.
 * @param filter The filter object to validate the trade against.
 * @returns {boolean} True if the trade is valid according to the filter, false otherwise.
 */
function excluded(entry, filter) {
    "use strict";

    if (filter.owner && filter.owner !== "" && entry.owner.company.toUpperCase().indexOf(filter.owner.toUpperCase()) == -1) return false;

    if (filter.issuer && filter.issuer !== "" && entry.issuer.toUpperCase().indexOf(filter.issuer.toUpperCase()) == -1) return false;

    if (filter.ticker && filter.ticker !== "" && entry.ticker.toUpperCase().indexOf(filter.ticker.toUpperCase()) == -1) return false;

    // Must be a valid trade if we reach this point
    return true;
}

