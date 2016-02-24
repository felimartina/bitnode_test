var mongo_dal = require('./mongo-dal');
var constants = require('./constants');
var logger = require('./logger');
var stats = require('./stats-calculator');

var tick = function (bit_driver, stats_definition, historical_stats_definitions, callback) {
    bit_driver.tick(function (current_tick) {
        tick.stats = stats.calculate_single_stats(current_tick, stats_definition);
        mongo_dal.ticks_dal.insert(current_tick, function (){
            // calculate historical stats for the this tick
            stats.calculate_historical_stats(current_tick._id, historical_stats_definitions);
        });

        logger.info('price avg: %s (ask: %s - bid: %s)', current_tick.price_avg, current_tick.ask, current_tick.bid);
        if (callback) callback(current_tick);
    });
};

module.exports = {
    tick: tick
};
