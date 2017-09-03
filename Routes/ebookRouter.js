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

module.exports = ebookRouter

