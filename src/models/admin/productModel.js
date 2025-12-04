import mongoose from "mongoose";
let produtSchema=new  mongoose.Schema({
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
        ref:"Category",
        required:false
    },
    variants:[{
        type:mongoose.Types.ObjectId,
        ref:"variant",
        required:true
    }],
    productImages:[{
        url:{
            type:String,
            required:true
        },
        publicId:{
            type:String,
            required:true
        },
        isMain:{
            type:Boolean,
            default:false
        }

    }
    ]
    
},
{timestamps:true}
)
produtSchema.index({ name: "text", description: "text" });

export default mongoose.model('product',produtSchema)