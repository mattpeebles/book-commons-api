const {router} = require('./router');
const {basicStrategy, jwtStrategy} = require('./strategy');

module.exports = {router, basicStrategy, jwtStrategy};