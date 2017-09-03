
exports.DATABASE_URL = process.env.DATABASE_URL ||
				global.DATABASE_URL ||
				'mongodb://localhost/commons' //needs to match database name (obv)

exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
							'mongodb://localhost/test-commons'

exports.PORT = process.env.PORT || 4040

exports.CLIENT_ORIGIN = process.env.origin