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
    referralCode: String, 
    referredBy:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"user",
    }, 
    profileImg:{
        type:String,
        required:false,
        default:'https://imgs.search.brave.com/OrvFL2AD85Wyt_GL_x3kyCCYdVUybANnlgtKHDXaLiM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzE0LzQz/LzU1LzE0NDM1NWQ3/YjM2YzVmNjQ2NDM1/NDIzNzk4MjgxY2U5/LmpwZw'
    },
    profileImgId:{
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