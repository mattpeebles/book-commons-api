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
const {Users, Wishlists} = require('../models')

// Test Database seed functions
	//Wishlist database
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


	//User database
		const usersArray = [{
					email: 'frank@ocean.com',
					password: 'chanel',
					wishlists: []
				},
				{
					email: 'bon@iver.com',
					password: '#29 stratford apts',
					wishlists: []
				},
				{
					email: 'kanye@west.com',
					password: 'wavvy',
					wishlists: []
				}]
	//
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
		return seedWishlistDatabase()
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
							updateUser['userId'] = userId
							return agent.put(`/users/${userId}/add/${wishlistId}`)
								.send(updateUser)
								.then(_res => {
									res = _res
									res.should.have.status(201)
									res.body.wishlists.should.include(updateUser.wishlistId)
								})
						})
				})
		})

		it('should remove wishlist id from wishlist array', () => {
			seedWishlistDatabase()

			let person = usersArray[Math.floor(Math.random() * usersArray.length)]
			let agent = chai.request.agent(app)
			let wishlistId;

			let res;

			updateUser = {}

			return Wishlists
				.findOne()
				.exec()
				.then(list => { //get wishlist id
					let wishlist = list.listRepr()
					wishlistId = wishlist.id
					updateUser['wishlistId'] = wishlistId
					return chai.request(app)
						.post('/users')
						.send(person)
				})
				.then(() => {  //login
					return agent.post('/users/login')
						.send(person)
				})
				.then(res => { //add wishlist to user wishlists array
					let userId = res.body.user.id
					updateUser['userId'] = userId
					return agent.put(`/users/${userId}/add/${wishlistId}`)
						.send(updateUser)
				})
				.then(res => { //delete wishlist from array
					res.body.wishlists.should.include(updateUser.wishlistId.toString())
					
					return agent.put(`/users/${updateUser.userId}/delete/${updateUser.wishlistId}`)
						.send(updateUser)
				})
				.then(_res => { //ensure wishlist is no longer in user wishlists array
					res = _res
					res.should.have.status(201)
					res.body.wishlists.should.not.include(updateUser.wishlistId)
					return chai.request(app)
						.get(`/wishlists/${updateUser.wishlistId}`)
				})
				.then(res => { //ensure wishlist no longer exists in wishlist collection
					res.body.message.should.be.equal('Wishlist does not exist')
				})
		})
	})

	describe('DELETE endpoint', () => {
		it('should delete account', () => {
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
									
									return agent.delete(`/users/${res.body.user.id}`)
										.then(_res => {
											res = _res
											res.should.have.status(204)
										})
								})
						})			
		})

		it('should delete account and all associated wishlists', () => {		
			let res;
			let agent = chai.request.agent(app)
			let user = usersArray[Math.floor(Math.random() * usersArray.length)]
			let listIds;
			let userId;
			
			return Wishlists
				.find()
				.exec()
				.then(lists => {
					let wishlists = lists.map(list => list.listRepr())
					
					listIds = [wishlists[0].id, wishlists[1].id, wishlists[2].id]
					return listIds
				})
				.then(listIds => {
					return chai.request(app)
						.post('/users')
						.send(user)
				})
				.then(_res => {
					_res.should.have.status(201)
					return agent.post('/users/login')
						.send({
							email: user.email,
							password: user.password
						})			
				})
				.then(res => {
					userId = res.body.user.id
					return agent.put(`/users/${userId}/add/${listIds[0]}`)
						.send({
							userId: userId,
							wishlistId: listIds[0]
						})
				})
				.then(res => {
					return agent.put(`/users/${userId}/add/${listIds[1]}`)
						.send({
							userId: userId,
							wishlistId: listIds[1]
						})				
				})
				.then(res => {
					return agent.put(`/users/${userId}/add/${listIds[2]}`)
						.send({
							userId: userId,
							wishlistId: listIds[2]
						})				
				})
				.then(_res => {
					res = _res
					return agent.delete(`/users/${userId}`)
				})
				.then(_res => {
					res = _res
					res.should.have.status(204)

					return Wishlists
						.find([{id: listIds[0]}, {id: listIds[1]}, {id: listIds[2]}])
						.exec()
				})
				.then(lists => {
					lists.should.be.a('array')
					lists.should.have.length(3)
				})
		})
	})
})