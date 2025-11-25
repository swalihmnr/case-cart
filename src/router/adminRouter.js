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
router.post('/category/block/:id',adminController.blockCategory)
router.get('/category/edit/:id',adminController.editCategory)
router.post('/category/edit/:id',adminController.postEditCategory)

export default router