import express from "express";
const router =express.Router();
import offerController from '../../controllers/admin/offerController.js'
router.get('/offers',offerController.renderOffersPage)
router.get('/offer/add',offerController.renderOfferAdd)
router.post('/offer/add',offerController.postOfferAdd)
router.get('/offer/edit',offerController.renderOfferEdit)
router.post('/offer/edit',offerController.postEditOffer)
router.patch('/offer/delete/:id',offerController.deleteOffer)
export default router