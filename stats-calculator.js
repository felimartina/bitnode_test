var logger = require('./logger');
var constants = require('./constants');
var gauss = require('gauss');
var mongo_dal = require('./mongo-dal');

var calculate_historical_stat = function (stat, callback) {
    mongo_dal.ticks_dal.read_last_ticks(stat.ticks_to_use, function (docs) {
        //Don't calculate stat if we don't have enough ticks, otherwise data would be innacurate
        if (docs.length < stat.ticks_to_use) return;
        var avg_price_array = [];
        //find stat to evaluate for each tick and add it to  
        docs.forEach(function (tick) {
            var found_stat = tick.stats.find(function (element, index, array) {
                return element.name === stat.variable;
            });
            
            if (found_stat && found_stat.value) {
                avg_price_array.push(found_stat.value);
            } else {
                stat.error = 'Unable calculate stat because variable is not present on all previous ticks';
                logger.error(stat.error);
                callback(stat);
                return;
            }
        }, this);
        
        avg_price_array = avg_price_array.toVector();
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
                logger.error('Unsupported historical stat: %s', stat.name);
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
var calculate_historical_stats = function (tick_id, stats_definitions, callback) {
    stats_definitions.forEach(function (element) {
        calculate_historical_stat(element, function (stat) {
            mongo_dal.ticks_dal.add_stat(tick_id, stat);
        });
    }, this);
};

var calculate_single_stats = function (tick, stats_definitions, callback) {
    stats_definitions.forEach(function (stat) {
        switch (stat.name) {
            case constants.enums.stat.ASK:
                stat.value = parseFloat(tick.ask);
                break;
            case constants.enums.stat.BID:
                stat.value = parseFloat(tick.bid);
                break;
            case constants.enums.stat.PRICE_AVG:
                stat.value = (tick.bid + tick.ask) / 2;
                break;
            case constants.enums.stat.RANGE:
                stat.value = tick.ask - tick.bid;
                break;
                
            default:
                logger.error('Unsupported single stat: %s', stat.name);
                break;
        }
    }, this);
    return stats_definitions;
};

module.exports = {
    calculate_historical_stats: calculate_historical_stats,
    calculate_single_stats: calculate_single_stats
};