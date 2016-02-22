var request = require('request');
var uri_tick = 'https://api.uphold.com/v0/ticker/';
module.exports = {
    buyBTC: function (amount, callback) {

    },

    buyUSD: function (amount, callback) {

    },

    tick: function (currency, callback) {
        request(uri_tick + currency, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(parseTick(body));
            }
            else {
                console.log('status_code: %s, error: %s', response.statusCode, error);
            }
        });
    },
    
    //Currency Enumeration
    enum_currencies: Object.freeze({ USDBTC: 'USDBTC', BTCUSD: 'BTCUSD' })   
};

function parseTick(string_tick) {
    var tick = JSON.parse(string_tick);
    if (tick){
        tick.ask = parseFloat(tick.ask);
        tick.bid = parseFloat(tick.bid);
    }
    return tick;
}