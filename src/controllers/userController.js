import user from "../models/userModel.js";
import modelOtp from "../models/otpModel.js";
import bcrypt from "bcrypt";
import otpGeneratorTodb from "../utils/otpGeneratorToDb.js";
import productModel from "../models/admin/productModel.js";
import Category from "../models/admin/categoryModel.js";
import variantModel from "../models/admin/variantModel.js";
import mongoose from "mongoose";
import { STATUS_CODES } from "../utils/statusCodes.js";
import { uploadBufferTocloudnery } from "../utils/cloudneryUpload.js";
import wishlistModel from "../models/wishlistModel.js";
import cartModel from "../models/cartModel.js";
import addressModel from "../models/addressModel.js";
import orderModel from "../models/orderModel.js";
import offerModel from "../../src/models/admin/offerModel.js";
import discountChecker from "../../src/utils/calculateDiscount.js";
import calculateBestItemOffer from "../utils/calculateBestOfferItem.js";
import couponModel from "../../src/models/admin/coupenModel.js";
import wallet from "../models/walletModel.js";
import randomNumberGerator from '../../src/utils/randomNumberGerator.js'

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
// GET HOME PAGE
// ==============================
// Renders user home page
let getHome = (req, res) => {
  console.log(req);
  res.render("./user/home");
};
3;
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
// GET PRODUCT LIST
// ==============================
// Handles:
// - Search
// - Category filter
// - Price filter
// - Sorting
// - Pagination
// - Wishlist marking
const getProduct = async (req, res) => {
  try {
    let {
      page = 1,
      search = "",
      price = "all",
      Categories = "",
      sort = "",
    } = req.query;
    page = Number(page);

    const limit = 6;
    const skip = (page - 1) * limit;

    const selectedCategories = Categories ? Categories.split(",") : [];

    let matchStage = { isBlock: false };

    if (search.trim()) {
      matchStage.name = { $regex: search, $options: "i" };
    }

    if (selectedCategories.length > 0) {
      matchStage.catgId = {
        $in: selectedCategories.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    // PRICE FILTER
    let priceFilter = {};
    if (price === "under-150") {
      priceFilter = { "variants.salePrice": { $lte: 150 } };
    }
    if (price === "500-700") {
      priceFilter = { "variants.salePrice": { $gte: 500, $lte: 700 } };
    }
    if (price === "above-1000") {
      priceFilter = { "variants.salePrice": { $gte: 1000 } };
    }

    // SORT LOGIC
    let sortStage = { createdAt: -1 };
    if (sort === "priceLowHigh") sortStage = { minPrice: 1 };
    if (sort === "priceHighLow") sortStage = { minPrice: -1 };
    if (sort === "aToZ") sortStage = { name: 1 };
    if (sort === "zToA") sortStage = { name: -1 };

    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: "variants",
          localField: "variants",
          foreignField: "_id",
          as: "variants",
        },
      },
      {
        $addFields: {
          variants: {
            $filter: {
              input: "$variants",
              as: "v",
              cond: { $gt: ["$$v.stock", 0] },
            },
          },
        },
      },
      { $match: { "variants.0": { $exists: true } } },

      // JOIN CATEGORY
      {
        $lookup: {
          from: "categories",
          localField: "catgId",
          foreignField: "_id",
          as: "catgId",
        },
      },
      { $unwind: "$catgId" },
      { $match: { "catgId.isActive": true } },

      // ADD MIN PRICE & MAIN IMAGE
      {
        $addFields: {
          minPrice: { $min: "$variants.salePrice" },
          minVariant: {
            $first: {
              $sortArray: {
                input: "$variants",
                sortBy: { salePrice: 1 },
              },
            },
          },
          mainImage: {
            $first: {
              $filter: {
                input: "$productImages",
                as: "img",
                cond: { $eq: ["$$img.isMain", true] },
              },
            },
          },
        },
      },

      // PRICE FILTER
      { $match: priceFilter },
    ];

    // APPLY SORT ONLY IF NOT EMPTY
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    // PAGINATION + COUNT IN SINGLE CALL
    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const result = await productModel.aggregate(pipeline);
    let wishlistItems = [];
    let user = false;
    const today = new Date();

    const products = await Promise.all(
      result[0].data.map(async (p) => {
        const offers = await offerModel.aggregate([
          {
            $match: {
              status: "active",
              startDate: { $lte: today },
              endDate: { $gte: today },
            },
          },
          {
            $match: {
              $or: [
                { applicableOn: "global" },
                {
                  applicableOn: "product",
                  productIds: { $in: [p._id] },
                },
                {
                  applicableOn: "category",
                  categoryIds: { $in: [p.catgId._id] },
                },
              ],
            },
          },
          {
            $project: {
              discountValue: 1,
              offerType: 1,
              title: 1,
              categoryIds: 1,
              productIds: 1,
              applicableOn: 1,
              minimumOrderValue: 1,
            },
          },
        ]);

        const price = p.minVariant.orgPrice;

        let bestDiscount = 0;
        let bestOffer = null;

        for (let offer of offers) {
          if (offer.discountValue >= price) continue;
          let discountAmount = 0;
          if (offer.offerType === "percentage") {
            discountAmount = price * (offer.discountValue / 100);
          } else {
            discountAmount = Math.min(offer.discountValue, price);
          }

          if (discountAmount > bestDiscount) {
            bestDiscount = discountAmount;
            bestOffer = offer;
          }
        }

        return {
          ...p,
          offerType: bestOffer?.offerType || null,
          offerValue: bestOffer?.discountValue || 0,
          offerName: bestOffer?.title || null,
          bestDiscount,
          salePrice: price - bestDiscount,
        };
      }),
    );
    console.log(products);

    const totalItems = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);
    if (req.session.user?.id) {
      user = true;
    }
    const categories = await Category.find({ isActive: true });
    if (req.session.user?.id) {
      wishlistItems = await wishlistModel.find({ userId: req.session.user.id });
    }
    res.render("user/product-list", {
      products,
      categories,
      selectedCategories,
      search,
      price,
      sort,
      totalItems,
      currentPage: page,
      totalPages,
      wishlistItems,
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

// ==============================
// GET PRODUCT DETAIL PAGE
// ==============================
// Fetches a single product with category & variants
// Also loads up to 4 related products
const getDetialProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const product = await productModel
      .findById(objectId)
      .populate("catgId")
      .populate("variants");

    let relatedProducts = await productModel
      .find({ catgId: product.catgId, _id: { $ne: product._id } })
      .limit(4);
    if (relatedProducts.length < 4) {
      const remains = 4 - relatedProducts.length;
      const excludeCatgIds = [
        product._id,
        ...relatedProducts.map((id) => id.catgId._id),
      ];
      const defCatgProduct = await productModel
        .find({
          catgId: { $ne: product.catgId },
          _id: { $nin: excludeCatgIds },
        })
        .limit(remains);
      relatedProducts = [...relatedProducts, ...defCatgProduct];
    }

    console.log("last");
    res.render("./user/product-detial", {
      product,
      relatedProducts,
    });
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// GET VARIANT PRICE DATA (AJAX)
// ==============================
// Used when user switches variant (color / model)
// Returns updated prices dynamically
const getVariantData = async (req, res) => {
  try {
    const today = new Date();
    const productId = req.params.id;
    const variantId = req.query.variantId;
    let currentDiscount = 0;
    if (!productId || !variantId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "productId or variantId not provided",
      });
    }
    const variant = await variantModel.findOne({ _id: variantId });
    if (!variant) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "variant not founded",
      });
    }

    //offer showining in product detial page
    const product = await productModel
      .findById(productId)
      .populate("catgId")
      .populate("variants");
    const offers = await offerModel.aggregate([
      {
        $match: {
          status: "active",
          startDate: { $lte: today },
          endDate: { $gte: today },
        },
      },
      {
        $match: {
          $or: [
            { applicableOn: "global" },
            {
              applicableOn: "product",
              productIds: product._id,
            },
            {
              applicableOn: "category",
              categoryIds: product.catgId?._id,
            },
          ],
        },
      },
      {
        $project: {
          applicableOn: 1,
          categoryIds: 1,
          productIds: 1,
        },
      },
    ]);



    currentDiscount = variant.orgPrice - variant.salePrice
    let disObject = {};
    let salePrice;
    disObject.isOffer = false;
    if (offers.length !== 0) {
      let combinedOffers = offers.filter((v) =>
        ["product", "category"].includes(v.applicableOn),
      );

      let offerType = "offerType";
      //  passing argugemnts are mentioned inside of the of the discountChecker
      disObject = await discountChecker(
        combinedOffers,
        offerModel,
        variant.orgPrice,
        offerType,
      );

    }
    salePrice = variant.salePrice;
    console.log('current discount' + currentDiscount + " it's from offer " + disObject.bestDiscount)
    if (offers.length !== 0 && currentDiscount < disObject.bestDiscount) {
      salePrice = Math.floor(variant.orgPrice - disObject.bestDiscount);
    }
    if (currentDiscount < disObject.bestDiscount) {
      salePrice = Math.floor(variant.orgPrice - disObject.bestDiscount);
      disObject.isOffer = true;
    } else {
      salePrice = variant.salePrice;
      disObject.isOffer = false;
    }
    const orgPrice = variant.orgPrice;
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "success",
      salePrice,
      orgPrice,
      disObject,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

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

