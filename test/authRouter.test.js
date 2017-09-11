const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const {TEST_DATABASE_URL, JWT_SECRET} = require('../config');
const {app, runServer, closeServer} = require('../server');
const {Users} = require('../models');

const expect = chai.expect;
chai.use(chaiHttp);

describe('AUTH ENDPOINTS', function() {
    const email = 'kanye@west.com';
    const password = 'ultra lightbeam';
    const wishlists = [];
    let userId;

    before(function() {
        return runServer();
    });

    after(function() {
        return closeServer();
    });

    beforeEach(function() {
        return Users.hashPassword(password).then(password =>
            Users.create({
                email,
                password,
                wishlists
            })
            .then(user => {
                userId = user.id
            })
        );
    });

    afterEach(function() {
        return Users.remove({});
    });

    describe('/api/auth/login', function() {
        it('should reject requests with no credentials', function() {
            return chai.request(app)
                .post('/api/auth/login')
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(401);
                });
        });

        it('Should reject requests with incorrect email', function() {
            return chai.request(app)
                .post('/api/auth/login')
                .auth('wrongEmail', password)
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(401);
                });
        });

        it('Should reject requests with incorrect passwords', function() {
            return chai.request(app)
                .post('/api/auth/login')
                .auth(email, 'T Swift')
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(401);
                });
        });

        it('Should return a valid auth token', function() {
            return chai.request(app)
                .post('/api/auth/login')
                .auth(email, password)
                .then(res => {
                    res.should.have.status(200);
                    res.should.be.a('object');
                    const token = res.body.authToken;
                    token.should.be.a('string');
                    const payload = jwt.verify(token, JWT_SECRET, {
                        algorithm: ['HS256']
                    });
                    payload.user.should.deep.equal({
                        id: userId,
                        email,
                        wishlists
                    });
                });
        });
    });

    describe('/api/auth/refresh', function() {
        it('Should reject requests with no credentials', function() {
            return chai.request(app)
                .post('/api/auth/refresh')
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(401);
                });
        });

        it('Should reject requests with an invalid token', function() {
            const token = jwt.sign(
                {
                    email,
                    wishlists
                },
                'totally not the secret, you liar',
                {
                    algorithm: 'HS256',
                    expiresIn: '7d'
                }
            );

            return chai
                .request(app)
                .post('/api/auth/refresh')
                .set('Authorization', `Bearer ${token}`)
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(401);
                });
        });

        it('Should reject requests with an expired token', function() {
            const token = jwt.sign(
                {
                    user: {
                        email,
                        wishlists
                    },
                    exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
                },
                JWT_SECRET,
                {
                    algorithm: 'HS256',
                    subject: email
                }
            );

            return chai.request(app)
                .post('/api/auth/refresh')
                .set('authorization', `Bearer ${token}`)
                .then(() =>
                    expect.fail(null, null, 'Request should not succeed')
                )
                .catch(err => {
                    if (err instanceof chai.AssertionError) {
                        throw err;
                    }

                    const res = err.response;
                    res.should.have.status(401);
                });
        });
        it('Should return a valid auth token with a newer expiry date', function() {
            const token = jwt.sign(
                {
                    user: {
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
            const decoded = jwt.decode(token);

            return chai.request(app)
                .post('/api/auth/refresh')
                .set('authorization', `Bearer ${token}`)
                .then(res => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    const token = res.body.authToken;
                    token.should.be.a('string');
                    const payload = jwt.verify(token, JWT_SECRET, {
                        algorithm: ['HS256']
                    });
                    payload.user.should.deep.equal({
                        email,
                        wishlists
                    });
                    payload.exp.should.be.at.least(decoded.exp);
                });
        });
    });
});