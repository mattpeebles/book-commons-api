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
const {Users, Wishlists, Ebooks} = require('../models')

// Test Database seed functions
	//Ebook database
		function seedEbookDatabase(){
			console.info('creating test database of ebooks')
			const seedData = []

			for (let i = 1; i <= 3; i++){
				seedData.push(generateEbookData())
			}

			return Ebooks.insertMany(seedData)
		}

		function generateEbookData(){
			return {
					title: generateTitle(),
					author: generateAuthor(),
					preview: generatePreview(),
					publishDate: generatePublishDate(),
					languages: generateLanguages(),
					pages: generatePages(),
					formats: generateFormats(),
					location: generateLocation(),
					locationIcon: generateLocationIcon(),
					locationUrl: generateLocationUrl()
			}
		}

		function generateTitle(){
			return faker.name.title()
		}

		function generateAuthor(){
			return faker.name.firstName()
		}

		function generatePreview(){
			return faker.internet.url()
		}

		function generatePublishDate(){
			return faker.date.past().toString()
		}

		function generateLanguages(){
			return [faker.random.word(), faker.random.word()]
		}

		function generatePages(){
			return faker.random.number()
		}

		function generateFormats(){
			return ['epub', 'mobi', 'pdf']
		}

		function generateLocation(){
			return faker.internet.url()
		}

		function generateLocationIcon(){
			return faker.image.imageUrl()
		}

		function generateLocationUrl(){
			return faker.internet.url()
		}
	// 
	//Wishlist database
		function seedWishlistDatabase(){
			console.info('creating test database of wishlists')
			const seedData = []

			for (let i = 1; i <= 3; i++){
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

// 

function tearDownDb(){
	return new Promise((resolve, reject) => {
		console.warn('Delete test database')
		return mongoose.connection.dropDatabase()
		.then(result => resolve(result))
		.catch(err => reject(err))
	})
}


describe('WISHLIST API RESOURCE', () => {
	let wishlistIds = [];
	let agent = chai.request.agent(app)

	before(() => {
		return runServer(TEST_DATABASE_URL)
	})
	beforeEach(() => {
		return seedWishlistDatabase()
	})
	beforeEach(() => {
		
			//set up and log agent in to do authorized tests
		wishlistIds = []
		let user = {
			email: 'frank@ocean.com',
			password: 'chanel',
			wishlists: wishlistIds
		}

		return Wishlists
			.find()
			.exec()
			.then(lists => {
				lists.forEach(list => {
					wishlistIds.push(list.id)
				})

				return chai.request(app)
						.post('/users')
						.send(user)
						.then(_res => {
							_res.should.have.status(201)
							return agent.post('/users/login')
								.send({
									email: user.email,
									password: user.password
								})			
						})
						.then(_res => {
							console.log(`${user.email} is logged in`)
						})
			})
	})
	afterEach(() => {
		return chai.request(app)
			.get('/users/logout')
			.then(() => {
				console.log(`Agent logged out`)
			})
	})
	afterEach(() => {
		return tearDownDb()
	})
	after(() => {
		console.log('Closing test server')
		return closeServer()
	})

	describe('Get endpoint', () => {
		it('should return all wishlists of user', () => {
			let res;
				
				//test
				//get all user wishlists
			return agent.get('/wishlists')
				.then(_res => {
					res = _res
					res.should.have.status(200)
					res.should.be.json
					res.body.wishlists.should.have.length(3)
					res.body.wishlists[0].id.should.be.equal(wishlistIds[0])
					res.body.wishlists[1].id.should.be.equal(wishlistIds[1])
					res.body.wishlists[2].id.should.be.equal(wishlistIds[2])
				})
		});

		it('should return a particular wishlist', () => {
			let res;
			let wishlistId = wishlistIds[Math.floor(Math.random() * wishlistIds.length)]
			
				//test
				//get particular wishlist
			return chai.request(app)
				.get(`/wishlists/${wishlistId}`)
				.then(_res => {
					res = _res
					res.should.have.status(200)
					res.should.be.json
					res.body.id.should.be.equal(wishlistId)
					res.body.title.should.be.a('string')
					res.body.items.should.be.a('array')
	
				})
		})
	});

	describe('Post endpoint', () => {
		it('should post new wishlist to database', () => {
			let wishlist = {
				title: generateTitle()
			}
			
			let res;

				//test
				//post new wishlist
			return agent.post('/wishlists')
				.send(wishlist)
				.then(_res => {
					res = _res
					res.should.have.status(201)
					res.body.title.should.be.equal(wishlist.title)
					res.body.title.should.be.a('string')
					res.body.items.should.deep.equal([])
				})
		})
	});


	describe('Put endpoint', () => {
		it('should update wishlist title', () => {
			let wishlistId = wishlistIds[Math.floor(Math.random() * wishlistIds.length)]
			let updateList = {
				listId: wishlistId,
				title: 'The Life of Pablo'
			}

				//test
				//update wishlist
			return chai.request(app)
				.put(`/wishlists/${wishlistId}`)
				.send(updateList)
				.then(res => {
					res.should.have.status(201)

						//test check
						//get same wishlist to see if it's been updated
					return agent.get(`/wishlists/${wishlistId}`)
				})
				.then(res => {
					res.body.title.should.be.equal(updateList.title)
				})
		})

		it('should add ebook id to items array', () => {
			let ebookId = generateItemId()
			let wishlistId = wishlistIds[Math.floor(Math.random() * wishlistIds.length)]
			let updateItem = {
				listId: wishlistId,
				item: ebookId
			}

				//test
				//add book to wishlist
			return chai.request(app)
				.put(`/wishlists/${updateItem.listId}/add/${ebookId}`)
				.send(updateItem)
				.then(res => {
					res.should.have.status(201)
					res.body.items.should.be.a('array')
					res.body.items.should.include(updateItem.item)
				})
		})

		it('should not add a duplicate ebook id to items array', () => {
			let wishlistId = wishlistIds[Math.floor(Math.random() * wishlistIds.length)]
			let ebookId = generateItemId()
			let item = {
					listId: wishlistId,
					item: ebookId
				}
			
				//prep
				//add book to wishlist
			return chai.request(app)
				.put(`/wishlists/${wishlistId}/add/${ebookId}`)
				.send(item)
				.then(() => {
					
						//test
						//try to add same book to wishlist
					return chai.request(app)
						.put(`/wishlists/${wishlistId}/add/${ebookId}`)
						.send(item)
				})
				.then(res => {
					res.should.have.status(202)
					res.body.message.should.be.equal('Item already exists in wishlist')
				})	
		})

		it('should remove book from wishlist items', () => {
			seedEbookDatabase()

			let wishlistId = wishlistIds[Math.floor(Math.random() * wishlistIds.length)]
			
			//prep
			//get an ebook id
			return chai.request(app)
				.get('/ebooks')
				.then(res => {
					res.should.have.status(200)
					res.body.ebooks.should.have.length.of.at.least(1)
					
					return {
						listId: wishlistId,
						ebookId: res.body.ebooks[0].id
					}
				})
				.then(obj => {
						//prep
						//add ebook to wishlist
					return chai.request(app)
						.put(`/wishlists/${obj.listId}/add/${obj.ebookId}`)
						.send({
							listId: obj.listId,
							item: obj.ebookId
						})
						.then(res => {
							res.should.have.status(201)
							
								//test
								//remove ebook from wishlist
							return chai.request(app)
								.put(`/wishlists/${obj.listId}/delete/${obj.ebookId}`)
								.send({
									listId: obj.listId,
									item: obj.ebookId
								})
								.then(res => {
									res.should.have.status(201)
									res.body.message.should.be.equal('Ebook removed from wishlist')
									res.body.wishlist.items.should.not.include(obj.ebookId)
								})
						})
				})
		});
	})


	describe('Delete endpoint', () => {
		it('should remove wishlist', () => {
			return chai.request(app)
				.delete(`/wishlists/${wishlistIds[Math.floor(Math.random() * wishlistIds.length)]}`)
				.then(res => {
					res.should.have.status(204)
				})
		});

	})
})