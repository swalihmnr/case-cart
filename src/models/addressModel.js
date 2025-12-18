import mongoose, { Schema } from "mongoose";
const addressSchema=new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    streetAddress:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    landMark:{
        type:String,
        required:false
    },
    city:{
        type:String,
        required:true
    },
    pinCode:{
        type:String,
        required:true,
    },
    addressType:{
        type:String,
        enum:["Home",'Work',"other"],
        default:"Home",
        required:true
    },
    isDefault:{
        type:Boolean,
        required:true,
        default:false
    }

})
const addresss=mongoose.model('address',addressSchema);
export default addresss