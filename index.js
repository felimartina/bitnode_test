// var program = require('commander');
// var co = require('co');
// var prompt = require('co-prompt');
// var broker = require('./broker')('felimartina@outlook.com', '!Taekuondo9132?');
var bit_driver = require('./uphold_driver');
var ticker = require('./ticker');
var logger = require('./logger');
var constants = require('./constants');
var config = require('./config');
var decider = require('./decider');

var tick_interval = 10000; //10 sec
var stat_interval = 11000; //11 sec
var single_stats_definitions = [
    {
        id: 1,
        friendly_name: '',
        name: constants.enums.stats.ASK
    }, {
        id: 2,
        friendly_name: '',
        name: constants.enums.stats.BID
    }, {
        id: 3,
        friendly_name: '',
        name: constants.enums.stats.PRICE_AVG
    }, {
        id: 4,
        friendly_name: '',
        name: constants.enums.stats.RANGE
    }
];
var historical_stats_definitions = [
    {
        id: 5,
        friendly_name: 'STDEV OF PRICE_AVG TAKING 20 LAST TICKS.',
        name: constants.enums.stats.STDEV,
        ticks_to_use: 20,
        ticks_offset: 0,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 6,
        friendly_name: 'STDEV OF PRICE_AVG OF PREVIOUS 20 TICKS SKIPPING 20 LAST TICKS',
        name: constants.enums.stats.STDEV,
        ticks_to_use: 20,
        ticks_offset: 20,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 7,
        friendly_name: 'SMA OF PRICE_AVG TAKING 20 LAST TICKS',
        name: constants.enums.stats.SMA,
        ticks_to_use: 20,
        ticks_offset: 0,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 8,
        friendly_name: 'EMA OF PRICE_AVG TAKING 20 LAST TICKS',
        name: constants.enums.stats.EMA,
        ticks_to_use: 20,
        ticks_offset: 0,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 9,
        friendly_name: 'MIN PRICE_AVG FOR LAST 40 TICKS',
        name: constants.enums.stats.MIN,
        ticks_to_use: 40,
        ticks_offset: 0,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 10,
        friendly_name: 'MAX PRICE_AVG FOR LAST 40 TICKS',
        name: constants.enums.stats.MAX,
        ticks_to_use: 40,
        ticks_offset: 0,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 11,
        friendly_name: 'SMA OF RANGE TAKING 10 LAST TICKS',
        name: constants.enums.stats.SMA,
        ticks_to_use: 10,
        ticks_offset: 0,
        variable: constants.enums.stats.RANGE
    }, {
        id: 12,
        friendly_name: 'SMA OF RANGE TAKING 50 LAST TICKS',
        name: constants.enums.stats.SMA,
        ticks_to_use: 50,
        ticks_offset: 0,
        variable: constants.enums.stats.RANGE
    }, {
        id: 13,
        friendly_name: 'MAX PRICE_AVG FOR LAST 100 TICKS',
        name: constants.enums.stats.MAX,
        ticks_to_use: 100,
        ticks_offset: 0,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 14,
        friendly_name: 'MIN PRICE_AVG FOR LAST 100 TICKS',
        name: constants.enums.stats.MIN,
        ticks_to_use: 100,
        ticks_offset: 0,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 15,
        friendly_name: 'MAX PRICE_AVG OF PREVIOUS 40 TICKS SKIPPING 40 LAST TICKS ',
        name: constants.enums.stats.MAX,
        ticks_to_use: 40,
        ticks_offset: 40,
        variable: constants.enums.stats.PRICE_AVG
    }, {
        id: 16,
        friendly_name: 'MIN PRICE_AVG OF PREVIOUS 40 TICKS SKIPPING 40 LAST TICKS ',
        name: constants.enums.stats.MIN,
        ticks_to_use: 40,
        ticks_offset: 40,
        variable: constants.enums.stats.PRICE_AVG
    }
];
var sell_conditions = [
    {
        description: 'If PRICE_AVG STDEV is more than 0.5. Means that the market is inestable and volatile. It would be good to buy if it is trending down',
        variable1: {
            type: constants.enums.decision_variable_types.STAT,
            stat_id: 6
        },
        comparison: constants.enums.decision_condition_operands.GREATER,
        variable2: {
            type: constants.enums.decision_variable_types.SCALAR,
            value: 0.5
        }
    }, {
        description: 'If MAX for last 40 ticks is is less than MAX for previous 40 ticks. Means that market is going down (at list for this 40 ticks chunk), would be wise to sell before it goes further down.',
        variable1: {
            type: constants.enums.decision_variable_types.STAT,
            stat_id: 10
        },
        comparison: constants.enums.decision_condition_operands.LESS,
        variable2: {
            type: constants.enums.decision_variable_types.STAT,
            stat_id: 15
        }
    }
    // },
    // {
    //     variable1: {
    //         type: constants.enums.decision_variable_types.TRANSACTION,
    //         transaction_type: constants.enums.decision_transaction_types.SELL
    //     },
    //     comparison: constants.enums.decision_condition_operands.GREATER,
    //     variable2: {
    //         type: constants.enums.decision_variable_types.STAT,
    //         stat_id: 1
    //     }
    // }
];
var buy_conditions = [
    {
        description: 'If PRICE_AVG STDEV is more than 0.5. Means that the market is inestable and volatile. It would be good to buy if it is trending down',
        variable1: {
            type: constants.enums.decision_variable_types.STAT,
            stat_id: 6
        },
        comparison: constants.enums.decision_condition_operands.GREATER,
        variable2: {
            type: constants.enums.decision_variable_types.SCALAR,
            value: 0.5
        }
    }, {
        description: 'If MIN for last 40 ticks is is GREATER than MIN for previous 40 ticks. Means that market is going up (at list for this 40 ticks chunk). It would be wise to buy BTC before it goes further up.',
        variable1: {
            type: constants.enums.decision_variable_types.STAT,
            stat_id: 9
        },
        comparison: constants.enums.decision_condition_operands.GREATER,
        variable2: {
            type: constants.enums.decision_variable_types.STAT,
            stat_id: 16
        }
    }
    // },
    // {
    //     variable1: {
    //         type: constants.enums.decision_variable_types.TRANSACTION,
    //         transaction_type: constants.enums.decision_transaction_types.SELL
    //     },
    //     comparison: constants.enums.decision_condition_operands.GREATER,
    //     variable2: {
    //         type: constants.enums.decision_variable_types.STAT,
    //         stat_id: 1
    //     }
    // }
];
bit_driver.init(config.user, config.pass, function () {
    setInterval(function () {
        ticker.tick(bit_driver, single_stats_definitions, historical_stats_definitions);
    }, tick_interval);
    
    setInterval(function () {
        decider.decide(buy_conditions);
    }, tick_interval * 2);
});
// broker.run({ running_mode: broker.enum_running_mode.SELL_BITCOINS, step: 1 });
// program
//     .arguments('')
//     // .option('-u, --username <username>', 'The user to authenticate as')
//     // .option('-p, --password <password>', 'The user\'s password')
//     .action(function (file) {
//         co(function () {
//             // var username = yield prompt('username:');
//             // var password = yield prompt('password:');
//             // console.log('user: %s pass: %s file: %s',
//             //     file);
//             // broker.start();
//         });
//     })
//     .parse(process.argv);