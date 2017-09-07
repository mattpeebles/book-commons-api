//Routes
//Get all user wishlists, get particular wishlist, post new wishlist, update wishlist items adding ebook,
//update wishlist items by removing ebook, update wishlist by changing title, and delete wishlist


const express = require('express')
const app = express()
const wishlistRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const {passport, authorize} = require('../auth')

const {Wishlists, Ebooks} = require('../models')

wishlistRouter.use(jsonParser)

	//get all wishlists associated with logged in user
wishlistRouter.get('/', authorize, (req, res) => {
	
	let wishlists = req.user.wishlists

	let findArgs = []
	
	wishlists.forEach(list => {
		findArgs.push(new mongoose.Types.ObjectId( list ))
	})

	Wishlists
		.find({'_id': {$in: findArgs}})
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

	//get particular wishlist by id
wishlistRouter.get('/:listId', (req, res) => {
	Wishlists
		.findById(req.params.listId)
		.exec()
		.then(list => {
			if(list === null){
				return res.json({message: `Wishlist does not exist`})
			}

			res.json(list.listRepr())
		})
		.catch(err => {
			console.error(err)
			res.status(500).json({message: 'Internal server error'})
		})
});

	//post new wishlist, isolated from user wishlist array
	//must subsequently call /users/:userId/add/:listId to
	//succesfully add it to user
wishlistRouter.post('/', authorize, (req, res) => {
	
	let items = (req.body.items !== undefined) ? req.body.items : []

	Wishlists
		.create({
			title: req.body.title,
			items: items
		})
		.then(list => res.status(201).json(list.listRepr()))
		.catch(err => {
			console.error(err)
			return res.status(500).json({message: 'Internal server error'})
		})
});

	//update title of wishlist
wishlistRouter.put('/:listId', (req, res) => {
	if (!(req.params.listId === req.body.listId)){
		const message = (
		  `Request path listId (${req.params.listId}) and request body listId ` +
		  `(${req.body.listId}) must match`);
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
		.findByIdAndUpdate(req.body.listId, {$set: toUpdate}, {new: true})
		.then(wishlist => res.status(201).json(wishlist.listRepr()))
});

	//add book id to wish list items array
wishlistRouter.put('/:listId/add/:bookId', (req, res) => {
	if (!(req.params.listId === req.body.listId)){
		const message = (
		  `Request path listId (${req.params.listId}) and request body listId ` +
		  `(${req.body.id}) must match`);
		console.error(message);
		res.status(400).json({message: message});
	}

	let wishlist;
	let toUpdate;

	Wishlists
		.findById(req.params.listId)
		.exec()
		.then(list => {
			
			if(list.items.indexOf(req.params.bookId) > -1){
				res.status(202).json({message: 'Item already exists in wishlist'})
			}

			else{
				list.items.push(req.params.bookId)
				
				toUpdate = {
					items: list.items
				}

				Wishlists
					.findByIdAndUpdate(req.body.listId, {$set: toUpdate}, {new: true})
					.then(list => res.status(201).json(list.listRepr()))
			}
		})
})

	//remove book from wishlist
wishlistRouter.put('/:listId/delete/:bookId', (req, res) => {
	if (!(req.params.listId === req.body.listId)){
		const message = (
		  `Request path listId (${req.params.listId}) and request body listId ` +
		  `(${req.body.listId}) must match`);
		console.error(message);
		res.status(400).json({message: message});
	}


	Wishlists
		.findById(req.params.listId)
		.exec()
		.then(list => {
			let updatedItems = {
				id: req.params.listId,
				items: list.items.filter(item => item !== req.params.bookId)
			}

			Wishlists
				.findByIdAndUpdate(req.params.listId, {$set: updatedItems}, {new: true})
				.then(list => {
					res.status(201).json({message: 'Ebook removed from wishlist', wishlist: list.listRepr()})
				})
		})
})



wishlistRouter.delete('/:listId', (req, res) => {
	Wishlists
		.findByIdAndRemove(req.params.listId)
		.then(() => {
			console.log(`${req.params.listId} Wishlist was removed`)
			res.status(204).end()
		})
});

module.exports = wishlistRouter