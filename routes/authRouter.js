const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../config');

const createAuthToken = user => {
    
    return jwt.sign({user}, config.JWT_SECRET, {
        subject: user.email,
        expiresIn: config.JWT_EXPIRY,
        algorithm: 'HS256'
    });
};

const authRouter = express.Router();

    //email and password required
authRouter.post(
    '/login',
    passport.authenticate('basic', {session: false}),
    (req, res) => {
        const authToken = createAuthToken(req.user.userRepr());
        res.json({authToken});
    }
);

    //requires valid jwt token before new one can be received
authRouter.post(
    '/refresh',
    passport.authenticate('jwt', {session: false}),
    (req, res) => {
        const authToken = createAuthToken(req.user);
        res.json({authToken});
    }
);

module.exports = authRouter;