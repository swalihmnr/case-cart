import cloudnary from "../config/cloudnary.js";
import streamifier from 'streamifier'
export const uploadBufferTocloudnery=(fileBuffer)=>{
    return new Promise((resolve,reject)=>{
        const stream=cloudnary.uploader.upload_stream({
            folder:"casecart/products",
            resource_type:"image"
        },(error,result)=>{
            if(error){
                reject(error)
            }else{
                resolve(result)
            }
        });
        streamifier.createReadStream(fileBuffer).pipe(stream)
    })
}