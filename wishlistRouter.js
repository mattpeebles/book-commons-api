const express = require('express')
const app = express()
const wishlistRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()


const {Wishlists} = require('./models')

wishlistRouter.use(jsonParser)


wishlistRouter.get('/', (req, res) => {
	Wishlists
		.find()
		.exec()
		.then(wishlists => {
			res.json({wishlists: 
				wishlists.map(list => list.listRepr())
			})
		})
		.catch(err => {
			console.error(err)
			res.status(500).json({message: 'Internal server error'})
		})
})

module.exports = wishlistRouter