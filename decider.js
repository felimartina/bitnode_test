var constants = require('./constants');
var logger = require('./logger');

var decide = function (conditions) {
    var eval_conditions = conditions.map(function (condition) {
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

var eval_stat_condition = function (condition) {
    

};