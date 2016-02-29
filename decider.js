var constants = require('./constants');
var logger = require('./logger');
var mongo_dal = require('./mongo-dal');
var async = require('async');
var utils = require('./utils');

var decide = function (buy_conditions) {
    var all_conditions_true = false;
    async.forEachOf(buy_conditions, function (condition, key, callback) {
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
                    callback(err);
                }

                switch (condition.comparison) {
                    case constants.enums.decision_condition_operands.GREATER:
                        all_conditions_true = results.variable1 > results.variable2;
                        callback();
                        break;

                    case constants.enums.decision_condition_operands.LESS:
                        all_conditions_true = results.variable1 < results.variable2;
                        callback();
                        break;

                    case constants.enums.decision_condition_operands.EQUAL:
                        all_conditions_true = results.variable1 === results.variable2;
                        callback();
                        break;

                    default:
                        all_conditions_true = false;
                        logger.error(new Error('Unsupported comparison method.'));
                        callback();
                }
            });
    }, function (err) {
        if (err) logger.error(err);
        if (all_conditions_true)
            logger.info('were all conditions true??? do something');
    });
    
    // var eval_conditions = buy_conditions.map(function (condition) {
    //     return new Promise(function (resolve, reject) {
    //         if (eval_stat_condition(condition)) {
    //             resolve();
    //         } else {
    //         }
    //     });
    // });
    // Promise.all(eval_conditions).then(logger.info('ALL DECISIONS MET'));
    
    //     var satisfies_all = false;
    //     for (var i = 0; i < conditions.length; conditions++) {
    //         var condition = conditions[i];
    //         switch (condition.type) {
    //             case constants.decision_condition_types.STAT:
    //                 satisfies_all = eval_stat_condition(condition);
    //                 break;
    // 
    //             case constants.decision_condition_types.TRANSACTION:
    //                 satisfies_all = something;
    //                 break;
    // 
    //             default:
    //                 logger.error('Unsupported condition type: %s', condition.type);
    //                 break;
    //         }
    //     }
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
            mongo_dal.ticks_dal.get_last_valid_stat(variable_definition.stat_id, function (stat) {
                if (!stat) {
                    callback(new Error('Stat not found.'));
                } else if (isNaN(stat.value)) {
                    callback(new Error('Stat value is not a number.'));
                }
                else {
                    callback(null, utils.round_number(stat.value));
                }
            });
            break;

        case constants.enums.decision_variable_types.TRANSACTION:
            break;
    }
};

module.exports = {
    decide: decide
};