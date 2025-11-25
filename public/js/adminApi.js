import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.7/+esm";

const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
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
export default {
    addCategoryAxios,
    blockCategoryAxios,
    editCategoryAxios,
    blockCustomerAxios
}