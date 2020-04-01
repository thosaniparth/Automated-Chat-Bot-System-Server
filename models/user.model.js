const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
let Schema = mongoose.Schema;

let user = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
});

user.pre("save", function(next)
{
    this.firstName = this.firstName.charAt(0).toUpperCase()+this.firstName.slice(1).toLowerCase();
    this.lastName = this.lastName.charAt(0).toUpperCase()+this.lastName.slice(1).toLowerCase();
    this.password = bcrypt.hashSync(this.password,10);
    next();
});

let User = mongoose.model('user',user);
module.exports = User;