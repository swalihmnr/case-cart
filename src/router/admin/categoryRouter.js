import express from "express";
const router = express.Router();

import { addCategoryValidator } from "../../validators/categoryValidator.js";
import categoryController from "../../controllers/admin/categoryController.js";
import { requiredAdmin } from "../../middlewares/auth.js";

router.use(requiredAdmin);

router.get("/add-category", categoryController.getAddCategory);
router.post(
  "/add-category",
  addCategoryValidator,
  categoryController.postAddCategory,
);
router.get("/category", categoryController.getCategory);
router.post("/category", categoryController.postAddCategory);
router.patch("/category/block/:id", categoryController.blockCategory);
router.get("/category/edit/:id", categoryController.editCategory);
router.patch("/category/edit/:id", categoryController.postEditCategory);
export default router;
