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
import wishlistModel from '../models/wishlistModel.js'
import cartModel from '../models/cartModel.js'
import addressModel from '../models/addressModel.js';
import orderModel from '../models/orderModel.js'
import offerModel from '../../src/models/admin/offerModel.js'
import discountChecker from '../../src/utils/calculateDiscount.js'



// ==============================
// GET LOGIN PAGE
// ==============================
// Renders user login page
let getLogin=(req,res)=>{
    req.session.isKey=false
    res.render('./user/userLogin')
}



// ==============================
// POST LOGIN
// ==============================
// Validates user credentials
// Checks: existence, block status, verification, password
// Creates user session on success 
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

// ==============================
// GET SIGNUP PAGE
// ==============================
// Renders the user signup (registration) page
// This route is used when a new user wants to create an account
let getSignup=(req,res)=>{
    res.render('./user/userSignup')
}


// ==============================
// USER REGISTRATION
// ==============================
// Creates user
// Hashes password
// Generates OTP for email verification
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


// ==============================
// GET OTP VERIFICATION PAGE
// ==============================
// Renders the OTP verification page
// Used during:
// - User registration verification
// - Password reset verification
// - Email update verification
let getOtpVerify= async(req,res)=>{
    res.render("./user/otp-verification")
}

// ==============================
// OTP VERIFICATION
// ==============================
// Verifies OTP
// Handles multiple flows:
// - Signup
// - Email update
// - Password reset
let OtpVerify= async(req,res)=>{
    try{
         req.session.requre_sign=false;
        const {data,userEmail}=req.body
        const User=await user.findOne({email:userEmail})
        const userId=User._id
        console.log(userId)
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
            req.session.isKey=true
            req.session.requre_sign=false;
            if(req.session.user?.redirect=='/user-profile'){
                const result=await user.findById(req.session.user.userForUdpateId)
                result.email=req.session.user.newEmail;
                req.session.user.email=result.email
                await result.save()
                req.session.user.newEmail=null
                req.session.user.redirect='';
                return res.status(STATUS_CODES.OK).json({
                    success:true,
                    message:"OTP verified & Email changed",
                    redirectUrl:'/user-profile'
                })
            }
          if(req.session.redirect=="resetPassword"){
            req.session.redirect='';
            return res.status(STATUS_CODES.OK).json({
                success:true,
                message:"OTP verified ",
                redirectUrl:'/resetPassword'
            })
          }
           return res.json({
           success: true,
           message: 'OTP verified ',
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
        console.log(err,"it is the eoror")
    }

}

// ==============================
// RESEND OTP
// ==============================
// Generates and sends a new OTP to the user's email
// Used when OTP expires or user requests resend
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


// ==============================
// GET RESET PASSWORD PAGE
// ==============================
// Renders reset password page after OTP verification
let getResetPass=(req,res)=>{
    res.render('./user/resetPassword')
}

// ==============================
// POST RESET PASSWORD
// ==============================
// Updates user password after OTP verification
// Hashes new password before saving
let postResetPass=async(req,res)=>{
    console.log(req.body)
    const {password,userEmail}=req.body
    if(!userEmail){
        return  res.json({
            success:false,
            message:"user Email has missed!"
            
        })
    }else{
        req.session.isKey=false
        let User=await user.findOne({email:userEmail})
        console.log(User)
        if(!User){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:'User not exist'
            })
        }
        let salt_round=Number(process.env.SALT_ROUND)
        let hashedPassword=await bcrypt.hash(password,salt_round)
        console.log(hashedPassword)
        User.password=hashedPassword;
        await User.save()
        res.json({
            success:true,
            message:"Password updated successfully",
            redirectUrl:"/home"

        })
        

    }
}

// ==============================
// GET FORGOT PASSWORD PAGE
// ==============================
// Renders forgot password page
let getForgetPassword=(req,res)=>{
    res.render('./user/forgetPassword');
}

// ==============================
// POST FORGOT PASSWORD
// ==============================
// Initiates forgot password flow
// Sends OTP if user exists and is not blocked
let PostForgetPassword=async(req,res)=>{
    const {email}=req.body
    const existing= await user.findOne({email:email})
    if(!existing){
        return res.json({success:false,message:"User not exist"})
    }else{
        if(existing.isBlock){
           return res.json({success:false,message:"Your are blocked by admin"})
        }
        if (existing.password!=='google-auth'){
           req.session.redirect='resetPassword'
         req.session.requre_sign=true
            const User = await user.findOne({ email: email });
             await modelOtp.findOne({ userId: User._id });
             let otp= await otpGeneratorTodb(User,email)
             console.log('it is the Otp'+otp)
             return res.json({success:true,redirectUrl:'/otpVerfication',successUrl:'/resetPassword'})
            
       }else{
        return res.json({success:false,message:"it's Google User"})
       }
    }
}


