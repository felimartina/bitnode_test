var logger = require('./logger');
var constants = require('./constants');
var gauss = require('gauss');
var mongo_dal = require('./mongo-dal');

var find_stat_in_stat_array = function (stats, stat_name) {
    return stats.find(function (element, index, array) {
        return element.name === stat_name;
    });
};

var calculate_historical_stat = function (stat, callback) {
    //TODO - Only take last X ticks older than current tick
    mongo_dal.ticks_dal.read_last_ticks(stat.ticks_to_use, function (docs) {
        //Don't calculate stat if we don't have enough ticks, otherwise data would be innacurate
        if (docs.length < stat.ticks_to_use) return;
        var variables_to_evaluate_array = [];
        //find stat to evaluate for each tick and add it to  
        for (var i = 0; i < docs.length; i++) {
            var tick = docs[i];
            var found_stat = find_stat_in_stat_array(tick.stats, stat.variable);

            if (found_stat && found_stat.value) {
                variables_to_evaluate_array.push(found_stat.value);
            } else {
                stat.error = 'Unable calculate stat because variable is not present on all previous ticks';
                logger.error(stat.error);
                callback(stat);
                return;
            }
        }

        variables_to_evaluate_array = variables_to_evaluate_array.toVector();
        switch (stat.name) {
            case constants.enums.stats.STDEV:
                stat.value = variables_to_evaluate_array.stdev();
                break;
            case constants.enums.stats.VAR:
                stat.value = variables_to_evaluate_array.variance();
                break;
            case constants.enums.stats.SMA:
                stat.value = variables_to_evaluate_array.sma(stat.ticks_to_use)[0];
                break;
            case constants.enums.stats.EMA:
                stat.value = variables_to_evaluate_array.ema(stat.ticks_to_use)[0];
                break;
            case constants.enums.stats.MIN:
                stat.value = variables_to_evaluate_array.min();
                break;
            case constants.enums.stats.MAX:
                stat.value = variables_to_evaluate_array.max();
                break;
            default:
                logger.error('Unsupported historical stat: %s', stat.name);
                break;
        }
        if (callback) callback(stat);
    });
};
    
/**
 *  Calculates stats for a given tick based upon previous ticks 
 * @param {tick} tick - tick to calculate stats upon
 * @param {[tick]} tick_history - history of ticks
 *  */
var calculate_historical_stats = function (tick_id, stats_definitions) {
    stats_definitions.forEach(function(stat) {
        calculate_historical_stat(stat, function (calculated_stat) {
            mongo_dal.ticks_dal.add_stat(tick_id, calculated_stat);
        });
    }, this);
};

var calculate_single_stats = function (tick, stats_definitions, callback) {
    var calculated_stats = [];
    for (var i = 0; i < stats_definitions.length; i++) {
        var stat_name = stats_definitions[i].name;
        switch (stat_name) {
            case constants.enums.stats.ASK:
                calculated_stats.push({ name: stat_name, value: parseFloat(tick.ask) });
                break;
            case constants.enums.stats.BID:
                calculated_stats.push({ name: stat_name, value: parseFloat(tick.bid) });
                break;
            case constants.enums.stats.PRICE_AVG:
                calculated_stats.push({ name: stat_name, value: (parseFloat(tick.bid) + parseFloat(tick.ask)) / 2 });
                break;
            case constants.enums.stats.RANGE:
                calculated_stats.push({ name: stat_name, value: parseFloat(tick.ask) - parseFloat(tick.bid) });
                break;
            default:
                logger.error('Unsupported single stat: %s', stat_name);
                break;
        }
    }
    return calculated_stats;
};

module.exports = {
    calculate_historical_stats: calculate_historical_stats,
    calculate_single_stats: calculate_single_stats
};