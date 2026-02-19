import razorpayInstence from "../config/razorpayConfig.js";
import env from 'dotenv'
import Wallet from "../models/walletModel.js";
import crypto from 'crypto';
import { STATUS_CODES } from "../utils/statusCodes.js";
env.config()

const createWalletRazorpayOrder=async(req,res)=>{
    try {
        const {amount}=req.body;
        if(!amount||amount<1){
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success:false,
                message:"Invalid Amount"
            })
        }
        const options ={
            amount:Math.round(amount*100),
            currency:"INR",
            receipt:"wallet_"+Date.now()
        }
        const razorpayOrder=await razorpayInstence.orders.create(options);
        res.json({
            success:true,
            order:razorpayOrder,
            key:process.env.RAZORPAY_KEY_ID
        })

    } catch (error) {
         console.error("Wallet Razorpay order error:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create wallet payment order"
    });
    }
}

const verifyWalletRazorpayPayment=async(req,res)=>{
    try {
        const {
         razorpay_payment_id,
         razorpay_order_id,
         razorpay_signature,
         amount
       } = req.body;
   
       const body=razorpay_order_id+"|"+razorpay_payment_id;
   
       const expectedSignature=crypto.createHmac('sha256',process.env.RAZORPAY_SECRET).update(body.toString()).digest('hex')
       if(razorpay_signature!==expectedSignature){
           return res.status(STATUS_CODES.BAD_REQUEST).json({
               success:false,
               message:"Invalid Signature"
           })
       }
       await Wallet.findOneAndUpdate(
           {userId:req.session.user.id},
           {$inc:{balance:amount},
           $push:{
            transactions:{
                amount,
                description:"added money to wallet",
                transactionType:"Credited",
                paymentId:razorpay_payment_id,
                status: "completed"
            }
           }
        },
           
           {upsert:true}
       )
       res.json({
           success:true,
           message:"wallet credited successfully"
       })
        
    } catch (error) {
    console.error("Wallet verify error:", error);
    res.status(500).json({
      success: false,
      message: "Wallet verification failed"
    });
    }
}

export default{
    createWalletRazorpayOrder,
    verifyWalletRazorpayPayment
}