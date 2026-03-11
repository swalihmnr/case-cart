import { STATUS_CODES } from "../../utils/statusCodes.js";
import Wallet from "../../models/walletModel.js";
const getWallet = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // Number of transactions per page
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ userId: req.session.user.id });

    let paginatedTransactions = [];
    let totalPages = 0;

    if (wallet && wallet.transactions) {
      // Sort transactions by date descending
      wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalTransactions = wallet.transactions.length;
      totalPages = Math.ceil(totalTransactions / limit);

      // Slice the transactions array for pagination
      paginatedTransactions = wallet.transactions.slice(skip, skip + limit);
    }

    res.render("user/wallet", {
      wallet: wallet ? { ...wallet._doc, transactions: paginatedTransactions } : null,
      activeTab: "wallet",
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.error("Error in getWallet:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};
export default {
  getWallet,
};
