const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports = function (req, res, next) {
    const token = req.header('auth-token')
    if (!token) return res.status(401).json({
        status: 401,
        response: 'Unauthorized',
        message: 'You must login first'
    })

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET)
        req.user = verified
        next()
    } catch {
        res.status(400).json({
            status: 400,
            response: 'Bad Request',
            message: 'Invalid or Expired Token'
        })
    }
}