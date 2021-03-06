//Routes
//Get all ebooks, get particular ebook, get all ebooks in wishlist, post ebook, and delete ebook

const express = require('express');
const app = express();
const ebookRouter = express.Router();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;


const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const {AMAZON_SECRET} = require('../config')
const {Wishlists, Ebooks} = require('../models');

const amazon = require('amazon-product-api')


ebookRouter.use(jsonParser);

	//get all ebooks in database
ebookRouter.get('/', (req, res) => {
	Ebooks
		.find()
		.exec()
		.then(ebooks => {
			res.json({
				ebooks: ebooks.map(ebook => ebook.ebookRepr())
			});
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal service error'});
		})
});


ebookRouter.get('/amazon/:title', (req, res) => {
	let client = amazon.createClient({
		  awsId: "AKIAJXDEMJUFMXSLH7PQ",
		  awsSecret: `${AMAZON_SECRET}`,
		  awsTag: "book-commons-20"
		});

	client.itemSearch({
		title: `${req.params.title}`,
		searchIndex: 'Books',
		responseGroup: 'EditorialReview,ItemAttributes,ItemIds,Medium,Offers'
	})
	.then(ebooks => {
		res.json({ebooks: ebooks})
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal service error'});
	})
});
	
	//get particular ebook by id
ebookRouter.get('/:bookId', (req, res) => {
	Ebooks
		.findById(req.params.bookId)
		.exec()
		.then(ebook => {
			res.json(ebook.ebookRepr());
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal service error'});
		})
});

	//returns all ebooks in wishlist
ebookRouter.get('/wishlist/:listId', (req, res) => {

	Wishlists
		.findById(req.params.listId)
		.exec()
		.then(list => {
			let items = list.items;
			
			let findArgs = [];

				//creates arguments to pass into find, converts ids back into mongoose ids
			items.forEach(list => {
				findArgs.push(new mongoose.Types.ObjectId( list ))
			});

			Ebooks
				.find({'_id': {$in: findArgs}})
				.exec()
				.then(ebooks => {
					res.json({ebooks: ebooks.map(ebook => ebook.ebookRepr())});
				})
				.catch(err => {
					console.error(err);
					res.status(500).json({message: 'Internal service error'});
				})
		})
});

	//add new ebook to database, prevents duplicates by checking title, formats, and database it was pulled from
ebookRouter.post('/', (req, res) => {
	Ebooks
		.find({title: req.body.title, formats: req.body.formats, database: req.body.database})
		.count()
		.exec()
		.then(count => {
				//if book doesn't already exist in database, posts new one
			if(count === 0){
				Ebooks
					.create({
						database: req.body.database,
						icon: req.body.icon,
						title: req.body.title,
						author: req.body.author,
						preview: req.body.preview,
						publishDate: req.body.publishDate,
						languages: req.body.languages,
						pages: req.body.pages,
						formats: req.body.formats,
						location: req.body.location
					})
					.then(ebook => {
						res.status(201).json({ebook: ebook.ebookRepr()});
					})
					.catch(err => {
						console.error(err);
						res.status(500).json({message: 'Internal service error'});
					})
			} else { //if it does exist, the returns the one that exists
				Ebooks
					.find({title: req.body.title, pages: req.body.pages, location: req.body.location})	
					.exec()
					.then(book => {
						res.json({message: 'Book exists in database already', ebook: book[0].ebookRepr()})
					})
					.catch(err => {
						console.error(err)
						res.status(500).json({message: 'Internal service error'})
					})
			};
		})
});
	
	//removes ebook from database
ebookRouter.delete('/:bookId', (req, res) => {
	Ebooks
		.findByIdAndRemove(req.params.bookId)
		.then(() => res.status(204).end())
});

module.exports = ebookRouter;

