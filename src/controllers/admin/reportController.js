import { STATUS_CODES } from "../../utils/statusCodes.js"
const getReport=async(req,res)=>{
    try {
        return res.status(STATUS_CODES.OK).render('./admin/sale-report')
    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:'Internal server error!'
        })
    }
}

export default {
    getReport
}