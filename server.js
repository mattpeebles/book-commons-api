const express = require('express')
const app = express()
const cors = require('cors');
const {PORT, DATABASE_URL, CLIENT_ORIGIN} = require('./config');

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const userRouter = require('./Routes/userRouter')
const wishlistRouter = require('./Routes/wishlistRouter')
const ebookRouter = require('./Routes/ebookRouter')

const {passport, authorize} = require('./auth')

app.use(
	cors({
        origin: CLIENT_ORIGIN
    })
);

app.use(require('cookie-parser')())
app.use(require('express-session')({secret: 'hand again pig something its cent while occur', resave: true, saveUninitialized: true, cookie: { secure : false, maxAge : (4 * 60 * 60 * 1000)} }))
app.use(passport.initialize())
app.use(passport.session())
app.use('/users', userRouter)
app.use('/wishlists', wishlistRouter)
app.use('/ebooks', ebookRouter)




let server;

function runServer(databaseURL = DATABASE_URL, port=PORT){
	return new Promise((resolve, reject) => {
		mongoose.connect(databaseURL, {useMongoClient: true}, err=> {
			if(err){
				return reject(err)
			}

			server = app.listen(port, () => {
				console.log(`Book commons api is listening on port ${port}`)
				resolve()
			})
			.on('error', (err) => {
				mongoose.disconnect()
				return reject(err)
			})
		})
	})
}

function closeServer(){
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing Server')
			server.close(err => {
				if (err){
					return reject(err)
				}
				resolve()
			})
		})
	})
}

if (require.main === module) {
	runServer().catch(err => console.error(err))
}

module.exports = {app, runServer, closeServer}