// ==============================
// GET HOME PAGE
// ==============================
// Renders user home page
let getHome=(req,res)=>{
    console.log(req)
    res.render('./user/home')
}
3
// ==============================
// USER LOGOUT
// ==============================
//  session and clears cookie
const logOut = (req, res) => {
    try {
        req.session.user = null;   
        res.redirect('/home');
    } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/home');
    }
};
 

// ==============================
// GET PRODUCT LIST
// ==============================
// Handles:
// - Search
// - Category filter
// - Price filter
// - Sorting
// - Pagination
// - Wishlist marking
const getProduct = async (req, res) => {
    try {
        let { page = 1, search = "", price = "all", Categories = "", sort = "" } = req.query;
        page = Number(page);

        const limit = 6;
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
        let sortStage = {createdAt:-1};
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
           {
             $addFields: {
               variants: {
                 $filter: {
                   input: "$variants",
                   as: "v",
                   cond: { $gt: ["$$v.stock", 0] }
                 }
               }
             }
           },
           { $match: { "variants.0": { $exists: true } } },
           
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
            {$match:{'catgId.isActive':true}},

            // ADD MIN PRICE & MAIN IMAGE
               {
                $addFields: {
                    minPrice: { $min: "$variants.salePrice" },
                    minVariant: {
                    $first: {
                      $sortArray: {
                        input: "$variants",
                        sortBy: { salePrice: 1 }
                      }
                    }
                  },
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
         let wishlistItems=[]
         let user=false
        const products = result[0].data;
        const totalItems = result[0].totalCount[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / limit);
        if(req.session.user?.id){
           user= true
        }
        const categories = await Category.find({isActive:true});
        if(req.session.user?.id){
            wishlistItems = await wishlistModel.find({ userId: req.session.user.id });  
        }
        res.render("user/product-list", {
            products,
            categories,
            selectedCategories,
            search,
            price,
            sort,
            totalItems,
            currentPage: page,
            totalPages,
            wishlistItems,
            user
    
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
};


// ==============================
// GET PRODUCT DETAIL PAGE
// ==============================
// Fetches a single product with category & variants
// Also loads up to 4 related products
const getDetialProduct= async(req,res)=>{
    try {
        const id=req.params.id;
        const objectId=new mongoose.Types.ObjectId(id);
        const product= await productModel.findById(objectId).populate('catgId').populate("variants");
        
        let relatedProducts=await productModel.find({catgId:product.catgId,_id:{$ne:product._id}}).limit(4)
        if(relatedProducts.length<4){
            const remains=4-relatedProducts.length
            const excludeCatgIds=[product._id,...relatedProducts.map(id=>id.catgId._id)]
            const defCatgProduct=await productModel.find({catgId:{$ne:product.catgId},_id:{$nin:excludeCatgIds}}).limit(remains)
            relatedProducts=[...relatedProducts,...defCatgProduct]
        }

        console.log('last')
        res.render('./user/product-detial',{
            product,
            relatedProducts
        })
    } catch (error) {
        console.log(error)
    }
}

// ==============================
// GET VARIANT PRICE DATA (AJAX)
// ==============================
// Used when user switches variant (color / model)
// Returns updated prices dynamically
const getVariantData=async(req,res)=>{
    try {
        console.log('hlow')
        const today=new Date()
       const productId=req.params.id
       const variantId=req.query.variantId
       if(!productId||!variantId){
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success:false,
            message:"productId or variantId not provided"
        })
       }
       const variant=await variantModel.findOne({_id:variantId});
       if(!variant){
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success:false,
            message:"variant not founded"
        })
       }

       //offer showining in product detial page 
       const product=await productModel.findById(productId).populate('catgId').populate("variants");
       const offers = await offerModel.aggregate([
          
            {
              $match: {
                status: "active",
                startDate: { $lte: today },
                endDate: { $gte: today }
              }
            },
            {
              $match: {
                $or: [
                  { applicableOn: "global" },
                  {
                    applicableOn: "product",
                    productIds: product._id
                  },
                  {
                    applicableOn: "category",
                    categoryIds: product.catgId?._id
                  }
                ]
              }
            }
            ,{
            $project:{
                applicableOn:1,
                categoryIds:1,
                productIds:1
            }
            }
          ]);
          let disObject={}
          let salePrice
          disObject.isOffer=false
          if(offers.length!==0){
              let combinedOffers = offers.filter(v =>
                ["global", "product", "category"].includes(v.applicableOn)  
              );
            
              let offerType='offerType'
              //  passing argugemnts are mentioned inside of the of the discountChecker
               disObject=await discountChecker(combinedOffers,offerModel,variant.salePrice,offerType)
               disObject.isOffer=true

          }
          salePrice=variant.salePrice
         if(offers.length!==0){
            salePrice=Math.floor((variant.salePrice)-disObject.bestDiscount)
         }
       const orgPrice=variant.orgPrice
       return res.status(STATUS_CODES.OK).json({
        success:false,
        message:"success",
        salePrice,
        orgPrice,
        disObject
       })
       
    } catch (error) {
        console.log(error)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
    }
}

// ==============================
// GET USER PROFILE PAGE
// ==============================
const getUserProfil=async(req,res)=>{
    req.session.isKey=false
    let User=await user.findOne({email:req.session.user.email});

    res.render('./user/user-profile',{User});
}

// ==============================
// EDIT PROFILE INFORMATION
// ==============================
// Handles both normal & Google users
// Email change requires OTP verification
const editProfileInfo=async(req,res)=>{
    try {
        req.session.isKey=false
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
            if (email !== existing.email) {
                 req.session.requre_sign=true
                 req.session.user.redirect='/user-profile'
              const emailExists = await user.findOne({ email:email });
              if (emailExists) {
                  return res.status(409).json({
                      success: false,
                      message: "This email is already taken",
                  });
              }
             req.session.user.prevousEmail=existing.email;
              req.session.user.userForUdpateId=existing._id;
              req.session.user.newEmail=email
              req.session.user.email=existing.email
             let result= await otpGeneratorTodb(existing._id,existing.email);
             if(result){
                return res.status(STATUS_CODES.OK).json({
                    success:true,
                    otpVerify:true,
                    email:existing.email,
                    redirect:'/otpVerfication',
                    message:"verify your Email"
                })
             }
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

// ==============================
// UPDATE PROFILE IMAGE
// ==============================
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
            req.session.user.profileUrl= existing.profileImg
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

// ==============================
// GET WISHLIST
// ==============================
const getWishlist=async(req,res)=>{
   const userId= req.session.user.id;
   console.log(userId)
   const userID=new mongoose.Types.ObjectId(userId)
    const products= await wishlistModel.find({userId:userID}).populate('variantId').populate('productId')
    res.render('./user/wishlist',{
        products
        
    })
}

// ==============================
// ADD TO WISHLIST
// ==============================
const postWishlist=async(req,res)=>{
    try {
        const {productId,variant}=req.body;
        const variantId=new mongoose.Types.ObjectId(variant);
        const Variant=await variantModel.findById(variantId);
        const userId=new mongoose.Types.ObjectId(req.session.user.id)
        if(!productId){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"product not provided"
            })
        }
        if(!Variant){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"variant not provided"
            })
        }
        const existing=await wishlistModel.findOne({
            variantId:Variant._id,
            userId:userId,
            productId:productId
        })
        const existingCart=await cartModel.findOne({
            variantId:Variant._id,
            userId:userId,
            productId:productId
        })

        if(existing){
            return res.status(STATUS_CODES.CONFLICT).json({
                success:false,
                message:"already exists in wishlist"
            })
        }

        if(existingCart){
            return res.status(STATUS_CODES.CONFLICT).json({
                success:false,
                message:"already exist in cart"
            })
        }
        if(!userId){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"user not founded"
            })
        }
       let result= await wishlistModel.create({
            userId:userId,
            productId:productId,
            variantId:Variant._id
        })
        return res.status(STATUS_CODES.CREATED).json({
            success:true,
            message:'added to wishlist'
        })
        
    } catch (error) {
        
    }
}

