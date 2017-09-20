const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const should = chai.should;
const expect = chai.expect;

chai.use(chaiHttp);

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const faker = require('faker');

const {TEST_DATABASE_URL, JWT_SECRET} = require('../config');
const {app, runServer, closeServer} = require('../server');
const {Users, Wishlists} = require('../models');


// Test Database seed functions
	// Wishlist database
		function seedWishlistDatabase(){
			console.info('creating test database of wishlists');
			const seedData = [];

			for (let i = 1; i <= 6; i++){
				seedData.push(generateWishlistData())
			}

			return Wishlists.insertMany(seedData)
		}

		function generateWishlistData(){
			return {
				title: generateTitle(),
				items: [generateItemId(), generateItemId(), generateItemId(), generateItemId()]
			}
		}

		function generateTitle(){
			return faker.random.word()
		}

		function generateItemId(){
			return faker.random.uuid()
		}
	

//

function tearDownDb(){
	return new Promise((resolve, reject) => {
		console.warn('Delete test database')
		return mongoose.connection.dropDatabase()
			.then(result => resolve(result))
			.catch(err => reject(err))
	})
}


describe('USERS API RESOURCE', () => {
	let wishlistIds = [];
	let user;
	let userId;
	let token;
	const email = 'bon@iver.com';
	const password = '#29 stratford apts';
	let wishlists = [];

	before(() => {
		return runServer(TEST_DATABASE_URL)
	});
	beforeEach(() => {
		return seedWishlistDatabase()
	});
	beforeEach(() => {
		wishlists = []
			//set up user
		return Wishlists
			.find()
			.exec()
			.then(lists => {
				lists.forEach(list => {
					wishlists.push(list.id)
				});
				
					//create user
				return Users.hashPassword(password)
					.then(password => {
						return Users
							.create({
								email,
								password,
								wishlists
							})
							.then(user => {
								userId = user.id
								token = jwt.sign(
					                {
					                    user: {
					                        _id: userId,
					                        email,
					                        wishlists
					                    }
					                },
					                JWT_SECRET,
					                {
					                    algorithm: 'HS256',
					                    subject: email,
					                    expiresIn: '7d'
					                }
								);

								return userId
							})
					})
			});
	});


    afterEach(function() {
        return Users.remove({});
	});

	afterEach(() => {
		return tearDownDb();
	})

	after(() => {
		console.log('Closing test server')
		return closeServer();
	});

	describe('Login/Logout', () => {
		it('should login user', () => {
            return chai
                .request(app)
                .post('/api/auth/login')
                .auth(email, password)
                .then(res => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    const token = res.body.authToken;
                    token.should.be.a('string');
                    const payload = jwt.verify(token, JWT_SECRET, {
                        algorithm: ['HS256']
                    });
                    payload.user.should.deep.equal({
                        email,
                        wishlists,
                        id: userId
                    });
                });
		});
	})

	describe('GET endpoint', () => {

		it('should return authorized user on GET', () => {
			let res;
			
				//test
				//should return user profile
			return chai.request(app)
				.get('/api/users/me')
				.set('authorization', `Bearer ${token}`)
				.then(_res => {
					res = _res;
					res.should.have.status(200);
					res.should.be.json;
					res.body.id.should.be.a('string');
					res.body.email.should.be.a('string');
					res.body.email.should.be.equal(email);
					res.body.wishlists.should.be.a('array');
					res.body.wishlists.should.deep.equal(wishlists);
				})
		})
	})

	describe('POST endpoint', () => {
        it('should reject users with missing email', function() {
            return chai.request(app)
                .post('/api/users')
                .send({
                    password,
                    wishlists
                })
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(422);
                    res.body.reason.should.be.equal('ValidationError');
                    res.body.message.should.be.equal('Missing field');
                    res.body.location.should.be.equal('email');
                });
		});

        it('should reject users with missing password', function() {
            return chai.request(app)
                .post('/api/users')
                .send({
                	email,
                	wishlists
                })
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(422);
                    res.body.reason.should.be.equal('ValidationError');
                    res.body.message.should.be.equal('Missing field');
                    res.body.location.should.be.equal('password');
                });
		});

        it('should reject users with non-string password', function() {
            return chai.request(app)
                .post('/api/users')
                .send({
                	email,
                	password: 1234
                })
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(422);
                    res.body.reason.should.be.equal('ValidationError');
                    res.body.message.should.be.equal(
                        'Incorrect field type: expected string'
                    );
                    res.body.location.should.be.equal('password');
                });
		});

        it('should reject users with empty email', function() {
            return chai.request(app)
                .post('/api/users')
                .send({
                    email: '',
                    password
                })
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(422);
                    res.body.reason.should.be.equal('ValidationError');
                    res.body.message.should.be.equal(
                        'email must be at least 1 characters'
                    );
                    res.body.location.should.be.equal('email');
                });
		});

        it('should reject users with duplicate email', function() {
            // Create an initial user
            return Users
            	.create({
					email,
	                password
	            })
                .then(() =>
                    // Try to create a second user with the same username
                    chai.request(app)
                    	.post('/api/users')
                    	.send({
							email,
	                        password
	                    })
                )
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(422);
                    res.body.reason.should.be.equal('ValidationError');
                    res.body.message.should.be.equal(
                        'Email already taken'
                    );
                    res.body.location.should.be.equal('email');
                });
		});

		it('should post a new user to database', () => {
			let newUser = {
				email: 'grimes@artangel.com',
				password: 'butterfly',
				wishlists: []
			};

			let res;

				//test
			return chai.request(app)
				.post('/api/users')
				.send(newUser)
				.then(_res => {
					res = _res;
					res.should.have.status(201);
					res.body.email.should.be.equal(newUser.email);
				})
		});
	})

	describe('PUT endpoint', () => {
		it('should update email', () => {
			let res;

			let updateUser = {
				email: 'kendrick@lamar.com',
				userId: userId
			};

				//test
				//update user email
			return chai.request(app)
				.put(`/api/users/${userId}`)
				.set('authorization', `Bearer ${token}`)				
				.send(updateUser)
				.then(_res => {
					res = _res;
					res.should.have.status(201);
					res.body.user.email.should.be.equal(updateUser.email);
				})
		});

		it('should update password', () => {
			let res;
			let updateUser = {
				password: 'survive in america', 
				userId: userId
			}
				//test
				//update user password
			return chai.request(app)
				.put(`/api/users/${userId}`)
				.send(updateUser)
				.set('authorization', `Bearer ${token}`)				
				.then(_res => {
					res = _res
					res.should.have.status(201)
					res.body.message.should.be.equal('Password changed')

				// 		//prep for test double check
				// 		//logout user to check that new password can login user
				// 	return chai.request(app)
				// 		.get('/users/logout')
				})
				// .then(() => {

				// 		//test double check
				// 		//should log user in with new password
				// 	return agent.post('/users/login')
				// 		.send({
				// 			email: user.email,
				// 			password: updateUser.password
				// 		})
				// 		.then(res => {
				// 			res.should.have.status(201)
				// 			res.body.message.should.be.equal('Logged in')
				// 		})
				// })
		});
	})

	describe('DELETE endpoint', () => {
		it('should delete account', () => {				
				
				//test	
			return chai.request(app)
				.delete(`/api/users/${userId}`)
				.set('authorization', `Bearer ${token}`)				
				.then(res => {
					res.should.have.status(204);
				})
		})

		it('should delete account and all associated wishlists', () => {		
			let res;
			
				//prep
			return chai.request(app)
				.delete(`/api/users/${userId}`)
				.set('authorization', `Bearer ${token}`)				
				.then(_res => {
					res = _res;
					res.should.have.status(204);

					
						//test to check if wishlists were deleted by
						//searching through wishlist database for ids
						//associated with deleted user account
					let findArgs = [];

						//creates arguments to pass into find, converts ids back into mongoose ids
					wishlists.forEach(list => {
						findArgs.push(new mongoose.Types.ObjectId( list ))
					});

					return Wishlists
						.find({'_id': {$in: findArgs}})
						.exec()
				})
				.then(lists => {
					lists.should.be.a('array');
					lists.should.have.length(0);
				})
		})
	})
})