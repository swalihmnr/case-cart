import mongoose from "mongoose";
let produtSchema= mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    productStatus:{
        type:String,
        default:true,
    },
    decount:{
        type:Number,
        default:0
    },
    isBlock:{
        type:Boolean,
        default:false
    },
    catgId:{
        type:mongoose.Types.ObjectId,
        ref:"category",
        required:true
    },
    variants:{
        type:mongoose.Types.ObjectId,
        ref:"variant",
        required:true
    },
    productImages:[{
        type:String

    }
    ]
    
},
{timestamps:true}
)
export default mongoose.model('product',produtSchema)