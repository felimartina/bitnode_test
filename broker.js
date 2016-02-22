var uphold_config = { "host": "api.uphold.com" };
var request = require('request');
var logger = require('./logger');
var uphold = require('uphold-sdk-node')(uphold_config);
// var MA = require('moving-average');
var gauss = require('gauss');
var Collection = gauss.Collection;
// var transactions = [];
// var tick_pace = 10000;
// var step = 0.1; // min amount of dollar to consider a win

// var last_ticks_to_use = 100;
// var highest = 0, lowest = 0;
// var profit_overall = 0, profit_last = 0;

module.exports = function (user, pass) {
    //Enumerations
    var enum_currencies = Object.freeze({ USDBTC: 'USDBTC', BTCUSD: 'BTCUSD' });
    var enum_running_mode = Object.freeze({ BUY_BITCOINS: 'BUY_BITCOINS', SELL_BITCOINS: 'SELL_BITCOINS' });
    var running_settings = {
        running_mode: enum_running_mode.SELL_BITCOINS,
        tick_miliseconds: 10000,
        step: 1,
        number_of_ticks_to_use: 20
    };
    var tick_history = [];
    var highest_tick = 0, lowest_tick = 0;
    var cards;
    var wallet = { currency: 'BTC', value: 3.06634735, transactions: [] }; // us amount to work with
    function run(settings) {
        running_settings.running_mode = running_settings.running_mode || settings.running_mode;
        running_settings.tick_miliseconds = running_settings.tick_miliseconds || settings.tick_miliseconds;
        running_settings.step = running_settings.step || settings.step;
        running_settings.number_of_ticks_to_use = running_settings.number_of_ticks_to_use || settings.number_of_ticks_to_use;

        login(function () {
            switch (running_settings.running_mode) {
                case enum_running_mode.BUY_BITCOINS:
                    buy();
                    break;
                case enum_running_mode.SELL_BITCOINS:
                    sell();
                    break;
                default:
                    logger.error('Not recognized running mode');
                    break;
            }
        });

    }
    
    //login into uphold
    var login = function (next) {
        uphold.createPAT(user, pass, 'Logging from broker', false, function (err, res) {
            if (err) return logger.error(err);
            // if two factor authentication is enabled on the account a One Time Password (OTP) will be required
            // once retrieved this method can be called again with the OTP like so
            // uphold.createPAT('username', 'password', 'PAT description', 'OTP', function(err, res) {});
            if (res.otp) return logger.error('getOTP()');

            // add the PAT to the current uphold-sdk-node configs pat property and make authenticated calls
            uphold.addPAT(res.accessToken).user(function (err, user) {
                if (err) return logger.error(err);
                cards = user.cards;
                next();
            });
        });
    };

    var delay = function (next) {
        setTimeout(function () {
            next();
        }, running_settings.tick_miliseconds);
    };

    var tick = function (next) {
        uphold.tickersForCurrency(enum_currencies.BTCUSD, function (err, current_tick) {
            if (!err) {
                //parse tick values
                current_tick.bid = parseFloat(current_tick.bid);
                current_tick.ask = parseFloat(current_tick.ask);
                current_tick.timestamp = Date.now();
                current_tick = calculate_stats(current_tick, tick_history);
                current_tick.last_tick = tick_history[tick_history.length - 1];
                tick_history.push(current_tick);

                logger.info('running_mode: %s - price avg: %s, stdev: %s, sma: %s, ema %s', running_settings.running_mode, current_tick.price_avg, current_tick.stats.stdev, current_tick.stats.sma, current_tick.stats.ema);
                next(current_tick);
            }
            else {
                logger.error(err);
                next(null);
            }
        });
    };

    var buy = function () {
        tick(function (tick) {
            if (tick) {
                // don't make decisions until we have enough data
                if (tick_history.length <= running_settings.number_of_ticks_to_use) {
                    return delay(buy);
                }
                if (tick.stats.ema > tick.last_tick.stats.ema && tick.stats.stdev > 0.2 && tick.price_avg - tick.last_tick.price_avg > running_settings.step) {
                    //Seems like this goes up...buy BTC?
                    // BUY bitcoins, reset, and start buying
                    wallet.transactions.push({ currency_pair: enum_currencies.USDBTC, value: wallet.value, exchange: tick.ask });
                    wallet.currency = 'BTC';
                    wallet.value = wallet.value / tick.ask;
                    logger.info(wallet);
                    running_settings.running_mode = enum_running_mode.SELL_BITCOINS;
                    return delay(sell);
                }
            }
            else {
                logger.error('cannot read tick');
            }
            return delay(buy);
        });
    };

    var sell = function () {
        tick(function (tick) {
            if (tick) {
                // don't make decisions until we have enough data
                if (tick_history.length <= running_settings.number_of_ticks_to_use) {
                    return delay(sell);
                }
                if (tick.stats.ema < tick.last_tick.stats.ema && tick.stats.stdev > 0.2 && tick.last_tick.price_avg - tick.price_avg > running_settings.step) {
                    // sell bitcoins, reset, and start buying
                    wallet.transactions.push({ currency_pair: enum_currencies.BTCUSD, value: wallet.value, exchange: tick.bid });
                    wallet.currency = 'USD';
                    wallet.value = wallet.value * tick.bid;
                    logger.info(wallet);
                    running_settings.running_mode = enum_running_mode.BUY_BITCOINS;
                    return delay(buy);
                }
            }
            else {
                logger.error('cannot read tick');
            }
            return delay(sell);
        });
    };
    
/**
 *  Calculates stats for a given tick based upon previous ticks 
 * @param {tick} tick - tick to calculate stats upon
 * @param {[tick]} tick_history - history of ticks */
var calculate_stats = function (tick, tick_history) {
    // var greater_straight = 0, less_straight = 0;
    //         tick.difference_overall = tick.bid - tick_history[0].bid;
    //         tick.difference_tick = tick.bid - tick_history[tick_history.length - 1].bid;
    // 
    //         if (tick.bid >= highest_tick) {
    //             tick.was_highest = true;
    //             highest_tick = tick.bid;
    //         } else if (tick.bid <= lowest_tick) {
    //             tick.was_lowest = true;
    //             lowest_tick = tick.bid;
    //         }
    //determine if last N were the highest/lowest
    // for (var i = tick_history.length - 2, j = 0; j < running_settings.number_of_ticks_to_use && i >= 0; i-- , j++) {
    //     if (tick_history[i].difference_tick > 0) {
    //         greater_straight++;
    //         //stop the for when we break the less_straight
    //         if (less_straight > 0) {
    //             break;
    //         }
    //     } else if (tick_history[i].difference_tick < 0) {
    //         less_straight++;
    //         //stop the for when we break the greater_straight
    //         if (greater_straight > 0) {
    //             break;
    //         }
    //     }
    // }
        
    //Calculate Simple Moving Average
    // ma.push(Date.now(), tick.bid);
    // tick.SMA = ma.movingAverage();
    // tick.VA = ma.variance();
        
    tick.price_avg = (tick.bid + tick.ask) / 2;
    // var bid_array = [tick.bid], ask_array = [tick.ask];
    var price_array = [tick.price_avg];
    for (var i = tick_history.length - 1, j = 0; j < running_settings.number_of_ticks_to_use && i >= 0; i-- , j++) {
        price_array.push(tick_history[i].price_avg);
        // bid_array.push(tick_history[i].bid);
        // ask_array.push(tick_history[i].ask);
    }
    //Calculate Exponential Moving Average
    // bid_array = bid_array.toVector();
    // tick.bid_SMA = bid_array.sma(running_settings.number_of_ticks_to_use)[0];
    // tick.bid_EMA = bid_array.ema(running_settings.number_of_ticks_to_use)[0];
    // bid_array.
    // ask_array = ask_array.toVector();
    // tick.ask_SMA = ask_array.sma(running_settings.number_of_ticks_to_use)[0];
    // tick.ask_EMA = ask_array.ema(running_settings.number_of_ticks_to_use)[0];
    price_array = price_array.toVector();
    tick.stats = {
        sma: price_array.sma(running_settings.number_of_ticks_to_use)[0],
        ema: price_array.ema(running_settings.number_of_ticks_to_use)[0],
        stdev: price_array.stdev(),
        min: price_array.min(),
        max: price_array.max()
    };
        
    // tick.greater_straight = greater_straight;
    // tick.less_straight = less_straight;
    return tick;
};

return {
    run: run,
    enum_running_mode: enum_running_mode
};
};
// decide: function () {
//     uphold.tick(uphold.enum_currencies.BTCUSD, function (current_tick) {
// 
//         logger.info('ask: %s, bid: %s', current_tick.ask, current_tick.bid);
//         if (current_tick.greater_straight > 0) {
//             if (current_tick.greater_straight >= ticks[ticks.length - 1].greater_straight) {
//                 logger.info('Do not sell BTC yet...seems like this keeps growing');
//             } else if (current_tick.difference_overall > step) {
//                 logger.info('GOOD TO SELL BITCOINS');
//                 if (wallet.currency == uphold.enum_currencies.BTCUSD) {
//                     wallet.transactions.push({ currency_pair: uphold.enum_currencies.BTCUSD, value: wallet.value, exchange: current_tick.bid });
//                     wallet.currency = uphold.enum_currencies.USDBTC;
//                     wallet.value = wallet.value * current_tick.bid;
//                     logger.info(wallet);
//                 }
//             }
//         } else if (current_tick.less_straight > 0) {
//             if (current_tick.less_straight >= ticks[ticks.length - 1].less_straight) {
//                 logger.info('Do not buy yet...seems like this keeps going down');
//             } else if (Math.abd(current_tick.difference_overall) > step) {
//                 logger.info('GOOD TO BUY BITCOINS');
//                 if (wallet.currency == uphold.enum_currencies.USDBTC) {
//                     wallet.transactions.push({ currency_pair: uphold.enum_currencies.USDBTC, value: wallet.value, exchange: current_tick.bid });
//                     wallet.currency = uphold.enum_currencies.BTCUSD;
//                     wallet.value = current_tick.bid / wallet.value;
//                     logger.inf(wallet);
//                 }
//             }
//         }
//         ticks.push(current_tick);
//         broker.start(tick_pace);
//     });
