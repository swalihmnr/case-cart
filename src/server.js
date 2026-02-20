import express from 'express';
const app =express();
import env from 'dotenv';
env.config();
import session from 'express-session';
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import path from 'path'
import nocache from 'nocache';
import adminRouter from '../src/router/adminRouter.js'
import userRouter from '../src/router/userRouter.js'
import authRouter from '../src/router/authRouter.js'
import adminOfferRouter from '../src/router/admin/offerRouter.js'
import adminCoupenRouter from '../src/router/admin/coupenRouter.js'
import adminReportRouter from '../src/router/admin/reportRouter.js'

import userCouponRouter from '../src/router/user/couponRouter.js'
import walletRouter from './router/user/walletRouter.js';
import connectDB from './config/db.js';
import passport from 'passport';
import './config/passport.js'
import morgan from 'morgan';
import { attachUser } from './middlewares/auth.js';
import { attachAdmin } from './middlewares/auth.js';
import paymentRouter from '../src/router/paymentRouter.js'
app.use(session({
    secret:process.env.SECRET_KEY,
    resave:false,
    saveUninitialized:false
}))

let __filename=fileURLToPath(import.meta.url)
let __dirname=dirname(__filename);
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'));

app.use(express.json())
app.use(express.urlencoded({extended:true}));
app.use(nocache())
app.use(morgan('dev'))
app.use(passport.initialize())
app.use(passport.session())
app.use(attachUser)
app.use('/auth',authRouter)
app.use('/',userRouter)
app.use(attachAdmin)

//payment router here

app.use("/api/payment", paymentRouter);

// admin Routers here
app.use('/admin',adminRouter)
app.use('/admin',adminOfferRouter)
app.use('/admin',adminCoupenRouter)
app.use('/admin',adminReportRouter)
// user Routers here
app.use('/user',userCouponRouter)
app.use('/',walletRouter)

app.use(express.static(path.join(__dirname,'../public')));
app.use((req,res)=>{
    res.status(404).render('error')
})
app.use((err, req, res, next) => {
  console.error(err.stack); 
  res.status(500).json({
    success: false,
    message: err.message||"Internal Server Error"
  });
});

connectDB()
app.listen(process.env.PORT_NUMBER,()=>{
 console.log(`it's running on ${process.env.PORT_NUMBER}`)
})
