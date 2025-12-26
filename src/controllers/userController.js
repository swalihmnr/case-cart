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



let getLogin=(req,res)=>{
    req.session.isKey=false
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
        req.session.isKey=false
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
        const products = result[0].data;
        const totalItems = result[0].totalCount[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / limit);

        const categories = await Category.find();
         wishlistItems = await wishlistModel.find({ userId: req.session.user.id });
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
            wishlistItems
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
};



const getDetialProduct= async(req,res)=>{
    try {
        console.log('hlow')
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
const getVariantData=async(req,res)=>{
    try {
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
       const salePrice=variant.salePrice
       const orgPrice=variant.orgPrice
       return res.status(STATUS_CODES.OK).json({
        success:false,
        message:"success",
        salePrice,
        orgPrice
       })
       
    } catch (error) {
        
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
              existing.email=email;
              await existing.save()
              req.session.user.email=existing.email
             let result= await otpGeneratorTodb(existing._id,email);
             if(result){
                return res.status(STATUS_CODES.OK).json({
                    success:true,
                    otpVerify:true,
                    email:email,
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
const getWishlist=async(req,res)=>{
   const userId= req.session.user.id;
   console.log(userId)
   const userID=new mongoose.Types.ObjectId(userId)
    const products= await wishlistModel.find({userId:userID}).populate('variantId').populate('productId')
    res.render('./user/wishlist',{
        products
        
    })
}
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
        if (cartItem.quantity >= variant.stock || cartItem.quantity >= 5) {
            return res.status(403).json({
                success: false,
                message: "Order limit or stock limit reached"
            });
        }
        if(variant.isListed||cartItem.productId.isBlock||cartItem.productId.catgId.isActive===false){
            return res.status(STATUS_CODES.FORBIDDEN).json({
                success:false,
                message:"This product currently unavailable!"
            })

        }
        
        cartItem.quantity += 1;
       
    } else {
        if (cartItem.quantity>1) {
            if(variant.isListed||cartItem.productId.isBlock||cartItem.productId.catgId.isActive===false){
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
const getCheckout=async(req,res)=>{
    const userId=new mongoose.Types.ObjectId(req.session.user.id)
    const cartItems=await cartModel.aggregate([{$match:{userId:userId}},
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
        {$match:{"product.isBlock":false,
                "variant.isListed":false,
                "variant.stock":{$gt:0}
        }},
        {$project:{
            quantity:1,
            "product.name":1,
            "variant.deviceModel":1,
            "variant.salePrice":1,
            "mainImage.url":1

        }}

    ])
    let subtotal=0;
    cartItems.forEach((item)=>{
       subtotal+= item.quantity*item.variant.salePrice
    })
    console.log(cartItems)
    if(cartItems.length===0){
        return res.status(STATUS_CODES.FORBIDDEN)
    }
    const addresses=await addressModel.find()
    console.log('her reached')
    res.render('./user/checkout',{
        addresses,
        cartItems,
        subtotal
    })
}
const getAddressMngmnt=async(req,res)=>{
    const userID=new mongoose.Types.ObjectId(req.session.user.id)
    const addresses=await addressModel.aggregate([{$match:{userId:userID}}]);
    res.render('./user/user-address-management',{
        addresses
    })
}
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
        let resd=await addressModel.create({
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
const editAddress=async(req,res)=>{
    try {
       
        const addressId=req.session.adrsId;
        const userId=req.session.user.id
        const address= await addressModel.findOne({_id:addressId,userId:userId});
        let isChanged=false;
       for(let key in req.body.data){
        console.log(key)
        console.log(`${address[key]}===${req.body.data[key]}`)
        console.log(typeof address)
        console.log(typeof req.body.data)
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
const getAddAddress=async(req,res)=>{
    console.log('add page')
    res.render('./user/add-address')
}
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
const getConfirmation=async(req,res)=>{ 

    const userId=req.session.user.id
        const orderId=req.params.id;
        const order=await orderModel.findOne({_id:orderId}).populate('orderItems.productId').populate('orderItems.variantId');
     res.render('./user/ord-confirmation',{
        order

     })
}
const ordConfirmation=async(req,res)=>{
 try {
  let shippingAddress;
  const userId= new mongoose.Types.ObjectId(req.session.user.id);
  const data=req.body.data;
  if (data.address?.addressId) {
    const addressId = new mongoose.Types.ObjectId(data.address.addressId);
    const savedAddress= await addressModel.findById(addressId);
    if (!savedAddress) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Address not found"
      });
    }
    console.log(savedAddress.landMark,"it is the landMark")
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
 
  const cartItems = await cartModel.aggregate([
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
      $lookup: {
        from: "variants",
        localField: "variantId",
        foreignField: "_id",
        as: "variant"
      }
    },
    { $unwind: "$variant" },
    {
      $match: {
        "product.isBlock": false,
        "variant.isListed": false,
        "variant.stock": { $gt: 0 }
      }
    },

    {
      $project: {
        productId: 1,
        variantId: 1,
        quantity: 1,
        "variant.salePrice": 1
      }
    }
  ]);
console.log('it s the cartitems',cartItems)
  if (!cartItems.length) {
     console.log('entered1')
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: "Cart is empty or items unavailable"
    });
  }

  let subtotal = 0;
  cartItems.forEach(item => {
    subtotal += item.quantity * item.variant.salePrice;
  });

  const discount = 0;
  const finalAmount = subtotal - discount;

  const order = await orderModel.create({
    userId,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ?"pending": "initiated",
    shippingAddress,
    totalPrice: subtotal,
    discount,
    finalAmount,
    orderItems: cartItems.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.variant.salePrice,
      status: "processing",
      processingAt: new Date()
    }))
  });
  for (const item of cartItems) {
  const result = await variantModel.updateOne(
    {
      _id: item.variantId,
      stock: { $gte: item.quantity }   
    },
    {
      $inc: { stock: -item.quantity }  
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
  console.error(error);
  return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Internal server error"
  });
}

}
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
console.log(orders,totalPages,
    currentPage,
    totalItems
)
res.render("./user/order-history", { 
        orders,
        totalPages,
        currentPage,
        totalItems,
        status
 });

}

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
const invoice=async(req,res)=>{
    const orderItemsId=new mongoose.Types.ObjectId(req.params.id);
    console.log(req.query)
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

console.log(order,"it is working properly")
    res.render('./user/invoice',{
        order:order[0],
    });
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
    invoice

};