var mongo_dal = require('./mongo-dal');
var constants = require('./constants');
var logger = require('./logger');
var stats = require('./stats-calculator');

var tick = function (bit_driver, stats_definitions, callback) {
    bit_driver.tick(function (current_tick) {
        //parse tick values
        current_tick.bid = parseFloat(current_tick.bid);
        current_tick.ask = parseFloat(current_tick.ask);
        current_tick.price_avg = (current_tick.bid + current_tick.ask) / 2;
        current_tick.range = current_tick.ask - current_tick.bid;
        mongo_dal.ticks_dal.insert(current_tick, function (){
            // calculate stats for the this tick
            stats.calculate_stats(current_tick._id, stats_definitions);
        });

        logger.info('price avg: %s (ask: %s - bid: %s)', current_tick.price_avg, current_tick.ask, current_tick.bid);
        if (callback) callback(current_tick);
    });
};

module.exports = {
    tick: tick
};
