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
const {Ebooks} = require('../models')

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


describe('Ebook api resource', () => {
	before(() => {
		return runServer(TEST_DATABASE_URL)
	})
	beforeEach(() => {
		return seedEbookDatabase()
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
	})

	describe('Post endpoint', () => {
		it('should post new ebook to database', () => {
			let ebook = generateEbookData()

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
	})

	describe('Delete endpoint', () => {
		it('should remove ebook from database', () => {
			let bookId;
			Ebooks
				.findOne()
				.exec()
				.then(book => {
					bookId = book.id

					return chai.request(app)
						.delete(`/ebooks/${bookId}`)
				})
				.then(res => {
					res.should.have.status(204)
				})
		})
	})

})