// ==============================
// REMOVE ITEM FROM WISHLIST
// ==============================
// Deletes a wishlist item for the logged-in user
// Ensures user can remove only their own wishlist items
const remWishlist=async(req,res)=>{
    try {
        const id=req.params.id
        const wishlistId=new mongoose.Types.ObjectId(id)
        const userId=req.session.user.id
        if(!wishlistId){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"wishlist item not provided"
            })
        }
      await wishlistModel.findOneAndDelete({
       _id: wishlistId,
       userId: req.session.user.id
       });
       return res.status(STATUS_CODES.OK).json({
        success:true,
        message:'Removed from wishlist'
       })

        
    } catch (error) {
        
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"indernal server error"
        })
    }
}


// ==============================
// GET CART PAGE
// ==============================
// Fetches cart items for the logged-in user
// Calculates subtotal and total cart items
const getCart=async(req,res)=>{
    try {
    const userId=new mongoose.Types.ObjectId(req.session.user.id)
    const products=await cartModel.find({userId:userId}).populate('variantId').populate({
        path:'productId',
        populate:{
            path:'catgId',
            model:'Category'
        }
    });
    let subtotal=0; 
    const cartItems=await cartModel.find({userId:userId}).populate('variantId').populate('productId');
     cartItems.forEach((item)=>{
         subtotal+=item.quantity*item.variantId.salePrice
     })
     const totalDocs=await cartModel.countDocuments({userId:userId})
    console.log('finished')
   
   res.render('./user/cart',{
    products,
    subtotal,
    totalDocs
   })
    } catch (error) {
        console.log(error.message)
    }
    
}

