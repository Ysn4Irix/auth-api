/**
 * @author YsnIrix
 * @email ysn4irix@gmail.com
 * @create date 09-05-2021
 * @modify date 28-05-2021
 * @desc Authentication Controller
 */

const User = require("../models/Users");
const {
  validateRegister,
  validateLogin,
  validateForgetPass,
  validateChangePass,
  validateChangeEmail,
} = require("../validate");
const { compare, hash } = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const auth = {
  /* Register a user */
  RegisterHandler: async (req, res) => {
    /* Validation */
    const { error } = validateRegister(req.body);
    if (error)
      return res.status(400).json({
        status: 400,
        response: "Bad Request",
        message: error.details[0].message,
      });

    /* Check Email Exists */
    const EmailExist = await User.findOne({
      email: req.body.email,
    });
    if (EmailExist)
      return res.status(400).json({
        status: 400,
        response: "Bad Request",
        message: "Email ID already exists",
      });

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
        user: user,
      },
      process.env.JWT_ACCOUNT_ACTIVATE_SECRET,
      {
        expiresIn: "30m",
      }
    );
    const clientURL = "http://" + req.headers.host;
    const output = `<h2>Please click on below link to activate and verify your email</h2>
                <a href='${clientURL}/api/v1/activate/${mailToken}'>👉  Activate  👈</a>
                <p><strong>NOTE: </strong> The activation link expires in 30 minutes.</p>`;

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
        return res.status(400).json({
          status: 400,
          response: "Bad Request",
          message:
            "Something went wrong on our end. Please try register again.",
        });

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
          res.status(400).json({
            status: 400,
            response: "Bad Request",
            message: err.message,
          });
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
            return res.status(400).json({
              status: 400,
              response: "Bad Request",
              message: "Incorrect or expired link! Please try again.",
            });

          //return res.status(200).jsonp(decodedToken)
          const { user } = decodedToken;

          User.findOne(
            {
              email: user.email,
            },
            (err, user) => {
              if (user.verified)
                return res.status(400).json({
                  status: 400,
                  response: "Bad Request",
                  message: "Account already activated",
                });

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
                    return res.status(400).json({
                      status: 400,
                      response: "Bad Request",
                      message: "Account Activation Error, try register again",
                    });

                  res.status(200).json({
                    status: 200,
                    response: "OK",
                    redirectURL: `http://${req.headers.host}/api/v1/login`,
                    method: "GET",
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
    /* Validation */
    const { error } = validateLogin(req.body);
    if (error)
      return res.status(400).json({
        status: 400,
        response: "Bad Request",
        message: error.details[0].message,
      });

    /* Check User Exists */
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user)
      return res.status(400).json({
        status: 400,
        response: "Bad Request",
        message: "User not found",
      });

    //return res.status(200).jsonp(user.verified)
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
          user: req.body,
        },
        process.env.JWT_ACCOUNT_ACTIVATE_SECRET,
        {
          expiresIn: "30m",
        }
      );
      const clientURL = "http://" + req.headers.host;
      const output = `<h2>Please click on below link to activate and verify your email</h2>
            <a href='${clientURL}/api/v1/activate/${mailToken}'>👉 Activate 👈</a>
                <p><b>NOTE: </b> The activation link expires in 30 minutes.</p>`;

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
          return res.status(400).json({
            status: 400,
            response: "Bad Request",
            message:
              "Something went wrong on our end. Please try register again.",
          });

        res.status(200).json({
          status: 200,
          response: info.response,
          message: "Account not activated",
          newActivationURL: `http://${req.headers.host}/api/v1/activate/${mailToken}`,
          method: "GET",
        });
      });
    } else {
      // return res.status(200).jsonp(hashNewPassword)
      /* Checking the password is correct */
      const validPass = await compare(req.body.password, user.password);
      if (!validPass)
        return res.status(400).json({
          status: 400,
          response: "Bad Request",
          message: "Incorrect Email or Password",
        });

      // Create & asign a token to the user
      const token = jwt.sign(
        {
          user: user,
          expireIn: "4h",
        },
        process.env.JWT_SECRET
      );

      res.header("auth-token", token);

      return res.status(200).json({
        status: 200,
        response: "LoggedIn",
        message: {
          user: {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            country: user.country,
            accountVerified: user.verified,
            created: user.created,
          },
        },
      });
    }
  },
  /* Forget Password Handler */
  ForgetHandler: (req, res) => {
    /* Validation */
    const { error } = validateForgetPass(req.body);
    if (error)
      return res.status(400).json({
        status: 400,
        response: "Bad Request",
        message: error.details[0].message,
      });

    User.findOne({
      email: req.body.email,
    }).then((user) => {
      if (!user)
        return res.status(400).json({
          status: 400,
          response: "Bad Request",
          message: "User with this Email ID does not exists",
        });

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
          expiresIn: "30m",
        }
      );
      const clientURL = "http://" + req.headers.host;
      const output = `<h2>Please click on below link to reset your account password</h2>
            <a href='${clientURL}/api/v1/forget/${mailToken}'>👉 Activate 👈</a>
            <p><b>NOTE: </b> The reset link expires in 30 minutes.</p>`;

      User.updateOne(
        {
          resetToken: mailToken,
        },
        (err) => {
          if (err)
            return res.status(400).json({
              status: 400,
              response: "Bad Request",
              message: "Error resetting password",
            });

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
            subject: "🌍 Account Password Reset: Auth System", // Subject line
            generateTextFromHTML: true,
            html: output, // html body
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error)
              return res.status(400).json({
                status: 400,
                response: "Bad Request",
                message:
                  "Something went wrong on our end. Please try again later.",
              });

            res.status(200).json({
              status: 200,
              response: "OK",
              resetLink: `http://${req.headers.host}/api/v1/forget/reset/${mailToken}`,
              method: "POST",
              message:
                "Password reset link sent to email. Please see you mailbox",
            });
          });
        }
      );
    });
  },
  /* Reseting the Password */
  ResetingPasswordHandler: (req, res) => {
    const token = req.params.token;

    if (token) {
      jwt.verify(token, process.env.JWT_MAIL_SECRET, (err, decodedToken) => {
        if (err)
          return res.status(400).json({
            status: 400,
            response: "Bad Request",
            error: "Incorrect or expired link! Please try again.",
          });

        const { _id } = decodedToken;

        User.findById(_id, async (err, user) => {
          if (err)
            return res.status(400).json({
              status: 400,
              response: "Bad Request",
              error: "User with email ID does not exist! Please try again.",
            });

          /* Validation */
          const { error } = validateChangePass(req.body);
          if (error)
            return res.status(400).json({
              status: 400,
              response: "Bad Request",
              error: error.details[0].message,
            });

          if (req.body.newpassword !== req.body.confirmpassword)
            return res.status(400).json({
              status: 400,
              response: "Bad Request",
              error: "Passwords do not match",
            });

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
              if (err)
                return res.status(400).json({
                  status: 400,
                  response: "Bad Request",
                  error: "Error resetting password",
                });

              res.status(200).json({
                status: 200,
                response: "OK",
                redirectURL: `http://${req.headers.host}/api/v1/login`,
                method: "GET",
                message: "Account Password changed successfully",
              });
            }
          );
        });
      });
    }
  },
  /*Request Verification Email Code*/
  RequestEmailCode: (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000);
    const { user } = req.user;
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
        <h1>${code}</h1>`;

    User.findByIdAndUpdate(
      {
        _id: user._id,
      },
      {
        emailVerifyCode: code,
      },
      (err) => {
        if (err)
          return res.status(400).json({
            status: 400,
            response: "Bad Request",
            message: "Database Error",
          });

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
            return res.status(400).json({
              status: 400,
              response: "Bad Request",
              message:
                "Something went wrong on our end. Please try again later.",
            });

          res.status(200).json({
            status: 200,
            response: info.message,
            message: "Verification code sent to email. Please see you mailbox",
            redirectURL: `http://${req.headers.host}/api/v1/email/change`,
            method: "POST",
          });
        });
      }
    );
  },
  /* Changing Email */
  ChangeEmail: (req, res) => {
    const { user } = req.user;

    User.findById(user._id, async (err, user) => {
      if (err)
        return res.status(400).json({
          status: 400,
          response: "Bad Request",
          message: "User with email ID does not exist! Please try again.",
        });

      /* Validation */
      const { error } = validateChangeEmail(req.body);
      if (error)
        return res.status(400).json({
          status: 400,
          response: "Bad Request",
          message: error.details[0].message,
        });

      if (req.body.code !== user.emailVerifyCode)
        return res.status(400).json({
          status: 400,
          response: "Bad Request",
          message: "Invalid Code",
        });

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
            return res.status(400).json({
              status: 400,
              response: "Bad Request",
              message: "Error changing email, Try again later",
            });

          res.status(200).json({
            status: 200,
            response: "OK",
            redirectURL: `http://${req.headers.host}/api/v1/email/change`,
            method: "GET",
            message:
              "Email adress changed successfully, you must verify your email",
          });
        }
      );
    });
  },
};

module.exports = auth;
