import express from "express";
const router = express.Router();
import { requiredAdmin } from "../../middlewares/auth.js";
import customersController from "../../controllers/admin/customersController.js";

router.use(requiredAdmin);
router.get("/customers", customersController.getCustomer);
router.patch("/customers/block/:id", customersController.blockCustomer);
export default router;