// ==============================
// GET WISHLIST
// ==============================
const getWishlist = async (req, res) => {
  const userId = req.session.user.id;
  console.log(userId);
  const userID = new mongoose.Types.ObjectId(userId);
  const products = await wishlistModel
    .find({ userId: userID })
    .populate("variantId")
    .populate("productId");
  res.render("./user/wishlist", {
    products,
  });
};

// ==============================
// ADD TO WISHLIST
// ==============================
const postWishlist = async (req, res) => {
  try {
    const { productId, variant } = req.body;
    const variantId = new mongoose.Types.ObjectId(variant);
    const Variant = await variantModel.findById(variantId);
    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    if (!productId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "product not provided",
      });
    }
    if (!Variant) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "variant not provided",
      });
    }
    const existing = await wishlistModel.findOne({
      variantId: Variant._id,
      userId: userId,
      productId: productId,
    });
    const existingCart = await cartModel.findOne({
      variantId: Variant._id,
      userId: userId,
      productId: productId,
    });

    if (existing) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "already exists in wishlist",
      });
    }

    if (existingCart) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "already exist in cart",
      });
    }
    if (!userId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "user not founded",
      });
    }
    let result = await wishlistModel.create({
      userId: userId,
      productId: productId,
      variantId: Variant._id,
    });
    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "added to wishlist",
    });
  } catch (error) { }
};

// ==============================
// REMOVE ITEM FROM WISHLIST
// ==============================
// Deletes a wishlist item for the logged-in user
// Ensures user can remove only their own wishlist items
const remWishlist = async (req, res) => {
  try {
    const id = req.params.id;
    const wishlistId = new mongoose.Types.ObjectId(id);
    const userId = req.session.user.id;
    if (!wishlistId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "wishlist item not provided",
      });
    }
    await wishlistModel.findOneAndDelete({
      _id: wishlistId,
      userId: req.session.user.id,
    });
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "indernal server error",
    });
  }
};

