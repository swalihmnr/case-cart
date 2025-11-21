import express from "express";
const router=express.Router()
import adminController from "../controllers/adminController.js";
router.get('/login',adminController.getLogin);
router.post('/login',adminController.postLogin);
router.get('/dashboard',adminController.getDashboard)
router.get('/customers',adminController.getCustomer)
router.get('/add-category',adminController.getAddCategory)
router.post('/add-category',adminController.postAddCategory)
router.get('/category',adminController.getCategory)
router.post('/category',adminController.postAddCategory)

export default router