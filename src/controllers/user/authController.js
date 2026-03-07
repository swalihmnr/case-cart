
import mongoose from "mongoose";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import user from "../../models/userModel.js";
import bcrypt from "bcrypt";
import randomNumberGerator from '../../utils/randomNumberGerator.js'
import otpGeneratorTodb from "../../utils/otpGeneratorToDb.js";
import modelOtp from "../../models/otpModel.js";

// ==============================
// GET LOGIN PAGE
// ==============================
// Renders user login page
let getLogin = (req, res) => {
  req.session.isKey = false;
  res.render("./user/userLogin");
};

// ==============================
// POST LOGIN
// ==============================
// Validates user credentials
// Checks: existence, block status, verification, password
// Creates user session on success
let postLogin = async (req, res) => {
  const { Email, Password } = req.body;
  try {
    let existing = await user.findOne({ email: Email });
    if (existing) {
      if (existing.isBlock !== true) {
        if (existing.isVerified === true) {
          console.log("user verified....");
          if (existing.email !== Email) {
            console.log("user email not match");
            return res.json({
              success: false,
              message: "user email not match",
              emailErr: true,
            });
          }
          let isValidPass = await bcrypt.compare(Password, existing.password);
          if (!isValidPass) {
            console.log("incorrect password");
            return res.json({
              success: false,
              message: "incorrect password",
              passErr: true,
              redirectUrl: "/login",
            });
          } else {
            console.log("login successfully");

            req.session.user = {
              id: existing._id,
              name: `${existing.firstName} ${existing.lastName}`,
              email: existing.email,
              profileUrl: existing.profileImg,
            };
            console.log(req.session.user.profileUrl);
            return res
              .status(200)
              .json({
                success: true,
                message: "login successfully..",
                redirectUrl: "/home",
              });
          }
        } else {
          return res
            .status(403)
            .json({ isVerified: false, message: "user not verified" });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "admin blocked you ",
        });
      }
    } else {
      console.log("signup first");
      return res
        .status(404)
        .json({ success: false, message: "user hasn't signup yet" });
    }
  } catch (err) { }
};

// ==============================
// GET SIGNUP PAGE
// ==============================
// Renders the user signup (registration) page
// This route is used when a new user wants to create an account
let getSignup = (req, res) => {
  res.render("./user/userSignup");
};

// ==============================
// USER REGISTRATION
// ==============================
// Creates user
// Hashes password
// Generates OTP for email verification
let register = async (req, res) => {
  try {
    const { firstname, lastname, number, email, password, referralCode } = req.body;
    console.log(referralCode)
    const existing = await user.findOne({ email });
    if (existing) {
      console.log(`user already exists on this email ${email}`);
      return res.json({ success: false, message: "user already exists" });
    } else {
      let referralPerson = null;
      if (referralCode) {
        const existingReferrer = await user.findOne({ referralCode: referralCode });
        console.log('here is nothing')
        console.log(existingReferrer, 'existingReferrer')
        if (existingReferrer) {
          referralPerson = existingReferrer._id;
        } else {
          return res.json({ success: false, message: "Invalid referral code" });
        }
      }
      const salt_round = Number(process.env.SALT_ROUND);
      const hashedPassword = await bcrypt.hash(password, salt_round);
      const newUser = new user({
        firstName: firstname,
        lastName: lastname,
        number,
        email,
        referredBy: referralPerson || null,
        referralCode: `${lastname}${randomNumberGerator()}`
          .toUpperCase()
          .trim(),

        password: hashedPassword,
      });
      console.log(hashedPassword);
      await newUser.save();
      req.session.requre_sign = true;
      let newOtp = await otpGeneratorTodb(newUser, email);
      if (newOtp) {
        console.log("user registration successfully");
        return res.json({
          success: true,
          message: "user account created",
          redirectUrl: "/otpVerfication",
          Email: email,
        });
      } else {
        console.log("something went wrong...");
      }
    }
  } catch (err) {
    console.log(`it is the error ${err}`);
  }
};

// ==============================
// GET OTP VERIFICATION PAGE
// ==============================
// Renders the OTP verification page
// Used during:
// - User registration verification
// - Password reset verification
// - Email update verification
let getOtpVerify = async (req, res) => {
  res.render("./user/otp-verification");
};