// ==============================
// GET CART PAGE
// ==============================
// Fetches cart items for the logged-in user
// Calculates subtotal and total cart items
const getCart = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const totalDocs = await cartModel.countDocuments({ userId });

    const cartItems = await cartModel
      .find({ userId })
      .populate("variantId")
      .populate({
        path: "productId",
        populate: { path: "catgId", model: "Category" }
      });

    let subtotal = 0;
    let totalDiscount = 0;
    let finalAmount = 0;
    let shipping = 0;

    for (let item of cartItems) {

      const variant = item.variantId;
      const orgPrice = variant.orgPrice;
      const quantity = item.quantity;

      // sale price discount
      const currentDiscountPerUnit = orgPrice - variant.salePrice;

      // ---------- FIND BEST OFFER ----------
      const offers = await offerModel.find({
        status: "active",
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $or: [
          { applicableOn: "product", productIds: { $in: [item.productId._id] } },
          { applicableOn: "category", categoryIds: { $in: [item.productId.catgId._id] } }
        ]
      });

      let bestOffer = null;
      let bestOfferDiscountPerUnit = 0;

      for (let offer of offers) {
        if (offer.offerType === "percentage") {

          let discount = (orgPrice * offer.discountValue) / 100;

          if (discount > bestOfferDiscountPerUnit) {
            bestOfferDiscountPerUnit = discount;
            bestOffer = offer;
          }
        }
      }

      // ---------- COMPARE SALE VS OFFER ----------
      let finalUnitPrice;
      let usedDiscountPerUnit;

      if (bestOfferDiscountPerUnit > currentDiscountPerUnit) {

        finalUnitPrice = Math.floor(orgPrice - bestOfferDiscountPerUnit);
        usedDiscountPerUnit = Math.floor(bestOfferDiscountPerUnit);

        item.appliedOffer = {
          title: bestOffer.title,
          discount: usedDiscountPerUnit * quantity,
          discountValue: bestOffer.discountValue
        };

      } else {

        finalUnitPrice = Math.floor(variant.salePrice);
        usedDiscountPerUnit = Math.floor(currentDiscountPerUnit);

        item.appliedOffer = null;
      }

      const itemTotalOrg = orgPrice * quantity;
      const itemFinalTotal = finalUnitPrice * quantity;
      const itemDiscountTotal = usedDiscountPerUnit * quantity;

      subtotal += itemTotalOrg;
      totalDiscount += itemDiscountTotal;
      finalAmount += itemFinalTotal;

      item.finalPrice = itemFinalTotal;
    }

    if (finalAmount > 0 && finalAmount < 1500) {
      shipping = 50;
      finalAmount += shipping;
    }

    res.render("./user/cart", {
      products: cartItems,
      subtotal,
      totalDiscount,
      finalAmount,
      totalDocs,
      shipping,
    });

  } catch (error) {
    console.log(error.message);
  }
};

// ==============================
// ADD ITEM TO CART
// ==============================
// Adds selected variant to cart
// Prevents duplicates
// Removes item from wishlist if exists
const addCart = async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({
        success: false,
        message: "Please login to add items to your cart",
        redirectUrl: "/login"
      });
    }

    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const { variantId, productId } = req.body;
    const varinatID = new mongoose.Types.ObjectId(variantId);
    const productID = new mongoose.Types.ObjectId(productId);

    if (!userId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not founded",
      });
    }
    if (!varinatID) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "variantId not provided",
      });
    }
    if (!productID) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "productId not provided",
      });
    }
    const variantData = await variantModel.findById(varinatID);
    const productData = await productModel.findById(productID).populate('catgId');

    if (!variantData || !productData) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Product or Variant not found",
      });
    }

    // Validation Check: Stock, Listing, Product Block, Category Active
    if (variantData.stock < 1) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "This product is currently out of stock!",
      });
    }

    if (
      !variantData.isListed ||
      productData.isBlock ||
      (productData.catgId && productData.catgId.isActive === false)
    ) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "This product is currently unavailable!",
      });
    }

    const existing = await cartModel
      .findOne({
        userId: userId._id,
        productId: productID,
        variantId: varinatID,
      })
      .populate("variantId");
    if (existing) {
      console.log("already exist ");
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "already added to cart",
      });
    } else {
      await cartModel.create({
        userId: userId._id,
        productId: productID,
        variantId: varinatID,
      });
      await wishlistModel.deleteOne({
        userId: userId._id,
        productId: productID,
        variantId: varinatID,
      });

      return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: "item added to cart",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Indternal server Error !",
    });
  }
};

// ==============================
// UPDATE CART QUANTITY
// ==============================
// Increases or decreases quantity
// Enforces stock limit, listing status, category status
// Recalculates subtotal dynamically
const cartQuantityUpdate = async (req, res) => {
  try {
    const cartId = req.params.id;
    const userId = req.session.user.id;
    const change = req.body.change;

    const cartItem = await cartModel
      .findById(cartId)
      .populate("variantId")
      .populate({
        path: "productId",
        populate: {
          path: "catgId",
          model: "Category",
        },
      });
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const variant = cartItem.variantId;
    if (change === 1) {
      if (cartItem.quantity >= variant.stock) {
        return res.status(403).json({
          success: false,
          message: " stock limit reached",
        });
      }
      if (cartItem.quantity >= 5) {
        return res.status(403).json({
          success: false,
          message: "Order limit reached",
        });
      }
      if (
        !variant.isListed ||
        cartItem.productId.isBlock ||
        cartItem.productId.catgId.isActive === false
      ) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: "This product currently unavailable!",
        });
      }

      cartItem.quantity += 1;
    } else {
      if (cartItem.quantity > 1) {
        if (
          !variant.isListed ||
          cartItem.productId.isBlock ||
          cartItem.productId.catgId.isActive === false
        ) {
          return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            message: "This product currently unavailable!",
          });
        }
        cartItem.quantity -= 1;
      }
    }
    await cartItem.save();
    const cartItems = await cartModel
      .find({ userId })
      .populate("variantId")
      .populate("productId");
    let subtotal = 0;
    cartItems.forEach((item) => {
      console.log(item.variantId.salePrice, 'it is the salepirce in here')
      subtotal += Math.round(item.quantity * item.variantId.salePrice)
    });
    return res.status(200).json({
      success: true,
      quantity: cartItem.quantity,
      totalAmountPerPrdct: Math.round(cartItem.quantity * variant.salePrice),
      subtotal,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// REMOVE ITEM FROM CART
// ==============================
// Deletes a cart item by cartId
// Ensures the item exists before deletion
const remCart = async (req, res) => {
  try {
    const existing = await cartModel.findOne({ _id: req.params.id });
    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "user not founded",
      });
    }
    await cartModel.findByIdAndDelete(req.params.id);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "item deleted from cart.",
    });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal sever Error",
    });
  }
};

