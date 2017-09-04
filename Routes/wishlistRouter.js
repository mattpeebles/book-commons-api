const express = require('express')
const app = express()
const wishlistRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()


const {Wishlists} = require('../models')

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

wishlistRouter.post('/', (req, res) => {
	
	console.log(req.body.title)

	let title = req.body.title

	let wishlist = {
		title: title,
		items: []
	}

	Wishlists
		.create(wishlist)
		.then(list => res.status(201).json(list.listRepr()))
		.catch(err => {
			console.error(err)
			return res.status(500).json({message: 'Internal server error'})
		})
})

wishlistRouter.put('/:id', (req, res) => {
	if (!(req.params.id === req.body.id)){
		const message = (
		  `Request path entryId (${req.params.entryId}) and request body entryId ` +
		  `(${req.body.entryId}) must match`);
		console.error(message);
		res.status(400).json({message: message});
	}


	let wishlist = req.params.id
	let toUpdate = {}

	const updateableFields = ['title']

	updateableFields.forEach(field => {
		if(field in req.body){
			toUpdate[field] = req.body[field]
		}
	})

	Wishlists
		.findByIdAndUpdate(req.body.id, {$set: toUpdate}, {new: true})
		.then(wishlist => res.status(201).json(wishlist.listRepr()))
})



wishlistRouter.delete('/:id', (req, res) => {
	let wishlist;

	Wishlists
		.findById(req.params.id)
		.then(list => {
			wishlist = list
		})

	Wishlists
		.findByIdAndRemove(req.params.id)
		.then(() => {
			console.log(`${wishlist.title} Wishlist was removed`)
			res.status(204).end()
		})
})
module.exports = wishlistRouter