const chai = require('chai')
const chaiHttp = require('chai-http')
const jwt = require('jsonwebtoken')
const {expect, should} = require('chai')

chai.use(chaiHttp)

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const faker = require('faker')

const {TEST_DATABASE_URL, JWT_SECRET} = require('../config')
const {app, runServer, closeServer} = require('../server')
const {Users, Ebooks, Wishlists} = require('../models')

// Test Database seed functions

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

function tearDownDb(){
	return new Promise((resolve, reject) => {
		console.warn('Delete test database')
		return mongoose.connection.dropDatabase()
		.then(result => resolve(result))
		.catch(err => reject(err))
	})
}


describe('EBOOK API RESOURCE', () => {
	let userId;
	let token;
	const email = 'frank@ocean.com';
	const password = 'chanel';
	let wishlists = [];
	//let agent = chai.request.agent(app)

	before(() => {
		return runServer(TEST_DATABASE_URL)
	})
	beforeEach(() => {
		return seedEbookDatabase()
	})
	beforeEach(() => {
		wishlists = []
			//set up and log agent in to do authorized tests

		return Wishlists
			.find()
			.exec()
			.then(lists => {
					//send wishlist ids into array that is accessible by all tests
				lists.forEach(list => {
					wishlists.push(list.id)
				})

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

	describe('Get endpoint', () => {
		it('should return all ebooks', () => {
			let res;
			return chai.request(app)
				.get('/ebooks')
				.send({message: 'hello'})
				.then(_res => {
					res = _res
					res.should.have.status(200)
					res.body.ebooks.should.have.length.of.at.least(1)
				})
		})

		it('should return a particular ebook', () => {
			let bookId;
			let res;
			return Ebooks
				.findOne()
				.exec()
				.then(ebook => {
					bookId = ebook.id

					return chai.request(app)
						.get(`/ebooks/${bookId}`)
						.then(_res => {
							res = _res
							res.should.have.status(200)
							res.body.id.should.be.equal(bookId)
						})
				})
		})

		it('should return all ebooks in wishlist', () => {
			let bookIds = [];
			let res;

				//prep
				//get ebook ids and pass them to wishlist
			return Ebooks
				.find()
				.exec()
				.then(books => {

					books.forEach(book => {
						bookIds.push(book._id)
					})

						//prep
						//post new wishlist with ebook ids in items
					return chai.request(app)
						.post('/wishlists')
						.set('authorization', `Bearer ${token}`)
						.send({
							title: 'Test',
							items: bookIds
						})

				})
				.then(res => {
					let listId = res.body.wishlist.id

						//test
						//get ebooks associated with wishlist
					return chai.request(app)
						.get(`/ebooks/wishlist/${listId}`)
				})
				.then(res => {
					res.should.have.status(200)
					res.should.be.json
					res.body.ebooks.length.should.be.equal(bookIds.length)
					res.body.ebooks.forEach((book, index) => {
						book.id.should.be.equal(bookIds[index].toString())
					})

				})
		})
	})

	describe('Post endpoint', () => {
		it('should post new ebook to database', () => {
			let ebook = generateEbookData()

				//test
				//add new ebook to database
			return chai.request(app)
				.post('/ebooks')
				.send(ebook)
				.then(res => {

					res.should.have.status(201)
					res.body.title.should.be.equal(ebook.title)
					res.body.author.should.be.equal(ebook.author)
					res.body.preview.should.be.equal(ebook.preview)
					res.body.publishDate.should.be.equal(ebook.publishDate)
					res.body.languages.should.deep.equal(ebook.languages)
					res.body.pages.should.be.equal(ebook.pages)
					res.body.formats.should.deep.equal(ebook.formats)
					res.body.location.should.be.equal(ebook.location)
					res.body.locationIcon.should.be.equal(ebook.locationIcon)
					res.body.locationUrl.should.be.equal(ebook.locationUrl)
				})
		})

		it('should not post duplicate ebook to database', () => {
			let ebook = generateEbookData()

			return chai.request(app)
				.post('/ebooks')
				.send(ebook)
				.then(res => {
					res.should.have.status(201)
					
					return chai.request(app)
						.post('/ebooks')
						.send(ebook)
						.then(res => {
							res.should.have.status(200)
							res.body.message.should.be.equal('Book exists in database already')
							res.body.ebook.title.should.be.equal(ebook.title)
							res.body.ebook.author.should.be.equal(ebook.author)
							res.body.ebook.preview.should.be.equal(ebook.preview)
							res.body.ebook.publishDate.should.be.equal(ebook.publishDate)
							res.body.ebook.languages.should.deep.equal(ebook.languages)
							res.body.ebook.pages.should.be.equal(ebook.pages)
							res.body.ebook.formats.should.deep.equal(ebook.formats)
							res.body.ebook.location.should.be.equal(ebook.location)
							res.body.ebook.locationIcon.should.be.equal(ebook.locationIcon)
							res.body.ebook.locationUrl.should.be.equal(ebook.locationUrl)
						})
				})
		})
	})

	describe('Delete endpoint', () => {
		it('should remove ebook from database', () => {
			let bookId;
			
				//prep
				//find an ebook id
			return Ebooks
				.findOne()
				.exec()
				.then(book => {
					bookId = book.id

						//test
						//remove ebook from database
					return chai.request(app)
						.delete(`/ebooks/${bookId}`)
				})
				.then(res => {
					res.should.have.status(204)
				})
		})

	})

})