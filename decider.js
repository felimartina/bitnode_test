var constants = require('./constants');
var logger = require('./logger');
var mongo_dal = require('./mongo-dal');

var decide = function (buy_conditions) {
    var eval_conditions = buy_conditions.map(function (condition) {
        return new Promise(function (resolve, reject) {
            if (eval_stat_condition(condition)) {
                resolve();
            } else {
                reject();
            }
        });
    });
    Promise.all(eval_conditions).then(logger.info('ALL DECISIONS MET'));
    
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
    var variable1, variable2;
    get_variable_value(condition.variable1, function (value) {
        variable1 = value;
    });
    get_variable_value(condition.variable2, function (value) {
        variable2 = value;
    });
};

var get_variable_value = function (variable_definition, callback) {
    switch (variable_definition.type) {
        case constants.enums.decision_variable_types.SCALAR:
            callback(variable_definition.value);
            break;

        case constants.enums.decision_variable_types.STAT:

            mongo_dal.ticks_dal.get_last_valid_stat(variable_definition.stat_id, function (stat) {
                if (stat) {
                    callback(stat.value);
                }
            });
            break;

        case constants.enums.decision_variable_types.TRANSACTION:
            break;
    }
};

module.exports ={
    decide: decide
};