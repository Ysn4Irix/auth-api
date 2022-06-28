/**
 * @author Ysn4Irix
 * @email ysn4irix@gmail.com
 * @create date 10-05-2021
 * @modify date 26-06-2022
 * @desc authetication route
 */

const router = require("express").Router()
const authController = require("../controllers/authController")
const verify = require("../helpers/verifyLogin")
const ipcheck = require("../helpers/vpnDetection")

/* Register a user */
router.post("/register", authController.RegisterHandler)

/* Activate */
router.get("/activate/:token", authController.ActivateAccountHandler)

/* Login a user */
router.post("/login", authController.LoginHandler)

/* Forget Handler */
router.post("/forget", authController.ForgetHandler)

/* Checking the Reset Password Link */
router.get("/forget/reset/:token", authController.CheckResetLink)

/* Reseting the Password */
router.post(
  "/forget/resetpass/:userid",
  authController.ResetingPasswordHandler
)

/* Requesting Email Code */
router.get("/email/change", verify, authController.RequestEmailCode)

/* Changing the Email */
router.post("/email/change", verify, authController.ChangeEmail)

/* Logout User */
router.get("/logout", verify, authController.logout)

router.get("/ipcheck", async (req, res) => {
  const IPdata = await ipcheck("79.142.79.17")
  res.json({
    response: IPdata,
  })
})

module.exports = router