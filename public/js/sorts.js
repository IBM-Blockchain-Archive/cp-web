/**
 * Created by davery on 3/29/2016.
 */
"use strict";

var sort_papers = {
    date: function(a, b) {
        var dateA = a.issueDate;
        var dateB = b.issueDate;
        return compare(dateA, dateB);
    },
    cusip: function(a, b) {
        var textA = a.cusip.toUpperCase();
        var textB = b.cusip.toUpperCase();
        return compare(textA, textB);
    },
    ticker: function(a, b) {
        var tickA = a.ticker.toUpperCase();
        var tickB = b.ticker.toUpperCase();
        return compare(tickA, tickB);
    },
    par: function(a, b) {
        return compare(a.par, b.par);
    },
    quantity: function(a, b) {
        compare(a.quantity, b.quantity);
    },
    discount: function(a, b) {
        return compare(a.discount, b.discount);
    },
    maturity: function(a, b) {
        return compare(a.maturity, b.maturity);
    },
    issuer: function(a, b) {
        var issuerA = a.issuer.toUpperCase();
        var issuerB = b.issuer.toUpperCase();
        return compare(issuerA, issuerB);
    },
    owner: function(a, b) {
        var ownerA = a.owner.toUpperCase();
        var ownerB = b.owner.toUpperCase();
        return compare(ownerA, ownerB);
    }
};

var sort_selected = sort_papers.date;
var sort_reversed = true;

function compare(a, b) {
    return (a < b) ? -1 : (a > b) ? 1 : 0;
}