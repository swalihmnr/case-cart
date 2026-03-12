import express from "express";
const router = express.Router();
import orderController from "../../controllers/user/orderController.js";
import {
  userAuth,
  keResetPass,
  goBackOtpVerify,
  blockUser,
  wishlistCount,
  cartCount,
  notUser,
} from "../../middlewares/auth.js";
router.use(wishlistCount);
router.use(cartCount);
router.get("/order/confirm/:id", orderController.getConfirmation);
router.post("/order/confirm", orderController.ordConfirmation);
router.get("/order", userAuth, blockUser, orderController.getOrder);
router.get("/order/:id", userAuth, blockUser, orderController.getOrderDetails);
router.post(
  "/order/:id/payment-failed",
  userAuth,
  blockUser,
  orderController.markPaymentFailed,
);
router.patch(
  "/order/:id/cancel-all",
  userAuth,
  blockUser,
  orderController.cancelWholeOrder,
);
router.patch("/order/:id/cancel", orderController.orderCancel);
router.patch("/order/:id/return", orderController.returnReq);
router.get(
  "/order/:id/status",
  userAuth,
  blockUser,
  orderController.checkOrderStatus,
);
router.get("/order/:id/invoice", userAuth, blockUser, orderController.invoice);
export default router;
