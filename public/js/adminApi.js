import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.7/+esm";

const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 20000,
  
}); 

const addCategoryAxios = async (data)=>{
    try {
     
       let res= await api.post('/admin/add-category',data)
      
       return res
      
    } catch (error) {
       return  error.response
    }
}
const blockCategoryAxios=async(data)=>{
  try {
   let res=await api.post(`/admin/category/block/${data}`);
   return  res
  } catch (err) {
    console.log(err)
  }
}
const editCategoryAxios=async(id,data)=>{
  let res=await api.post(`/admin/category/edit/${id}`,data)
  return res
}
const blockCustomerAxios=async(id)=>{
  console.log(id)
  let res =await api.patch(`/admin/customers/block/${id}`)
  return res;
}

const addProductAxios=async(formData)=>{

  let res=await api.post('/admin/add-product',formData  ); 
  
  return res
}
const blockProductyAxios=async(data)=>{
  try {
   let res=await api.post(`/admin/product/list/block/${data}`);
   return  res
  } catch (err) {
    console.log(err)
  }
}
const uploadImgProductAxios=async(id,formData)=>{
  
    let res=await api.post(`/admin/product/edit/${id}/img-upload`,formData,{
      headers:{'content-Type':"multipart/form-data"}
    })
    return res
}


const editImgProductAxios=async(formData,productId)=>{

  let res=await api.post(`/admin/product/${productId}/edit-image`,formData,{
    headers: { "Content-Type": "multipart/form-data" }
  })
  return res

}
const setMainAxios=async(id,imgIndx)=>{
  try {
    let res=await api.post(`/admin/product/edit/${id}/img-set-main`,{imgIndx})
    return res;
  } catch (error) {
    console.log(error)
  }
}
const editImgDeleteAxios=async(id,productId)=>{
  let res =await api.post(`/admin/product/edit/${productId}/img-delete`,{id})
  console.log(res)
  return res
}
const editProductBasicInfoAxios=async(data,productId)=>{
return await api.post(`/admin/product/edit/${productId}/basic-info`,data)

}

const variantDetialsAxios=async(data)=>{
  return await api.post(`/admin/product/edit/${data}/variant-data`);
}
const editVariantSaveAxios=async(id,data)=>{
  return await api.post(`/admin/product/edit/${id}/variant-save`,data)
}
const toggleListUnlistAxios=async(id)=>{
  return await api.patch(`/admin/product/edit/${id}/veriant-toggle`)
}
export default {
    addCategoryAxios,
    blockCategoryAxios,
    editCategoryAxios,
    blockCustomerAxios,
    addProductAxios,
    blockProductyAxios,
    editImgProductAxios,
    setMainAxios,
    uploadImgProductAxios,
    editImgDeleteAxios,
    editProductBasicInfoAxios,
    variantDetialsAxios,
    editVariantSaveAxios,
    toggleListUnlistAxios
} 