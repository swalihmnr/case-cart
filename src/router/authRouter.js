import express from "express";
import authController from "../controllers/authController.js";
import user from "../models/userModel.js";

const router = express.Router();

router.get("/google", authController.googleAuth);

router.get("/google/callback",authController.googleAuthCallback,(req, res) => {
    console.log(req.user+'it is the truee')
   req.session.user = {
            name: `${req.user.firstName} ${req.user.lastName}`,
            
            email: req.user.email,
             profileUrl: req.user.profileImg
        };
        res.redirect("/home"); 
    }
);

export default router;
