import api from "../api.js";


document.querySelector("form").addEventListener("submit", async(event) => {
    localStorage.removeItem('otpTimer');
    localStorage.removeItem("otpExpire");  
     clearInterval(window.OtpTimer);
    
  event.preventDefault();
  let email = document.getElementById("email").value.trim();
  let Err_email = document.getElementById("emailErr");
  // Regex Patterns
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Clear all previous errors
  Err_email.innerText = "";
  let Err_flag = true;
  if (!emailPattern.test(email)) {
    Err_email.innerText = "Enter your email properly";
    Err_flag = false;
  }
  if (Err_flag) {
    console.log("Submitting signup form...");
    const data={
      email
    }
    let res=await api.forgotPassAxios(data)
   
    if(res.data.success){
        window.location.href=res.data.redirectUrl
    }else{
         console.log(res.data.message)
         Swal.fire({
        icon: 'warning',
        title: 'Signup',
        text: res.data.message,
        confirmButtonColor: '#667eea'
      });
    }
  } 
});
