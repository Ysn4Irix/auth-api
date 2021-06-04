/**
 * @author YsnIrix
 * @email ysn4irix@gmail.com
 * @create date 08-05-2021
 * @modify date 11-05-2021
 * @desc Server entry point
 */

const app = require('express')()
const logger = require('morgan')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()
const rateLimit = require("express-rate-limit")

const authRouter = require('./routes/auth')
const homeRouter = require('./routes/home')
const crudRouter = require('./routes/crud')

app.set('trust proxy', true);
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(
    rateLimit({
        windowMs: 40 * 1000,
        max: 3,
        message: "Too many requests from this IP, please try again after 40s"
    })
)

app.use('/api/v1', authRouter)
app.use('/api/v1', homeRouter)
app.use('/api/v1/crud', crudRouter)

// Connect to Database
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}, () => {
    console.log('Connected To Database')
})

app.use((req, res, next) => {
    const error = new Error("Request Not Found")
    error.status = 404
    next(error)
})

// error handler
app.use((error, req, res, next) => {
    // Set locals, only providing error in development
    res.locals.message = error.message
    res.locals.error = req.app.get('env') === 'development' ? error : {}

    // Send the error message
    res.status(error.status || 400).json({
        error: {
            message: error.message
        }
    })
})

module.exports = app