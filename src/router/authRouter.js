import express from "express";
import authController from "../controllers/authController.js";
import user from "../models/userModel.js";

const router = express.Router();

router.get("/google", authController.googleAuth);

router.get("/google/callback",authController.googleAuthCallback,(req, res) => {
   req.session.user = {
            id:req.user._id,
            name: `${req.user.firstName} ${req.user.lastName}`,
            
            email: req.user.email,
             profileUrl: req.user.profileImg
        };
        res.redirect("/"); 
    }
);

export default router;
