/**
 * @author YsnIrix
 * @email ysn4irix@gmail.com
 * @create date 09-05-2021
 * @modify date 20-08-2021
 * @desc Authentication Controller
 */

const User = require("../models/Users");
const {
  validateRegister,
  validateLogin,
  validateForgetPass,
  validateChangePass,
  validateChangeEmail,
} = require("../helpers/validate");
const { compare, hash } = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const auth = {
  /* Register a user */
  RegisterHandler: async (req, res, next) => {
    /* Validation */
    const { error } = validateRegister(req.body);
    if (error) return next(error);

    /* Check Email & Username Exists */
    const EmailExist = await User.findOne({
      email: req.body.email,
    });
    //return res.status(200).jsonp(EmailExist);
    if (EmailExist) return next(new Error("Email ID already exists"));

    /* Check Username Exists */
    const UsernameExist = await User.findOne({
      username: req.body.username,
    });
    if (UsernameExist) return next(new Error("Username already in use"));

    /* Hashing the Password */
    const hashPassword = await hash(req.body.password, 10);

    const user = new User({
      fullname: req.body.fullname,
      username: req.body.username,
      email: req.body.email,
      password: hashPassword,
      country: req.body.country,
    });

    /* Sending Activation Email */
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken = oauth2Client.getAccessToken();
    const mailToken = jwt.sign(
      {
        email: user.email,
      },
      process.env.JWT_ACCOUNT_ACTIVATE_SECRET,
      {
        expiresIn: "10m",
      }
    );
    const clientURL = "http://" + req.headers.host;
    const output = `<h2>Please click on below link to activate and verify your email</h2>
                <a href='${clientURL}/api/v1/activate/${mailToken}'>👉  Activate  👈</a>
                <p><strong>NOTE: </strong> The activation link expires in <strong>10 minutes</strong></p>`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.AUTH_EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    /* send mail with defined transport object */

    const mailOptions = {
      from: '"Auth Admin" <authysn@gmail.com>', // sender address
      to: req.body.email, // list of receivers
      subject: "🌍 Email Activation : Auth System", // Subject line
      generateTextFromHTML: true,
      html: output, // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error)
        return next(
          new Error(
            error.message.includes("invalid_grant")
              ? "Invalid Grant : Refresh Token Expired"
              : error.message
          )
        );

      user
        .save()
        .then(() => {
          res.status(200).json({
            status: 200,
            message: "Account Created. verify your email.",
            response: info.response,
            method: "GET",
            activationURL: `http://${req.headers.host}/api/v1/activate/${mailToken}`,
          });
        })
        .catch((err) => {
          return next(
            new Error({
              message: "Database Error",
              error: err.message,
            })
          );
        });
    });
  },
  /* Activate Account */
  ActivateAccountHandler: async (req, res, next) => {
    const token = req.params.token;

    if (token) {
      jwt.verify(
        token,
        process.env.JWT_ACCOUNT_ACTIVATE_SECRET,
        (err, decodedToken) => {
          if (err)
            return next(
              new Error("Incorrect or expired link! Please try again.")
            );

          //return res.status(200).jsonp(decodedToken)
          const { email } = decodedToken;

          User.findOne(
            {
              email: email,
            },
            (err, user) => {
              //return res.status(200).jsonp(user);
              if (user.verified)
                return next(new Error("Account already activated"));

              User.findByIdAndUpdate(
                {
                  _id: user._id,
                },
                {
                  verified: true,
                  activateToken: token,
                },
                (err) => {
                  if (err)
                    return next(
                      new Error("Account Activation Error 😢, try again later")
                    );

                  res.status(200).json({
                    status: 200,
                    response: "OK",
                    redirectURL: `http://${req.headers.host}/api/v1/login`,
                    message:
                      "Account activated successfully, you can log in now",
                  });
                }
              );
            }
          );
        }
      );
    }
  },
  /* Login a user */
  LoginHandler: async (req, res, next) => {
    /* Check is user already logged in */
    if (req.user != null)
      return next(new Error("Your are already logged in 😠"));

    /* Validation */
    const { error } = validateLogin(req.body);
    if (error) return next(error);

    /* Check User Exists */
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) return next(new Error("User not found"));

    //return res.status(200).jsonp(user.verified)
    /* Checking Email Activation */
    if (!user.verified) {
      /* Sending Activation Email */
      const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
      });

      const accessToken = oauth2Client.getAccessToken();
      const mailToken = jwt.sign(
        {
          email: req.body.email,
        },
        process.env.JWT_ACCOUNT_ACTIVATE_SECRET,
        {
          expiresIn: "10m",
        }
      );
      const clientURL = "http://" + req.headers.host;
      const output = `<h2>Please click on below link to activate and verify your email</h2>
            <a href='${clientURL}/api/v1/activate/${mailToken}'>👉  Activate  👈</a>
                <p><b>NOTE: </b> The activation link expires in 10 minutes.</p>`;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.AUTH_EMAIL,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });

      /* send mail with defined transport object */

      const mailOptions = {
        from: '"Auth Admin" <authysn@gmail.com>', // sender address
        to: req.body.email, // list of receivers
        subject: "🌍 Email Activation : Auth API", // Subject line
        generateTextFromHTML: true,
        html: output, // html body
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error)
          return next(
            new Error(
              error.message.includes("invalid_grant")
                ? "Invalid Grant : Refresh Token Expired"
                : error.message
            )
          );

        res.status(200).json({
          status: 200,
          response: info.response,
          message:
            "Account not activated, Email Verification sent check your mailbox",
          newActivationURL: `http://${req.headers.host}/api/v1/activate/${mailToken}`,
        });
      });
    } else {
      // return res.status(200).jsonp(hashNewPassword)
      /* Checking the password is correct */
      const validPass = await compare(req.body.password, user.password);
      if (!validPass) return next(new Error("Incorrect Email or Password"));

      // Create & asign a token to the user
      const token = jwt.sign(
        {
          _id: user._id,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      );

      res.header("authtoken", token);

      return res.status(200).json({
        status: 200,
        response: "LoggedIn",
        message: {
          user: {
            _id: user._id,
            accessToken: token,
          },
        },
      });
    }
  },
  /* Forget Password Handler */
  ForgetHandler: (req, res, next) => {
    /* Validation */
    const { error } = validateForgetPass(req.body);
    if (error) return next(error);

    User.findOne({
      email: req.body.email,
    }).then((user) => {
      if (!user)
        return next(
          new Error("User with this Email ID does not exists in our system")
        );

      /* Sending Verification Email */
      const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
      });

      const accessToken = oauth2Client.getAccessToken();
      const mailToken = jwt.sign(
        {
          _id: user._id,
        },
        process.env.JWT_MAIL_SECRET,
        {
          expiresIn: "10m",
        }
      );
      const clientURL = "http://" + req.headers.host;
      const output = `<h2>Please click on below link to reset your account password</h2>
            <a href='${clientURL}/api/v1/forget/reset/${mailToken}'>👉 Reset Password 👈</a>
            <p><b>NOTE: </b> The reset link expires in 10 minutes.</p>`;

      User.updateOne(
        {
          resetToken: mailToken,
        },
        (err) => {
          if (err) return next(new Error("Error resetting password"));

          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              type: "OAuth2",
              user: process.env.AUTH_EMAIL,
              clientId: process.env.CLIENT_ID,
              clientSecret: process.env.CLIENT_SECRET,
              refreshToken: process.env.REFRESH_TOKEN,
              accessToken: accessToken,
            },
          });

          /* send mail with defined transport object */
          const mailOptions = {
            from: '"Auth Admin" <authysn@gmail.com>', // sender address
            to: req.body.email, // list of receivers
            subject: "🌍 Account Password Reset: Auth API", // Subject line
            generateTextFromHTML: true,
            html: output, // html body
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error)
              return next(
                new Error(
                  error.message.includes("invalid_grant")
                    ? "Invalid Grant : Refresh Token Expired"
                    : error.message
                )
              );

            res.status(200).json({
              status: 200,
              response: "OK",
              resetLink: `http://${req.headers.host}/api/v1/forget/reset/${mailToken}`,
              method: "POST",
              message:
                "Password reset link sent to email. Please see your mailbox",
            });
          });
        }
      );
    });
  },

  /* Checking the Reset Password Link */
  CheckResetLink: (req, res, next) => {
    const token = req.params.token;
    if (token) {
      jwt.verify(token, process.env.JWT_MAIL_SECRET, (err, decodedToken) => {
        if (err)
          return next(
            new Error("Incorrect or expired link! Please try again.")
          );

        const { _id } = decodedToken;

        res.status(200).json({
          status: 200,
          response: "OK",
          message: "Success, Reset password link is valid ✅",
          redirectURL: `http://${req.headers.host}/api/v1/forget/resetpass/${_id}`,
          method: "POST",
        });
      });
    }
  },

  /* Reseting the Password */
  ResetingPasswordHandler: (req, res, next) => {
    const userid = req.params.userid;

    User.findById(userid, async (err, user) => {
      if (err) return next(new Error("User does not exist!"));

      /* Validation */
      const { error } = validateChangePass(req.body);
      if (error) return next(error);

      if (req.body.newpassword !== req.body.confirmpassword)
        return next(new Error("Passwords do not match"));

      /* Hashing the new Password */
      const hashNewPassword = await hash(req.body.confirmpassword, 10);

      User.findByIdAndUpdate(
        {
          _id: user._id,
        },
        {
          password: hashNewPassword,
        },
        (err) => {
          if (err) return next(new Error("Error resetting password"));

          res.status(200).json({
            status: 200,
            response: "OK",
            redirectURL: `http://${req.headers.host}/api/v1/login`,
            message: "Account Password changed successfully",
          });
        }
      );
    });
  },

  /*Request Verification Email Code*/
  RequestEmailCode: (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000);
    const { _id } = req.user;

    /* Sending Verification Email */
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken = oauth2Client.getAccessToken();

    const output = `<h2>Your Verification Code is :</h2>
        <h1 style="color: red">${code}</h1>`;

    User.findByIdAndUpdate(
      {
        _id: _id,
      },
      {
        emailVerifyCode: code,
      },
      (err, user) => {
        if (err) return next(new Error("Database Error"));

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: process.env.AUTH_EMAIL,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken,
          },
        });

        /* send mail with defined transport object */
        const mailOptions = {
          from: '"Auth Admin" <authysn@gmail.com>', // sender address
          to: user.email, // list of receivers
          subject: "🌍 Account Email Change: Auth System", // Subject line
          generateTextFromHTML: true,
          html: output, // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error)
            return next(
              new Error(
                error.message.includes("invalid_grant")
                  ? "Invalid Grant : Refresh Token Expired"
                  : error.message
              )
            );

          res.status(200).json({
            status: 200,
            response: info.message,
            message: "Verification code sent to email. Please see your mailbox",
            redirectURL: `http://${req.headers.host}/api/v1/email/change`,
          });
        });
      }
    );
  },

  /* Changing Email */
  ChangeEmail: (req, res, next) => {
    //return res.status(200).jsonp(req.user);
    const { _id } = req.user;

    User.findById(_id, async (err, user) => {
      //return res.status(200).jsonp(user);
      if (err) return next(new Error("User with this email  does not exist!"));
      /* Validation */
      const { error } = validateChangeEmail(req.body);
      if (error) return next(error);

      if (req.body.code !== user.emailVerifyCode)
        return next(new Error("Invalid Verification Code"));

      User.findByIdAndUpdate(
        {
          _id: user._id,
        },
        {
          email: req.body.newEmail,
          verified: false,
          activateToken: "",
          emailVerifyCode: 0,
        },
        (err) => {
          if (err)
            return next(new Error("Error changing email, Try again later"));

          res.status(200).json({
            status: 200,
            response: "OK",
            redirectURL: `http://${req.headers.host}/api/v1/email/change`,
            method: "GET",
            message:
              "Email address changed successfully, you must verify your new email",
          });
        }
      );
    });
  },
};

module.exports = auth;
