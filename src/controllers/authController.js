import passport from "passport";

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const googleAuthCallback = passport.authenticate("google", {
  failureRedirect: "/login",
});

export default {
  googleAuth,
  googleAuthCallback,
};
