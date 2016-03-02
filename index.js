var bit_driver = require('./uphold_driver');
var ticker = require('./ticker');
var logger = require('./logger');
var constants = require('./constants');
var config = require('./config');
var decider = require('./decider');
var running_settings = require('./running-settings');
var mongo_dal = require('./mongo-dal');

var commited_transactions = [];
var current_working_capital = running_settings.working_capital;
bit_driver.init(config.user, config.pass, function (err) {
    if (err) {
        logger.error('Unable to start.');
        logger.error(err);
        return;
    }
    //test uphold transactions
    // bit_driver.sellBTC(10, function (err, commited_transaction) {
    //     if (err) return logger.error(err);
    //     commited_transactions.push(commited_transaction);
    //     logger.info(commited_transaction);
    // });
    // bit_driver.buyBTC(1, function (err, commited_transaction) {
    //     if (err) return logger.error(err);
    //     commited_transactions.push(commited_transaction);
    //     logger.info(commited_transaction);
    // });
    // bit_driver.placeSellBTCOrder(1, function (err, pending_transaction) {
    //     if (err) return logger.error(err);
    //     last_pending_transaction = pending_transaction;
    //     logger.info(pending_transaction);
    //     bit_driver.commitPendingTransaction(pending_transaction, function (err, commited_transaction) {
    //         if (err) return logger.error(err);
    //         commited_transactions.push(commited_transaction);
    //         logger.info(commited_transaction);
    //     });
    // });
    setInterval(function () {
        ticker.tick(bit_driver, running_settings.single_stats_definitions, running_settings.historical_stats_definitions);
    }, running_settings.tick_interval);

    setInterval(function () {
        switch (current_working_capital.currency) {
            // we have BTC, then we have to sell them
            case constants.enums.currencies.BTC:
                decider.decide(running_settings.sell_conditions, function (conditions_met) {
                    if (conditions_met) {
                        bit_driver.sellBTC(current_working_capital, function (err, transaction) {
                            if (err) return logger.error('Unable to sell BTC', err);
                            transaction.running_mode = constants.enums.running_modes.SELL_BITCOINS;
                            commited_transactions.push(transaction);
                            logger.info('SOLD BTC', transaction);
                            current_working_capital = {
                                currency: constants.enums.currencies.USD,
                                amount: parseFloat(transaction.destination.amount)
                            };
                            mongo_dal.transactions_dal.insert(transaction);
                        });
                    }
                });
                break;

            // we have USD, then we have to buy BTC
            case constants.enums.currencies.USD:
                decider.decide(running_settings.buy_conditions, function (conditions_met) {
                    if (conditions_met) {
                        bit_driver.buyBTC(current_working_capital, function (err, transaction) {
                            if (err) return logger.error('Unable to sell BTC', err);
                            transaction.running_mode = constants.enums.running_modes.BUY_BITCOINS;
                            commited_transactions.push(transaction);
                            logger.info('BOUGHT BTC', transaction);
                            current_working_capital = {
                                currency: constants.enums.currencies.BTC,
                                amount: parseFloat(transaction.destination.amount)
                            };
                            mongo_dal.transactions_dal.insert(transaction);
                        });
                    }
                });
                break;

            default:
                logger.error('Unrecognized running mode.');
                return;
        }
    }, running_settings.tick_interval * 2);
});