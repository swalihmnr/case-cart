import mongoose from "mongoose";
const otpSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    expiresAt:{
        type:Date,
        required:true,
        index:{expires:0}
    }
    
})
const Otp=mongoose.model('otp',otpSchema)
export default Otp
