const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

//User Set Up
	const UserSchema = mongoose.Schema({
		email: {type: String, required: true},
		password: {type: String, required: true},
		wishlists: {type: [String], 'default': []}
	});


	UserSchema.methods.userRepr = function(){
		return {
			id: this._id,
			email: this.email,
			wishlists: this.wishlists
		}
	};

	UserSchema.methods.validatePassword = function(password) {
		return bcrypt.compare(password, this.password)
	};

	UserSchema.statics.hashPassword = function(password){
		return bcrypt.hash(password, 10)
	};
//

//Wishlist Set Up
	const WishlistSchema = mongoose.Schema({
		title: {type: String, required: true},
		items: {type: Array, "default": []} //an array of objects
	});

	WishlistSchema.methods.listRepr = function(){
		return {
			id: this._id,
			title: this.title,
			items: this.items
		}
	};
//

//Ebook Set Up
	const EbookSchema = mongoose.Schema({
		title: {type: String, required: true},
		author: {type: String, required: true},
		preview: {type: String, required: true},
		publishDate: {type: String, required: true}, //this may be a date depending on response
		languages: {type: [String], required: true},
		pages: {type: Number, required: true},
		formats: {type: [String], required: true},
		location: {type: String, required: true},
		locationIcon: {type: String, required: true},
		locationUrl: {type: String, required: true}
	});

	EbookSchema.methods.ebookRepr = function(){
		return {
			id: this._id,
			title: this.title,
			author: this.author,
			preview: this.preview,
			publishDate: this.publishDate,
			languages: this.languages,
			pages: this.pages,
			formats: this.formats,
			location: this.location,
			locationIcon: this.locationIcon,
			locationUrl: this.locationUrl
		}
	};
//

const Users = mongoose.model('users', UserSchema);
const Wishlists = mongoose.model('wishlists', WishlistSchema);
const Ebooks = mongoose.model('ebooks', EbookSchema);

module.exports = {Users, Wishlists, Ebooks};