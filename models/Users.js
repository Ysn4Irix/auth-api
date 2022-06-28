/**
 * @author Ysn4Irix
 * @email ysn4irix@gmail.com
 * @create date 08-05-2021
 * @modify date 26-06-2022
 * @desc Users Database model
 */

const mongoose = require("mongoose")

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
  verified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  emailVerifyCode: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

module.exports = mongoose.model("Users", userSchema)