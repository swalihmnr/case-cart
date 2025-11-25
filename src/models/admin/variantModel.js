import mongoose from 'mongoose';
const variantSchema=mongoose.Schema({
    deviceModal:{
        type:String,
        required:true
    },
    images:[
        {
            type:String
        }
    ],
    discount:{
        type:Number,
        required:false,
        default:0
    },
    orgPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:false
    },
    isListed:{
        type:Boolean,
        default:true

    },
    productId:{
        type:mongoose.Types.ObjectId,
        ref:"product",
        required:true

    },
    stock:{
        type:Number,
        required:true,
        default:0
    }
},
{
    timestamps:true
})

export default mongoose.model('variant',variantSchema)