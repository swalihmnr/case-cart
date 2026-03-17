import api from "../api.js";

document.getElementById("email")?.addEventListener("input", () => {
  document.getElementById("emailErr").innerText = "";
});

document.querySelector("form").addEventListener("submit", async (event) => {
  localStorage.removeItem("otpTimer");
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
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = "Submitting...";

      console.log("Submitting forgot password form...");
      const data = {
        email,
      };
      let res = await api.forgotPassAxios(data);

      if (res.data.success) {
        window.location.href = res.data.redirectUrl;
      } else {
        console.log(res.data.message);
        Swal.fire({
          icon: "warning",
          title: "Forgot Password",
          text: res.data.message,
          confirmButtonColor: "#667eea",
        });
      }
    } catch (err) {
      console.error("Forgot password submission error:", err);
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Something went wrong. Please try again later.";

      Swal.fire({
        icon: "error",
        title: "Forgot Password",
        text: errorMessage,
        confirmButtonColor: "#667eea",
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
  }
});
