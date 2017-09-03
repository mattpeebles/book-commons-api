const mongoose = require('mongoose')


const UserSchema = mongoose.Schema({
	email: {type: String, required: true},
	password: {type: String, required: true},
	wishlists: {type: [String], required: true}
})


UserSchema.methods.userRepr = function(){
	return {
		id: this._id,
		email: this.email,
		wishlists: this.wishlists
	}
}

const WishlistSchema = mongoose.Schema({
	title: {type: String, required: true},
	items: {type: Array, "default": []} //an array of objects
})

WishlistSchema.methods.listRepr = function(){
	return {
		id: this._id,
		title: this.title,
		items: this.items
	}
}

const Users = mongoose.model('users', UserSchema)
const Wishlists = mongoose.model('wishlists', WishlistSchema)

module.exports = {Users, Wishlists}