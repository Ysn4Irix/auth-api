/**
 * @author Ysn4Irix
 * @email ysn4irix@gmail.com
 * @create date 08-05-2021
 * @modify date 26-06-2022
 * @desc Server entry point
 */

require("dotenv").config()
const express = require("express")
const app = express()
const logger = require("morgan")
const {
  connect
} = require("mongoose")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

const authRouter = require("./routes/auth")
const homeRouter = require("./routes/home")
const middlewares = require("./helpers/middlewares")

app.enable("trust proxy")
app.use(logger("dev"))
app.use(helmet())
app.use(express.json())
app.use(
  express.urlencoded({
    extended: true,
  })
)

app.use(
  rateLimit({
    windowMs: 40 * 1000,
    max: 3,
    message: {
      status: 429,
      response: "Too many requests from this IP, please try again after 40s",
    },
  })
)

app.use("/api/v1", authRouter)
app.use("/api/v1", homeRouter)

app.use(middlewares.notFound)
app.use(middlewares.errorHandler)

// Connect to Database
connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log("Database Connected 🎉")
    const port = process.env.PORT || 5656
    app.listen(port, () => {
      console.log(`Listening at http://localhost:${port} 🎉`)
    })
  })
  .catch((err) => console.log(err.message))

module.exports = app