import api from "../api.js";

window.togglePassword = togglePassword;
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.parentNode.querySelector("i");

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

// Clear errors on input
document.getElementById("new-password")?.addEventListener("input", () => {
  document.getElementById("Errmsg").innerText = "";
});
document
  .getElementById("confirm-new-password")
  ?.addEventListener("input", () => {
    document.getElementById("cnErrmsg").innerText = "";
  });

document.querySelector("form").addEventListener("submit", async (event) => {
  event.preventDefault();

  let password = document.getElementById("new-password").value.trim();
  let confirmPass = document
    .getElementById("confirm-new-password")
    .value.trim();

  let Err_pass = document.getElementById("Errmsg");
  let Err_cPass = document.getElementById("cnErrmsg");

  // Regex Patterns
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  Err_pass.innerText = "";
  Err_cPass.innerText = "";

  let Err_flag = true;

  if (password === "") {
    Err_pass.innerText = "Enter your password";
    Err_flag = false;
  } else if (!passwordPattern.test(password)) {
    Err_pass.innerText =
      "Must be 8+ characters with uppercase, lowercase, number and symbol";
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
    let userEmail = sessionStorage.getItem("email");
    console.log(userEmail);
    const data = {
      password,
      userEmail,
    };
    try {
      let res = await api.resetPassAxios(data);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Password Updated",
          text: res.data.message,
          confirmButtonColor: "#667eea",
        }).then(() => {
          window.location.href = res.data.redirectUrl;
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: res.data.message,
          confirmButtonColor: "#667eea",
        });
      }
    } catch (err) {
      console.error("Reset password error:", err);
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Something went wrong. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#667eea",
      });
    }
  }
});
