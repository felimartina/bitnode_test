var config = require('./config');
var uphold_config = { "host": config.uphold_server };
var uphold = require('uphold-sdk-node')(uphold_config);
var logger = require('./logger');
var constants = require('./constants');
var btc_card, usd_card;

var init = function (user, pass, callback) {
    //login into uphold
    uphold.createPAT(user, pass, 'Logging from broker', true, function (err, res) {
        if (err) return callback(err);
        // if two factor authentication is enabled on the account a One Time Password (OTP) will be required
        // once retrieved this method can be called again with the OTP like so
        // uphold.createPAT('username', 'password', 'PAT description', 'OTP', function(err, res) {});
        if (res.otp) return callback(new Error('getOTP()'));

        // add the PAT to the current uphold-sdk-node configs pat property and make authenticated calls
        uphold.addPAT(res.accessToken).user(function (err, user) {
            if (err) return callback(err);
            fetchCards(function (err) {
                if (err) return callback(err);
                callback();
            });
        });
    });
};
var fetchCards = function (callback) {
    uphold.cards(function (err, cards) {
        if (err) callback(err);
        usd_card = cards.find(function (card) {
            return card.currency === constants.enums.currencies.USD;
        });
        btc_card = cards.find(function (card) {
            return card.currency === constants.enums.currencies.BTC;
        });
        callback();
    });
};
var tick = function (callback) {
    uphold.tickersForCurrency(constants.enums.currencies.BTCUSD, function (err, current_tick) {
        if (!err) {
            callback(current_tick);
        }
        else {
            logger.error(err);
        }
    });
};

var buyBTC = function (working_capital, callback) {
    var options = {
        card: usd_card.id,
        currency: working_capital.currency,
        amount: working_capital.amount,
        destination: btc_card.id,
        message: 'Buying BTC from bot'
    };
    uphold.createTransaction(options, function (err, transaction) {
        if (err) return callback(err);
        callback(null, transaction);
    });
};

var sellBTC = function (working_capital, callback) {
    var options = {
        card: btc_card.id,
        currency: working_capital.currency,
        amount: working_capital.amount,
        destination: usd_card.id,
        message: 'Selling BTC from bot'
    };
    uphold.createTransaction(options, function (err, transaction) {
        if (err) return callback(err);
        callback(null, transaction);
    });
};
// 
// var placeBuyBTCOrder = function (amount, callback) {
//     uphold.prepareTransaction(usd_card.id, constants.enums.currencies.USD, amount, btc_card.id, function (err, transaction) {
//         if (err) return callback(err);
//         callback(null, transaction);
//     });
// };
// 
// var placeSellBTCOrder = function (amount, callback) {
//     uphold.prepareTransaction(btc_card.id, constants.enums.currencies.USD, amount, usd_card.id, function (err, transaction) {
//         if (err) return callback(err);
//         callback(null, transaction);
//     });
// };
// 
// var commitPendingTransaction = function (transaction, callback) {
//     uphold.commitTransaction(transaction.origin.CardId, transaction.id, 'Commiting last pending transaction', function (err, transaction) {
//         if (err) return callback(err);
//         callback(null, transaction);
//     });
// };

//     buyUSD: function (amount, callback) {
//
//     },
module.exports = {
    init: init,
    tick: tick,
    buyBTC: buyBTC,
    sellBTC: sellBTC
    // placeBuyBTCOrder: placeBuyBTCOrder,
    // placeSellBTCOrder: placeSellBTCOrder,
    // commitPendingTransaction: commitPendingTransaction
};
//
// function parseTick(string_tick) {
//     var tick = JSON.parse(string_tick);
//     if (tick) {
//         tick.ask = parseFloat(tick.ask);
//         tick.bid = parseFloat(tick.bid);
//     }
//     return tick;
// }