import express from 'express';
const router =express.Router();
import dashboardController from '../../controllers/admin/dashboardController.js';
router.get('/dashboard', dashboardController.getDashboard)


export default router