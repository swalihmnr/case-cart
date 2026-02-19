import express from "express";
const router =express.Router(); 
import walletController from "../../controllers/user/walletController.js";
router.get('/wallet',walletController.getWallet);

export default router