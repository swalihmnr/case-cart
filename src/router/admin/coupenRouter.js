import express from "express";
import coupenCondroller from "../../controllers/admin/coupenController.js";
import { addCouponValidator } from "../../validators/couponValidator.js";
const router = express.Router();
router.get("/coupen", coupenCondroller.renderCoupenPage);
router.get("/coupen/add", coupenCondroller.renderAddCoupen);
router.post("/coupen/add", addCouponValidator, coupenCondroller.postAddCoupen);
router.get("/coupen/edit/:id", coupenCondroller.renderEditCoupon);
router.patch("/coupen/edit", coupenCondroller.postEditCoupop);
router.patch("/coupen/del/:id", coupenCondroller.deletCoupon);

export default router;
