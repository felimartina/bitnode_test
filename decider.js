var constants = require('./constants');
var logger = require('./logger');
var mongo_dal = require('./mongo-dal');
var async = require('async');
var utils = require('./utils');

var decide = function (conditions, callback) {
    var all_conditions_true = false;
    async.forEachOf(conditions, function (condition, key, callback) {
        async.parallel({
            variable1: function (callback) {
                get_variable_value(condition.variable1, callback);
            },
            variable2: function (callback) {
                get_variable_value(condition.variable2, callback);
            },
        },
            function (err, results) {
                if (err) {
                    all_conditions_true = false;
                    return callback(err);
                }

                switch (condition.comparison) {
                    case constants.enums.decision_condition_operands.GREATER:
                        all_conditions_true = results.variable1 > results.variable2;
                        return callback();

                    case constants.enums.decision_condition_operands.LESS:
                        all_conditions_true = results.variable1 < results.variable2;
                        return callback();

                    case constants.enums.decision_condition_operands.EQUAL:
                        all_conditions_true = results.variable1 === results.variable2;
                        return callback();

                    default:
                        all_conditions_true = false;
                        return callback(new Error('Unsupported comparison method.'));
                }
            });
    }, function (err) {
        callback(all_conditions_true);
    });
};
// 
// var eval_condition = function (condition, callback) {
// 
// };

var get_variable_value = function (variable_definition, callback) {
    switch (variable_definition.type) {
        case constants.enums.decision_variable_types.SCALAR:
            callback(null, variable_definition.value);
            break;

        case constants.enums.decision_variable_types.STAT:
            mongo_dal.ticks_dal.get_last_valid_stat(variable_definition.stat_id, function (err, stat) {
                if (err) {
                    callback(err);
                } else if (isNaN(stat.value)) {
                    callback(new Error('Stat value is not a number.'));
                } else {
                    callback(null, utils.round_number(stat.value));
                }
            });
            break;

        case constants.enums.decision_variable_types.TRANSACTION:
            mongo_dal.transactions_dal.get_last_transaction(variable_definition.transaction_running_mode ,function (err, transaction) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, utils.round_number(transaction.param.rate));
                }
            });
            break;
    }
};

module.exports = {
    decide: decide
};