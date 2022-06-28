const router = require("express").Router()
const verify = require("../helpers/verifyLogin")
const homeController = require("../controllers/homeController")

router.get("/home", verify, homeController.HomePage)

module.exports = router