// ==============================
// ADD ITEM TO CART
// ==============================
// Adds selected variant to cart
// Prevents duplicates
// Removes item from wishlist if exists
const addCart=async(req,res)=>{
    try {
        const userId=new mongoose.Types.ObjectId(req.session.user.id)
        const {variantId,productId}=req.body
        const varinatID=new mongoose.Types.ObjectId(variantId);
        const productID=new mongoose.Types.ObjectId(productId)

        if(!userId){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"User not founded"
            })
        }
        if(!varinatID){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"variantId not provided"
            })
        }
        if(!productID){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"productId not provided"
            })
        }
        const existing=await cartModel.findOne({userId:userId._id,productId:productID,variantId:varinatID}).populate('variantId');
        if(existing){
            console.log('already exist ')
            return res.status(STATUS_CODES.CONFLICT).json({
                success:false,
                message:"already added to cart"
            })
        }else{

                 await cartModel.create({
                userId:userId._id,
                productId:productID,
                variantId:varinatID
            }) 
           await wishlistModel.deleteOne({userId:userId._id,productId:productID,variantId:varinatID})
           
            return res.status(STATUS_CODES.CREATED).json({
                success:true,
                message:"item added to cart"
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Indternal server Error !"
        })
    }
}


// ==============================
// UPDATE CART QUANTITY
// ==============================
// Increases or decreases quantity
// Enforces stock limit, listing status, category status
// Recalculates subtotal dynamically
const cartQuantityUpdate=async(req,res)=>{
   try {
    const cartId = req.params.id;
    const userId = req.session.user.id;
    const change = req.body.change;

    const cartItem = await cartModel
        .findById(cartId)
        .populate('variantId').populate({
        path:'productId',
        populate:{
            path:'catgId',
            model:'Category'
        }
    });
    if (!cartItem) {
        return res.status(404).json({
            success: false,
            message: "Cart item not found"
        });
    }
    

    const variant = cartItem.variantId;
    if (change===1) {
        if (cartItem.quantity >= variant.stock) {
            return res.status(403).json({
                success: false,
                message: " stock limit reached"
            });
        }
        if(cartItem.quantity >= 5){
             return res.status(403).json({
                success: false,
                message: "Order limit reached"
            });
        }
        if(!variant.isListed||cartItem.productId.isBlock||cartItem.productId.catgId.isActive===false){
            return res.status(STATUS_CODES.FORBIDDEN).json({
                success:false,
                message:"This product currently unavailable!"
            })

        }
        
        cartItem.quantity += 1;
       
    } else {
        if (cartItem.quantity>1) {
            if(!variant.isListed||cartItem.productId.isBlock||cartItem.productId.catgId.isActive===false){
            return res.status(STATUS_CODES.FORBIDDEN).json({
                success:false,
                message:"This product currently unavailable!"
            })

        }
            cartItem.quantity-= 1;
        }
    }
    await cartItem.save();
    const cartItems = await cartModel
        .find({ userId })
        .populate('variantId').populate('productId')
    let subtotal = 0;
    cartItems.forEach(item => {
        subtotal += item.quantity * item.variantId.salePrice;
    });

    
    return res.status(200).json({
        success: true,
        quantity: cartItem.quantity,
        totalAmountPerPrdct: cartItem.quantity * variant.salePrice,
        subtotal
    });


} catch (error) {
    console.error(error);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
}

}


// ==============================
// REMOVE ITEM FROM CART
// ==============================
// Deletes a cart item by cartId
// Ensures the item exists before deletion
const remCart=async(req,res)=>{
    try {
    const existing= await cartModel.findOne({_id:req.params.id})
    if(!existing){
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success:false,
            message:'user not founded'
        })
    }
    await cartModel.findByIdAndDelete(req.params.id)
    return res.status(STATUS_CODES.OK).json({
        success:true,
        message:"item deleted from cart."
    })
} catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success:false,
        message:"Internal sever Error"
    })
}
}


