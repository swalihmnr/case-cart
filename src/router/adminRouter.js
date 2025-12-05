import upload from "../middlewares/multer.js";
import express from "express";
const router=express.Router()
import adminController from "../controllers/adminController.js";
router.get('/login',adminController.getLogin);
router.post('/login',adminController.postLogin);
router.get('/dashboard',adminController.getDashboard)
router.get('/customers',adminController.getCustomer)
router.patch('/customers/block/:id',adminController.blockCustomer)
router.get('/add-category',adminController.getAddCategory)
router.post('/add-category',adminController.postAddCategory)
router.get('/category',adminController.getCategory)
router.post('/category',adminController.postAddCategory)
router.patch('/category/block/:id',adminController.blockCategory)
router.get('/category/edit/:id',adminController.editCategory)
router.patch('/category/edit/:id',adminController.postEditCategory)
router.get('/add-product',adminController.getAddproduct)
router.post('/add-product',upload.array('images',5),adminController.postAddproduct);
router.get('/product-list',adminController.getProductList)
router.get('/product/edit/:id',adminController.getProductEdit)
router.patch('/product/:id/edit-image',upload.single('image'),adminController.productImageEdit)
router.patch('/product/list/block/:id',adminController.blockProduct)
router.patch('/product/edit/:id/img-set-main',adminController.imgSetMain);
router.patch('/product/edit/:id/img-upload',upload.single('image'),adminController.productImageUpload)
router.patch('/product/edit/:id/img-delete',adminController.editImgDelete);
router.patch('/product/edit/:id/basic-info',adminController.editProductBasicInformation)
router.patch('/product/edit/:id/variant-data',adminController.passVariantData);
router.post('/product/edit/:id/variant-save',adminController.postEditVariantSave);
router.patch('/product/edit/:id/veriant-toggle',adminController.patchListUnlist)

export default router