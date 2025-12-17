import mongoose, { Schema } from "mongoose";
const cartSchema=new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    quantity:{
        type:Number,
        required:true,
        default:1
    },
    variantId:{
        type:Schema.Types.ObjectId,
        ref:"variant",
        required:true
    },
    productId:{
        type:Schema.Types.ObjectId,
        ref:"product",
        required:true
    }
},
{timestamps:true}

)
const cart=mongoose.model('cart',cartSchema);
export default cart