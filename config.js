var mode = 'PROD'; //CHANGE THIS TO 'PROD' if you want to run on prod mode

if (mode === 'TEST') {
    module.exports = {
        user: '',
        pass: '',
        uphold_server: 'api-sandbox.uphold.com',
        mongo_server: ''
    };
} else {
    module.exports = {
        user: '',
        pass: '',
        uphold_server: 'api.uphold.com',
        mongo_server: ''
    };
}