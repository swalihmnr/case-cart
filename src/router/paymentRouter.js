import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/razorpayController.js";
import walletPamentController from "../controllers/walletPamentController.js";

const router = express.Router();

router.post("/create-order", createRazorpayOrder);
router.post("/verify-payment", verifyRazorpayPayment);
router.post(
  "/wallet/create-order",
  walletPamentController.createWalletRazorpayOrder,
);
router.post(
  "/wallet/verify-payment",
  walletPamentController.verifyWalletRazorpayPayment,
);

export default router;
