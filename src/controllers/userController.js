import user from '../models/userModel.js'
import modelOtp from '../models/otpModel.js'
import bcrypt from 'bcrypt'
import otpGeneratorTodb from '../utils/otpGeneratorToDb.js'
import productModel from '../models/admin/productModel.js'
import Category from '../models/admin/categoryModel.js'
import variantModel from '../models/admin/variantModel.js'
import mongoose from 'mongoose'
import { STATUS_CODES } from '../utils/statusCodes.js'
import { uploadBufferTocloudnery } from '../utils/cloudneryUpload.js'


let getLogin=(req,res)=>{
    res.render('./user/userLogin')
}
let postLogin=async(req,res)=>{
    const {Email,Password}=req.body
    try{
       
        let existing=await user.findOne({email:Email})
        if(existing){
            if(existing.isBlock!==true){

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
                        
                        req.session.user={
                            id:existing._id,
                            name:`${existing.firstName} ${existing.lastName}`,
                            email:existing.email,
                            profileUrl:existing.profileImg
                        }
                        console.log(req.session.user.profileUrl)
                        return res.status(200).json({success:true,message:"login successfully..",redirectUrl:'/home'})
                        
                    }
                }else{
                    return res.status(403).json({isVerified:false,message:"user not verified"})
                }
            }else{
                return res.status(403).json({
                    success:false,
                    message:"admin blocked you "
                })
            }
        }else{
            console.log('signup first')
            return res.status(404).json({success:false,message:"user hasn't signup yet"})
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
            req.session.requre_sign=true
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
            req.session.requre_sign=false;
          
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
    console.log(req)
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
const getUserProfil=async(req,res)=>{
    let User=await user.findOne({email:req.session.user.email});

    res.render('./user/user-profile',{User});
}
const editProfileInfo=async(req,res)=>{
    try {
       const {firstName,lastName,email,number}=req.body
       const existing=await user.findOne({email:req.session.user.email});
      if(!existing){
        console.log('user not exist')
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success:false,
            message:"user does not exist"
        })
      }else{
        let isChanged=false;
        if(existing.password!=="google-auth"){
            if(firstName!==existing.firstName){
                isChanged=true
            }
            if(lastName!==existing.lastName){
                isChanged=true
            }
            if(email!==existing.email){
                isChanged=true
            }
            if(number!==existing.number){
                isChanged=true
            }
            
            if(isChanged){
                    const updatedUser=await user.findByIdAndUpdate(existing._id,{
                        firstName:firstName,
                        lastName:lastName,
                        number:number,
                        email:email

                    },{new:true})
                    req.session.user.name = `${updatedUser.firstName} ${updatedUser.lastName}`;
                    req.session.user.email = updatedUser.email;

                return res.status(STATUS_CODES.OK).json({
                    isGoogle:false,
                    isChanged:true,
                    success:true,
                    message:'profile info updated successfully...'
                })
            }else{
                return res.status(STATUS_CODES.OK).json({
                    isGoogle:false,
                    isChanged:false,
                    success:false,
                    message:'Nothing to update'
                })
            }
        }else{
             if(firstName!==existing.firstName){
                isChanged=true
            }
            if(lastName!==existing.lastName){
                isChanged=true
            }
            if(number!==existing.number){
                isChanged=true
            }
            if(email!==existing.email){
                return res.status(STATUS_CODES.FORBIDDEN).json({
                    isGoogle:true,
                    isChanged:false,
                    success:false,
                    message:'you are Google user ,you could not change your email'
                })
            }
            if(isChanged){
                    const updatedUser=await user.findByIdAndUpdate(existing._id,{
                        firstName:firstName,
                        lastName:lastName,
                        number:number
                    },{new:true})
                     req.session.user.name = `${updatedUser.firstName} ${updatedUser.lastName}`;

                    return res.status(STATUS_CODES.OK).json({
                        isChanged:true,
                        success:true,
                        isGoogle:true,
                        message:'profile info updated'
                    })
            }else{
                return res.status(STATUS_CODES.OK).json({
                    isGoogle:true,
                    success:false,
                    isChanged:false,
                    message:"Nothing to update"
                })
            }

        }
      }
    } catch (error) {
       console.log(error)
    }
}
const editProfileImg=async(req,res)=>{
    try {
        console.log(req.file)
        const uploadResult=await uploadBufferTocloudnery(req.file.buffer);
        const existing= await user.findOne({email:req.session.user.email})
        console.log(existing)
        if(!existing){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"User not founded"
            })
        }else{
            existing.profileImg= await uploadResult.secure_url;
            existing.profileImgId=await uploadResult.public_id;
            await existing.save()
            req.session.user.profileUrl=await existing.profileImg
            return res.status(STATUS_CODES.OK).json({
                success:true,
                message:"Profile Image updated"
            })
        }

    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Internal Server Error !"
        })
    }
}
const getWishlist=async(req,res)=>{
    const user={
        profileUrl:'sdfsdfsdfs'
    }
    res.render('./user/wishlist',{
        user
    })
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
    getUserProfil,
    editProfileInfo,
    editProfileImg,
    getWishlist

};