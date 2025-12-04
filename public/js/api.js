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

      if (resetUrl) {
        sessionStorage.setItem("urlLoginPage", resetUrl);
      }
    } else {
      if (res.data.redirectUrl) {
        sessionStorage.setItem("urlLoginPage", res.data.redirectUrl);
      }
    }

    // Immediately remove reset flag (no race condition)
    sessionStorage.removeItem("Otpmod");

    return res.data.success;
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
    return res;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
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


export default {
  userSignupAxios,
  userOtpAxios,
  resendOtpAxios,
  loginAxios,
  forgotPassAxios,
  resetPassAxios,
  admnLoginAxios,

};
