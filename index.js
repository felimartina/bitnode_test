var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');
var broker = require('./broker')('felimartina@outlook.com', '!Taekuondo9132?');
broker.run({ running_mode: broker.enum_running_mode.SELL_BITCOINS, step: 1});
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