/**
 * @author YsnIrix
 * @email ysn4irix@gmail.com
 * @create date 10-05-2021
 * @modify date 19-08-2021
 * @desc CRUD Operations Controller
 */

const User = require("../models/Users");
const { validateUpdate } = require("../helpers/validate");

const crud = {
  /* Getting all */
  getAllUsers: async (req, res, next) => {
    try {
      const users = await User.find();
      res.status(200).json({
        status: 200,
        response: users,
      });
    } catch (err) {
      next(err);
    }
  },
  /* Getting One */
  getOneUser: (req, res) => {
    res.status(200).json({
      status: 200,
      response: res.user,
    });
  },
  /* update user data */
  updateUser: async (req, res, next) => {
    /* Validation */
    const { error } = validateUpdate(req.body);
    if (error) return next(error);

    if (req.body.fullname != null) res.user.fullname = req.body.fullname;
    if (req.body.country != null) res.user.country = req.body.country;

    try {
      const updatedUser = await res.user.save();
      res.status(200).json({
        status: 200,
        response: updatedUser,
      });
    } catch (err) {
      res.status(400).json({
        message: err.message,
      });
    }
  },
  /* Delete User */
  deleteUser: async (req, res) => {
    try {
      await res.user.remove();
      res.status(200).json({
        status: 200,
        message: "User Deleted Successfully",
      });
    } catch (err) {
      res.status(500).json({
        status: 500,
        response: "Internal Server Error",
        message: err.message,
      });
    }
  },
  /* Get user */
  getuser: async (req, res, next) => {
    let user;
    try {
      user = await User.findById(req.params.id);
      if (user == null) return next(new Error("Cannot find user"));
    } catch (err) {
      next(new Error("Database Error 😢"));
    }
    res.user = user;
    next();
  },
};

module.exports = crud;
