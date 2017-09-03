const express = require('express')
const app = express()
const userRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const {Users} = require('../models')

userRouter.use(jsonParser)

userRouter.get('/', (req, res) => {
	Users
		.find()
		.exec()
		.then(users => {
			res.json({
				users: users.map(user => user.userRepr())
			})
		})
		.catch(err => {
			console.error(err)
			res.status(500).json({message: 'Internal server error'})
		})
})


module.exports = userRouter