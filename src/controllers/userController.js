import user from '../models/userModel.js'
import modelOtp from '../models/otpModel.js'
import bcrypt from 'bcrypt'
import otpGeneratorTodb from '../utils/otpGeneratorToDb.js'
import productModel from '../models/admin/productModel.js'
import Category from '../models/admin/categoryModel.js'
import variantModel from '../models/admin/variantModel.js'
import mongoose from 'mongoose'
import { name } from 'ejs'


let getLogin=(req,res)=>{
    res.render('./user/userLogin')
}
let postLogin=async(req,res)=>{
    const {Email,Password}=req.body
    try{
        let existing=await user.findOne({email:Email})
        if(existing){
            if(existing.isVerified===true){
                console.log('user verified....')
                if(existing.email!==Email){
                    console.log('user email not match')
                    return res.json({success:false,message:"user email not match",emailErr:true})
                }
                let isValidPass= await bcrypt.compare(Password,existing.password);
                if(!isValidPass){
                    console.log('incorrect password')
                    return res.json({success:false,message:"incorrect password",passErr:true,redirectUrl:'/login'});
                    
                }else{
                    
                    console.log('login successfully')
                    req.session.isLogin=true
                    req.session.user={
                        id:existing._id,
                        name:`${existing.firstName} ${existing.lastName}`,
                        emial:existing.email
                    }
                    return res.json({success:true,message:"login successfully..",redirectUrl:'/home'})
                    
                }
            }else{
                return res.json({isVerified:false,message:"user not verified"})
            }
        }else{
            console.log('signup first')
            return res.json({success:false,message:"user hasn't signup yet"})
        }
    }catch(err){

    }
}
let getSignup=(req,res)=>{
    res.render('./user/userSignup')
}



let register=async(req,res)=>{
    try{
        const{firstname,lastname,number,email,password}=req.body
       
        const existing =await user.findOne({email});
        if(existing){
            console.log(`user already exists on this email ${email}`)
            return res.json({success:false,message:"user already exists"})
        }else{
            const salt_round=Number(process.env.SALT_ROUND)
            const hashedPassword= await bcrypt.hash(password,salt_round)

            const newUser=new user({
                firstName:firstname,
                lastName:lastname,
                number,
                email,
                password:hashedPassword
                
            })
            console.log(hashedPassword)
            await newUser.save()
            req.session.tempUserId=true;
            let newOtp=await otpGeneratorTodb(newUser,email)
            if(newOtp){ 
                console.log('user registration successfully')
                return res.json({success:true,message:"user account created",redirectUrl:'/otpVerfication',Email:email})
            }else{
                console.log('something went wrong...')
            }
        }
        
    }catch(err){
        console.log(`it is the error ${err}`)
    }
    
}

let getOtpVerify= async(req,res)=>{
    res.render("./user/otp-verification")
}
let OtpVerify= async(req,res)=>{
    try{
        
        const {data,userEmail}=req.body
        const User=await user.findOne({email:userEmail})
        const userId=User._id
        
        const userOtp=await modelOtp.findOne({userId:userId})
        if(userOtp){
            console.log('valid otp')
            let dbOtp=userOtp.otp
            console.log(dbOtp+"it is from db")
            console.log(data+'data here')  
    
            if (!data) {
           return res.json({ success: false, message: 'No OTP provided' });
           }

         if (dbOtp === data) {
            await user.updateOne({email:userEmail},{$set:{isVerified:true}})
           
           console.log(`otp verified successfully: ${data}`);
           req.session.isLogin=true;
          
           return res.json({
           success: true,
           message: 'OTP verified',
           redirectUrl:'/login'  
            });
             
          }else{
            res.json({success:false,message:'otp not matched'})
          }
        

            
   
        }else{
            console.log('expired')
            return res.json({success:false,message:'otp expired'})
        }
   
    }catch(err){

    }

}
let resendOtpVerify = async (req, res) => {
    
  const {  userEmail } = req.body;

  const User = await user.findOne({ email: userEmail });
  if (!User) {
      return res.json({ success: false, message: 'User not found' });
  }

  const newOtp = await otpGeneratorTodb(User, userEmail);
  console.log(`New OTP generated: ${newOtp}`);


  return res.json({
    success: true,
    message: 'New OTP sent',
   
  });
};

let getResetPass=(req,res)=>{
    req.session.resetMode=false
    res.render('./user/resetPassword')
}
let postResetPass=async(req,res)=>{
    console.log(req.body)
    const {password,userEmail}=req.body
    if(!userEmail){
       return  res.json({
        success:false,
        message:"user Email has missed!"

       })
    }else{
        let User=await user.findOne({email:userEmail})
        let salt_round=Number(process.env.SALT_ROUND)
        let hashedPassword=await bcrypt.hash(password,salt_round)
        console.log(hashedPassword)
        await User.updateOne(
            {email:userEmail},{$set:{password:hashedPassword}}
        )
        res.json({
            success:true,
            message:"Password updated successfully",
            redirectUrl:"/home"

        })
        

    }
}
let getForgetPassword=(req,res)=>{
    res.render('./user/forgetPassword');
}
let PostForgetPassword=async(req,res)=>{
    const {email}=req.body
    const existing= await user.findOne({email:email})
    if(!existing){
        return res.json({success:false,message:"User not exist"})
    }else{
       if (existing.password!=='google-auth'){
            const User = await user.findOne({ email: email });
            const Userotp = await modelOtp.findOne({ userId: User._id });
            console.log('it is user otp on post frogot',Userotp)
             let otp= await otpGeneratorTodb(User,email)
             console.log('it is the Otp'+otp)
             req.session.resetMode=true
             return res.json({success:true,redirectUrl:'/otpVerfication',successUrl:'/resetPassword'})
            
       }else{
        return res.json({success:false,message:"it's Google User"})
       }
    }
}

