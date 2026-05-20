import express from "express";
const adminBrandRouter = express.Router();
import brandController from "../../controllers/admin/brandController.js";
import { requiredAdmin } from "../../middlewares/auth.js";
import upload from "../../middlewares/multer.js";

// List brands
adminBrandRouter.get("/brands", requiredAdmin, brandController.getBrand);

// Add brand
adminBrandRouter.get("/brands/new", requiredAdmin, brandController.getAddBrand);
adminBrandRouter.post("/brands", requiredAdmin, upload.single("icon"), brandController.postAddBrand);

// Edit brand
adminBrandRouter.get("/brands/:id/edit", requiredAdmin, brandController.editBrand);
adminBrandRouter.put("/brands/:id", requiredAdmin, upload.single("icon"), brandController.postEditBrand);

// Block/Unblock brand
adminBrandRouter.patch("/brands/:id/block", requiredAdmin, brandController.blockBrand);


export default adminBrandRouter;
