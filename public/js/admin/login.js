import api from '../api.js'
   window.togglePassword=togglePassword
    function togglePassword(id) {
        const input = document.getElementById(id);
        const icon = document.getElementById(id + "-icon");

        const show = input.type === "password";
        input.type = show ? "text" : "password";

        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    }


      const patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: /^.{8,}$/,
      };
    
      document.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();
    
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value.trim();
    
        const emailErr = document.getElementById("emailErr");
        const passErr = document.getElementById("passErr");
    
        emailErr.innerText = "";
        passErr.innerText = "";
    
        let valid = true;
    
        if (!patterns.email.test(email)) {
          emailErr.innerText = "Enter a valid email";
          valid = false;
        }
    
        if (!patterns.password.test(password)) {
          passErr.innerText = "Password must be at least 8 characters";
          valid = false;
        }
    
        if (valid) {
          const data={
            Email:email,
            Password:password
          }
          let res=await  api.admnLoginAxios(data)
         
    
        }
      });
    
        
