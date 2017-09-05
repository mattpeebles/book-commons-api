const chai = require('chai')
const chaiHttp = require('chai-http')
const should = chai.should()
const expect = chai.expect()

chai.use(chaiHttp)

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const faker = require('faker')

const {TEST_DATABASE_URL} = require('../config')
const {app, runServer, closeServer} = require('../server')
const {Users} = require('../models')

// Test Database seed functions

	
	const usersArray = [{
				email: 'frank@ocean.com',
				password: 'chanel'
			},
			{
				email: 'bon@iver.com',
				password: 'stratford'
			},
			{
				email: 'kanye@west.com',
				password: 'wavvy'
			}]

	function seedUserDatabase(){
		console.info('creating test database of users')
		const seedData = []

		for (let i = 1; i <= 3; i++){
			seedData.push(generateUserData())
		}

		return Users.insertMany(seedData)
	}

	function generateUserData(){
		return {
			email: generateEmail(),
			password: generatePassword()
		}
	}

	function generateEmail(){
		return faker.internet.email()
	}

	function generatePassword(){
		return faker.internet.password()
	}

	function generateWishlists(){
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
	before(() => {
		runServer(TEST_DATABASE_URL)
	})
	beforeEach(() => {
		return seedUserDatabase()
	})
	afterEach(() => {
		return tearDownDb()
	})
	after(() => {
		console.info('Closing test database')
		return closeServer()
	})

	describe('Login/Logout', () => {
		it('should login user', () => {
			let res;
			let agent = chai.request.agent(app)
			let user = usersArray[Math.floor(Math.random() * usersArray.length)]
			return chai.request(app)
				.post('/users')
				.send(user)
				.then(_res => {
					return agent.post('/users/login')
						.send(user)
						.then(_res => {
							res = _res
							res.should.have.status(201)
							res.body.message.should.be.equal('Logged in')
						})
				})
		})

		it('should logout user', () => {
			let res;
			let agent = chai.request.agent(app)
			let user = usersArray[Math.floor(Math.random() * usersArray.length)]
			
			return chai.request(app)
				.post('/users')
				.send(user)
				.then(_res => {
					return agent.post('/users/login')
						.send(user)
						.then(_res => {
							return chai.request(app)
								.get('/users/logout')
								.then(_res => {
									res = _res
									res.should.have.status(200)
									res.body.message.should.be.equal('Log out successful')
								})
						})
				})
		})
	})

	describe('GET endpoint', () => {

		it('should return a list of all users', () => {
			let res;
			return chai.request(app)
				.get('/users')
				.then(_res => {
					res = _res
					res.should.have.status(200)
					res.body.users.should.have.length.of.at.least(1)
				})
		})

		it('should return authorized user on GET', () => {
			let person = usersArray[Math.floor(Math.random() * usersArray.length)]
			let res;
			let agent = chai.request.agent(app)

			return chai.request(app)
				.post('/users')
				.send(person)
				.then(_res => {					
					return agent.post('/users/login')
						.send(person)
						.then(_res => {
							return agent.get('/users/me')
								.then(_res => {
									res = _res
									let {user} = res.body

									res.should.have.status(200)
									res.should.be.json
									user.id.should.be.a('string')
									user.email.should.be.a('string')
									user.email.should.be.equal(person.email)
									user.wishlists.should.be.a('array')
								})
						})
				})
		})
	})

	describe('POST endpoint', () => {
		it('should post a new user to database', () => {
			let user = usersArray[Math.floor(Math.random() * usersArray.length)]
			let res;

			return chai.request(app)
				.post('/users')
				.send(user)
				.then(_res => {
					res = _res
					res.should.have.status(201)
					res.body.email.should.be.equal(user.email)
				})
		})
	})

	describe('PUT endpoint', () => {
		it('should update email', () => {
			let person = usersArray[Math.floor(Math.random() * usersArray.length)]
			let agent = chai.request.agent(app)
			let res;
			let updateUser = {email: 'kendrick@lamar.com'}

			return chai.request(app)
				.post('/users')
				.send(person)
				.then(() => {
					return agent.post('/users/login')
						.send(person)
						.then(res => {
							let userId = res.body.user.id
							updateUser['id'] = userId
							return agent.put(`/users/${userId}`)
								.send(updateUser)
								.then(_res => {
									res = _res
									res.should.have.status(201)
									res.body.email.should.be.equal(updateUser.email)
								})
						})
				})
		})

		it('should update password', () => {
			let person = usersArray[Math.floor(Math.random() * usersArray.length)]
			let agent = chai.request.agent(app)
			let res;
			let updateUser = {password: 'survive in america'}

				//create new user
			return chai.request(app)
				.post('/users')
				.send(person)
				.then(() => {
					
					return agent.post('/users/login')
						.send(person)
						.then(res => {
							let userId = res.body.user.id
							updateUser['id'] = userId
								
								//update user password
							return agent.put(`/users/${userId}`)
								.send(updateUser)
								.then(_res => {
									res = _res
									res.should.have.status(201)
									res.body.message.should.be.equal('Password changed')

										//logout user to check that new password can login user
									return chai.request(app)
										.get('/users/logout')
										.then(() => {
											return agent.post('/users/login')
												.send({
													email: person.email,
													password: updateUser.password
												})
												.then(res => {
													res.should.have.status(201)
													res.body.message.should.be.equal('Logged in')
												})
										})
								})
						})
				})
		})

		it('should add wishlist id to wishlist array', () => {
			let person = usersArray[Math.floor(Math.random() * usersArray.length)]
			let wishlistId = faker.random.uuid()
			let agent = chai.request.agent(app)
			let res;

			updateUser = {
				wishlistId: wishlistId
			}

			return chai.request(app)
				.post('/users')
				.send(person)
				.then(() => {
					return agent.post('/users/login')
						.send(person)
						.then(res => {
							let userId = res.body.user.id
							updateUser['id'] = userId
							return agent.put(`/users/${userId}/${wishlistId}`)
								.send(updateUser)
								.then(_res => {
									res = _res
									res.should.have.status(201)
									res.body.wishlists.should.be.include(updateUser.wishlistId)
								})
						})
				})
		})
	})
})