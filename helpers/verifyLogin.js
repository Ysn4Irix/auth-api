/**
 * @author Ysn4Irix
 * @email ysn4irix@gmail.com
 * @create date 10-05-2021
 * @modify date 28-06-2022
 * @desc User Entry Validations
 */

const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  const token = req.header("authtoken")
  if (!token)
    return res.status(403).json({
      status: 403,
      response: "Forbidden",
      message: "You must login first",
    })

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    req.user = verified
    next()
  } catch {
    next(new Error("Session is expired!!"))
  }
}