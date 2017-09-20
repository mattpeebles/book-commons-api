const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const should = chai.should();
const expect = chai.expect();

chai.use(chaiHttp);

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const faker = require('faker');

const {TEST_DATABASE_URL, JWT_SECRET} = require('../config');
const {app, runServer, closeServer} = require('../server');
const {Users, Wishlists, Ebooks} = require('../models');

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
				database: 'gutenberg',
				icon: generateLocationIcon(),
				title: generateTitle(),
				author: generateAuthor(),
				preview: generatePreview(),
				publishDate: generatePublishDate(),
				languages: generateLanguages(),
				pages: generatePages(),
				formats: generateFormats(),
				location: generateLocation()
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
		console.warn('Delete test database');
		return mongoose.connection.dropDatabase()
			.then(result => resolve(result))
			.catch(err => reject(err))
	})
}


describe('WISHLIST API RESOURCE', () => {
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
		return seedWishlistDatabase()
	})
	beforeEach(() => {
		wishlists = [];

		return Wishlists
			.find()
			.exec()
			.then(lists => {
					//send wishlist ids into array that is accessible by all tests
				lists.forEach(list => {
					wishlists.push(list.id)
				});

				return Users.hashPassword(password)
					.then(password => {
						return Users
							.create({
								email,
								password,
								wishlists
							})
							.then(user => {
								userId = user.id;
								token = jwt.sign(
					                {
					                    user: {
					                        _id: userId,
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
		return tearDownDb();
	})
	after(() => {
		console.log('Closing test server')
		return closeServer();
	})

	describe('Get endpoint', () => {
		it('should return all wishlists of user', () => {
			let res;
				
				//test
				//get all user wishlists
			return chai.request(app)
				.get('/api/wishlists')
				.set('authorization', `Bearer ${token}`)
				.then(_res => {
					res = _res;
					res.should.have.status(200);
					res.should.be.json;
					res.body.wishlists.should.have.length(3);
					res.body.wishlists[0].id.should.be.equal(wishlists[0]);
					res.body.wishlists[1].id.should.be.equal(wishlists[1]);
					res.body.wishlists[2].id.should.be.equal(wishlists[2]);
				});
		});

		it('should return a particular wishlist', () => {
			let res;
			let wishlistId = wishlists[Math.floor(Math.random() * wishlists.length)];
			
				//test
				//get particular wishlist
			return chai.request(app)
				.get(`/api/wishlists/${wishlistId}`)
				.then(_res => {
					res = _res;
					res.should.have.status(200);
					res.should.be.json;
					res.body.id.should.be.equal(wishlistId);
					res.body.title.should.be.a('string');
					res.body.items.should.be.a('array');
				});
		});
	});

	describe('Post endpoint', () => {
		let wishlist = {
			title: generateTitle()
		};
			
		it('should post new wishlist to database', () => {
			let res;

				//test
				//post new wishlist
			return chai.request(app)
				.post('/api/wishlists')
				.set('authorization', `Bearer ${token}`)
				.send(wishlist)
				.then(_res => {
					res = _res;
					res.should.have.status(201);
					res.body.wishlist.title.should.be.equal(wishlist.title);
					res.body.wishlist.title.should.be.a('string');
					res.body.wishlist.items.should.deep.equal([]);
				})
		});

		it('should add new wishlist id to users wishlists', () => {
			return chai.request(app)
				.post('/api/wishlists')
				.set('authorization', `Bearer ${token}`)
				.send(wishlist)
				.then(res => {
					res.body.user.wishlists.should.include(res.body.wishlist.id);
				})
		});
	});


	describe('Put endpoint', () => {
		it('should update wishlist title', () => {
			let wishlistId = wishlists[Math.floor(Math.random() * wishlists.length)];
			
			let updateList = {
				listId: wishlistId,
				title: 'The Life of Pablo'
			};

				//test
				//update wishlist
			return chai.request(app)
				.put(`/api/wishlists/${wishlistId}`)
				.send(updateList)
				.then(res => {
					res.should.have.status(201);

						//test double check
						//get same wishlist to see if it's been updated
					return chai.request(app)
						.get(`/api/wishlists/${wishlistId}`)
				})
				.then(res => {
					res.body.title.should.be.equal(updateList.title);
				})
		});

		it('should add ebook id to items array', () => {
			let ebookId = generateItemId();
			let wishlistId = wishlists[Math.floor(Math.random() * wishlists.length)];
			let updateItem = {
				listId: wishlistId,
				item: ebookId
			};

				//test
				//add book to wishlist
			return chai.request(app)
				.put(`/api/wishlists/${updateItem.listId}/add/${ebookId}`)
				.send(updateItem)
				.then(res => {
					res.should.have.status(201);
					res.body.items.should.be.a('array');
					res.body.items.should.include(updateItem.item);
				})
		})

		it('should not add a duplicate ebook id to items array', () => {
			let wishlistId = wishlists[Math.floor(Math.random() * wishlists.length)];
			let ebookId = generateItemId();
			let item = {
					listId: wishlistId,
					item: ebookId
				};
			
				//prep
				//add book to wishlist
			return chai.request(app)
				.put(`/api/wishlists/${wishlistId}/add/${ebookId}`)
				.send(item)
				.then(() => {
					
						//test
						//try to add same book to wishlist
					return chai.request(app)
						.put(`/api/wishlists/${wishlistId}/add/${ebookId}`)
						.send(item)
				})
				.then(res => {
					res.should.have.status(202);
					res.body.message.should.be.equal('Item already exists in wishlist');
				})	
		})

		it('should remove book from wishlist items', () => {
			seedEbookDatabase();

			let wishlistId = wishlists[Math.floor(Math.random() * wishlists.length)];
			
			//prep
			//get an ebook id
			return chai.request(app)
				.get('/api/ebooks')
				.then(res => {
					res.should.have.status(200);
					res.body.ebooks.should.have.length.of.at.least(1);
					
					return {
						listId: wishlistId,
						ebookId: res.body.ebooks[0].id
					}
				})
				.then(obj => {
						//prep
						//add ebook to wishlist
					return chai.request(app)
						.put(`/api/wishlists/${obj.listId}/add/${obj.ebookId}`)
						.send({
							listId: obj.listId,
							item: obj.ebookId
						})
						.then(res => {
							res.should.have.status(201)
							
								//test
								//remove ebook from wishlist
							return chai.request(app)
								.put(`/api/wishlists/${obj.listId}/delete/${obj.ebookId}`)
								.send({
									listId: obj.listId,
									item: obj.ebookId
								})
								.then(res => {
									res.should.have.status(201);
									res.body.message.should.be.equal('Ebook removed from wishlist');
									res.body.wishlist.items.should.not.include(obj.ebookId);
								})
						})
				})
		});
	})


	describe('Delete endpoint', () => {
		it('should remove wishlist from collection and from user object', () => {
			let wishlistId = wishlists[Math.floor(Math.random() * wishlists.length)];
			
				//test
				//removes wishlist from wishlist collection
			return chai.request(app)
				.delete(`/api/wishlists/${wishlistId}`)
				.set('authorization', `Bearer ${token}`)
				.then(res => {
					res.should.have.status(204);

						//test
						//ensures that wishlist id was removed from user object
					return chai.request(app)
						.get('/api/users/me')
						.set('authorization', `Bearer ${token}`)
						.then(res => {
							res.body.wishlists.should.not.include(wishlistId);
						})
				})
		});

	})
})