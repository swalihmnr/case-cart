import user from "../../models/userModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";

// ==============================
// GET USER PROFILE PAGE
// ==============================
const getUserProfil = async (req, res) => {
  req.session.isKey = false;
  let User = await user.findOne({ email: req.session.user.email });

  res.render("./user/user-profile", { User });
};

// ==============================
// EDIT PROFILE INFORMATION
// ==============================
// Handles both normal & Google users
// Email change requires OTP verification
const editProfileInfo = async (req, res) => {
  try {
    req.session.isKey = false;
    const { firstName, lastName, email, number } = req.body;
    const existing = await user.findOne({ email: req.session.user.email });
    if (!existing) {
      console.log("user not exist");
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "user does not exist",
      });
    } else {
      let isChanged = false;
      if (existing.password !== "google-auth") {
        if (firstName !== existing.firstName) {
          isChanged = true;
        }
        if (lastName !== existing.lastName) {
          isChanged = true;
        }
        if (email !== existing.email) {
          req.session.requre_sign = true;
          req.session.user.redirect = "/user-profile";
          const emailExists = await user.findOne({ email: email });
          if (emailExists) {
            return res.status(409).json({
              success: false,
              message: "This email is already taken",
            });
          }
          req.session.user.prevousEmail = existing.email;
          req.session.user.userForUdpateId = existing._id;
          req.session.user.newEmail = email;
          req.session.user.email = existing.email;
          let result = await otpGeneratorTodb(existing._id, existing.email);
          if (result) {
            return res.status(STATUS_CODES.OK).json({
              success: true,
              otpVerify: true,
              email: existing.email,
              redirect: "/otpVerfication",
              message: "verify your Email",
            });
          }
        }

        if (number !== existing.number) {
          isChanged = true;
        }

        if (isChanged) {
          const updatedUser = await user.findByIdAndUpdate(
            existing._id,
            {
              firstName: firstName,
              lastName: lastName,
              number: number,
              email: email,
            },
            { new: true },
          );
          req.session.user.name = `${updatedUser.firstName} ${updatedUser.lastName}`;
          req.session.user.email = updatedUser.email;

          return res.status(STATUS_CODES.OK).json({
            isGoogle: false,
            isChanged: true,
            success: true,
            message: "profile info updated successfully...",
          });
        } else {
          return res.status(STATUS_CODES.OK).json({
            isGoogle: false,
            isChanged: false,
            success: false,
            message: "Nothing to update",
          });
        }
      } else {
        if (firstName !== existing.firstName) {
          isChanged = true;
        }
        if (lastName !== existing.lastName) {
          isChanged = true;
        }
        if (number !== existing.number) {
          isChanged = true;
        }
        if (email !== existing.email) {
          return res.status(STATUS_CODES.FORBIDDEN).json({
            isGoogle: true,
            isChanged: false,
            success: false,
            message: "you are Google user ,you could not change your email",
          });
        }
        if (isChanged) {
          const updatedUser = await user.findByIdAndUpdate(
            existing._id,
            {
              firstName: firstName,
              lastName: lastName,
              number: number,
            },
            { new: true },
          );
          req.session.user.name = `${updatedUser.firstName} ${updatedUser.lastName}`;

          return res.status(STATUS_CODES.OK).json({
            isChanged: true,
            success: true,
            isGoogle: true,
            message: "profile info updated",
          });
        } else {
          return res.status(STATUS_CODES.OK).json({
            isGoogle: true,
            success: false,
            isChanged: false,
            message: "Nothing to update",
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// UPDATE PROFILE IMAGE
// ==============================
const editProfileImg = async (req, res) => {
  try {
    console.log(req.file);
    const uploadResult = await uploadBufferTocloudnery(req.file.buffer);
    const existing = await user.findOne({ email: req.session.user.email });
    console.log(existing);
    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not founded",
      });
    } else {
      existing.profileImg = await uploadResult.secure_url;
      existing.profileImgId = await uploadResult.public_id;
      await existing.save();
      req.session.user.profileUrl = existing.profileImg;
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Profile Image updated",
      });
    }
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error !",
    });
  }
};

export default {
    getUserProfil,
    editProfileImg,
    editProfileInfo
}