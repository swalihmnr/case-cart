import { STATUS_CODES } from "../../utils/statusCodes.js";
import coupenModel from "../../models/admin/coupenModel.js";

const verifyCoupon=async(req,res)=>{
    try {
        const {data}=req.body
        if(!data){
            console.log('not existing!')
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                messgae:"This code not existing !"
            })
        }
        let existing=await coupenModel.findOne({couponCode:data,status:"active"});
        console.log(existing)
        if(!existing){
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success:false,
                messgae:"coupon not founded!"
            })
        }
        return res.status(STATUS_CODES.OK).json({
            success:true,
            data:existing,
            message:"coupon verifeid"
        })
       
    } catch (error) {
        
    }
}


export default{
    verifyCoupon
}