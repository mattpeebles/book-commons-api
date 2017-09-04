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
const {Wishlists} = require('../models')

// Test Database seed functions

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
		})
	})
})