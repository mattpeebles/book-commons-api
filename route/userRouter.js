//Routes
//login user, logout user, get user information, post new user, update users email or password,
//update user wishlists by adding wishlist, update user wishlists by removing wishlists, delete user account

const express = require('express');
const app = express();
const userRouter = express.Router();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const {Users, Wishlists} = require('../models');
const {createAuthToken} = require('./authRouter');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const passport = require('passport');

userRouter.use(jsonParser);

// 	//logs out user and ends session
// userRouter.get('/logout', (req, res) => {
// 	req.logOut()
// 	return res.status(200).json({message: 'Log out successful'})
// })


	//authorize
	//return logged in user info
userRouter.get('/me', passport.authenticate('jwt', {session: false}), (req, res) => {
		Users
			.findById(req.user._id)
			.exec()
			.then(user => {
				return res.json(user.userRepr());
			})
	}
);


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

    const trimmedFields = ['email', 'password'];
    const nonTrimmedField = trimmedFields.find(
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
            max: 72 //max length of bcrypt string encryption
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
                ? `${tooSmallField} must be at least ${sizedFields[tooSmallField]
                      .min} characters`
                : `${tooLargeField} must be at most ${sizedFields[tooLargeField]
                      .max} characters.`,
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
                    message: 'Email already taken',
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
});
	
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

        //ensure password entered is correct
   Users.findById(req.user._id)
        .then(_user => {
            user = _user;
            return user.validatePassword(req.body.currentPassword);
        })
        .then(isValid => {   
                //if it isn't reject request
            if (!isValid) {
                return res.status(400).json({
                    message: 'Incorrect password',
                    reason: 'ValidationError',
                    location: 'password'
                });
            }
            return isValid
        })
        .then(() => {
                
                //check to see if email and confirm email match
            if (req.body.email !== undefined && req.body.email !== req.body.confirmEmail) {
                return res.status(400).json({
                    message: 'Email does not match',
                    reason: 'ValidationError',
                    location: 'confirmEmail'
                });
            }
                //check to see if newPassword and confirmPassword match
            if (req.body.password !== undefined && req.body.password !== req.body.confirmPassword) {
                return res.status(400).json({
                    message: 'Email does not match',
                    reason: 'ValidationError',
                    location: 'confirmEmail'
                });
            }

            const toUpdate = {}
            const updateableFields = ['email', 'password']

            updateableFields.forEach(field => {
                if (field in req.body){
                    toUpdate[field] = req.body[field];
                }
            })

                //hashes password if password exists in request
            if (toUpdate.password !== undefined){
                let message = (toUpdate.email !== undefined) ? 'Email and password changed' : 'Password changed';
                return Users.hashPassword(toUpdate.password)
                    .then(hash => {
                        toUpdate['password'] = hash
                        return Users
                            .findByIdAndUpdate(req.params.userId, {$set: toUpdate}, {new: true})
                            .exec()
                            .then(user => {
                                let authToken = createAuthToken(user)
                                res.status(201).json({message: message, user: user.userRepr(), token: authToken})
                            })
                            .catch(err => res.status(500).json({message: 'Internal server error'}))
                    })
            }

                //doesn't need to hash password so immediately updates user
            return Users
                .findByIdAndUpdate(req.params.userId, {$set: toUpdate}, {new: true})
                .exec()
                .then(user => {
                    let authToken = createAuthToken(user)
                    res.status(201).json({user: user.userRepr(), token: authToken})
                })
                .catch(err => res.status(500).json({message: 'Internal server error'}))
        })
})

	//authorize
	//deletes account and all related wishlists
userRouter.delete('/:userId', passport.authenticate('jwt', {session: false}), (req, res) => {
	Users
		.findById(req.params.userId)
		.exec()
		.then(user => {
			let wishlists = user.wishlists;

			let findArgs = [];

				//creates arguments to pass into find, converts ids back into mongoose ids
			wishlists.forEach(list => {
				findArgs.push(new mongoose.Types.ObjectId( list ));
			})

			return Wishlists
				.find({'_id': {$in: findArgs}})
				.remove()
				.exec()
		})
		.then(res => {
			if(res.result.ok === 1){
				console.log(`All user wishlists have been deleted - ${res.result.n}`);
			}
			return 
		})
		.then(() => {
			Users
				.findByIdAndRemove(req.params.userId)
				.exec()
		})
		.then(() => {
			console.log(`Account ${req.params.userId} was deleted`);
			res.status(204).end();
		})
		.catch(err => res.status(500).json({message: 'Internal server error'}))
});


module.exports = userRouter;