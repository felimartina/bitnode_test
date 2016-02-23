var uphold_config = { "host": "api.uphold.com" };
var uphold = require('uphold-sdk-node')(uphold_config);
var logger = require('./logger');
var constants = require('./constants');

var init = function (user, pass, callback) {
    //login into uphold
    uphold.createPAT(user, pass, 'Logging from broker', false, function (err, res) {
        if (err) return logger.error(err);
        // if two factor authentication is enabled on the account a One Time Password (OTP) will be required
        // once retrieved this method can be called again with the OTP like so
        // uphold.createPAT('username', 'password', 'PAT description', 'OTP', function(err, res) {});
        if (res.otp) return logger.error('getOTP()');

        // add the PAT to the current uphold-sdk-node configs pat property and make authenticated calls
        uphold.addPAT(res.accessToken).user(function (err, user) {
            if (err) return logger.error(err);
            callback();
        });
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
 //     var buyBTC = function (amount, callback) {
    // 
    //     };

    //     buyUSD: function (amount, callback) {
    // 
    //     },
module.exports = {
    init: init,
    tick: tick
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