// ==============================
// GET CHECKOUT PAGE
// ==============================
// Handles both Cart checkout and Buy Now checkout
// Validates product availability before proceeding
const getCheckout=async(req,res)=>{
    let cartItems;
    let subtotal=0;
    const userId=new mongoose.Types.ObjectId(req.session.user.id)
    const {type,productId,variantId}=req.query;


  // ======================
  // CART CHECKOUT FLOW
  // ======================
    if(type!=='buyNow'){
        req.session.buyNow=false;
        console.log(type,variantId,userId)
        const cartItem=await cartModel.aggregate([{$match:{userId:userId}},
            {$lookup:{
                from:'products',
                localField:'productId',
                foreignField:'_id',
                as:"product"
            }},
            {$unwind:'$product'},
            {$lookup:{
                from:'variants',
                localField:'variantId',
                foreignField:'_id',
                as:'variant'
            }},
            {$addFields:{
                mainImage:{
                  $first:{
                      $filter:{
                          input:"$product.productImages",
                          as:'img',
                          cond:"$$img.isMain"
                      }
                  }  
                }
            }},
            {$unwind:"$variant"},
            {$project:{
                "variant.stock":1,
                "product.isBlock":1,
                "variant.isListed":1,
                quantity:1,
                "product.name":1,
                "variant.deviceModel":1,
                "variant.salePrice":1,
                "mainImage.url":1
    
            }}
    
        ])
        for(let item of cartItem){
            if(item.variant.isListed!==true){
               return res.redirect('/cart')
            }
            if(item.product.isBlock!==false){
               return res,redirect('/cart');
            }
            if(item.variant.stock<1){
               return res.redirect('/cart')
            }
        }
       
        cartItem.forEach((item)=>{
            subtotal+= item.quantity*item.variant.salePrice
        })
        cartItems=cartItem;
        if(cartItem.length===0){
            return res.status(STATUS_CODES.FORBIDDEN)
        }

          // ======================
  // BUY NOW FLOW
  // ======================
    }else{
        req.session.variantId=variantId
        req.session.buyNow=true
        console.log('entered')
        const result=await variantModel.aggregate([{$match:{_id:new mongoose.Types.ObjectId(variantId)}},
            {$lookup:{
                from:"products",
                localField:"productId",
                foreignField:"_id",
                as:"product"
            }},
            {$unwind:"$product"},
            {$addFields:{
                quantity:1,
                mainImage:{
                  $first:{
                      $filter:{
                          input:"$product.productImages",
                          as:'img',
                          cond:"$$img.isMain"
                      }
                  }  
                }
            }},
            {$project:{
                quantity:1,
                stock:1,
                "product.name":1,
                deviceModel:1,
                salePrice:1,
                "mainImage.url":1


            }}
        ])
        cartItems = result;
         if (!cartItems.length) {
           return res.status(STATUS_CODES.NOT_FOUND).send("Variant not found");
         }
         
        cartItems=result;
        subtotal += cartItems[0].quantity * cartItems[0].salePrice;
        console.log(result)
        }
        const addresses=await addressModel.find()
    res.render('./user/checkout',{
        addresses,
        cartItems,
        subtotal
    })
}

// ==============================
// GET ADDRESS MANAGEMENT
// ==============================
// Lists all saved addresses of the logged-in user
const getAddressMngmnt=async(req,res)=>{
    const userID=new mongoose.Types.ObjectId(req.session.user.id)
    const addresses=await addressModel.aggregate([{$match:{userId:userID}}]);
    res.render('./user/user-address-management',{
        addresses
    })
}

// ==============================
// ADD NEW ADDRESS
// ==============================
// Prevents duplicate addresses
const addAddress=async(req,res)=>{
    try {
        
        const {firstName,lastName,phone,streetAddress,landmark,city,state,pincode,addressType,isDefault}=req.body.data;
        const userId=req.session.user.id;
        console.log(firstName,lastName,phone,streetAddress,landmark,city,state,pincode,addressType,isDefault)
        const existing=await addressModel.findOne({userId:userId,streetAddress:streetAddress,pinCode:pincode,city:city})
        if(existing){
            console.log('existing ')
            return res.status(STATUS_CODES.CONFLICT).json({
                success:false,
                message:"Address already exists"
            })
        }
        console.log("not existing")
            await addressModel.create({
            userId,
            firstName,
            lastName,
            phone,
            streetAddress,
            landMark:landmark,
            pinCode:pincode,
            city,
            state,
            addressType,
            isDefault
    
        })

        return res.status(STATUS_CODES.CREATED).json({
            success:true,
            message:"address saved "
        })
    } catch (error) {
        console.log(error)
    }
}


// ==============================
// GET EDIT ADDRESS PAGE
// ==============================
const geteditAddress=async(req,res)=>{
    const addressId=req.params.id;
    delete req.session.adrsId
    req.session.adrsId=addressId
    const userID=new mongoose.Types.ObjectId(req.session.user.id);
    const address=await addressModel.findOne({userId:userID,_id:addressId})
    res.render('./user/edit-address',{
        address
    })
}

