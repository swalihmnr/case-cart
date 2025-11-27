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
import connectDB from './config/db.js';
import passport from 'passport';
import './config/passport.js'
import morgan from 'morgan';
import { attachUser } from './middlewares/auth.js';
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
app.use('/admin',adminRouter)
app.use(express.static(path.join(__dirname,'../public')))
connectDB()
app.listen(process.env.PORT_NUMBER,()=>{
 console.log(`it's running on ${process.env.PORT_NUMBER}`)
})