let getLandingPage=(req,res)=>{
    res.render("./user/landingPage")
}
let getHome=(req,res)=>{
    res.render('./user/home')
}
let logOut=(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log('logout error');
          return  res.redirect('/home')
        }else{
            res.clearCookie('connect.sid');
            return  res.redirect('/landingPage')
        }
    })
}
 
const getProduct = async (req, res) => {
    try {
        let { page = 1, search = "", price = "all", Categories = "", sort = "" } = req.query;
        page = Number(page);

        const limit = 9;
        const skip = (page - 1) * limit;

    
        const selectedCategories = Categories ? Categories.split(",") : [];

        let matchStage = { isBlock: false };

    
        if (search.trim()) {
            matchStage.name = { $regex: search, $options: "i" };
        }


        if (selectedCategories.length > 0) {
          matchStage.catgId = { 
        $in: selectedCategories.map(id => new mongoose.Types.ObjectId(id)) 
    };
}

        // PRICE FILTER
        let priceFilter = {};
        if (price === "under-150") {
            priceFilter = { "variants.salePrice": { $lte: 150 } };
        }
        if (price === "500-700") {
            priceFilter = { "variants.salePrice": { $gte: 500, $lte: 700 } };
        }
        if (price === "above-1000") {
            priceFilter = { "variants.salePrice": { $gte: 1000 } };
        }

        // SORT LOGIC
        let sortStage = {};
        if (sort === "priceLowHigh") sortStage = { minPrice: 1 };
        if (sort === "priceHighLow") sortStage = { minPrice: -1 };
        if (sort === "aToZ") sortStage = { name: 1 };
        if (sort === "zToA") sortStage = { name: -1 };

        
        const pipeline = [
            { $match: matchStage },

       
            {
                $lookup: {
                    from: "variants",
                    localField: "variants",
                    foreignField: "_id",
                    as: "variants"
                }
            },

            // JOIN CATEGORY
            {
                $lookup: {
                    from: "categories",
                    localField: "catgId",
                    foreignField: "_id",
                    as: "catgId"
                }
            },
            { $unwind: "$catgId" },

            // ADD MIN PRICE & MAIN IMAGE
            {
                $addFields: {
                    minPrice: { $min: "$variants.salePrice" },
                    mainImage: {
                        $first: {
                            $filter: {
                                input: "$productImages",
                                as: "img",
                                cond: { $eq: ["$$img.isMain", true] }
                            }
                        }
                    }
                }
            },

            // PRICE FILTER
            { $match: priceFilter },
        ];

        // APPLY SORT ONLY IF NOT EMPTY
        if (Object.keys(sortStage).length > 0) {
            pipeline.push({ $sort: sortStage });
        }

        // PAGINATION + COUNT IN SINGLE CALL
        pipeline.push(
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        );

        const result = await productModel.aggregate(pipeline);

        const products = result[0].data;
        const totalItems = result[0].totalCount[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / limit);

        const categories = await Category.find();

        res.render("user/product-list", {
            products,
            categories,
            selectedCategories,
            search,
            price,
            sort,
            totalItems,
            currentPage: page,
            totalPages
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
};



const getDetialProduct= async(req,res)=>{
    try {
        const veriantid=req.query.veriantId
        let veriant;
        const veriantId=new mongoose.Types.ObjectId(veriantid);
        const id=req.params.id;
        const objectId=new mongoose.Types.ObjectId(id);
        const product= await productModel.findById(objectId).populate('catgId').populate("variants");
        if(veriantid===undefined){
            veriant=await variantModel.findOne({_id:product.variants[0]._id})
        }else{
            veriant=await variantModel.findOne({_id:veriantId})

        }
        const relatedProducts=await productModel.find({catgId:product.catgId,_id:{$ne:product._id}}).limit(4)
        console.log(veriantid)
        if(veriantId===null){
        }else{
           
        }
        let salePrice=veriant.salePrice
        let orgPrice=veriant.orgPrice
       
        res.render('./user/product-detial',{
            product,
            salePrice,
            orgPrice,
            relatedProducts
        })
    } catch (error) {
        console.log(error)
    }
}
export default {
    getLogin,
    postLogin,
    resendOtpVerify,
    getForgetPassword,
    PostForgetPassword,
    getOtpVerify,
    getSignup,
    getResetPass,
    postResetPass,
    getLandingPage,
    getHome,
    register,
    OtpVerify,
    logOut,
    getProduct,
    getDetialProduct,

};