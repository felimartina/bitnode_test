var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectID = require('mongodb').ObjectID;
var logger = require('./logger');
var config = require('./config');

var db;
MongoClient.connect(config.mongo_server, function (err, connected_db) {
    assert.equal(null, err);
    db = connected_db;
});
module.exports = {
    ticks_dal: {
        insert: function (tick, callback) {
            tick.timestamp = Date.now();
            db.collection('ticks').insert(tick, function (err, doc) {
                if (err) {
                    logger.error('Cannot store current tick. err: %s tick:', err, tick);
                }
                if (callback) callback(doc);
            });
        },

        add_stat: function (tick_id, stat, callback) {
            db.collection('ticks').update({ _id: tick_id }, { $push: { stats: stat } }, function (err) {
                if (err) {
                    logger.error('Cannot add stat for tick "%s". err: %s', tick_id, err);
                }
                if (callback) callback();
            });
        },

        read_last_ticks: function (timestamp, ticks_to_read, skip, callback) {
            var filter_options = {
                limit: ticks_to_read,
                sort: [['timestamp', 'desc']],
                skip: skip
            };
            var filter = {
                timestamp: { '$lt': timestamp }
            };
            db.collection('ticks').find(filter, filter_options).toArray(function (err, docs) {
                if (err) {
                    logger.error('Cannot read ticks. err: %s', err);
                }
                if (callback) callback(docs);
            });
        },

        get_last_valid_stat: function (stat_id, callback) {
            var filter = [
                { '$sort': { 'timestamp': -1 } },
                { '$unwind': '$stats' },
                { '$match': { 'stats.id': stat_id, 'stats.value': { '$exists': true } } },
                { '$project': { 'name': '$stats.name', 'value': '$stats.value', 'variable': '$stats.variable' } },
                { '$limit': 1 }
            ];
            db.collection('ticks').aggregate(filter, {}, function (err, docs) {
                var stat = null;
                if (err) {
                    logger.error('Cannot read stat. err: %s', err);
                } else if (docs.length !== 0) {
                    stat = docs[0];
                }
                if (callback) callback(stat);
            });
        }
    }
};
// 
// var stats_collection = db.get('stats');
// var stats_dal = {
//     insert: function (stat, callback) {
//         stat.timestamp = Date.now();
//         //make sure _id is unique
//         stat._id = new ObjectID();
//         stats_collection.insert(stat, function (err, doc) {
//             if (err) {
//                 logger.error('Cannot store current stat. err: %s stat: ', err, stat);
//             }
//             if (callback) callback(doc);
//         });
//     },
// 
//     read_last_stats: function (stats_to_read, callback) {
//         var filter_options = {
//             limit: stats_to_read,
//             sort: [['timestamp', 'desc']]
//         };
//         ticks_collection.find({}, filter_options, function (err, docs) {
//             if (err) {
//                 logger.error('Cannot read ticks. err: %s', err);
//             }
//             if (callback) callback(docs);
//         });
//     }
// };
// 
// module.exports = {
//     ticks_dal: ticks_dal,
//     stats_dal: stats_dal
// };