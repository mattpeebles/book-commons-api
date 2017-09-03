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
			password: generatePassword(),
			wishlists: [generateWishlists(), generateWishlists(), generateWishlists(), generateWishlists()]
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


describe('Users api resource', () => {
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
	})
})