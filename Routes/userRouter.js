const express = require('express')
const app = express()
const userRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const {Users} = require('../models')

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const {passport, authorize} = require('../auth')

userRouter.use(jsonParser)
userRouter.use(jsonParser)
userRouter.use(require('cookie-parser')())
userRouter.use(require('express-session')({secret: 'hand again pig something its cent while occur', resave: true, saveUninitialized: true, cookie: { secure : false, maxAge : (4 * 60 * 60 * 1000)} }))
userRouter.use(passport.initialize())
userRouter.use(passport.session())


// TODO
// Post wishlist to wishlist array
// Remove wishlist from wishlist array
// Remove profile
// 	then wishlists
// 	then ebooks

userRouter.post('/login', function handleLocalAuthentication(req, res, next) {
    passport.authenticate('local', function(err, user, info) {  
        if (err) return next(err);
        if (!user) {
            return res.status(403).json({
                message: "no user found"
            });
        }

        // Manually establish the session...
        req.login(user, function(err) {
            if (err) return next(err);
            res.status(201).json({message: 'Logged in', user: user.userRepr()})
        });
    })(req, res, next);
});

userRouter.get('/logout', (req, res) => {
	req.logOut()
	return res.status(200).json({message: 'Log out successful'})

})


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

userRouter.get('/me', authorize, (req, res) => {
	res.json({user: req.user.userRepr()})
})

userRouter.post('/', (req, res) => {
	if (!req.body){
		return res.status(400).json({message: 'No request body'})
	}

	if (!('email' in req.body)){
		return res.status(400).json({message: 'Missing field: email'})
	}

	let {email, password} = req.body

	if(typeof(email) !== 'string'){
		return res.status(422).json({message: 'Incorrect field type: email'})
	}

	if (!(password)){
		return res.status(422).json({message: 'Missing field: password'})
	}

	if (typeof password !== 'string'){
		return res.status(422).json({message: 'Incorrect field type: password'})
	}

	password = password.trim()

	if (password === ''){
		return res.status(422).json({message: 'Incorrect field length: password'})
	}

	Users
		.find({email})
		.count()
		.exec()
		.then(count => {
			if(count > 0){
				return res.status(422).json({message: 'Email has already been used'})
			}

			return Users.hashPassword(password)
		})
		.then(hash => {
			return Users
				.create({
					email: email,
					password: hash
				})
		})
		.then(user => {
			return res.status(201).json(user.userRepr())
		})
		.catch(err => {
			res.status(500).json({message: 'Internal server error'})
		})
})

userRouter.put('/:userId', authorize, (req, res) => {
	if(!(req.params.userId === req.body.id)){
		const message = (
		  `Request path id (${req.params.userId}) and request body id ` +
		  `(${req.body.id}) must match`);
		console.error(message);
		res.status(400).json({message: message});		
	}

	const toUpdate = {}
	const updateableFields = ['email', 'password']

	updateableFields.forEach(field => {
		if (field in req.body){
			toUpdate[field] = req.body[field]
		}
	})

	if (toUpdate.password !== undefined){
		let message = (toUpdate.email !== undefined) ? 'Email and password changed' : 'Password changed'
		return Users.hashPassword(toUpdate.password)
			.then(hash => {
				toUpdate['password'] = hash
				return Users
					.findByIdAndUpdate(req.params.userId, {$set: toUpdate}, {new: true})
					.exec()
					.then(user => res.status(201).json({message: message, user: user.userRepr()}))
					.catch(err => res.status(500).json({message: 'Internal server error'}))
			})
	}

	return Users
		.findByIdAndUpdate(req.params.userId, {$set: toUpdate}, {new: true})
		.exec()
		.then(user => res.status(201).json(user.userRepr()))
		.catch(err => res.status(500).json({message: 'Internal server error'}))
})

userRouter.put('/:userId/:listId', authorize, (req, res) => {
	if(!(req.params.userId === req.body.id)){
		const message = (
		  `Request path id (${req.params.userId}) and request body id ` +
		  `(${req.body.id}) must match`);
		console.error(message);
		res.status(400).json({message: message});	
	}

	let newList = req.params.listId

	let toUpdate = {}

	return Users
		.findById(req.params.userId)
		.exec()
		.then(user => {
			let wishlists = user.wishlists
			wishlists.push(newList)

			toUpdate['wishlists'] = wishlists

			return Users
				.findByIdAndUpdate(req.params.userId, {$set: toUpdate}, {new: true})
				.exec()
				.then(user => {
					res.status(201).json(user.userRepr())
				})
		})
})


module.exports = userRouter