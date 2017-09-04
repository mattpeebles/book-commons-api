const express = require('express')
const app = express()
const ebookRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise


const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const {Ebooks} = require('../models')


ebookRouter.use(jsonParser)


//Routes
//Get all ebooks, get particular ebook, post ebook, and delete ebook
//No need for put as there's nothing needed to be updated at this time


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
		.then(ebook => res.status(201).json(ebook.ebookRepr()))
		.catch(err => {
			console.error(err)
			res.status(500).json({message: 'Internal service error'})
		})
})

ebookRouter.delete('/:bookId', (req, res) => {
	Ebooks
		.findByIdAndRemove(req.params.bookId)
		.then(() => res.status(204).end())
})

module.exports = ebookRouter