// ==============================
// GET CHECKOUT PAGE
// ==============================
// Handles both Cart checkout and Buy Now checkout
// Validates product availability before proceeding
const getCheckout = async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.redirect('/login');
    }
    let cartItems = [];
    let subtotal = 0;              // ORIGINAL TOTAL
    let offerDiscountTotal = 0;
    let finalAmount = 0;
    let shipping = 0;
    let coupons;
    const walletBalance = await wallet.findOne({ userId: req.session.user.id });
    const FREE_SHIPPING_LIMIT = 1500;
    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const { type, variantId } = req.query;

    coupons = await couponModel.find({ status: "active", usedBy: { $ne: userId } });

    // ======================
    // CART FLOW
    // ======================
    if (type !== "buyNow") {
      req.session.buyNow = false
      // Cart flow - Get items from user's cart
      cartItems = await cartModel.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "variants",
            localField: "variantId",
            foreignField: "_id",
            as: "variant",
          },
        },
        { $unwind: "$variant" },
        {
          $addFields: {
            mainImage: {
              $first: {
                $filter: {
                  input: "$product.productImages",
                  as: "img",
                  cond: { $eq: ["$$img.isMain", true] }
                }
              }
            }
          }
        },
        {
          $project: {
            product: 1,
            variant: 1,
            quantity: 1,
            mainImage: 1,
            orgPrice: "$variant.orgPrice"
          }
        }
      ]);

      if (!cartItems.length) return res.redirect("/cart");

      // Calculate offers for each cart item
      for (let item of cartItems) {
        // Validation Check: Stock, Listing, Product Block
        if (!item.variant.isListed || item.product.isBlock || item.variant.stock < item.quantity) {
          return res.redirect("/cart?error=Some items in your cart are currently unavailable or out of stock.");
        }

        const orgTotal = item.variant.orgPrice * item.quantity;
        subtotal += orgTotal;

        const offerResult = await calculateBestItemOffer(item);

        const totalItemDiscount = offerResult.discountAmount * item.quantity;
        const totalItemFinal = offerResult.finalPrice * item.quantity;

        item.offerDiscount = totalItemDiscount;
        item.finalPrice = totalItemFinal;

        // SAFE OFFER ATTACH - Cart flow
        if (offerResult.bestOffer) {
          item.appliedOffer = {
            title: offerResult.bestOffer.title,
            value: offerResult.bestOffer.discountValue,
            discount: totalItemDiscount
          };
        } else {
          item.appliedOffer = null;
        }

        offerDiscountTotal += totalItemDiscount;
        finalAmount += totalItemFinal;
      }

      // Add shipping if applicable
      if (finalAmount < FREE_SHIPPING_LIMIT) {
        shipping = 50;
        finalAmount += shipping;
      }
    }

    // ======================
    // FIXED BUY NOW FLOW - WITH PROPER appliedOffer STRUCTURE
    // ======================
    else {
      // Get the variant with product details
      req.session.buyNow = true
      const variantData = await variantModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(variantId) } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $addFields: {
            mainImage: {
              $first: {
                $filter: {
                  input: "$product.productImages",
                  as: "img",
                  cond: { $eq: ["$$img.isMain", true] }
                }
              }
            }
          }
        }
      ]);

      if (!variantData.length) {
        return res.redirect("/products");
      }

      const variant = variantData[0];
      // VALIDATION: Check product block, listing status, and stock
      if (variant.product.isBlock || !variant.isListed || variant.stock < 1) {
        return res.redirect('/product/' + variant.product._id + '/detials?error=Product unavailable');
      }

      req.session.variantId = variant._id

      // Create item object that EXACTLY matches cart flow structure
      const item = {
        product: variant.product,
        variant: {
          orgPrice: variant.orgPrice,
          salePrice: variant.salePrice,
          deviceModel: variant.deviceModel,
          stock: variant.stock,
          _id: variant._id
        },
        quantity: 1,
        mainImage: variant.mainImage,
        orgPrice: variant.orgPrice
      };

      console.log('Buy Now Item Structure:', {
        hasVariant: !!item.variant,
        variantOrgPrice: item.variant?.orgPrice,
        productName: item.product?.name
      });

      // Calculate original subtotal
      subtotal = item.orgPrice;

      // Calculate best offer for this single item
      const offerResult = await calculateBestItemOffer({
        product: item.product,
        variant: item.variant,
        quantity: 1
      });

      // Set item properties
      item.offerDiscount = offerResult.discountAmount;
      item.finalPrice = offerResult.finalPrice;

      // FIXED: Proper appliedOffer structure matching cart flow
      if (offerResult.bestOffer) {
        item.appliedOffer = {
          title: offerResult.bestOffer.title,
          value: offerResult.bestOffer.discountValue,
          discount: offerResult.discountAmount  // Use discountAmount directly
        };
        console.log('Applied Offer Set:', item.appliedOffer);
      } else {
        item.appliedOffer = null;
        console.log('No Applied Offer');
      }

      // Update totals
      offerDiscountTotal = offerResult.discountAmount;
      finalAmount = offerResult.finalPrice;

      // Add shipping if applicable
      if (finalAmount < FREE_SHIPPING_LIMIT) {
        shipping = 50;
        finalAmount += shipping;
      }

      // Create cartItems array with the single item
      cartItems = [item];
    }
    let walletButton = true
    // if(walletBalance.balance<finalAmount){
    //   walletButton=false
    // }
    const addresses = await addressModel.find({ userId });

    // Debug logs to verify both flows work the same
    console.log("========= CHECKOUT DATA =========");
    console.log("Flow Type:", type || "cart");
    console.log("Subtotal (Org Total):", subtotal);
    console.log("Offer Discount Total:", offerDiscountTotal);
    console.log("Subtotal after offers:", subtotal - offerDiscountTotal);
    console.log("Shipping:", shipping);
    console.log("Final Amount:", finalAmount);
    console.log("Items Count:", cartItems.length);

    if (cartItems.length > 0) {
      console.log("First Item Structure:");
      console.log("  - Has variant.orgPrice:", !!cartItems[0].variant?.orgPrice);
      console.log("  - variant.orgPrice:", cartItems[0].variant?.orgPrice);
      console.log("  - finalPrice:", cartItems[0].finalPrice);
      console.log("  - offerDiscount:", cartItems[0].offerDiscount);
      console.log("  - has appliedOffer:", !!cartItems[0].appliedOffer);
      if (cartItems[0].appliedOffer) {
        console.log("  - appliedOffer.title:", cartItems[0].appliedOffer.title);
        console.log("  - appliedOffer.value:", cartItems[0].appliedOffer.value);
        console.log("  - appliedOffer.discount:", cartItems[0].appliedOffer.discount);
      }
    }
    console.log("=================================");

    res.render("./user/checkout", {
      addresses,
      cartItems,
      subtotal,
      offerDiscountTotal,
      shipping,
      finalAmount,
      coupons,
      walletButton
    });

  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).send("Checkout error");
  }
};

