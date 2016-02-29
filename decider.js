var constants = require('./constants');
var logger = require('./logger');
var mongo_dal = require('./mongo-dal');
var async = require('async');
var decide = function (buy_conditions) {
    async.each(buy_conditions, eval_stat_condition(buy_conditions));
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

var eval_stat_condition = function (condition, callback) {
    async.parallel({
        variable1: get_variable_value(condition.variable1),
        variable2: get_variable_value(condition.variable2)
    },
    function (err, results) {
        if (err) callback(err, null);
        switch (condition.comparison) {
            case constants.enums.decision_variable_types.GREATER:
                callback(null, results.variable1 > results.variable2);
                break;

            case constants.enums.decision_variable_types.LESS:
                callback(null, results.variable1 < results.variable2);
                break;

            case constants.enums.decision_variable_types.EQUAL:
                callback(null, results.variable1 === results.variable2);
                break;
        }
    });
};

var get_variable_value = function (variable_definition, callback) {
    switch (variable_definition.type) {
        case constants.enums.decision_variable_types.SCALAR:
            callback(null, variable_definition.value);
            break;

        case constants.enums.decision_variable_types.STAT:
            mongo_dal.ticks_dal.get_last_valid_stat(variable_definition.stat_id, function (stat) {
                if (stat && !isNaN(stat.value)) {
                    callback(null, stat.value);
                }
                else {
                    callback('error: unable to read stat value.', null);
                }
            });
            break;

        case constants.enums.decision_variable_types.TRANSACTION:
            break;
    }
};

var eval_condition
module.exports = {
    decide: decide
};