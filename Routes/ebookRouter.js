const express = require('express')
const app = express()
const ebookRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise


const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const {Ebooks} = require('../models')


ebookRouter.use(jsonParser)


// TODO
// Add route to get particular book in database
// Add route to post ebook to database
// Add route to update ebook in database
// Add route to remove ebook from database


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

module.exports = ebookRouter

