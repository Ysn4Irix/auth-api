exports.HomePage = async (req, res, next) => {
  const { user } = req.user;
  res.status(200).json({
    status: 200,
    response: "Home Page",
    user: {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      country: user.country,
      accountVerified: user.verified,
      created: user.created,
    },
  });
};
