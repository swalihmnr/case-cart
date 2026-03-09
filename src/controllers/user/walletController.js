import { STATUS_CODES } from "../../utils/statusCodes.js";
import Wallet from "../../models/walletModel.js";
const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.session.user.id });

    res.render("user/wallet", {
      wallet,
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};
export default {
  getWallet,
};