// ==============================
// UPDATE ADDRESS
// ==============================
// Updates only changed fields dynamically
const editAddress=async(req,res)=>{
    try {
       
        const addressId=req.session.adrsId;
        const userId=req.session.user.id
        const address= await addressModel.findOne({_id:addressId,userId:userId});
        let isChanged=false;
       for(let key in req.body.data){
        console.log(`${address[key]}===${req.body.data[key]}`)
        if(req.body.data[key]!==undefined&&String(address[key]) !== String(req.body.data[key])){
            address[key]=req.body.data[key];
            isChanged=true
        }
    }
    if(!isChanged){
        return res.status(STATUS_CODES.OK).json({
            success:false,
            message:"data not updated!"
        })
    }
    await address.save()
    return res.status(STATUS_CODES.OK).json({
        success:true,
        message:'address updated!'
    })
        
    } catch (error) {
        console.log(error)
    }
}

// ==============================
//get ADDRESS
// ==============================
const getAddAddress=async(req,res)=>{
    console.log('add page')
    res.render('./user/add-address')
}

// ==============================
// DELETE ADDRESS
// ==============================
const deleteAddress=async(req,res)=>{
    try {
        const addressId=new mongoose.Types.ObjectId(req.params.id)
        if(!addressId){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"address not provided"
            })
        }
        await addressModel.deleteOne({_id:addressId,userId:req.session.user.id})
        return res.status(STATUS_CODES.OK).json({
            success:true,
            message:"address deleted"
        })
        
        
    } catch (error) {
        console.log(error)
    }
}

// ==============================
// ORDER CONFIRMATION PAGE
// ==============================
// Shows order details after successful checkout
const getConfirmation=async(req,res)=>{ 

    const userId=req.session.user.id
        const orderId=req.params.id;
        const order=await orderModel.findOne({_id:orderId}).populate('orderItems.productId').populate('orderItems.variantId');

     res.render('./user/ord-confirmation',{
        order

     })
}

// ==============================
// PLACE ORDER (FINAL CONFIRMATION)
// ==============================
// Handles order placement for:
// 1. Cart checkout
// 2. Buy Now checkout
// Performs full validation before creating order
const ordConfirmation=async(req,res)=>{
 try {
   let items=[] 
  let shippingAddress;
  const userId= new mongoose.Types.ObjectId(req.session.user.id);
  const data=req.body.data;

  // ==============================
// SHIPPING ADDRESS HANDLING
// ==============================
  if (data.address?.addressId) {
      // Use saved address
    const addressId = new mongoose.Types.ObjectId(data.address.addressId);
    const savedAddress= await addressModel.findById(addressId);
    if (!savedAddress) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Address not found"
      });
    }
    shippingAddress = {
      addressType: savedAddress.addressType,
      firstName: savedAddress.firstName,
      lastName: savedAddress.lastName,
      phone: savedAddress.phone,
      streetAddress: savedAddress.streetAddress,
      landMark: savedAddress.landMark,
      city: savedAddress.city,
      state: savedAddress.state,
      pinCode: savedAddress.pinCode
    };
  } else {
     // Manual address entry
    const {
      firstName,
      lastName,
      phone,
      streetAddress,
      landMark,
      city,
      state,
      pinCode
    } = data.address ;

    shippingAddress = {
      addressType: "manual",
      firstName,
      lastName,
      phone,
      streetAddress,
      landMark,
      city,
      state,
      pinCode
    };
  }

  const paymentMethod = data.paymentMethod;

  if (!["cod", "wallet", "razorpay"].includes(paymentMethod)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: "Invalid payment method"
    });
  }
  
 if(req.session.buyNow){
    items = await variantModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.session.variantId),
        isListed: true,
        stock: { $gt: 0 }
      }
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $addFields: {
        quantity: 1
      }
    }
  ]);
  console.log(items)
  if(items.length===0){
    return res.status(STATUS_CODES.NOT_FOUND).json({
        success:false,
        message:"variant not founded!"
    })
  }
  const item = items[0];

if (!item) {
  return res.status(404).json({
    success: false,
    message: "Item no longer available",
    redirect: "/products"
  });
}

if (!item.product) {
  return res.status(404).json({
    success: false,
    message: "Product removed",
    redirect: "/products"
  });
}

if (!item._id) {
  return res.status(404).json({
    success: false,
    message: "Variant removed",
    redirect: "/products"
  });
}

if (item.product.isBlock === true) {
  return res.status(403).json({
    success: false,
    message: "Product is currently unavailable",
    redirect: "/products"
  });
}

