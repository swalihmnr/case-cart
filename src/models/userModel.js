import mongoose from 'mongoose';
const userSchema= new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        
    },
    lastName:{
        type:String,
        required:false,
        
    },
    number:{
        type:String,
        required:false,
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    password:{
        type:String,
        required:true
    },
    isBlock:{
        type:Boolean,
        default:false
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    profileImg:{
        type:String,
        required:false
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }

})
userSchema.index({
    firstName:"text",
    lastName:"text",
    email:"text",
    number:"text"
})
const user=mongoose.model('user',userSchema);
export default user