/**
 * @author YsnIrix
 * @email ysn4irix@gmail.com
 * @create date 08-05-2021
 * @modify date 28-05-2021
 * @desc Users Database model
 */

const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  activateToken: {
    type: String,
    default: "",
  },
  resetToken: {
    type: String,
    default: "",
  },
  emailVerifyCode: {
    type: Number,
    default: 0,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Users", userSchema);
