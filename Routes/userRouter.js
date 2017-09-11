//Routes
//login user, logout user, get user information, post new user, update users email or password,
//update user wishlists by adding wishlist, update user wishlists by removing wishlists, delete user account

const express = require('express')
const app = express()
const userRouter = express.Router()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const {Users, Wishlists} = require('../models')

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const passport = require('passport');

userRouter.use(jsonParser)

// 	//logs in user and initiates session
// userRouter.post('/login', function handleLocalAuthentication(req, res, next) {
//     passport.authenticate('local', function(err, user, info) {  
//         if (err) return next(err);
//         if (!user) {
//             return res.status(403).json({
//                 message: "no user found"
//             });
//         }

//         // Manually establish the session...
//         req.login(user, function(err) {
//             console.log('user login: ', user)
//             if (err) return next(err);
//             res.status(201).json({message: 'Logged in', user: user.userRepr()})
//         });
//     })(req, res, next);
// });

// 	//logs out user and ends session
// userRouter.get('/logout', (req, res) => {
// 	req.logOut()
// 	return res.status(200).json({message: 'Log out successful'})
// })


	//authorize
	//return logged in user info
userRouter.get(
	'/me', 
	passport.authenticate('jwt', {session: false}), 
	(req, res) => {
		//const {email, wishlists} = req.user


		Users
			.findById(req.user.id)
			.exec()
			.then(user => {
				return res.json(user.userRepr())
			})
	}
)


	//adds a new user with a non-duplicate email
userRouter.post('/', (req, res) => {
    const requiredFields = ['email', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));


    if (missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Missing field',
            location: missingField
        });
    }

    const stringFields = ['email', 'password'];
    const nonStringField = stringFields.find(
        field => field in req.body && typeof req.body[field] !== 'string'
    );

    if (nonStringField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Incorrect field type: expected string',
            location: nonStringField
        });
    }

    const explicityTrimmedFields = ['email', 'password'];
    const nonTrimmedField = explicityTrimmedFields.find(
        field => req.body[field].trim() !== req.body[field]
    );

    if (nonTrimmedField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Cannot start or end with whitespace',
            location: nonTrimmedField
        });
    }

    const sizedFields = {
        email: {
            min: 1
        },
        password: {
            min: 8,
            // bcrypt truncates after 72 characters, so let's not give the illusion
            // of security by storing extra (unused) info
            max: 72
        }
    };

    const tooSmallField = Object.keys(sizedFields).find(
        field =>
            'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
    );
    const tooLargeField = Object.keys(sizedFields).find(
        field =>
            'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
    );

    if (tooSmallField || tooLargeField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: tooSmallField
                ? `Must be at least ${sizedFields[tooSmallField]
                      .min} characters long`
                : `Must be at most ${sizedFields[tooLargeField]
                      .max} characters long`,
            location: tooSmallField || tooLargeField
        });
    }

    let {email, password} = req.body;

    return Users.find({email})
        .count()
        .then(count => {
            if (count > 0) {
                // There is an existing user with the same email
                return Promise.reject({
                    code: 422,
                    reason: 'ValidationError',
                    message: 'email already taken',
                    location: 'email'
                });
            }
            // If there is no existing user, hash the password
            return Users.hashPassword(password);
        })
        .then(hash => {
            return Users
            .create({
                email,
                password: hash
            });
        })
        .then(user => {
            return res.status(201).json(user.userRepr());
        })
        .catch(err => {
            // Forward validation errors on to the client, otherwise give a 500
            // error because something unexpected has happened
            if (err.reason === 'ValidationError') {
                return res.status(err.code).json(err);
            }
            res.status(500).json({code: 500, message: 'Internal server error'});
});
})
	
	//updates email or password, password is hashed before
	//given to user object
userRouter.put('/:userId', passport.authenticate('jwt', {session: false}), (req, res) => {
	if(!(req.params.userId === req.body.userId)){
		const message = (
		  `Request path id (${req.params.userId}) and request body userId ` +
		  `(${req.body.userId}) must match`);
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


// 	//superfluous wishlist add handles this action
// 	//adds non duplicate wishlist id to wishlists array in user object
// userRouter.put('/:userId/add/:listId', passport.authenticate('jwt', {session: false}), (req, res) => {
// 	if(!(req.params.userId === req.body.userId)){
// 		const message = (
// 		  `Request path id (${req.params.userId}) and request body id ` +
// 		  `(${req.body.userId}) must match`);
// 		console.error(message);
// 		res.status(400).json({message: message});	
// 	}

// 	let newList = req.params.listId

// 	let toUpdate = {}

// 	return Users
// 		.findById(req.params.userId)
// 		.exec()
// 		.then(user => {
// 			let wishlists = user.wishlists
// 			wishlists.push(newList)

// 			toUpdate['wishlists'] = wishlists

// 			return Users
// 				.findByIdAndUpdate(req.params.userId, {$set: toUpdate}, {new: true})
// 				.exec()
// 		})
// 		.then(user => {
			
// 			res.status(201).json(user.userRepr())
// 		})
// })


// 	//superfluous wishlist delete handles this action
// 	//removes wishlist id from wishlists array in user object
// userRouter.put('/:userId/delete/:listId', passport.authenticate('jwt', {session: false}), (req, res) => {
// 	if(!(req.params.userId === req.body.userId)){
// 		const message = (
// 		  `Request path id (${req.params.userId}) and request body userId ` +
// 		  `(${req.body.userId}) must match`);
// 		console.error(message);
// 		res.status(400).json({message: message});	
// 	}

// 	let toUpdate = {}

// 	return Users
// 		.findById(req.params.userId)
// 		.exec()
// 		.then(user => {
// 			let wishlists = user.wishlists.filter(id => id !== req.params.listId)

// 			toUpdate['wishlists'] = wishlists

// 			return Wishlists
// 				.findByIdAndRemove(req.params.listId)
// 				.exec()
// 				.then(() => {
// 				return Users
// 					.findByIdAndUpdate(req.params.userId, {$set: toUpdate}, {new: true})
// 					.exec()
// 					.then(user => {
// 						res.status(201).json(user.userRepr())
// 					})
// 				})
// 		})
// })


	//authorize
	//deletes account and all related wishlists
userRouter.delete('/:userId', passport.authenticate('jwt', {session: false}), (req, res) => {
	Users
		.findById(req.params.userId)
		.exec()
		.then(user => {
			let wishlists = user.wishlists

			let findArgs = []

				//creates arguments to pass into find, converts ids back into mongoose ids
			wishlists.forEach(list => {
				findArgs.push(new mongoose.Types.ObjectId( list ))
			})

			return Wishlists
				.find({'_id': {$in: findArgs}})
				.remove()
				.exec()
		})
		.then(res => {
			if(res.result.ok === 1){
				console.log(`All user wishlists have been deleted - ${res.result.n}`)
			}
			return 
		})
		.then(() => {
			Users
				.findByIdAndRemove(req.params.userId)
				.exec()
		})
		.then(() => {
			console.log(`Account ${req.params.userId} was deleted`)
			res.status(204).end()
		})
		.catch(err => res.status(500).json({message: 'Internal server error'}))
})


module.exports = userRouter