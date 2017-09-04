const express = require('express')
const app = express()
const wishlistRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()


const {Wishlists} = require('../models')

wishlistRouter.use(jsonParser)


// TODO
// add itemid to items array
// update item wishlist location
// remove item from wishlist

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


wishlistRouter.get('/:listId', (req, res) => {
	Wishlists
		.findById(req.params.listId)
		.exec()
		.then(list => res.json(list.listRepr()))
		.catch(err => {
			console.error(err)
			res.status(500).json({message: 'Internal server error'})
		})
});


wishlistRouter.post('/', (req, res) => {
	Wishlists
		.create({
			title: req.body.title,
			items: []
		})
		.then(list => res.status(201).json(list.listRepr()))
		.catch(err => {
			console.error(err)
			return res.status(500).json({message: 'Internal server error'})
		})
});

wishlistRouter.put('/:listId', (req, res) => {
	if (!(req.params.listId === req.body.id)){
		const message = (
		  `Request path entryId (${req.params.entryId}) and request body entryId ` +
		  `(${req.body.entryId}) must match`);
		console.error(message);
		res.status(400).json({message: message});
	}

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
});



wishlistRouter.delete('/:listId', (req, res) => {
	Wishlists
		.findByIdAndRemove(req.params.listId)
		.then(() => {
			console.log(`${req.params.listId} Wishlist was removed`)
			res.status(204).end()
		})
});

module.exports = wishlistRouter