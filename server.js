const express = require('express')
const app = express()
const cors = require('cors');
const {PORT, DATABASE_URL, CLIENT_ORIGIN} = require('./config');

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const userRouter = require('./userRouter')
const wishlistRouter = require('./wishlistRouter')

app.use('/users', userRouter)
app.use('/wishlists', wishlistRouter)

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);


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

app.get('/api/*', (req, res) => {
	res.json({ok: true})
})


if (require.main === module) {
	runServer().catch(err => console.error(err))
}

module.exports = {app, runServer, closeServer}