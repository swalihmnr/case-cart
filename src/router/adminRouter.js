import upload from "../middlewares/multer.js";
import express from "express";
const router = express.Router()
import adminController from "../controllers/adminController.js";
import { requiredAdmin } from '../middlewares/auth.js'
import { loginValidator } from "../validators/loginValidator.js";
import { addProductValidation } from "../validators/productValidator.js";
import { addCategoryValidator } from "../validators/categoryValidator.js";
router.get('/login', adminController.getLogin);
router.post('/login',loginValidator, adminController.postLogin);
router.use(requiredAdmin)
router.get("/logout", adminController.adminLogout);
router.get('/dashboard', adminController.getDashboard)
router.get('/customers', adminController.getCustomer)
router.patch('/customers/block/:id', adminController.blockCustomer)
router.get('/add-category', adminController.getAddCategory)
router.post('/add-category', addCategoryValidator, adminController.postAddCategory)
router.get('/category', adminController.getCategory)
router.post('/category', adminController.postAddCategory)
router.patch('/category/block/:id', adminController.blockCategory)
router.get('/category/edit/:id', adminController.editCategory)
router.patch('/category/edit/:id', adminController.postEditCategory)
router.get('/add-product', adminController.getAddproduct)
router.post('/add-product', upload.array('images', 5),addProductValidation, adminController.postAddproduct);
router.get('/product-list', adminController.getProductList)
router.get('/product/edit/:id', adminController.getProductEdit)
router.patch('/product/:id/edit-image', upload.single('image'), adminController.productImageEdit)
router.patch('/product/list/block/:id', adminController.blockProduct)
router.patch('/product/edit/:id/img-set-main', adminController.imgSetMain);
router.patch('/product/edit/:id/img-upload', upload.single('image'), adminController.productImageUpload)
router.patch('/product/edit/:id/img-delete', adminController.editImgDelete);
router.patch('/product/edit/:id/basic-info', adminController.editProductBasicInformation)
router.patch('/product/edit/:id/variant-data', adminController.passVariantData);
router.post('/product/edit/:id/variant-save', adminController.postEditVariantSave);
router.patch('/product/edit/:id/veriant-toggle', adminController.patchListUnlist)
router.get('/order', adminController.getOrderMngmnt)
router.get('/order/details/:orderId/:itemId', adminController.getOrderDetails)
router.patch('/order/:id/status', adminController.orderStatusChanger)
router.patch('/order/:id/approve', adminController.reqApprove)
router.patch('/order/:id/reject', adminController.reqReject)

export default router