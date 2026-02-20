import express from 'express'
const router = express.Router()
import reportCondroller from '../../controllers/admin/reportController.js'

router.get('/sales/report', reportCondroller.getReport);
router.get('/sales/export/pdf', reportCondroller.exportPdf);
router.get('/sales/export/excel', reportCondroller.exportExcel);
export default router