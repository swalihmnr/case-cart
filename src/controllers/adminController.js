import adminModel from '../models/admin/adminModel.js'
import Category from '../models/admin/categoryModel.js';
import productModel from '../models/admin/productModel.js';
import user from '../models/userModel.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import variantModel from '../models/admin/variantModel.js';
import { uploadBufferTocloudnery } from '../utils/cloudneryUpload.js';
import orderModel from '../models/orderModel.js';
import { STATUS_CODES } from '../utils/statusCodes.js';
import flowChecker from '../utils/order-flow-checker.js'


// Render admin login page
// Used to show login UI for admin
const getLogin=(req,res)=>{
    res.render('./admin/adminLogin')
}

// Logout admin safely
 const adminLogout = (req, res) => {
  try {
    req.session.admin = null;  
    return res.redirect("/admin/login");
  } catch (error) {
    console.error(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Handle admin login
// 1. Check admin exists by email
// 2. Compare password using bcrypt
// 3. Store admin data in session on success
const postLogin=async(req,res)=>{
const {Email,Password}=req.body
let existing= await adminModel.findOne({email:Email})
if(!existing){
    res.json({success:false,message:"it is not admin"})
}else{
    let isValidPass=await bcrypt.compare(Password,existing.password);
    if(isValidPass){
        
        req.session.admin={
            id:existing._id,
            email:existing.email
        }
        res.json({
            success:true,
            message:'admin logged'
        })
    }else{
         res.json({
            success:false,
            message:'incorrect password'
        })
    }
}


}

// Render admin dashboard page
const getDashboard=(req,res)=>{
    res.render('./admin/admin-dashboard')
}

// Fetch customers with:
// - Pagination
// - Search
// - Active / Blocked filter
// - Monthly joined users count
const getCustomer=async(req,res)=>{
    const page=parseInt(req.query.page)||1;
    const search=(req.query.search)||""
    const selectionFilter=(req.query.filter)||"all"
    console.log(search)
    let searchFilter={};
    if(search!==""){
        searchFilter={
            $or:[
                {firstName:{$regex:search,$options:"i"}},
                {lastName:{$regex:search,$options:"i"}},
                {email:{$regex:search,$options:"i"}},
                {number:{$regex:search,$options:"i"}}
            ]
        }
    }
    if(selectionFilter==="active"){
        searchFilter.isBlock=false
    }if(selectionFilter==="blocked"){
        searchFilter.isBlock=true
    }if(selectionFilter==="all"){
        
    }
    searchFilter.isVerified=true
    // for take this month joinee
     const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const thisMonth = await user.find({
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth,
            }
        }).countDocuments()

    let limit=4;
    let skip=(page-1)*limit
    let currentPage=page;
    const totalBlockCount=await user.find({isBlock:true}).countDocuments()
    const totalActiveCount=await user.find({isBlock:false}).countDocuments()
    const totalCustomers=await user.find().countDocuments()
    const customers=await user.find(searchFilter).skip(skip).limit(limit);
    const totalItems=await user.find(searchFilter).countDocuments()
    const totalPages=Math.ceil(totalItems/limit)
    res.status(200).render('./admin/admin-customer',{customers,
        currentPage,
        totalItems,
        totalPages, 
        skip,
        limit,
        search,
        totalBlockCount,
        totalActiveCount,
        thisMonth,
        totalCustomers,
        selectionFilter
    
    })
}

// Block or unblock a customer
// Toggle isBlock status
const blockCustomer=async(req,res)=>{
    try {
        let id=req.params.id
        const objectId=new mongoose.Types.ObjectId(id);
        const exsitng=await user.findOne({_id:objectId});
        if(exsitng){
            if(exsitng.isBlock){
                exsitng.isBlock=false
                await exsitng.save()
                return res.status(200).json({
                    success:"unblocked ",
                    status:false
                    
                })
            }else{
                exsitng.isBlock=true
                await exsitng.save();
                return res.status(200).json({
                    success:"Blocked ",
                    status:true

                })
            }
        }else{
            return res.status(404).json({
                success:false,
                message:"Not Founded"
            })
        }
    
    } catch (error) {
        
    }
}

// List categories with pagination and search
const getCategory=async(req,res)=>{
    const search=(req.query.search)||""
    const page=parseInt(req.query.page)||1;
    let searchFilter={}
    if(search!==""){
        searchFilter={
            $or:[
                {name:{$regex:search,$options:"i"}},
                {description:{$regex:search,$options:"i"}}
            ]
        }
    }
    
    const limit=9
    const skip=(page-1)*limit;

    const categories=await Category.find(searchFilter).skip(skip).limit(limit).lean()
    const totalItems=await Category.find(searchFilter).countDocuments()
    const totalPages=Math.ceil(totalItems/limit)
    let currentPage=page
    res.render('./admin/category-list',{categories,
        totalItems,
        totalPages,
        skip,
        page,
        limit,
        currentPage,
        search
    })
}

// Create new category
// Prevent duplicate category names
const postCategory=async(req,res)=>{
    res.render('./admin/list-category')
}

//Render add category
const getAddCategory=(req,res)=>{
    res.render('./admin/add-category')
}

// ==============================
// ADD CATEGORY (POST)
// ==============================
// Creates a new category
// - Prevents duplicate category names
// - Supports "Save" and "Save & Add Another" actions
const postAddCategory=async(req,res)=>{
try{

    const {categoryName,categoryDescription,action}=req.body
  let existing= await Category.findOne({name:categoryName});
  if(!existing){

      let newCategory=new Category({
          name:categoryName,
          isActive:true,
          description:categoryDescription
      })  
      console.log("category saved")
       await newCategory.save()
       
       if(action==='save'){   
         return  res.status(200).json({
              success:true,
              message:"Category saved...",
              redirectUrl:'/admin/category'
  
          })
       }else{
        return   res.status(200).json({
              success:true,
              message:"Category saved...",
              redirectUrl:'/admin/add-category'
  
          })
       }

  }else{
    console.log('category already exists')
   return res.status(409).json({
        success:false,
        message:"category already exists"
    })
  }
}catch(err){
    console.log(err)
}

}

// ==============================
// BLOCK / UNBLOCK CATEGORY
// ==============================
// Toggles category active status
// Used to hide or show category in user side
const blockCategory=async(req,res)=>{
    try {
        console.log('hiilow')
        let id=req.params.id
       
        const objectId= new  mongoose.Types.ObjectId(id)
        const existing=await Category.findOne({_id:objectId})
        if(!existing){
            return  res.status(404).json({
                success:false,
                message:'Not Founded'
            })
        }else{
            console.log('testing')
            console.log(existing.isActive)
            if(existing.isActive){
                existing.isActive=false
                await existing.save()
            }else{
                existing.isActive=true;
                await existing.save()
            }
              console.log(existing.isActive)
            return res.status(200).json({
                success:true,
                message:`${existing.isActive?"block":"unblock"}`,
               

            })
        }
    } catch (error) {
        console.log(error)
    }
}

// ==============================
// GET EDIT CATEGORY PAGE
// ==============================
// Fetch category by ID and render edit page
const editCategory=async(req,res)=>{
     let id=req.params.id
    const objectId= new  mongoose.Types.ObjectId(id)
     let category=await Category.findOne({_id:objectId})
    res.render('admin/admin-edit-category',{category})
}

// ==============================
// UPDATE CATEGORY
// ==============================
// - Prevents duplicate names
// - Avoids unnecessary updates
const postEditCategory=async(req,res)=>{
    
    try {
        console.log(req.body)
        const {categoryName,categoryDescription}=req.body
        let id=req.params.id
        console.log(id)
        const existing=await Category.findOne({_id:id})
        if(existing){
            const isDuplecate=await Category.findOne({_id:{$ne:id},name:categoryName})
            if(isDuplecate){
                return res.status(409).json({
                    success:false,
                    message:"it's name already exist"
                })
            }else{
            if(existing.name===categoryName&& existing.description===categoryDescription){
                return res.status(304).json({
                    success:false,
                    message:"not detected"
                })
            }
            const updated=await Category.findByIdAndUpdate(id,{
                name:categoryName,
                description:categoryDescription
            },{
                new:true
            })
            return res.status(200).json({
                success:true,
                message:"updated successfully",
                redirectUrl:'/admin/category'
            })
            
            }
        }else{
            return res.status(404).json({
                success:false,
                message:"User not founded",
            })
        }

    } catch (error) {
        
    }
}

// ==============================
// PRODUCT LIST WITH FILTER & SEARCH
// ==============================
// - Pagination
// - Category filter
// - Search by product name
const getProductList=async(req,res)=>{
  const limit = 6;
const filter = (req.query.filter || "Select Category").trim();
const search = (req.query.search || "").trim();

const page = parseInt(req.query.page) || 1;

let searchFilter = {};

if (search !== "") {
    searchFilter.name = { $regex: search, $options: "i" };
}

if (filter !== "Select Category") {
    const category = await Category.findOne({ name: filter });

    if (category) {
        searchFilter.catgId = category._id;
    }
}

    const currentPage=page
    const totalItems= await productModel.find(searchFilter).countDocuments()
    const products= await productModel.find(searchFilter).populate('variants').populate('catgId').sort({createdAt:-1}).skip((page-1)*limit).limit(limit)
    console.log(page,"it page number")
    let totalStock;
   products.forEach(product => {
     totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
   
});

    const categories=await Category.find()
      const totalPages=Math.ceil(totalItems/limit)
    res.render('./admin/product-list',{
        products,
        categories,
        currentPage,
        totalPages,
        totalItems,
        search,
        selectionFilter:filter,
        totalStock
    })
}

// ==============================
// ADD PRODUCT PAGE
// ==============================
// Fetch categories and render product creation page
const getAddproduct=async(req,res)=>{
    const categories=await Category.find()
    res.render('./admin/add-product-&-variant',{
        categories
    })
}

// ==============================
// ADD PRODUCT WITH VARIANTS & IMAGES
// ==============================
// - Minimum 3 images validation
// - Upload images to Cloudinary
// - Create product & variants
const postAddproduct=async(req,res)=>{
   
try {
    if(req.files.length<3){
     return res.status(400).json({
            success:false,
            message:"upload minimum three images"
        })
    }else{
        const {productName,description,category,status,devices,mainImageIndex}=req.body
        const existing=await productModel.findOne({name:productName})
        if(!existing){
        const uploadResults = await Promise.all(
        req.files.map(file => uploadBufferTocloudnery(file.buffer))
        );
        const productImgUrls = uploadResults.map((upload, index) => ({
        url: upload.secure_url,
        publicId: upload.public_id,
        isMain: Number(mainImageIndex) === index,
    }));

    
    const newProduct=await productModel.create({
        name:productName,
        description:description,
        productStatus:status==="active"?true:false,
        catgId: new mongoose.Types.ObjectId(category),
        productImages:productImgUrls
        
    })
    const parsedDevices=JSON.parse(devices);
        const variants = await variantModel.insertMany(
            parsedDevices.map(v => ({
                productId:newProduct._id,
                deviceModel: v.name,
                orgPrice: v.originalPrice,
                salePrice: v.salePrice,
                stock: v.stock,
                discount: v.discount
                
            }))
        );
        newProduct.variants=variants.map((v)=>{
            return v._id
        })
        await newProduct.save()
     
      
        
    return  res.status(200).json({
           success:true,
           message:"Product uploading  Successfully",
           redirectUrl:"/admin/product-list",
            data:newProduct
    })
   }else{
    console.log('already exist')
    return res.status(409).json({
        success:false,
        message:"Product already existing"

    })
   }  
   }
} catch (error) {
    console.log(error)
}
   
}

// ==============================
// GET PRODUCT EDIT PAGE
// ==============================
// Fetch product details along with category & variants
// Used to render edit-product page
const getProductEdit=async(req,res)=>{
    const id=req.params.id;
    const objectId= new mongoose.Types.ObjectId(id)
    const product=await productModel.findOne({_id:objectId}).populate('catgId').populate('variants') ;
    const categories=await Category.find()
    res.render('./admin/edit-product',{
        product,
        categories
    })
}

// ==============================
// BLOCK / UNBLOCK PRODUCT
// ==============================
// Toggles product visibility
// Used to hide or show product in user side
const blockProduct=async(req,res)=>{
    try {
        let id=req.params.id
       
        const objectId= new  mongoose.Types.ObjectId(id)
        const existing=await productModel.findOne({_id:objectId})
        if(!existing){
            return  res.status(404).json({
                success:false,
                message:'Not Founded'
            })
        }else{
            console.log(existing.isBlock)
            if(existing.isBlock){
                existing.isBlock=false
                await existing.save()
            }else{
                existing.isBlock=true;
                await existing.save()
            }
              console.log(existing.isBlock)
            return res.status(200).json({
                success:true,
                message:`${existing.isBlock?"block":"unblock"}`,
               

            })
        }
    } catch (error) {
        console.log(error)
    }
}

// ==============================
// ADD PRODUCT IMAGE
// ==============================
// Upload additional product images (max limit: 5)
// Image stored in Cloudinary
const productImageUpload=async(req,res)=>{
    try {
        const id=req.params.id
        const objectId=new mongoose.Types.ObjectId(id);
        const existing=await productModel.findById(objectId);
        if(!existing){
            return res.status(404).json({
                success:false,
                message:"product not exists"
            })
        }
        if(!req.file){
            return res.status(400).json({
                success:false,
                message:"Image not selected"
            })
        }
        if(existing.productImages.length<5){
            const cloudUrl= await uploadBufferTocloudnery(req.file.buffer);
            existing.productImages.push({
                url:cloudUrl.secure_url,
                publicId:cloudUrl.public_id,
                isMain:false
    
            })
            await existing.save()
            return res.status(200).json({
                success:true,
                message:"Image added"
            })

        }else{
            return res.status(429).json({
            success: false,
            message: "Upload limit reached. Try again later."
        });

        }
    } catch (error) {
        console.log(error)
    }
}


// ==============================
// EDIT PRODUCT IMAGE
// ==============================
// Replace an existing product image
const productImageEdit=async(req,res)=>{
   try {
    const {imageId}=req.body
     const productId=req.params.id
    const objectId=new mongoose.Types.ObjectId(productId)
    const existing = await productModel.findOne({_id:objectId});
    if(!existing){
        return res.status(404).json({
            success:false,
            message:"product not exists"

        })
    }
    const index=existing.productImages.findIndex((img)=>{
        return img._id==imageId
    })
    if(index===-1){
        return res.send(404).json({
            success:false,
            message:"image not founded "
        })

    }

    if(!req.file){
        return res.status(400).json({
            success:false,
            message:"no image selected "
        })
    }
    const cloudUrl=await uploadBufferTocloudnery(req.file.buffer)
    existing.productImages[index].url=cloudUrl.secure_url;
    await existing.save()
    return res.status(200).json({
        success:true,
        message:"Product Image updated"
    })
   
   } catch (error) {
    console.log(error)
   }
}

// ==============================
// SET MAIN PRODUCT IMAGE
// ==============================
// Marks selected image as main image
// Only one main image allowed
const imgSetMain=async(req,res)=>{
    try {
        const proudctId=req.params.id
        const objectId=new mongoose.Types.ObjectId(proudctId);
        const {imgIndx}=req.body
        const existing=await productModel.findOne({_id:objectId});
        if(!existing){
            return res.status(404).json({
                success:false,
                message:"product not exists"
            })
        }
      for(let i=0;i<existing.productImages.length;i++){
        if(i===Number(imgIndx)-1){
            if(existing.productImages[i].isMain!==true){
                const existMainRemove=existing.productImages.findIndex((img)=>img.isMain===true)
                existing.productImages[existMainRemove].isMain=false
                existing.productImages[i].isMain=true
                await existing.save();
                return res.status(200).json({
                    success:true,
                    message:"successfully setmain"
                })
            }else{
               return res.status(208).json({
                success:false,
                message:"it's already done ,no change"
               })
            }
        }
      }

        
    } catch (error) {
        error
    }
}

// ==============================
// DELETE PRODUCT IMAGE
// ==============================
// Deletes image except main image
const  editImgDelete=async(req,res)=>{
    try {
        const Id=req.params.id
        const {id}=req.body;
        const objectId=new mongoose.Types.ObjectId(Id);
        const existing = await productModel.findOne({_id:objectId});
        if(!existing){
            return res.status(404).json({
                success:false,
                message:"product not exists"
            })    
        }
    const index=existing.productImages.findIndex((v)=>v._id.toString()===id)
    if(index===-1){
        return res.status(404).json({
            success:false,
            message:"Image not founded"
        })
    }
    if(existing.productImages[index].isMain!==true){
        existing.productImages.splice(index,1)
        await existing.save();
        return res.status(200).json({
            success:true,
            message:"Image deleted !"
        })

    }else{
        return res.status(403).json({
            success:false,
            message:"It's main you couldn't delete this Image"
        })
    }
        
    } catch (error) {
        
    }
}


// ==============================
// UPDATE PRODUCT BASIC INFO
// ==============================
// Update product name, category, and description
const editProductBasicInformation=async(req,res)=>{
    try {
        const id=req.params.id
        const productId=new mongoose.Types.ObjectId(id)
        const {productName,category,description}=req.body
        const categoryId=new mongoose.Types.ObjectId(category)
        const existing=await productModel.findById(productId);
        if(!existing){
            return res.status(404).json({
                success:false,
                message:"Product not exists"
            })
        }
        const result= await productModel.findByIdAndUpdate(productId,{
            name:productName,
            description:description,
            catgId:categoryId
        },{
            new:true
        })
        let flag=false;
        if(existing.name!==result.name){
            flag=true
        }
        if(existing.description!==result.description){
            flag=true
        }
        if(existing.catgId.toString()!==result.catgId.toString()){
            
            flag=true
        }
        if(flag){

            return res.status(200).json({
                success:true,
                message:"product info updated!"
            })
        }
          
    } catch (error) {
        console.log(error)
    }
}


// ==============================
// FETCH VARIANT DATA
// ==============================
// Used for editing variant via modal
const passVariantData=async(req,res)=>{
    try {
        const id=req.params.id
        console.log(id)
        const objectId=new mongoose.Types.ObjectId(id);
        const variant=await variantModel.findById(objectId)
        return res.status(STATUS_CODES.OK).json({
        success: true,
        variant
});
    } catch (error) {
        console.log(error)
    }
}


// ==============================
// UPDATE VARIANT DETAILS
// ==============================
// Validates price logic and updates variant
const postEditVariantSave=async(req,res)=>{
    try {
       const {deviceModel,stock,orgPrice,salePrice}=req.body;
       const id=req.params.id;
       const objectId=new mongoose.Types.ObjectId(id);
       const existing=await variantModel.findById(objectId);
       if(!existing){
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success:false,
            message:"variant not founded"
        })
       }
     if (+orgPrice < +salePrice) {
    return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than original price"
    });
}

       let result=await variantModel.findByIdAndUpdate(objectId,{
        deviceModel:deviceModel,
        stock:stock,
        orgPrice:orgPrice,
        salePrice:salePrice
       },{new:true})
       console.log(result)
       let isflag=false
       if(existing.deviceModel!==result.deviceModel){
        isflag=true
       }
       if(existing.stock!==result.stock){
        isflag=true
       }
        if(existing.orgPrice!==result.orgPrice){
        isflag=true
       }
        if(existing.salePrice!==result.salePrice){
        isflag=true
       }
       if(isflag){
        return res.status(STATUS_CODES.OK).json({
            success:true,
            message:'variant updated'
        })
       }


    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"server side error"
        })
    }
}

