
exports.DATABASE_URL = process.env.DATABASE_URL ||
				global.DATABASE_URL ||
				'mongodb://localhost/commons'; //needs to match database name (obv)

exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
							'mongodb://localhost/test-commons';

exports.PORT = process.env.PORT || 4040;

exports.JWT_SECRET = process.env.JWT_SECRET || 'secret';
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
exports.AMAZON_SECRET = process.env.AMAZON_SECRET || 'secret';