module.exports.enums = {
    //Enumerations
    currencies: Object.freeze({ USDBTC: 'USDBTC', BTCUSD: 'BTCUSD', BTC: 'BTC', USD: 'USD' }),
    running_modes: Object.freeze({ BUY_BITCOINS: 'BUY_BITCOINS', SELL_BITCOINS: 'SELL_BITCOINS' }),
    stats: Object.freeze({ ASK: 'ASK', BID: 'BID', PRICE_AVG: 'PRICE_AVG', RANGE: 'RANGE', STDEV: 'STDEV', VAR: 'VAR', EMA: 'EMA', SMA: 'SMA', MIN: 'MIN', MAX: 'MAX' }),
    decision_variable_types: Object.freeze({ STAT: 'STAT', TRANSACTION: 'TRANSACTION', SCALAR: 'SCALAR' }),
    decision_transaction_types: Object.freeze({ BUY: 'BUY', SELL: 'SELL', BALANCE: 'BALANCE' }),
    decision_condition_operands: Object.freeze({ GREATER: 'GREATER', LESS: 'LESS', EQUAL: 'EQUAL' })
};