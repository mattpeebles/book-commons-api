const chai = require('chai')
const chaiHttp = require('chai-http')
const jwt = require('jsonwebtoken')
const should = chai.should
const expect = chai.expect

chai.use(chaiHttp)

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const faker = require('faker')

const {TEST_DATABASE_URL, JWT_SECRET} = require('../config')
const {app, runServer, closeServer} = require('../server')
const {Users, Wishlists} = require('../models')


// Test Database seed functions
	// Wishlist database
		function seedWishlistDatabase(){
			console.info('creating test database of wishlists')
			const seedData = []

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
	})
	beforeEach(() => {
		return seedWishlistDatabase()
	})
	beforeEach(() => {
		wishlists = []
			//set up user
		return Wishlists
			.find()
			.exec()
			.then(lists => {
					//get all wishlist ids into a variable accessible to all tests
				lists.forEach(list => {
					wishlists.push(list.id)
				})
				
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
					                        id: userId,
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
			})
	})


    afterEach(function() {
        return Users.remove({});
	})

	afterEach(() => {
		return tearDownDb()
	})

	after(() => {
		console.log('Closing test server')
		return closeServer()
	})

	// describe('Login/Logout', () => {
		it('should login user', () => {
            return chai
                .request(app)
                .post('/auth/login')
                .auth(email, password)
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    const token = res.body.authToken;
                    expect(token).to.be.a('string');
                    const payload = jwt.verify(token, JWT_SECRET, {
                        algorithm: ['HS256']
                    });
                    expect(payload.user).to.deep.equal({
                        email,
                        wishlists,
                        id: userId
                    });
                });
		});

	// 	it('should logout user', () => {
	// 		let res;
			
	// 			//test
	// 			//logs user out
	// 		return chai.request(app)
	// 			.get('/users/logout')
	// 			.then(_res => {
	// 				res = _res
	// 				res.should.have.status(200)
	// 				res.body.message.should.be.equal('Log out successful')
	// 			})
	// 	})
	// })

	describe('GET endpoint', () => {

		it('should return authorized user on GET', () => {
			let res;
			
				//test
				//should return user profile
			return chai.request(app)
				.get('/users/me')
				.set('authorization', `Bearer ${token}`)
				.then(_res => {
					res = _res

					res.should.have.status(200)
					res.should.be.json
					res.body.id.should.be.a('string')
					res.body.email.should.be.a('string')
					res.body.email.should.be.equal(email)
					res.body.wishlists.should.be.a('array')
					res.body.wishlists.should.deep.equal(wishlists)
				})
		})
	})

	describe('POST endpoint', () => {
		it('should post a new user to database', () => {
			let newUser = {
				email: 'grimes@artangel.com',
				password: 'butterfly',
				wishlists: []
			}
			let res;

				//test
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(_res => {
					res = _res
					res.should.have.status(201)
					res.body.email.should.be.equal(newUser.email)
				})
		})
	})

	describe('PUT endpoint', () => {
		it('should update email', () => {
			let res;

			let updateUser = {
				email: 'kendrick@lamar.com',
				userId: userId
			}	

				//test
				//update user email
			return chai.request(app)
				.put(`/users/${userId}`)
				.set('authorization', `Bearer ${token}`)				
				.send(updateUser)
				.then(_res => {
					res = _res
					res.should.have.status(201)
					res.body.email.should.be.equal(updateUser.email)
				})
		})

		it('should update password', () => {
			let res;
			let updateUser = {
				password: 'survive in america', 
				userId: userId
			}
					
			const token = jwt.sign(
                {
                    user: {
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
				//test
				//update user password
			return chai.request(app)
				.put(`/users/${userId}`)
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
		})

		// it('should add wishlist id to wishlist array', () => {
		// 	let wishlistId = faker.random.uuid()
		// 	let res;

		// 	updateUser = {
		// 		userId: userId,
		// 		wishlistId: wishlistId
		// 	}

		// 		//test
		// 	return agent.put(`/users/${userId}/add/${wishlistId}`)
		// 		.send(updateUser)
		// 		.then(_res => {
		// 			res = _res
		// 			res.should.have.status(201)
		// 			res.body.wishlists.should.include(updateUser.wishlistId)
		// 		})
		// })

		// it('should remove wishlist id from wishlist array', () => {

		// 	let wishlistId;

		// 	let res;

		// 	updateUser = {
		// 		userId: userId,
		// 		wishlistId: user.wishlists[0]
		// 	}
					
		// 		//test
		// 		//removes wishlist from user 
		// 	return agent.put(`/users/${updateUser.userId}/delete/${updateUser.wishlistId}`)
		// 		.send(updateUser)
		// 		.then(_res => { 
		// 			res = _res
		// 			res.should.have.status(201)
		// 			res.body.wishlists.should.not.include(updateUser.wishlistId)
					
		// 				//test double check
		// 				//attempts to get wishlist
		// 				//ensures wishlist no longer exists in wishlist collection
		// 			return chai.request(app)
		// 				.get(`/wishlists/${updateUser.wishlistId}`)
		// 		})
		// 		.then(res => { 
		// 			res.body.message.should.be.equal('Wishlist does not exist')
		// 		})
		// })

	})

	describe('DELETE endpoint', () => {
		it('should delete account', () => {				
			const token = jwt.sign(
                {
                    user: {
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
				//test	
			return chai.request(app)
				.delete(`/users/${userId}`)
				.set('authorization', `Bearer ${token}`)				
				.then(res => {
					res.should.have.status(204)
				})
		})

		it('should delete account and all associated wishlists', () => {		
			let res;
			
				//prep
			return chai.request(app)
				.delete(`/users/${userId}`)
				.set('authorization', `Bearer ${token}`)				
				.then(_res => {
					res = _res
					res.should.have.status(204)

					
						//test to check if wishlists were deleted by
						//searching through wishlist database for ids
						//associated with deleted user account
					let findArgs = []

						//creates arguments to pass into find, converts ids back into mongoose ids
					wishlists.forEach(list => {
						findArgs.push(new mongoose.Types.ObjectId( list ))
					})

					return Wishlists
						.find({'_id': {$in: findArgs}})
						.exec()
				})
				.then(lists => {
					lists.should.be.a('array')
					lists.should.have.length(0)
				})
		})
	})
})