export const otpAccess = (req, res, next) => {
  if (req.session.requre_sign) {
    next();
  } else {
    res.redirect("/login");
  }
};
