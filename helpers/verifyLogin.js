const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  const token = req.header("authtoken");
  if (!token)
    return res.status(403).json({
      status: 403,
      response: "Forbidden",
      message: "You must login first",
    });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    next(new Error("Invalid or Expired Token"));
  }
};
