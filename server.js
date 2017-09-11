	//Environment Setup
require('dotenv').config();
const express = require('express')
const app = express()
//const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

	//Routers
const userRouter = require('./Routes/userRouter');
const wishlistRouter = require('./Routes/wishlistRouter')
const ebookRouter = require('./Routes/ebookRouter');
const {router: authRouter, basicStrategy, jwtStrategy} = require('./auth')

const {PORT, DATABASE_URL} = require('./config');

// app.use(
// 	cors({
//         origin: CLIENT_ORIGIN,
//         'Access-Control-Allow-Credentials': true
//     })
// );


	//Middleware
app.use(morgan('common'))
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(passport.initialize());
passport.use(basicStrategy);
passport.use(jwtStrategy);

app.use('/auth/', authRouter)
app.use('/users', userRouter)
app.use('/wishlists', wishlistRouter)
app.use('/ebooks', ebookRouter)



	//Server
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