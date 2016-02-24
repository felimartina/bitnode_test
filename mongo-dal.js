var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/bitnode_test');
var ObjectID = require('mongodb').ObjectID;
var logger = require('./logger');

var ticks_collection = db.get('ticks');
var ticks_dal = {
    insert: function (tick, callback) {
        tick.timestamp = Date.now();
        ticks_collection.insert(tick, function (err, doc) {
            if (err) {
                logger.error('Cannot store current tick. err: %s tick:', err, tick);
            }
            if (callback) callback(doc);
        });
    },

    add_stat: function (tick_id, stat, callback) {
        ticks_collection.update(tick_id, { $push: { stats: stat } }, function (err) {
            if (err) {
                logger.error('Cannot add stat for tick "%s". err: %s', tick_id, err);
            }
            if (callback) callback();
        });
    }, 
    
    read_last_ticks: function (ticks_to_read, callback) {
        var filter_options = {
            limit: ticks_to_read,
            sort: [['timestamp', 'desc']]
        };
        ticks_collection.find({}, filter_options, function (err, docs) {
            if (err) {
                logger.error('Cannot read ticks. err: %s', err);
            }
            if (callback) callback(docs);
        });
    }
};

var stats_collection = db.get('stats');
var stats_dal = {
    insert: function (stat, callback) {
        stat.timestamp = Date.now();
        //make sure _id is unique
        stat._id = new ObjectID();
        stats_collection.insert(stat, function (err, doc) {
            if (err) {
                logger.error('Cannot store current stat. err: %s stat: ', err, stat);
            }
            if (callback) callback(doc);
        });
    },

    read_last_stats: function (stats_to_read, callback) {
        var filter_options = {
            limit: stats_to_read,
            sort: [['timestamp', 'desc']]
        };
        ticks_collection.find({}, filter_options, function (err, docs) {
            if (err) {
                logger.error('Cannot read ticks. err: %s', err);
            }
            if (callback) callback(docs);
        });
    }
};

module.exports = {
    ticks_dal: ticks_dal,
    stats_dal: stats_dal
};