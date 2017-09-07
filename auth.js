//Passport and Authorize middleware set up

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const {Users} = require('./models')



		//establishes local strategy for passport
		//validates password goes alon with account
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'   
    },
    function verify(email, password, done) {
	 	let user;
	 	Users
			.findOne({email: email})
			.exec()
			.then(_user => {
				user = _user
				if (!user){
					return done(null, false)
				}
				return user.validatePassword(password)
			})
			.then(isValid => {
				if (!isValid){
					return done(null, false)
				}
				else{
					return done(null, user)
				}
			})
			.catch(err => done(err))
	}
))

	//ensures user is logged in by checking
	//to see if session was established
	//by looking at req.user value
function authorize(req, res, next){
	if (req.user !== undefined){
		next()
	}
	else {
		res.status(403).send('Forbidden')	
	}
}

	//serializes user object into session
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

	//removes user object after session is concluded
passport.deserializeUser(function(id, done) {
  Users.findById(id, function (err, user) {
    done(err, user);
  });
});


module.exports = {passport, authorize}