// ==============================
// GET ADDRESS MANAGEMENT
// ==============================
// Lists all saved addresses of the logged-in user
const getAddressMngmnt = async (req, res) => {
  const userID = new mongoose.Types.ObjectId(req.session.user.id);
  const addresses = await addressModel.aggregate([
    { $match: { userId: userID } },
  ]);
  res.render("./user/user-address-management", {
    addresses,
  });
};

// ==============================
// ADD NEW ADDRESS
// ==============================
// Prevents duplicate addresses
const addAddress = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const {
      firstName,
      lastName,
      phone,
      streetAddress,
      landmark,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    } = req.body.data;
    console.log(
      firstName,
      lastName,
      phone,
      streetAddress,
      landmark,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    );
    const existing = await addressModel.findOne({
      userId: userId,
      streetAddress: streetAddress,
      pinCode: pincode,
      city: city,
    });
    if (existing) {
      console.log("existing ");
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "Address already exists",
      });
    }
    console.log("not existing");
    //remove existing default address
    if (isDefault) {
      await addressModel.updateMany({ userId },
        { $set: { isDefault: false } }
      )
    }
    await addressModel.create({
      userId,
      firstName,
      lastName,
      phone,
      streetAddress,
      landMark: landmark,
      pinCode: pincode,
      city,
      state,
      addressType,
      isDefault,
    });

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "address saved ",
    });
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// GET EDIT ADDRESS PAGE
// ==============================
const geteditAddress = async (req, res) => {
  const addressId = req.params.id;
  delete req.session.adrsId;
  req.session.adrsId = addressId;
  const userID = new mongoose.Types.ObjectId(req.session.user.id);
  const address = await addressModel.findOne({
    userId: userID,
    _id: addressId,
  });
  res.render("./user/edit-address", {
    address,
  });
};

// ==============================
// UPDATE ADDRESS
// ==============================
// Updates only changed fields dynamically
const editAddress = async (req, res) => {
  try {
    const addressId = req.session.adrsId;
    const userId = req.session.user.id;
    const address = await addressModel.findOne({
      _id: addressId,
      userId: userId,
    });
    let isChanged = false;
    for (let key in req.body.data) {
      if (req.body.data.isDefault === true) {
        console.log('enter to address')
        await addressModel.updateMany(
          { userId },
          { $set: { isDefault: false } }
        )
      }
      console.log(`${address[key]}===${req.body.data[key]}`);
      if (
        req.body.data[key] !== undefined &&
        String(address[key]) !== String(req.body.data[key])
      ) {
        address[key] = req.body.data[key];
        isChanged = true;
      }
    }
    if (!isChanged) {
      return res.status(STATUS_CODES.OK).json({
        success: false,
        message: "data not updated!",
      });
    }
    await address.save();
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "address updated!",
    });
  } catch (error) {
    console.log(error);
  }
};

// ==============================
//get ADDRESS
// ==============================
const getAddAddress = async (req, res) => {
  console.log("add page");
  res.render("./user/add-address");
};

// ==============================
// DELETE ADDRESS
// ==============================
const deleteAddress = async (req, res) => {
  try {
    const addressId = new mongoose.Types.ObjectId(req.params.id);
    if (!addressId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "address not provided",
      });
    }
    await addressModel.deleteOne({
      _id: addressId,
      userId: req.session.user.id,
    });
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "address deleted",
    });
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// ORDER CONFIRMATION PAGE
// ==============================
// Shows order details after successful checkout
const getConfirmation = async (req, res) => {
  const userId = req.session.user.id;
  const orderId = req.params.id;
  const order = await orderModel
    .findOne({ _id: orderId })
    .populate("orderItems.productId")
    .populate("orderItems.variantId");
  console.log("CONFIRMATION PAGE - Order Fetched:", {
    id: order._id,
    paymentStatus: order.paymentStatus,
    paymentConfirmedAt: order.paymentConfirmedAt,
    finalAmount: order.finalAmount
  });
  console.log(order);
  res.render("./user/ord-confirmation", {
    order,
  });
};

