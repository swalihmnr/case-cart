import mongoose from 'mongoose'
const categorySchema=mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    descripton:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        required:true
    }
},{
        timestamps:true
    }
)

const categoryModel=mongoose.model('Category',categorySchema)
export default categoryModel