if (item.isListed === false) {
  return res.status(403).json({
    success: false,
    message: "Variant is unavailable",
    redirect: "/products"
  });
}

if (item.stock < 1) {
  return res.status(409).json({
    success: false,
    message: "Insufficient stock",
    redirect: "/products"
  });
}


if (item.product.catgId?.isActive === false) {
  return res.status(403).json({
    success: false,
    message: "Category is inactive",
    redirect: "/products"
  });
}

 }else{
    const result = await cartModel.aggregate([
    { $match: { userId } },

    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
        $lookup:{
            from:"categories",
            localField:"product.catgId",
            foreignField:"_id",
            as:"category"
        }
    },
    {$unwind:"$category"},

    {
      $lookup: {
        from: "variants",
        localField: "variantId",
        foreignField: "_id",
        as: "variant"
      }
    },
    { $unwind: "$variant" },
    {
      $project: {
        productId: 1,
        variantId: 1,
        quantity: 1,
        "variant.salePrice": 1,
        "product.isBlock": 1,
        "variant.isListed": 1,
        "variant.stock": 1,
        "category.isActive":1
      }
    }
  ]);
  items=result
for(let item of items){
    console.log('i am here ')
   if(item.product.isBlock||item.variant.isListed!==true||item.variant.stock<1||item.category.isActive===false){
    return res.status(STATUS_CODES.FORBIDDEN).json({
        success:false,
        redirect:"/cart"
        
    })
   }
}
  if (!items.length) {
    
     console.log('entered1')
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: "Cart is empty or items unavailable"
    });
  }
 }
  
let subtotal = 0;

items.forEach(item => {
  const price = item.salePrice || item.variant.salePrice;
  subtotal += item.quantity * price;
});


  const discount = 0;
  const finalAmount = subtotal - discount;
const orderItems = items.map(i => {
  const unitPrice = i.salePrice || i.variant.salePrice;

  return {
  productId: i.productId || i.product._id,
  variantId: i.variantId || i._id,
  quantity: i.quantity,
   price: unitPrice,  
  status: "processing",
  paymentStatus: paymentMethod === "cod" ?"pending": "initiated",
  processingAt: new Date()
  };
});

  const order = await orderModel.create({
    userId,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ?"pending": "initiated",
    shippingAddress,
    totalPrice: subtotal,
    discount,
    finalAmount,
    orderItems
  });
  for (const item of items) {
  const variantId = item.variantId || item._id;
  const quantity = item.quantity;

  const result = await variantModel.updateOne(
    {
      _id: variantId,
      stock: { $gte: quantity }
    },
    {
      $inc: { stock: -quantity }
    }
  );

  if (result.modifiedCount === 0) {
    throw new Error("Insufficient stock for a product");
  }
}


  await cartModel.deleteMany({ userId });
    console.log('low')
  return res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Order placed successfully",
    orderId: order._id
  });

} catch (error) {
    console.log('error is here ')
  console.error(error);
  return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Internal server error"
  });
}

}

// ==============================
// GET USER ORDERS (ORDER HISTORY)
// ==============================
// Fetches user orders with:
// - Pagination
// - Status filtering
// - Product & variant details
const getOrder=async(req,res)=>{
    const userId=new mongoose.Types.ObjectId(req.session.user.id)
    const currentPage=parseInt(req.query.page)||1
    const status=req.query.status
    const limit=4;
    const skip =(currentPage-1)*limit

const result = await orderModel.aggregate([
    {$match:{userId:userId}},
    {$sort:{createdAt:-1}},
    {$facet:{
        data:[
            {$unwind:"$orderItems"},
            {$skip:skip},
            {$limit:limit}
            ,
            {$lookup:{
                from:"products",
                localField:"orderItems.productId",
                foreignField:"_id",
                as:"product"
            }},
            {$unwind:"$product"},
            ...(status?[{$match:{"orderItems.status":status}}]:[]),
            {$lookup:{
                from:"variants",
                localField:"orderItems.variantId",
                foreignField:"_id",
                as:"variant"
            }},
            {$unwind:"$variant"}
        ],
        totalCount:[
            {$unwind:'$orderItems'},
            {$count:"count"}
        ]
    }},

]);
const orders=result[0].data
const totalItems=result[0].totalCount[0]?.count||0;
const  totalPages=Math.ceil(totalItems/limit)
res.render("./user/order-history", { 
        orders,
        totalPages,
        currentPage,
        totalItems,
        status
 });

}


