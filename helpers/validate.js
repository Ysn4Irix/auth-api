/**
 * @author Ysn4Irix
 * @email ysn4irix@gmail.com
 * @create date 10-05-2021
 * @modify date 20-06-2022
 * @desc User Entry Validations
 */

const Joi = require("joi")

const options = {
  abortEarly: false,
  errors: {
    wrap: {
      label: "",
    },
  },
}

const validateRegister = (data) => {
  const schema = Joi.object({
    fullname: Joi.string().min(4).max(20).required(),
    username: Joi.string().min(6).max(15).required(),
    /* email: Joi.string().pattern(new RegExp("^[a-z0-9](\.?[a-z0-9]){5,}@g(oogle)?mail\.com$")).required().messages({
            "string.pattern.base": "Only gmail or googlemail are accepted"
        }), */
    email: Joi.string().min(6).max(25).email().required(),
    password: Joi.string().min(6).max(20).required(),
    country: Joi.string().required(),
  })
  return schema.validate(data, options)
}

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).max(25).email().required(),
    password: Joi.string().max(20).min(6).required(),
  })
  return schema.validate(data, options)
}

const validateUpdate = (data) => {
  const schema = Joi.object({
    firstname: Joi.string().min(4).max(20),
    country: Joi.string(),
  })
  return schema.validate(data, options)
}

const validateChangePass = (data) => {
  const schema = Joi.object({
    newpassword: Joi.string().min(4).max(20).required(),
    confirmpassword: Joi.string().min(4).max(20).required(),
  })
  return schema.validate(data, options)
}

const validateForgetPass = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).max(25).email().required(),
  })
  return schema.validate(data, options)
}

const validateChangeEmail = (data) => {
  const schema = Joi.object({
    code: Joi.number().min(6).required(),
    newEmail: Joi.string().min(6).max(25).email().required(),
  })
  return schema.validate(data, options)
}

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdate,
  validateChangePass,
  validateForgetPass,
  validateChangeEmail,
}