import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.7/+esm";

const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------
// SIGNUP
// ---------------------------
 const userSignupAxios = async (data) => {
  try {
    const res = await api.post("/signup", data);

    if (res.data.success && res.data.redirectUrl) {
      // Save email globally for OTP
      sessionStorage.setItem("email", data.email);
      window.location.href = res.data.redirectUrl;
    }
    return res;
  } catch (err) {
    console.error("Signup error:", err);
    throw err;
  }
};

// ---------------------------
// OTP VERIFICATION
// ---------------------------
 const userOtpAxios = async (otp) => {
  try {
    const email = sessionStorage.getItem("email");
    console.log(email+'it is the email')
    if (!email) {
      throw new Error("Session expired. Email not found.");
    }

    const res = await api.post("/otpVerfication", {
      data: otp,
      userEmail: email,
    });

    console.log("OTP checking...");

    // RESET MODE (forget password)
    if (sessionStorage.getItem("Otpmod") === "reset") {
      const resetUrl = sessionStorage.getItem("resetUrl");

      if (resetUrl!==null) {
        sessionStorage.setItem("urlLoginPage", resetUrl);
      }
    } else {
      console.log('low')
      if (res.data.redirectUrl) {
        sessionStorage.setItem("urlLoginPage", res.data.redirectUrl);
      }
    }

    // Immediately remove reset flag (no race condition)
    sessionStorage.removeItem("Otpmod");

    return res;
  } catch (err) {
    console.error("OTP verify error:", err);
    throw err;
  }
};

// ---------------------------
// RESEND OTP
// ---------------------------
 const resendOtpAxios = async () => {
  try {
    const email = sessionStorage.getItem("email");
    if (!email) throw new Error("Cannot resend OTP. Email missing.");

    return await api.post("/resendOtpVerification", { userEmail: email });
  } catch (err) {
    console.error("Resend OTP error:", err);
    throw err;
  }
};

// ---------------------------
// LOGIN
// ---------------------------
const loginAxios = async (data) => {
  try {
    const res = await api.post("/login", data);
    console.log(res)
    return res;
    
  } catch (error) {
    console.log('here is the main problem right')
    return error.response
  }
 
};

// ---------------------------
// FORGOT PASSWORD
// ---------------------------
 const forgotPassAxios = async (data) => {
  try {
    const res = await api.post("/forgotPassword", data);

    if (data.email) {
      sessionStorage.setItem("email", data.email); // SAME KEY as OTP
    }

    if (res.data.success) {
      sessionStorage.setItem("Otpmod", "reset");
      if (res.data.successUrl) {
        sessionStorage.setItem("resetUrl", res.data.successUrl);
      }
    }

    return res;
  } catch (err) {
    console.error("Forgot password error:", err);
    throw err;
  }
};

///   ------------------------
///  RESET PASSWORD SUBMIT
///   ------------------------
 const resetPassAxios = async (data) => {
  try {
    const email = sessionStorage.getItem("email");
    if (!email) throw new Error("Session expired. Email missing.");

    let res=await api.post("/resetPassword", data);
    return res
  } catch (err) {
    console.error("Reset password error:", err);
    throw err;
  }
};
const admnLoginAxios=async(data)=>{
  try{
    
    return await api.post('/admin/login',data)
  }catch(err){

  }
}
const userProfileAxios=async(data)=>{
  try {
  let res = await api.post('/profile/info/edit',data);
  if(res.data.email){
     clearInterval(window.OtpTimer); 
  localStorage.removeItem('otpTimer');
  localStorage.removeItem('otpExpire');
  sessionStorage.setItem("email", res.data.email)
  sessionStorage.setItem("urlLoginPage", '/user-profile');
  }
  return res
  } catch (error) {
    return error.response
  }
}
const userProfileImgUplaoderAxios=async(file)=>{
  try {
    return await api.patch('/profile/edit/img',file,{
      headers:{'content-Type':"multipart/form-data"}
    })
  } catch (error) {
    return error.response
  }
}

const addWishlistAxios=async(productId,variant)=>{

    return await api.post('/product/wishlist/add',{
      productId,variant
    })
    
}
const remWishlistAxios=async(id)=>{
  try {
    return await api.delete(`/product/wishlist/${id}/rem`)
    
  } catch (error) {
    console.log(error.response+"Axios error");
    return error.response
  }
}
const productDetialAxios=async(productId,variantId)=>{
  try {
    return  await api.get(`/product/${productId}`)
  } catch (error) {
    return error.response
  }
}
const getVariantDataAxios=async(productId,variantId)=>{
    try {
      return  await api.post(`/product/${productId}/getVariant?variantId=${variantId}`);

    } catch (error) {
      return error.response
    }
}



const addToCartAxios=async(productId,variantId)=>{
  try {
  return await api.patch(`/cart/add`,{
      variantId,
      productId
    })
  } catch (error) {
    return error.response
  }
}
const quantityUpdateAxios=async(cartId,change)=>{
  try {
   return  await api.post(`/cart/quantity/${cartId}`,{
      change
    })
    
  } catch (error) {
    return error.response
  }
}
const removeFromCartAxios=async(productId,variantId)=>{
  return api.patch(`/product/cart/${productId}`)
}

const addAddressAxios=async(data)=>{
  try {
    return await api.post(`/address/add`,{
      data
    })
    
  } catch (error) {
    return error.response
  }
}
const editAddressAxios=async(data)=>{
  try {
    return await api.post(`/address/edit`,{
      data
    })
  } catch (error) {
    return error.response
  }
}
const deleteAddressAxios=async(addressId)=>{
  try {

    return api.patch(`/address/${addressId}/del`);
  } catch (error) {
    return error.response
  }
}
const confirmationAxios=async(data)=>{
  try {
    return await api.post(`/order/confirm`,{
      data
    })
    
  } catch (error) {
    
  }
}
const ordCancelAxios=async(data,orderItemId)=>{
  try {
    return await api.patch(`/order/${orderItemId}/cancel`,data)
  } catch (error) {
   return  error.response
  }
}

  const ordReturnAxios=async(data,orderItemId)=>{
    try {
      return api.patch(`/order/${orderItemId}/return`,data)
    } catch (error) {
      return error.response
    }
  }

const orderInvoice=async(orderId,orderItemId)=>{
  try {
    console.log(orderItemId,'it is the order Id')
    window.location.href=`/order/${orderItemId}/invoice?odrId=${orderId}`
  } catch (error) {
    
  }
}
const changePasswordAxios=async(data)=>{
try { 
  return await api.post('/password/reset',data)
} catch (error) {
  return error.response
}
}
export default {
  userSignupAxios,
  userOtpAxios,
  resendOtpAxios,
  loginAxios,
  forgotPassAxios,
  resetPassAxios,
  admnLoginAxios,
  userProfileAxios,
  userProfileImgUplaoderAxios,
  addWishlistAxios,
  remWishlistAxios,
  addToCartAxios,
  quantityUpdateAxios,
  productDetialAxios,
  getVariantDataAxios,
  removeFromCartAxios,
  addAddressAxios,
  editAddressAxios,
  deleteAddressAxios,
  confirmationAxios,
  ordCancelAxios,
  ordReturnAxios,
  orderInvoice,
  changePasswordAxios

};
