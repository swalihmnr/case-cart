import api from "../api.js";
 
const remWishlist=async(id)=>{
    try {
         const res=await api.remWishlistAxios(id)
        if(res.data.success){
          Swal.fire({
        icon: 'success',
        title: 'added to wishlist',
        text: res.data.message,
        confirmButtonColor: '#667eea'
      });
      setTimeout(() => {
          location.reload()
      }, 2000);
        }else{
             Swal.fire({
        icon: 'warning',
        title: 'something went wrong',
        text: res.data.message,
        confirmButtonColor: '#667eea'
      }); 
        }
    } catch (error) {
          Swal.fire({
        icon: 'error',
        title: 'something went wrong',
        text: error.response.data.message,
        confirmButtonColor: '#667eea'
      });
        console.log(error.response)
    }
   
}
window.remWishlist=remWishlist
