const mongoose = require('mongoose');
const passportLocalMongoosePkg = require('passport-local-mongoose');

// Compatibility wrapper for ESM/CJS
const passportLocalMongoose = passportLocalMongoosePkg.default || passportLocalMongoosePkg;

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);