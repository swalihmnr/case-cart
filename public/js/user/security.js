import api from '../api.js';

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("passwordForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // Error elements (create spans in HTML if needed)
    const errCurrent = document.getElementById("currentPassErr");
    const errNew = document.getElementById("newPassErr");
    const errConfirm = document.getElementById("confirmPassErr");

    // Clear previous errors
    if (errCurrent) errCurrent.innerText = "";
    if (errNew) errNew.innerText = "";
    if (errConfirm) errConfirm.innerText = "";

    let isValid = true;

    // Validation rules
    if (!currentPassword) {
      if (errCurrent) errCurrent.innerText = "Enter current password";
      isValid = false;
    }

    if (!newPassword) {
      if (errNew) errNew.innerText = "Enter new password";
      isValid = false;
    } else if (newPassword.length < 8) {
      if (errNew) errNew.innerText = "Minimum 8 characters required";
      isValid = false;
    }

    if (!confirmPassword) {
      if (errConfirm) errConfirm.innerText = "Confirm your new password";
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      if (errConfirm) errConfirm.innerText = "Passwords do not match";
      isValid = false;
    }

    if (!isValid) return;

    try {
        const data={
            currentPassword,
        newPassword
        }
      const res = await api.changePasswordAxios(data);

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Password Updated",
          text: "Your password has been changed successfully",
          confirmButtonColor: "#7c3aed" // purple
        });

        form.reset();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.data.message || "Unable to update password",
          confirmButtonColor: "#ef4444" // red
        });
      }

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again later.",
        confirmButtonColor: "#ef4444"
      });
    }
  });
});