// ==============================
// PLACE ORDER (FINAL CONFIRMATION)
// ==============================
// Handles order placement for:
// 1. Cart checkout
// 2. Buy Now checkout
// Performs full validation before creating order
const ordConfirmation = async (req, res) => {
  try {
    let walletBalance = await wallet.findOne({ userId: req.session.user.id });
    if (!walletBalance) {
      walletBalance = new wallet({
        balance: 0,
        userId: req.session.user.id
      })
    }
    const FREE_SHIPPING_LIMIT = 1500;

    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const data = req.body.data;

    // ==============================
    // COUPON
    // ==============================
    let coupon = null;
    if (data.couponCode) {
      coupon = await couponModel.findById(
        new mongoose.Types.ObjectId(data.couponCode)
      );
    }

    if (coupon && coupon.usedBy.map(id => id.toString()).includes(userId.toString())) {
      return res.json({
        success: false,
        message: "Coupon already used"
      });
    }



    // ==============================
    // SHIPPING ADDRESS
    // ==============================
    let shippingAddress;

    if (data.address?.addressId) {
      const savedAddress = await addressModel.findById(
        new mongoose.Types.ObjectId(data.address.addressId)
      );

      if (!savedAddress) {
        return res.status(404).json({ success: false, message: "Address not found" });
      }

      shippingAddress = {
        addressType: savedAddress.addressType,
        firstName: savedAddress.firstName,
        lastName: savedAddress.lastName,
        phone: savedAddress.phone,
        streetAddress: savedAddress.streetAddress,
        landMark: savedAddress.landMark,
        city: savedAddress.city,
        state: savedAddress.state,
        pinCode: savedAddress.pinCode,
      };
    } else {
      shippingAddress = data.address;
    }

    // ==============================
    // PAYMENT
    // ==============================
    const paymentMethod = data.paymentMethod;

    if (!["cod", "wallet", "razorpay"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }
    console.log(req.session.variantId)
    // ==============================
    // FETCH ITEMS (BUY NOW / CART)
    // ==============================
    let items = [];

    if (req.session.buyNow) {

      items = await variantModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.session.variantId),
            isListed: true,
            stock: { $gt: 0 }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $addFields: {
            quantity: 1,
            variant: "$$ROOT"
          }
        }
      ]);

    } else {

      items = await cartModel.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "variants",
            localField: "variantId",
            foreignField: "_id",
            as: "variant"
          }
        },
        { $unwind: "$variant" }
      ]);
    }

    if (!items.length) {
      return res.status(404).json({ success: false, message: "No valid items found" });
    }

    // ==============================
    // VALIDATION (AVAILABILITY & STOCK)
    // ==============================
    let unavailableItems = [];
    for (const item of items) {
      if (!item.variant.isListed || item.product.isBlock || item.variant.stock < item.quantity) {
        unavailableItems.push(item.product.name);
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some items in your cart are currently unavailable or out of stock: ${unavailableItems.join(', ')}`
      });
    }

    // ==============================
    // CALCULATIONS (MATCH CHECKOUT)
    // ==============================
    // ==============================
    // CALCULATIONS (FIXED)
    // ==============================
    let subtotal = 0;
    let totalOfferDiscount = 0;
    let totalSavedAmount = 0;
    const orderItems = [];

    let afterProductDiscounts = 0;

    // First calculate original subtotal
    for (const item of items) {
      subtotal += item.variant.orgPrice * item.quantity;
    }
    console.log("Original Subtotal:", subtotal);

    // Then calculate offers for each item
    for (const item of items) {
      const quantity = item.quantity;

      const offerResult = await calculateBestItemOffer({
        quantity,
        variant: item.variant,
        product: item.product
      });

      const totalItemDiscount = offerResult.discountAmount * quantity;
      const totalItemFinal = offerResult.finalPrice * quantity;


      totalOfferDiscount += totalItemDiscount;
      totalSavedAmount += totalItemDiscount;
      afterProductDiscounts += totalItemFinal; // Accumulate final price directly

      console.log(`Item ${item.product.name}:`);
      console.log(`  - Discount: ${totalItemDiscount}`);
      console.log(`  - Final: ${totalItemFinal}`);

      orderItems.push({
        productId: item.product._id,
        variantId: item.variant._id,
        name: item.product.name,
        quantity,
        price: item.variant.salePrice,
        itemTotal: item.variant.salePrice * quantity,
        paymentStatus: paymentMethod === "cod" ? "pending" : paymentMethod === "wallet" ? "paid" : "initiated",
        offer: offerResult.bestOffer ? {
          offerId: offerResult.bestOffer._id,
          title: offerResult.bestOffer.title,
          type: offerResult.bestOffer.offerType,
          value: offerResult.bestOffer.discountValue,
          discountAmount: totalItemDiscount  // ✅ Use totalItemDiscount directly
        } : null,
        finalPrice: totalItemFinal,
        status: "processing"
      });
    }

    // Calculate after product discounts
    // const afterProductDiscounts = subtotal - totalOfferDiscount; // REPLACED with direct accumulation
    console.log("After Product Discounts:", afterProductDiscounts);

    // ==============================
    // SHIPPING
    // ==============================
    const shipping = afterProductDiscounts >= FREE_SHIPPING_LIMIT ? 0 : 50;
    console.log("Shipping:", shipping);

    // Calculate final amount before coupon
    let finalAmount = afterProductDiscounts + shipping;
    console.log("Before Coupon:", finalAmount);

    // ==============================
    // COUPON APPLY
    // ==============================
    let couponDiscount = 0;

    if (coupon) {
      if (afterProductDiscounts < coupon.MinimumPurchaseValue) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount of ₹${coupon.MinimumPurchaseValue} is required to apply this coupon.`
        });
      }

      if (coupon.discountType === "percentage") {
        couponDiscount = (afterProductDiscounts * coupon.discountValue) / 100;
        if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
          couponDiscount = Math.min(couponDiscount, coupon.maximumDiscount);
        }
      } else {
        couponDiscount = coupon.discountValue;
      }

      console.log("Coupon Discount:", couponDiscount);

      finalAmount -= couponDiscount;
    }

    // Calculate total savings
    const totalSavings = Math.floor(totalOfferDiscount) + couponDiscount;

    console.log("========== ORDER PRICE DEBUG ==========");
    console.log("Items count:", items.length);
    console.log("Subtotal (Org total):", subtotal);
    console.log("Offer discount total:", totalOfferDiscount);
    console.log("Subtotal after offers:", afterProductDiscounts);
    console.log("Shipping:", shipping);
    console.log("Coupon discount:", couponDiscount);
    console.log("Final amount:", finalAmount);
    console.log("💸 Total Savings:", totalSavings);
    console.log("=======================================");


    // ==============================
    // CREATE ORDER
    // ==============================
    const order = await orderModel.create({
      userId,
      paymentMethod,
      paymentStatus:
        paymentMethod === "cod"
          ? "pending"
          : paymentMethod === "wallet"
            ? "paid"
            : "initiated",

      shippingAddress,
      totalPrice: subtotal,
      totalDiscount: Math.floor(totalOfferDiscount),
      shipping,
      couponId: coupon ? coupon._id : null,
      couponDiscount,
      finalAmount,
      orderItems,
    });
    if (paymentMethod === 'wallet') {
      if (walletBalance?.balance < finalAmount) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Insufficient Amount!"
        })
      }
      walletBalance.balance -= finalAmount;
      walletBalance.transactions.push({
        amount: finalAmount,
        description: "Order Payment",
        orderId: order._id,
        transactionType: "debited"
      })
      order.paymentStatus = "paid";
      order.paymentConfirmedAt = new Date()
      await order.save()
      await walletBalance.save()

    }

    //to add userID for prevent reusing coupons
    if (coupon && paymentMethod !== "razorpay") {
      await couponModel.findByIdAndUpdate(
        coupon._id,
        {
          $addToSet: {
            usedBy: userId
          }
        }
      );
    }

    // ==============================
    // STOCK UPDATE
    // ==============================
    if (paymentMethod !== "razorpay") {
      for (const item of items) {
        await variantModel.updateOne(
          { _id: item.variant._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    // ==============================
    // CLEAR CART / BUY NOW SESSION
    // ==============================
    if (!req.session.buyNow && paymentMethod !== "razorpay") {
      await cartModel.deleteMany({ userId });
    }

    if (paymentMethod !== "razorpay") {
      req.session.buyNow = null;
      req.session.variantId = null;
    }

    return res.status(201).json({
      success: true,
      orderId: order._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// ==============================
// GET USER ORDERS (ORDER HISTORY)
// ==============================
// Fetches user orders with:
// - Pagination
// - Status filtering
// - Product & variant details
// Fetches user orders with:
// - Pagination
// - Status filtering
// - Product & variant details
const getOrder = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.session.user.id);
  const currentPage = parseInt(req.query.page) || 1;
  const status = req.query.status;
  const limit = 4;
  const skip = (currentPage - 1) * limit;

  let matchQuery = { userId: userId };
  if (status) {
    matchQuery["orderItems.status"] = status;
  }

  const result = await orderModel.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          { $unwind: "$orderItems" },
          {
            $lookup: {
              from: "products",
              localField: "orderItems.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $lookup: {
              from: "variants",
              localField: "orderItems.variantId",
              foreignField: "_id",
              as: "variant",
            },
          },
          { $unwind: "$variant" },
          {
            $group: {
              _id: "$_id",
              orderId: { $first: "$orderId" },
              userId: { $first: "$userId" },
              address: { $first: "$address" },
              paymentMethod: { $first: "$paymentMethod" },
              paymentStatus: { $first: "$paymentStatus" },
              totalPrice: { $first: "$totalPrice" },
              couponDiscount: { $first: "$couponDiscount" },
              createdAt: { $first: "$createdAt" },
              orderItems: {
                $push: {
                  _id: "$orderItems._id",
                  orderId: "$orderItems.orderId",
                  productId: "$orderItems.productId",
                  product: "$product",
                  variantId: "$orderItems.variantId",
                  variant: "$variant",
                  quantity: "$orderItems.quantity",
                  finalPrice: "$orderItems.finalPrice",
                  status: "$orderItems.status",
                  cancelledAt: "$orderItems.cancelledAt",
                  cancellationReason: "$orderItems.cancellationReason"
                }
              }
            }
          },
          { $sort: { createdAt: -1 } }
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const orders = result[0].data;
  const totalItems = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  res.render("./user/order-history", {
    orders,
    totalPages,
    currentPage,
    totalItems,
    status,
  });
};

// ==============================
// GET ORDER DETAILS
// ==============================
const getOrderDetails = async (req, res) => {
  try {
    const orderId = new mongoose.Types.ObjectId(req.params.id);
    const order = await orderModel.aggregate([
      { $match: { _id: orderId } },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "variants",
          localField: "orderItems.variantId",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: "$variant" },
      {
        $group: {
          _id: "$_id",
          shipping: { $first: "$shipping" },
          orderId: { $first: "$orderId" },
          userId: { $first: "$userId" },
          shippingAddress: { $first: "$shippingAddress" },
          paymentMethod: { $first: "$paymentMethod" },
          paymentStatus: { $first: "$paymentStatus" },
          totalPrice: { $first: "$totalPrice" },
          totalDiscount: { $first: "$totalDiscount" },
          finalAmount: { $first: "$finalAmount" },
          couponDiscount: { $first: "$couponDiscount" },
          createdAt: { $first: "$createdAt" },
          orderItems: {
            $push: {
              _id: "$orderItems._id",
              productId: "$orderItems.productId",
              product: "$product",
              variantId: "$orderItems.variantId",
              variant: "$variant",
              quantity: "$orderItems.quantity",
              finalPrice: "$orderItems.finalPrice",
              status: "$orderItems.status",
              cancelledAt: "$orderItems.cancelledAt",
              cancellationReason: "$orderItems.cancellationReason",
              isReject:"$orderItems.isReject"
            }
          }
        }
      }
    ]);

    if (!order || order.length === 0) {
      return res.status(404).render("404");
    }

    res.render("./user/order-details", { order: order[0] });
  } catch (error) {
    console.error(error);
    res.status(500).render("500");
  }
};

// ==============================
// CANCEL WHOLE ORDER
// ==============================
const markPaymentFailed = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === 'initiated') {
      await orderModel.findByIdAndUpdate(orderId, {
        paymentStatus: 'failed',
        'orderItems.$[].paymentStatus': 'failed'
      });
      return res.json({ success: true, message: "Payment marked as failed" });
    }

    return res.json({ success: true, message: "No update needed" });
  } catch (error) {
    console.error("Error marking payment failed:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
}

const cancelWholeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const reason = req.body.reason || "User requested cancellation";

    // Verify order exists and has items that can be cancelled
    const orderExists = await orderModel.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      "orderItems.status": { $in: ['pending', 'placed', 'processing'] }
    });

    if (!orderExists) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled (might be already delivered or cancelled)"
      });
    }


    const cancellableItems = orderExists.orderItems.filter(item =>
      ["pending", "placed", "processing"].includes(item.status)
    );

    if (!cancellableItems.length) {
      return res.status(400).json({
        success: false,
        message: "No items can be cancelled"
      });
    }


    const result = await orderModel.updateMany(
      { _id: new mongoose.Types.ObjectId(orderId) },
      {
        $set: {
          "orderItems.$[elem].status": "cancelled",
          "orderItems.$[elem].cancelledAt": new Date(),
          "orderItems.$[elem].cancellationReason": reason
        }
      },
      {
        arrayFilters: [{ "elem.status": { $in: ["pending", "placed", "processing"] } }]
      }
    );
    if (
      result.modifiedCount > 0 && orderExists.paymentStatus === "paid") {

      let Wallet = await wallet.findOne({
        userId: orderExists.userId
      });

      if (!Wallet) {
        Wallet = await wallet.create({
          userId: orderExists.userId,
          balance: 0,
          transactions: []
        });
      }

      const refund = Math.floor(
        orderExists.finalAmount - orderExists.shipping
      )
      Wallet.balance += refund;

      Wallet.transactions.push({
        amount: refund,
        description: "Refund for cancelled order",
        orderId: orderExists._id,
        transactionType: "credited"
      });

      await Wallet.save();
    }

    // =========================
    // RESTORE STOCK 
    // =========================
    if (orderExists.paymentStatus !== "initiated" && orderExists.paymentStatus !== "failed") {
      for (const item of cancellableItems) {
        await variantModel.updateOne(
          { _id: item.variantId },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    if (result.modifiedCount > 0) {
      return res.json({ success: true, message: "Order cancelled successfully" });
    } else {
      return res.status(400).json({ success: false, message: "No items could be cancelled" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==============================
// CANCEL ORDER ITEM
// ==============================
// Cancels a specific order item (not entire order)
const orderCancel = async (req, res) => {
  try {
    const orderItemId = new mongoose.Types.ObjectId(req.params.id);
    const { orderId, reason } = req.body;
    const orderID = new mongoose.Types.ObjectId(orderId);

    // Check if order exists
    const existingOrder = await orderModel.findOne({
      _id: orderID,
      "orderItems._id": orderItemId
    });

    if (!existingOrder) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Order item not found",
      });
    }

    // Check if item is already cancelled/delivered to prevent invalid state transitions
    const item = existingOrder.orderItems.id(orderItemId);
    if (['cancelled', 'delivered', 'returned'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `Item is already ${item.status}`,
      });
    }

    const result = await orderModel.updateOne(
      { _id: orderID, "orderItems._id": orderItemId },
      {
        $set: {
          "orderItems.$.status": "cancelled",
          "orderItems.$.cancelledAt": new Date(),
          "orderItems.$.cancellationReason": reason,
        },
      },
    );

    // ======================
    // RESTORE STOCK
    // ======================
    if (existingOrder.paymentStatus !== "initiated" && existingOrder.paymentStatus !== "failed") {
      await variantModel.updateOne(
        { _id: item.variantId },
        { $inc: { stock: item.quantity } }
      );
    }


    if (result.modifiedCount > 0 && existingOrder.paymentStatus === "paid") {
      let Wallet = await wallet.findOne({ userId: req.session.user.id })
      if (!Wallet) {
        Wallet = await wallet.create({
          userId: req.session.user.id,
          balance: 0,
          transactions: []
        })
      }
      Wallet.balance += item.finalPrice;
      Wallet.transactions.push({
        amount: item.finalPrice,
        description: "Refund for cancelled order",
        orderId: existingOrder._id,
        transactionType: 'credited'
      })


      await Wallet.save()
    }


    if (result.modifiedCount > 0) {
      // Optional: Check if all items are cancelled to update main order status if you track it
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: `Item cancelled successfully`,
      });
    } else {
      return res.status(400).json({ success: false, message: "Failed to cancel item" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==============================
// GENERATE INVOICE
// ==============================
// Fetches invoice details for a specific order item
const invoice = async (req, res) => {
  const orderItemsId = new mongoose.Types.ObjectId(req.params.id);
  const order_id = req.query.odrId;
  const order = await orderModel.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(order_id) },
    },
    {
      $unwind: "$orderItems",
    },
    {
      $match: {
        "orderItems._id": orderItemsId,
      },
    },
    {
      $lookup: {
        from: "variants",
        localField: "orderItems.variantId",
        foreignField: "_id",
        as: "variant",
      },
    },
    {
      $unwind: "$variant",
    },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $project: {
        shippingAddress: 1,
        orderId: 1,
        paymentMethod: 1,
        paymentStatus: 1,
        totalPrice: 1,
        finalAmount: 1,
        createdAt: 1,
        orderItem: "$orderItems",
        variant: 1,
        product: 1,
      },
    },
  ]);
  res.render("./user/invoice", {
    order: order[0],
  });
};

