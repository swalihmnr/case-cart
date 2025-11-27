import {v2 as cloudnary} from 'cloudinary'
import env from 'dotenv'
env.config()
cloudnary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API,
    api_secret:process.env.CLOUD_SECRET_CODE
})
export default cloudnary;