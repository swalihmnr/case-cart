import adminModel from '../models/admin/adminModel.js'
import categoryModel from '../models/admin/categoryModel.js'
import bcrypt from 'bcrypt';


const getLogin=(req,res)=>{
    res.render('./admin/adminLogin')
}
const postLogin=async(req,res)=>{
const {Email,Password}=req.body
let existing= await adminModel.findOne({email:Email})
if(!existing){
    res.json({success:false,message:"it is not user"})
}else{
    let isValidPass=await bcrypt.compare(Password,existing.password);
    if(isValidPass){

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
const getDashboard=(req,res)=>{
    res.render('./admin/admin-dashboard')
}
const getCustomer=(req,res)=>{
    res.render('./admin/admin-customer')
}
const getCategory=(req,res)=>{
    res.render('./admin/category-list')
}
const postCategory=async(req,res)=>{
    res.render('./admin/list-category')
}
const getAddCategory=(req,res)=>{
    res.render('./admin/add-category')
}
const postAddCategory=async(req,res)=>{
    const {title,description}=req.body

}
const getAddproduct=async(req,res)=>{
    res.render('./admin/add-product-&-variant')
}
export default {
    getLogin,
    postLogin,
    getDashboard,
    getCustomer,
    getAddCategory,
    postAddCategory,
    getCategory,
    postCategory,
    getAddproduct
}