// ==============================
// REQUEST RETURN
// ==============================
const returnReq = async (req, res) => {
  try {
    const orderItemId = new mongoose.Types.ObjectId(req.params.id);
    const { orderId, reason } = req.body;
    const existing = await orderModel.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      "orderItems._id": new mongoose.Types.ObjectId(orderItemId),
    });
    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "order not founded",
      });
    }
    const item = existing.orderItems.id(orderItemId);
    if (item.status !== "delivered") {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "Return allowed only after delivery",
      });
    }
    item.status = "return_req";
    item.returnReason = reason;
    item.returnedAt = new Date();
    await existing.save();
    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "return requasted.",
    });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error!.",
    });
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
    return status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error!",
    });
  }
};
export default {
  getLogin,
  postLogin,
  resendOtpVerify,
  getForgetPassword,
  PostForgetPassword,
  getOtpVerify,
  getSignup,
  getResetPass,
  postResetPass,
  getHome,
  register,
  OtpVerify,
  logOut,
  getProduct,
  getDetialProduct,
  getUserProfil,
  editProfileInfo,
  editProfileImg,
  getSecurity,
  resetPass,
  getWishlist,
  postWishlist,
  remWishlist,
  getCart,
  addCart,
  cartQuantityUpdate,
  getVariantData,
  remCart,
  getCheckout,
  getAddressMngmnt,
  getAddAddress,
  geteditAddress,
  addAddress,
  editAddress,
  deleteAddress,
  getConfirmation,
  ordConfirmation,
  getOrder,
  orderCancel,
  returnReq,
  invoice,
  getOrderDetails,
  cancelWholeOrder,
  markPaymentFailed,
};
