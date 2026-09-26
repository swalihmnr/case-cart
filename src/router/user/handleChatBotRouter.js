import express from "express";
const router=express.Router();

import controller from '../../controllers/user/chatBotController.js'
router.post('/',controller.handleChatBot)

export default router