// ==============================
// CANCEL ORDER ITEM
// ==============================
// Cancels a specific order item (not entire order)
const orderCancel=async(req,res)=>{
    try {
        const orderItemId=new mongoose.Types.ObjectId(req.params.id);
        console.log(orderItemId)
        const {orderId,reason}=req.body
        const orderID=new mongoose.Types.ObjectId(orderId);
        console.log(reason)
        const order=await orderModel.findOne({_id:orderID},{orderItems:{$elemMatch:{_id:orderItemId}}})
        if(!order){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:'Order not founded'
            })
        }
       let cor= await orderModel.updateOne({_id:orderID,"orderItems._id":orderItemId},
            {$set:{
                "orderItems.$.status":"cancelled",
                "orderItems.$.cancelledAt":new Date(),
                "orderItems.$.cancellationReason":reason

            }}
        )
        return res.status(STATUS_CODES.CREATED).json({
            success:true,
            message:`${orderId} order cancelled`
        })
    } catch (error) {
        
    }
}

// ==============================
// GENERATE INVOICE
// ==============================
// Fetches invoice details for a specific order item
const invoice=async(req,res)=>{
    const orderItemsId=new mongoose.Types.ObjectId(req.params.id);
    const order_id= req.query.odrId
    const order = await orderModel.aggregate([
  {
    $match: { _id: new mongoose.Types.ObjectId(order_id) }
  },
  {
    $unwind:"$orderItems"
  },
  {
    $match:{
        "orderItems._id":orderItemsId
    }
  },
  {
    $lookup:{
        from:"variants",
        localField:"orderItems.variantId",
        foreignField:"_id",
        as:"variant"
    }
  },
  {
    $unwind:"$variant"
  },
  {
    $lookup:{
        from:'products',
        localField:"orderItems.productId",
        foreignField:"_id",
        as:"product"
    }
  },{
    $unwind:"$product" 
  },
  {
    $project: {
      shippingAddress: 1,
      orderId: 1,
      paymentMethod: 1,
      paymentStatus: 1,
      totalPrice: 1,
      finalAmount: 1,
      createdAt: 1,
      orderItem:"$orderItems",
      variant:1,
      product:1
    }
  }
])
    res.render('./user/invoice',{
        order:order[0],
    });
}

// ==============================
// REQUEST RETURN
// ==============================
const returnReq=async(req,res)=>{
    try {
        const orderItemId=new mongoose.Types.ObjectId(req.params.id)
        const {orderId,reason}=req.body
        const existing=await orderModel.findOne({_id:new mongoose.Types.ObjectId(orderId),"orderItems._id":new mongoose.Types.ObjectId(orderItemId)})
        if(!existing){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"order not founded"
            })
        }
        const item=existing.orderItems.id(orderItemId)
        if(item.status!=='delivered'){   
            return res.status(STATUS_CODES.FORBIDDEN).json({
                success:false,
                message:"Return allowed only after delivery"
            })
        }
        item.status='return_req';
        item.returnReason=reason      
        item.returnedAt=new Date();
        await existing.save();
        return res.status(STATUS_CODES.CREATED).json({
            success:true,
            message:'return requasted.'
        })
        
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Internal server Error!."
        })
    }
}

// ==============================
// GET SECURITY PAGE
// ==============================
const getSecurity=(req,res)=>{
    res.render('./user/security')
}

// ==============================
// RESET PASSWORD
// ==============================
const resetPass=async(req,res)=>{
const {currentPassword,newPassword}=req.body
const userId=new mongoose.Types.ObjectId(req.session.user.id);
try {
    const User=await user.findOne({_id:userId});
    if(!User){
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success:false,
            message:"user not found"
        })
    }

    const isMatch=await bcrypt.compare(currentPassword,User.password);
    if(!isMatch){
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success:false,
            message:"Current Password not Match"
        })
    }
    const salt_round=Number(process.env.SALT_ROUND)
    const hashedPassword= await bcrypt.hash(newPassword,salt_round)
    User.password=hashedPassword;;
    await User.save()
    return res.status(STATUS_CODES.OK).json({
        success:false,
        message:"Password Updated."
    })      
    
} catch (error) {
    return status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success:false,
        message:"Internal server Error!"
    })
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
    getHome,
    register,
    OtpVerify,
    logOut,
    getProduct,
    getDetialProduct,
    getUserProfil,
    editProfileInfo,
    editProfileImg,
    getSecurity,
    resetPass,
    getWishlist,
    postWishlist,
    remWishlist,
    getCart,
    addCart,
    cartQuantityUpdate,
    getVariantData,
    remCart,
    getCheckout,
    getAddressMngmnt,
    getAddAddress,
    geteditAddress,
    addAddress,
    editAddress,
    deleteAddress,
    getConfirmation,
    ordConfirmation,
    getOrder,
    orderCancel,
    returnReq,
    invoice

};
