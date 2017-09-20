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
		database: {type: String, required: true},
		icon: {type: String},
		title: {type: String, required: true},
		author: {type: String, required: true},
		preview: {type: String},
		publishDate: {type: String}, //this may be a date depending on response
		languages: {type: [String]},
		pages: {type: Number},
		formats: {type: [String]},
		location: {type: String}
	});

	EbookSchema.methods.ebookRepr = function(){
		return {
			id: this._id,
			database: this.database,
			icon: this.icon,
			title: this.title,
			author: this.author,
			preview: this.preview,
			publishDate: this.publishDate,
			languages: this.languages,
			pages: this.pages,
			formats: this.formats,
			location: this.location,
		}
	};
//

const Users = mongoose.model('users', UserSchema);
const Wishlists = mongoose.model('wishlists', WishlistSchema);
const Ebooks = mongoose.model('ebooks', EbookSchema);

module.exports = {Users, Wishlists, Ebooks};