import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

router.get("/google", authController.googleAuth);

router.get("/google/callback",authController.googleAuthCallback,(req, res) => {
    req.session.isLogin=true
        res.redirect("/home"); 
    }
);

export default router;