// ==============================
// LIST / UNLIST VARIANT
// ==============================
// Controls variant availability in user side
const patchListUnlist=async(req,res)=>{
   try {
     const id=req.params.id;
    const objectId=new mongoose.Types.ObjectId(id);
    const existing=await variantModel.findById(objectId);
    if(!existing){
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success:false,
            message:"veriant not founded"
        })
    }
    if(existing.isListed){
        existing.isListed=false
       await existing.save()
       return res.status(STATUS_CODES.OK).json({
        success:true,
        message:'Unlisted'
       })
    }else{
        existing.isListed=true
        await existing.save()
         return res.status(STATUS_CODES.OK).json({
        success:true,
        message:'listed'
       })
    }
   } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:'server down!'
        })
   }
}

// ==============================
// GET ORDER MANAGEMENT PAGE
// ==============================
// Fetch orders with:
// - Pagination
// - Search by Order ID
// - Filter by order item status
// Uses aggregation to flatten orderItems and join user, product & variant data
const getOrderMngmnt=async (req,res)=>{
    const limit=8;
    const page=parseInt(req.query.page)||1;
    const skip=(page-1)*limit
const search=(req.query.search)||""
const selectionFilter=(req.query.filter)||"all"
const filter = {};
if (search) {
  filter.orderId = { $regex: search, $options: "i" };
}

if (selectionFilter !== "all") {
  filter["orderItems.status"] = selectionFilter;
}

const result= await orderModel.aggregate([
    {$unwind:"$orderItems"},
    {$match:filter},
    { 
        $facet:{data:[
            {$sort:{createdAt:-1}},
        {$lookup:{
            from:"users",
            localField:"userId",
            foreignField:"_id",
            as:"user"
            
        }},
        {$unwind:"$user"},
    
        {$lookup:{
            from:"variants",
            localField:"orderItems.variantId",
            foreignField:"_id",
            as:"variant"
        }},
        {$unwind:"$variant"},
        {$lookup:{
            from:"products",
            localField:"orderItems.productId",
            foreignField:"_id",
            as:"product"
        }},
        {$unwind:"$product"},
        {$skip:skip},
        {$limit:limit}
    ],count:[
        {$count:"count"}
    ]}}
]);
const currentPage=page;
const orders=result[0].data
const totalItems = result[0].count[0]?.count || 0;
const totalPages=Math.ceil(totalItems/limit)
console.log(totalItems,totalPages)
    res.render('./admin/order-management',{
        orders,
        selectionFilter,
        currentPage,
        totalPages,
        totalItems,
        search
    })
}

