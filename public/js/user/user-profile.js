import api from "../api.js";

//user profile image
window.handleProfileUpload = handleProfileUpload;
async function handleProfileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert("File size must be less than 2MB");
    return;
  }

  const previewDiv = document.querySelector(".w-20.h-20");
  const imageUrl = URL.createObjectURL(file);
  console.log(file);
  const newForm = new FormData();
  newForm.append("image", file);
  try {
    let res = await api.userProfileImgUplaoderAxios(newForm);
    if (res.data.success) {
      let alert_box = document.querySelector(".warning-box");
      numberErr.classList.remove("text-red-500");
      numberErr.classList.add("text-blue-500");
      alert_box.classList.remove("hidden");
      alert_box.innerText = res.data.message;
    }
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    let alert_box = document.querySelector(".warning-box");
    numberErr.classList.remove("text-red-500");
    numberErr.classList.add("text-blue-500");
    alert_box.classList.remove("hidden");
    alert_box.innerText = error.response.message;
  }
}

document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const firstName = document.getElementById("f-name").value.trim();
  const lastName = document.getElementById("l-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const number = document.getElementById("number").value.trim();

  let firstnameErr = document.getElementById("f-err");
  let lastnameErr = document.getElementById("l-err");
  let emailErr = document.getElementById("emailErr");
  let numberErr = document.getElementById("numberErr");

  const namePattern = /^[A-Za-z\s]+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const numberPattern = /^[0-9]{10}$/;

  let isValid = true;

  firstnameErr.textContent = "";
  lastnameErr.textContent = "";
  emailErr.textContent = "";
  numberErr.textContent = "";

  if (!namePattern.test(firstName) || firstName.length < 2) {
    firstnameErr.textContent = "Enter a valid first name";
    isValid = false;
  }
  if (!namePattern.test(lastName) || lastName.length < 2) {
    lastnameErr.textContent = "Enter a valid last name";
    isValid = false;
  }

  if (!emailPattern.test(email)) {
    emailErr.textContent = "Enter a valid email address";
    isValid = false;
  }
  if (!numberPattern.test(number)) {
    numberErr.textContent =
      "Enter your phone number to add it to your profile.";
  }

  if (isValid) {
    const data = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      number: number,
    };
    try {
      let res = await api.userProfileAxios(data);

      if (res.data.success) {
        let alert_box = document.querySelector(".warning-box");
        numberErr.classList.remove("text-red-500");
        numberErr.classList.add("text-blue-500");
        alert_box.classList.remove("hidden");
        alert_box.innerText = res.data.message;
        if (res.data.otpVerify) {
          console.log("here entered");
          location.href = res.data.redirect;
        }
      } else {
        if (res.data.isGoogle) {
          let alert_box = document.querySelector(".warning-box");
          numberErr.classList.remove("text-red-500");
          numberErr.classList.add("text-blue-500");
          alert_box.classList.remove("hidden");
          alert_box.innerText = res.data.message;
        } else {
          let alert_box = document.querySelector(".warning-box");
          numberErr.classList.remove("text-red-500");
          numberErr.classList.add("text-blue-500");
          alert_box.classList.remove("hidden");
          alert_box.innerText = res.data.message;
        }
      }
      if (res.data.isChanged === false) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {}
  }
});
