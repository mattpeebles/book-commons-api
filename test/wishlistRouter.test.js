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
const {Wishlists, Ebooks} = require('../models')

// Test Database seed functions
	//Ebook database
		function seedEbookDatabase(){
			console.info('creating test database of users')
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


describe('Wishlist api resource', () => {
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
		it('should return all wishlists', () => {
			let res;
			return chai.request(app)
				.get('/wishlists')
				.then(_res => {
					res = _res
					res.should.have.status(200)
					res.body.wishlists.should.have.length.of.at.least(1)
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
			return chai.request(app)
				.post('/wishlists')
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
						.put(`/wishlists/${updateItem.id}/${ebookId}`)
						.send(updateItem)
				})
				.then(res => {
					res.should.have.status(201)
					res.body.items.should.be.a('array')
					res.body.items.should.include(updateItem.item)
				})
		})
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

		it('should remove book from wishlist items if book exists in multiple lists', () => {
			seedEbookDatabase()

				//get a wishlist id
			return chai.request(app)
				.get('/wishlists')
				.then(res => {
					res.should.have.status(200)
					res.body.wishlists.should.have.length.of.at.least(1)

					return {
						list1: res.body.wishlists[0].id,
						list2: res.body.wishlists[1].id
					}
				})
				.then(lists => {
						//get an ebook id
					return chai.request(app)
						.get('/ebooks')
						.then(res => {
							res.should.have.status(200)
							res.body.ebooks.should.have.length.of.at.least(1)
							
							return {
								listId1: lists.list1,
								listId2: lists.list2,
								ebookId: res.body.ebooks[0].id
							}
						})
						.then(obj => {
							//post ebook to wishlist 1
							return chai.request(app)
								.put(`/wishlists/${obj.listId1}/${obj.ebookId}`)
								.send({
									id: obj.listId1,
									item: obj.ebookId
								})
								.then(res => {
									res.should.have.status(201)
										//post ebook to wishlist 2
									return chai.request(app)
										.put(`/wishlists/${obj.listId2}/${obj.ebookId}`)
										.send({
											id: obj.listId2,
											item: obj.ebookId
										})
										.then(res => {
											res.should.have.status(201)

											return chai.request(app)
												.delete(`/wishlists/${obj.listId1}/${obj.ebookId}`)
										})
										.then(res => {
											res.should.have.status(204)
										})
								})
						})
				})
		});

		it('should remove book from wishlist items and delete it if it exists in one list', () => {
			seedEbookDatabase()

				//get a wishlist id
			return chai.request(app)
				.get('/wishlists')
				.then(res => {
					res.should.have.status(200)
					res.body.wishlists.should.have.length.of.at.least(1)

					return {
						list1: res.body.wishlists[0].id,
						list2: res.body.wishlists[1].id
					}
				})
				.then(lists => {
						//get an ebook id
					return chai.request(app)
						.get('/ebooks')
						.then(res => {
							res.should.have.status(200)
							res.body.ebooks.should.have.length.of.at.least(1)
							
							return {
								listId1: lists.list1,
								listId2: lists.list2,
								ebookId: res.body.ebooks[0].id
							}
						})
						.then(obj => {
							//post ebook to wishlist 1
							return chai.request(app)
								.put(`/wishlists/${obj.listId1}/${obj.ebookId}`)
								.send({
									id: obj.listId1,
									item: obj.ebookId
								})
								.then(res => {
									res.should.have.status(201)

									return chai.request(app)
										.delete(`/wishlists/${obj.listId1}/${obj.ebookId}`)
								})
								.then(res => {
									res.should.have.status(204)
								})
						})
				})
		});

	})
})