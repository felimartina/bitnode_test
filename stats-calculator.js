var logger = require('./logger');
var constants = require('./constants');
var gauss = require('gauss');
var mongo_dal = require('./mongo-dal'); 

var calculate_stat = function (stat, callback) {
    mongo_dal.ticks_dal.read_last_ticks(stat.ticks_to_use,function (docs) {
        if (docs.length === 0) return;
        var avg_price_array = docs.map(function (tick) {
            return tick.price_avg;
        });
        avg_price_array = avg_price_array.toVector();
        stat.tick_id = docs[0]._id;
        switch (stat.name) {
            case constants.enums.stat.STDEV:
                stat.value = avg_price_array.stdev();
                break;
            case constants.enums.stat.VAR:
                stat.value = avg_price_array.variance();
                break;
            case constants.enums.stat.SMA:
                stat.value = avg_price_array.sma(stat.ticks_to_use)[0];
                break;
            case constants.enums.stat.EMA:
                stat.value = avg_price_array.ema(stat.ticks_to_use)[0];
                break;
            case constants.enums.stat.MIN:
                stat.value = avg_price_array.min();
                break;
            case constants.enums.stat.MAX:
                stat.value = avg_price_array.max();
                break;
            default:
                logger.error('Unsupported stat: %s', stat.name);
                break;
        }
        callback(stat);
    });
};
    
/**
 *  Calculates stats for a given tick based upon previous ticks 
 * @param {tick} tick - tick to calculate stats upon
 * @param {[tick]} tick_history - history of ticks
 *  */
var calculate_stats = function (stats_definitions, callback) {
    stats_definitions.forEach(function (element) {
        calculate_stat(element, function (stat) {
            mongo_dal.stats_dal.insert(stat);
        });
    }, this);
};

module.exports = {
    calculate_stats: calculate_stats
};