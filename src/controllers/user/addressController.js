import mongoose from "mongoose";
import addressModel from "../../models/addressModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
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
      await addressModel.updateMany({ userId }, { $set: { isDefault: false } });
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
        console.log("enter to address");
        await addressModel.updateMany(
          { userId },
          { $set: { isDefault: false } },
        );
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
export default {
  getAddressMngmnt,
  addAddress,
  geteditAddress,
  editAddress,
  getAddAddress,
  deleteAddress,
};
