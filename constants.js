module.exports.enums = {
    //Enumerations
    currencies: Object.freeze({ USDBTC: 'USDBTC', BTCUSD: 'BTCUSD' }),
    running_modes: Object.freeze({ BUY_BITCOINS: 'BUY_BITCOINS', SELL_BITCOINS: 'SELL_BITCOINS' }),
    stats: Object.freeze({ ASK: 'ASK', BID: 'BID', PRICE_AVG: 'PRICE_AVG', RANGE: 'RANGE', STDEV: 'STDEV', VAR: 'VAR', EMA: 'EMA', SMA: 'SMA', MIN: 'MIN', MAX: 'MAX' }),
    decision_condition_types: Object.freeze({ STAT: 'STAT', TRANSACTION: 'TRANSACTION' })
};