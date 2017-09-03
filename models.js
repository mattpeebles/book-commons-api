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

const Users = mongoose.model('users', UserSchema)
module.exports = {Users}