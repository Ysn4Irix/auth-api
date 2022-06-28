exports.HomePage = async (req, res, next) => {
  const {
    _id
  } = req.user
  res.status(200).json({
    status: 200,
    response: "Home Page",
    user: {
      _id,
    },
  })
}