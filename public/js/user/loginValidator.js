import api from "../api.js";
const url = new URL(window.location.href);
window.togglePassword = togglePassword;
function togglePassword(inputId) {
  const input = document.getElementById(inputId);

  const icon = input.parentElement.querySelector("button i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^.{8,}$/,
};

if (url.searchParams.get("blocked") === "true") {
  Swal.fire({
    icon: "error",
    title: "Account Blocked",
    text: "Your account has been blocked by admin.",
  });
}
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("user-email").value.trim();
  const password = document.getElementById("user-password").value.trim();

  const emailErr = document.getElementById("emailErr");
  const passErr = document.getElementById("passwordErr");

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
    const data = {
      Email: email,
      Password: password,
    };
    let res = await api.loginAxios(data);
    console.log(res);
    try {
      if (res.data.success) {
        console.log("hlow");
        if (res.data.redirectUrl === "/") {
          window.location.href = res.data.redirectUrl;
        }
      } else {
        if (res.data.emailErr) {
          emailErr.innerText = res.data.message;
        } else if (res.data.passErr) {
          passErr.innerText = res.data.message;
        } else {
          Swal.fire({
            icon: "warning",
            title: "Signup",
            text: res.data.message,
            confirmButtonColor: "#667eea",
          });
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Access deneid!",
        text: error.response.data.message,
      });
    }
  }
});
