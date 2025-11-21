import  api from '../api.js '


document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("signup-password");
    const eyeIcon = document.getElementById("eye-icon");

    eyeIcon.addEventListener("click", () => {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
      } else {
        passwordInput.type = "password";
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
      }
    });
  });
  document.querySelector("form").addEventListener("submit", async(event) => {
  event.preventDefault();

  let fname = document.getElementById("first-name").value.trim();
  let lname = document.getElementById("last-name").value.trim();
  let pnumber = document.getElementById("phone").value.trim();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("signup-password").value.trim();
  let confirmPass = document.getElementById("confirm-password").value.trim();

  let Err_fname = document.getElementById("fnameErr");
  let Err_lname = document.getElementById("lnameErr");
  let Err_number = document.getElementById("numberErr");
  let Err_email = document.getElementById("emailErr");
  let Err_pass = document.getElementById("passwordErr");
  let Err_cPass = document.getElementById("cpasswordErr");

  // Regex Patterns
  const namePattern = /^[A-Za-z\s]+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^.{8,}$/;
  const numberPattern = /^[0-9]+$/;

  // Clear all previous errors
  Err_fname.innerText = "";
  Err_lname.innerText = "";
  Err_number.innerText = "";
  Err_email.innerText = "";
  Err_pass.innerText = "";
  Err_cPass.innerText = "";

  let Err_flag = true;

  if (!namePattern.test(fname)) {
    Err_fname.innerText = "Enter your first name";
    Err_flag = false;
  }
  if (!namePattern.test(lname)) {
    Err_lname.innerText = "Enter your last name";
    Err_flag = false;
  }
  if (!numberPattern.test(pnumber)) {
    Err_number.innerText = "Enter a valid phone number";
    Err_flag = false;
  }
  if (!emailPattern.test(email)) {
    Err_email.innerText = "Enter your email properly";
    Err_flag = false;
  }
  if (password === "") {
    Err_pass.innerText = "Enter your password";
    Err_flag = false;
  } else if (!passwordPattern.test(password)) {
    Err_pass.innerText = "Minimum length should be 8 characters";
    Err_flag = false;
  }
  if (confirmPass === "") {
    Err_cPass.innerText = "Enter confirm password";
    Err_flag = false;
  } else if (password !== confirmPass) {
    Err_cPass.innerText = "Passwords do not match";
    Err_flag = false;
  }
  if (Err_flag) {
    console.log("Submitting signup form...");
    const data={
      firstname: fname,
      lastname: lname,
      number: pnumber,
      email,
      password
    }
    sessionStorage.setItem('email',email);
    localStorage.removeItem('otpTimer');
    localStorage.removeItem("otpExpire");  
   let res=await api.userSignupAxios(data)
   if(res.data.success){
        window.location.href=res.data.redirectUrl
   }else{
      Swal.fire({
      icon: "warning",
      title: "User already exists",
      text: "Try logging in or use a different email.",
      confirmButtonColor: "#f6ad55" // orange
});

   }
 
  } 


});
        
        