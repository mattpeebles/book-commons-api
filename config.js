
exports.DATABASE_URL = process.env.DATABASE_URL ||
				global.DATABASE_URL ||
				'mongodb://localhost/commons' //needs to match database name (obv)

exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
							'mongodb://localhost/test-commons'

exports.PORT = process.env.PORT || 4040


process.env['CLIENT_ORIGIN'] = 'https://book-commons.netlify.com'

exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'