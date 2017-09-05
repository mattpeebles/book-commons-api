//Routes
//Get all ebooks, get particular ebook, post ebook, and delete ebook

const express = require('express')
const app = express()
const ebookRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise


const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const {Ebooks} = require('../models')


ebookRouter.use(jsonParser)

ebookRouter.get('/', (req, res) => {
	Ebooks
		.find()
		.exec()
		.then(ebooks => {
			res.json({
				ebooks: ebooks.map(ebook => ebook.ebookRepr())
			})
		})
		.catch(err => {
			console.error(err)
			res.status(500).json({message: 'Internal service error'})
		})
})

ebookRouter.get('/:bookId', (req, res) => {
	Ebooks
		.findById(req.params.bookId)
		.exec()
		.then(ebook => {
			res.json(ebook.ebookRepr())
		})
		.catch(err => {
			console.error(err)
			res.status(500).json({message: 'Internal service error'})
		})
})

ebookRouter.post('/', (req, res) => {
	Ebooks
		.find({title: req.body.title, pages: req.body.pages, location: req.body.location})
		.count()
		.exec()
		.then(count => {
				//if book doesn't already exist in database, posts new one
			if(count === 0){
				Ebooks
					.create({
						title: req.body.title,
						author: req.body.author,
						preview: req.body.preview,
						publishDate: req.body.publishDate,
						languages: req.body.languages,
						pages: req.body.pages,
						formats: req.body.formats,
						location: req.body.location,
						locationIcon: req.body.locationIcon,
						locationUrl: req.body.locationUrl
					})
					.then(ebook => {
						res.status(201).json(ebook.ebookRepr())
					})
					.catch(err => {
						console.error(err)
						res.status(500).json({message: 'Internal service error'})
					})
			}
				//if it does exist, the returns the one that exists
			else {
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
			}
		})
})

ebookRouter.delete('/:bookId', (req, res) => {
	Ebooks
		.findByIdAndRemove(req.params.bookId)
		.then(() => res.status(204).end())
})

module.exports = ebookRouter

