/**
 * @author YsnIrix
 * @email ysn4irix@gmail.com
 * @create date 10-05-2021
 * @modify date 19-08-2021
 * @desc authetication route
 */

const router = require("express").Router();
const authController = require("../controllers/authController");
const verify = require("../helpers/verifyLogin");
const iplockup = require("../helpers/vpnDetection");

/* Register a user */
router.post("/register", authController.RegisterHandler);

/* Activate */
router.get("/activate/:token", authController.ActivateAccountHandler);

/* Login a user */
router.post("/login", authController.LoginHandler);

/* Forget Handler */
router.post("/forget", authController.ForgetHandler);

/* Checking the Reset Password Link */
router.get("/forget/reset/:token", authController.CheckResetLink);

/* Reseting the Password */
router.post(
  "/forget/resetpass/:userid",
  authController.ResetingPasswordHandler
);

/* Requesting Email Code */
router.get("/email/change", verify, authController.RequestEmailCode);

/* Changing the Email */
router.post("/email/change", verify, authController.ChangeEmail);

router.get("/iplockup", async (req, res) => {
  const IPdata = await iplockup("79.142.79.17");
  res.json({
    response: IPdata,
  });
});
module.exports = router;