// ==============================
// OTP VERIFICATION
// ==============================
// Verifies OTP
// Handles multiple flows:
// - Signup
// - Email update
// - Password reset
let OtpVerify = async (req, res) => {
  try {
    req.session.requre_sign = false;
    const { data, userEmail } = req.body;
    const User = await user.findOne({ email: userEmail });
    const userId = User._id;
    console.log(userId);
    const userOtp = await modelOtp.findOne({ userId: userId });
    if (userOtp) {
      console.log("valid otp");
      let dbOtp = userOtp.otp;
      console.log(dbOtp + "it is from db");
      console.log(data + "data here");

      if (!data) {
        return res.json({ success: false, message: "No OTP provided" });
      }

      if (dbOtp === data) {
        const isAlreadyVerified = User.isVerified;
        await user.updateOne(
          { email: userEmail },
          { $set: { isVerified: true } },
        );

        if (!isAlreadyVerified && User.referredBy) {
          const rewardAmount = 50;

          let newUserWallet = await wallet.findOne({ userId: User._id });
          if (!newUserWallet) {
            newUserWallet = new wallet({ userId: User._id, balance: rewardAmount });
          } else {
            newUserWallet.balance += rewardAmount;
          }
          newUserWallet.transactions.push({
            amount: rewardAmount,
            transactionType: 'credited',
            description: 'Signup Referral Bonus'
          });
          await newUserWallet.save();

          let referrerWallet = await wallet.findOne({ userId: User.referredBy });
          if (!referrerWallet) {
            referrerWallet = new wallet({ userId: User.referredBy, balance: rewardAmount });
          } else {
            referrerWallet.balance += rewardAmount;
          }
          referrerWallet.transactions.push({
            amount: rewardAmount,
            transactionType: 'credited',
            description: 'Referral Bonus for inviting a user'
          });
          await referrerWallet.save();
        }
        console.log(`otp verified successfully: ${data}`);
        req.session.isKey = true;
        req.session.requre_sign = false;
        if (req.session.user?.redirect == "/user-profile") {
          const result = await user.findById(req.session.user.userForUdpateId);
          result.email = req.session.user.newEmail;
          req.session.user.email = result.email;
          await result.save();
          req.session.user.newEmail = null;
          req.session.user.redirect = "";
          return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "OTP verified & Email changed",
            redirectUrl: "/user-profile",
          });
        }
        if (req.session.redirect == "resetPassword") {
          req.session.redirect = "";
          return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "OTP verified ",
            redirectUrl: "/resetPassword",
          });
        }
        return res.json({
          success: true,
          message: "OTP verified ",
          redirectUrl: "/login",
        });
      } else {
        res.json({ success: false, message: "otp not matched" });
      }
    } else {
      console.log("expired");
      return res.json({ success: false, message: "otp expired" });
    }
  } catch (err) {
    console.log(err, "it is the eoror");
  }
};

// ==============================
// RESEND OTP
// ==============================
// Generates and sends a new OTP to the user's email
// Used when OTP expires or user requests resend
let resendOtpVerify = async (req, res) => {
  const { userEmail } = req.body;
  const User = await user.findOne({ email: userEmail });
  if (!User) {
    return res.json({ success: false, message: "User not found" });
  }

  const newOtp = await otpGeneratorTodb(User, userEmail);
  console.log(`New OTP generated: ${newOtp}`);

  return res.json({
    success: true,
    message: "New OTP sent",
  });
};

// ==============================
// GET RESET PASSWORD PAGE
// ==============================
// Renders reset password page after OTP verification
let getResetPass = (req, res) => {
  res.render("./user/resetPassword");
};

// ==============================
// POST RESET PASSWORD
// ==============================
// Updates user password after OTP verification
// Hashes new password before saving
let postResetPass = async (req, res) => {
  console.log(req.body);
  const { password, userEmail } = req.body;
  if (!userEmail) {
    return res.json({
      success: false,
      message: "user Email has missed!",
    });
  } else {
    req.session.isKey = false;
    let User = await user.findOne({ email: userEmail });
    console.log(User);
    if (!User) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not exist",
      });
    }
    let salt_round = Number(process.env.SALT_ROUND);
    let hashedPassword = await bcrypt.hash(password, salt_round);
    console.log(hashedPassword);
    User.password = hashedPassword;
    await User.save();
    res.json({
      success: true,
      message: "Password updated successfully",
      redirectUrl: "/home",
    });
  }
};

// ==============================
// GET FORGOT PASSWORD PAGE
// ==============================
// Renders forgot password page
let getForgetPassword = (req, res) => {
  res.render("./user/forgetPassword");
};

// ==============================
// POST FORGOT PASSWORD
// ==============================
// Initiates forgot password flow
// Sends OTP if user exists and is not blocked
let PostForgetPassword = async (req, res) => {
  const { email } = req.body;
  const existing = await user.findOne({ email: email });
  if (!existing) {
    return res.json({ success: false, message: "User not exist" });
  } else {
    if (existing.isBlock) {
      return res.json({ success: false, message: "Your are blocked by admin" });
    }
    if (existing.password !== "google-auth") {
      req.session.redirect = "resetPassword";
      req.session.requre_sign = true;
      const User = await user.findOne({ email: email });
      await modelOtp.findOne({ userId: User._id });
      let otp = await otpGeneratorTodb(User, email);
      console.log("it is the Otp" + otp);
      return res.json({
        success: true,
        redirectUrl: "/otpVerfication",
        successUrl: "/resetPassword",
      });
    } else {
      return res.json({ success: false, message: "it's Google User" });
    }
  }
};
// ==============================
// USER LOGOUT
// ==============================
//  session and clears cookie
const logOut = (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/home");
  } catch (error) {
    console.error("Logout error:", error);
    res.redirect("/home");
  }
};

// ==============================
// GET SECURITY PAGE
// ==============================
const getSecurity = (req, res) => {
  res.render("./user/security");
};

// ==============================
// RESET PASSWORD
// ==============================
const resetPass = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = new mongoose.Types.ObjectId(req.session.user.id);
  try {
    const User = await user.findOne({ _id: userId });
    if (!User) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "user not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, User.password);
    if (!isMatch) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Current Password not Match",
      });
    }
    const salt_round = Number(process.env.SALT_ROUND);
    const hashedPassword = await bcrypt.hash(newPassword, salt_round);
    User.password = hashedPassword;
    await User.save();
    return res.status(STATUS_CODES.OK).json({
      success: false,
      message: "Password Updated.",
    });
  } catch (error) {
    console.log(error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error!",
    });
  }
};

export default{
    getLogin,
    postLogin,
    getSignup,
    register,
    getOtpVerify,
    OtpVerify,
    resendOtpVerify,
    getResetPass,
    postResetPass,
    getForgetPassword,
    PostForgetPassword,
    logOut,
    getSecurity,
    resetPass

}