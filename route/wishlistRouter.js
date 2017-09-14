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

const passport = require('passport');

const {Users, Wishlists, Ebooks} = require('../models')

wishlistRouter.use(jsonParser)

	//authorize
	//get all wishlists associated with logged in user
wishlistRouter.get('/', passport.authenticate('jwt', {session: false}), (req, res) => {
	
	return Users
		.findById(req.user.id)
		.exec()
		.then(user => {
			let wishlists = user.wishlists

			let findArgs = []
			
			wishlists.forEach(list => {
				findArgs.push(new mongoose.Types.ObjectId( list ))
			})
			
			return Wishlists
				.find({'_id': {$in: findArgs}})
				.exec()
		})
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


	//authorize
	//post new wishlist, isolated from user wishlist array
	//must subsequently call /users/:userId/add/:listId to
	//succesfully add it to user
wishlistRouter.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {
	
	let items = (req.body.items !== undefined) ? req.body.items : []
	let wishlist;

	Wishlists
		.create({
			title: req.body.title,
			items: items
		})
		.then(list => {
			 wishlist = list.listRepr()

			return Users
				.findById(req.user.id)
				.exec()
		})
		.then(user => {
			
			let wishlistsArray = [...user.wishlists, wishlist.id]
			
			let updateWishlists = {
				wishlists: wishlistsArray
			}

				//updates logged in user with new wishlist id
			Users
				.findByIdAndUpdate(req.user.id, {$set: updateWishlists}, {new: true})
				.exec()
				.then(user => {
					res.status(201).json({user: user.userRepr(), wishlist: wishlist})
				})
		})
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



	//authorize
wishlistRouter.delete('/:listId',  passport.authenticate('jwt', {session: false}), (req, res) => {
	
	return Users
		.findById(req.user.id)
		.exec()

	.then(user => {
		let wishlistsArray = user.wishlists.filter(list => list !== req.params.listId)
		return {
			wishlists: wishlistsArray
		}
	})
	.then(updateUser => {
		return Users
			.findByIdAndUpdate(req.user.id, {$set: updateUser}, {new: true})
			.exec()
	})
	.then(() => {
		return Wishlists
			.findByIdAndRemove(req.params.listId)
	})
	.then(() => {
		console.log(`${req.params.listId} Wishlist was removed`)
		res.status(204).end()
	})
});

module.exports = wishlistRouter