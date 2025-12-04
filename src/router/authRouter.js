import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

router.get("/google", authController.googleAuth);

router.get("/google/callback",authController.googleAuthCallback,(req, res) => {
   req.session.user = {
            name: `${req.user.firstName} ${req.user.lastName} `,
            
            email: req.user.email,
        };
        res.redirect("/home"); 
    }
);

export default router;
