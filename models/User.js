const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please supply an email address'
  },
  username: {
    type: String,
    required: 'Please supply a username',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  likes: [
    { type: mongoose.Schema.ObjectId, ref: 'Post' }
  ]
});

userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.username); 
  return `https://www.gravatar.com/avatar/${hash}?s=40&d=identicon&r=PG`;
});

// Exposes the register method
userSchema.plugin(passportLocalMongoose, { usernameField: 'username' });

userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);