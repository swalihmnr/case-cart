import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",

    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let existingUser = await User.findOne({ email });

        if (!existingUser) {
            const newUser = await User.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: email,
            password: "google-auth",
            number: null,
            isVerified: true,
            profileImg: profile.photos[0].value,
          });

          return done(null, newUser); 
        }
        console.log('existing user enter again')
        return done(null, existingUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
