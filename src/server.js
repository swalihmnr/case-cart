import express from "express";
const app = express();
import env from "dotenv";
env.config();
import session from "express-session";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import nocache from "nocache";
import flash from 'connect-flash'

let __filename = fileURLToPath(import.meta.url);
let __dirname = dirname(__filename);

import autherRouter from "../src/router/user/authRouter.js";
import productRouter from "../src/router/user/productRouter.js";
import profileRouter from "../src/router/user/profileRouter.js";
import orderRouter from "../src/router/user/orderRouter.js";
import homeRouter from "../src/router/user/homeRouter.js";
import wishlistRouter from "../src/router/user/wishlistRouter.js";
import cartRouter from "../src/router/user/cartRouter.js";
import checkoutRouter from "../src/router/user/checkoutRouter.js";
import addressRouter from "../src/router/user/addressRouter.js";

import authRouter from "../src/router/authRouter.js";
import adminAuthRouter from "../src/router/admin/authRouter.js";
import adminCategoryRouter from "../src/router/admin/categoryRouter.js";
import customerRouter from "../src/router/admin/customersRouter.js";
import adminOrderRouter from "../src/router/admin/orderRouter.js";
import adminProductRouter from "../src/router/admin/productRouter.js";
import adminOfferRouter from "../src/router/admin/offerRouter.js";
import adminCoupenRouter from "../src/router/admin/coupenRouter.js";
import adminReportRouter from "../src/router/admin/reportRouter.js";
import adminDashboardRouter from "../src/router/admin/dashboardRouter.js";

import userCouponRouter from "../src/router/user/couponRouter.js";
import walletRouter from "./router/user/walletRouter.js";
import connectDB from "./config/db.js";
import passport from "passport";
import "./config/passport.js";
import morgan from "morgan";
import { attachUser } from "./middlewares/auth.js";
import { attachAdmin } from "./middlewares/auth.js";
import paymentRouter from "../src/router/paymentRouter.js";
import MongoStore from "connect-mongo";

app.use(express.static(path.join(__dirname, "../public")));
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),

    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);
app.use(flash())
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.warning = req.flash("warning");
  res.locals.info = req.flash("info");
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());
app.use(morgan("dev"));
app.use(passport.initialize());
app.use(passport.session());
app.use(attachUser);
app.use("/auth", authRouter);
app.use(attachAdmin);

//payment router here

app.use("/api/payment", paymentRouter);

// admin Routers here
app.use("/admin", adminOfferRouter);
app.use("/admin", adminCoupenRouter);
app.use("/admin", adminReportRouter);
app.use("/admin", adminDashboardRouter);
app.use("/admin", adminAuthRouter);
app.use("/admin", adminCategoryRouter);
app.use("/admin", customerRouter);
app.use("/admin", adminOrderRouter);
app.use("/admin", adminProductRouter);

// user Routers here

app.use("/", autherRouter);
app.use("/", productRouter);
app.use("/", profileRouter);
app.use("/", orderRouter);
app.use("/", homeRouter);
app.use("/user", userCouponRouter);
app.use("/", walletRouter);
app.use("/", wishlistRouter);
app.use("/", cartRouter);
app.use("/", checkoutRouter);
app.use("/", addressRouter);


app.use((req, res) => {
  res.status(404).render("error");
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

connectDB();
app.listen(process.env.PORT_NUMBER, () => {
  console.log(`it's running on ${process.env.PORT_NUMBER}`);
});
