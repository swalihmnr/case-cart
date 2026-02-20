import express from 'express'
const router=express.Router()
import reportCondroller from '../../controllers/admin/reportController.js'

router.get('/sales/report',reportCondroller.getReport)


export default router