// ==============================
// CHANGE ORDER ITEM STATUS
// ==============================
// Validates order status flow before updating
// Uses flowChecker to prevent invalid status jumps
const orderStatusChanger=async(req,res)=>{
    try {
        const {orderItemId,selectedValue}=req.body
        const orderId=new mongoose.Types.ObjectId(req.params.id);
        const orderItemID=new mongoose.Types.ObjectId(orderItemId)
        const crntDbStatus=await orderModel.findOne({_id:orderId,"orderItems._id":orderItemID},{'orderItems.$':1})
        const currentDbStatus=crntDbStatus.orderItems[0].status;
        console.log(flowChecker(currentDbStatus,selectedValue))
        if(!flowChecker(currentDbStatus,selectedValue)){
            console.log('you can not do that ')
           return res.status(STATUS_CODES.FORBIDDEN).json({
            success:false,
            message:`you had to follow the flow that's why you cann't jumb to ${selectedValue}`
           })
        }else{
            if(selectedValue==='delivered'){
                await orderModel.updateOne({_id:orderId,"orderItems._id":orderItemID},{
                    $set:{"orderItems.$.status":selectedValue,"orderItems.$.deliveredAt":new Date(),"orderItems.$.paymentStatus":"paid"}
                })
            }
             await orderModel.updateOne({_id:orderId,"orderItems._id":orderItemID},{
                    $set:{"orderItems.$.status":selectedValue}
                })

            console.log('status updated')
            return res.status(STATUS_CODES.OK).json({
                success:true,
                message:'status updated!'
            })
        }

       
    } catch (error) {
        console.log(error.message)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Internal server Error"
        })
    }
}

