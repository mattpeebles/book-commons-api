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
	before(() => {
		return runServer(TEST_DATABASE_URL)
	})
	beforeEach(() => {
		return seedWishlistDatabase()
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
			let agent = chai.request.agent(app)
			let user = {
				email: 'frank@ocean.com',
				password: 'chanel'
			}
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
						.then(() => {
							return agent.get('/wishlists')
								.then(_res => {
									res = _res
									res.should.have.status(200)
									res.body.wishlists.should.have.length.of.at.least(1)
								})
						})
				})
		});

		it('should return a particular wishlist', () => {
			let res;
			return Wishlists
				.findOne()
				.exec()
				.then(list => {
					let wishlist = list.listRepr()
					
					return chai.request(app)
						.get(`/wishlists/${wishlist.id}`)
						.then(_res => {
							res = _res
							res.should.have.status(200)
							res.body.id.should.be.equal(wishlist.id.toString())
							res.body.title.should.be.equal(wishlist.title)
							res.body.items.should.deep.equal(wishlist.items)
						})
				})
		})
	});

	describe('Post endpoint', () => {
		it('should post new wishlist to database', () => {
			let wishlist = {
				title: generateTitle()
			}
			
			let res;
			let agent = chai.request.agent(app)
			let user = {
				email: 'frank@ocean.com',
				password: 'chanel'
			}
			return chai.request(app)
				.post('/users')
				.send(user)
				.then(_res => {
					return agent.post('/users/login')
						.send(user)
				})
				.then(_res => {
					return agent.post('/wishlists')
						.send(wishlist)
				})
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
			let updateList = {
				title: 'The Life of Pablo'
			}
			return Wishlists
				.findOne()
				.exec()
				.then(list => {
					updateList.id = list.id
					return chai.request(app)
						.put(`/wishlists/${list.id}`)
						.send(updateList)
				})
				.then(res => {
					res.should.have.status(201)

					return Wishlists.findById(updateList.id).exec()
				})
				.then(list => {
					list.title.should.be.equal(updateList.title)
				})
		})

		it('should add ebook id to items array', () => {
			let ebookId = generateItemId()
			let updateItem = {
				item: ebookId
			}

			return Wishlists
				.findOne()
				.exec()
				.then(list => {
					updateItem.id = list.id
					return chai.request(app)
						.put(`/wishlists/${updateItem.id}/add/${ebookId}`)
						.send(updateItem)
				})
				.then(res => {
					res.should.have.status(201)
					res.body.items.should.be.a('array')
					res.body.items.should.include(updateItem.item)
				})
		})

		it('should not add a duplicate ebook id to items array', () => {
			return Wishlists
				.find()
				.exec()
				.then(lists => {
					let listArray = lists.map(list => list.listRepr())

					return listArray[0]
				})
				.then(list => {
					let existentId = list.items[0]

					return chai.request(app)
						.put(`/wishlists/${list.id}/add/${existentId}`)
						.send({
							id: list.id,
							item: existentId
						})
						.then(res => {
							res.should.have.status(202)
							res.body.message.should.be.equal('Item already exists in wishlist')
						})

				})
		})

		it('should remove book from wishlist items', () => {
			seedEbookDatabase()

				//get a wishlist id
			return Wishlists
				.find()
				.exec()
				.then(lists => {
					let listArray = lists.map(list => list.listRepr())
					return listArray[0].id
				})
				.then(list => {
						//get an ebook id
					return chai.request(app)
						.get('/ebooks')
						.then(res => {
							res.should.have.status(200)
							res.body.ebooks.should.have.length.of.at.least(1)
							
							return {
								listId: list,
								ebookId: res.body.ebooks[0].id
							}
						})
						.then(obj => {
							return chai.request(app)
								.put(`/wishlists/${obj.listId}/add/${obj.ebookId}`)
								.send({
									id: obj.listId,
									item: obj.ebookId
								})
								.then(res => {
									res.should.have.status(201)
									return chai.request(app)
										.put(`/wishlists/${obj.listId}/delete/${obj.ebookId}`)
										.send({
											id: obj.listId,
											item: obj.ebookId
										})
										.then(res => {
											res.should.have.status(201)
											res.body.message.should.be.equal('Ebook removed from wishlist')
											res.body.wishlist.items.should.not.include(obj.ebookId)
										})
								})
						})
				})
		});
	})


	describe('Delete endpoint', () => {
		it('should remove wishlist', () => {
			return Wishlists
				.findOne()
				.exec()
				.then(list => {
					return chai.request(app)
						.delete(`/wishlists/${list.id}`)
				})
				.then(res => {
					res.should.have.status(204)
				})
		});

	})
})