// ==============================
// APPROVE RETURN REQUEST
// ==============================
// Admin approves product return
// Order item status changed to "returned"
const reqApprove=async(req,res)=>{
    try {
        
        const orderId=new mongoose.Types.ObjectId(req.params.id);
        const {itemId}=req.body
        const ordItemId=new mongoose.Types.ObjectId(itemId)
        const existing=await orderModel.findOne({_id:orderId,'orderItems._id':ordItemId});
        if(!existing){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"Item not Founded"
            })
        }
        const item=existing.orderItems.id(itemId);
        item.status="returned"
        await existing.save()
        return res.status(STATUS_CODES.OK).json({
            success:true,
            message:"Returned Approved"
        })
        
    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Internal server Error!"
        })
    }
}


// ==============================
// REJECT RETURN REQUEST
// ==============================
// Admin rejects return request
// Status reverted to delivered and marked as rejected
const reqReject=async(req,res)=>{
    try {
        
        const orderId=new mongoose.Types.ObjectId(req.params.id);
        const {itemId}=req.body
        const ordItemId=new mongoose.Types.ObjectId(itemId)
        const existing=await orderModel.findOne({_id:orderId,'orderItems._id':ordItemId});
        if(!existing){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                message:"Item not Founded"
            })
        }
        const item=existing.orderItems.id(itemId);
        item.status="delivered"
        item.isReject=true
        await existing.save()
    return res.status(STATUS_CODES.CREATED).json({
        success:true,
        message:"Return Rejected!"
    })
    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Internal server Error!"
        })
    }
}

export default {
    getLogin,
    postLogin, 
    adminLogout,              
    getDashboard,
    getCustomer,
    blockCustomer,
    getAddCategory,
    postAddCategory,
    getCategory,
    postCategory,
    blockCategory,
    editCategory,
    postEditCategory,
    getProductList,
    getAddproduct,
    postAddproduct,
    getProductEdit,
    blockProduct,
    productImageEdit,
    imgSetMain,
    productImageUpload,
    editImgDelete,
    editProductBasicInformation,
    passVariantData,
    postEditVariantSave,
    patchListUnlist,
    getOrderMngmnt,
    orderStatusChanger,
    reqApprove,
    reqReject

}
