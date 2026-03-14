import api from "../api.js";
import { showGlobalLoading, hideGlobalLoading } from "../ui-helpers.js";

document
  .querySelector("#addressForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    // -------- GET VALUES --------
    console.log("here is ");
    let firstName = document.getElementById("first-name").value.trim();
    let lastName = document.getElementById("last-name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let line1 = document.getElementById("line1").value.trim();
    let landmark = document.getElementById("landmark").value.trim();
    let city = document.getElementById("city").value.trim();
    let state = document.getElementById("state").value;
    let pincode = document.getElementById("pincode").value.trim();
    let addressType = document.querySelector(
      'input[name="addressType"]:checked',
    )?.value;
    let isDefault = document.getElementById("isDefault").checked;

    // -------- ERROR ELEMENTS --------
    let Err_fname = document.getElementById("firstNameError");
    let Err_lname = document.getElementById("lastNameError");
    let Err_phone = document.getElementById("phoneError");
    let Err_line1 = document.getElementById("line1Error");
    let Err_city = document.getElementById("cityError");
    let Err_state = document.getElementById("stateError");
    let Err_pin = document.getElementById("pincodeError");
    let Err_type = document.getElementById("addressTypeError");

    // -------- REGEX & CONSTRAINTS --------
    const namePattern = /^[A-Za-z\s]+$/;
    const phonePattern = /^[6-9]\d{9}$/;
    const pinPattern = /^\d{6}$/;

    // -------- CLEAR ERRORS --------
    Err_fname.innerText = "";
    Err_lname.innerText = "";
    Err_phone.innerText = "";
    Err_line1.innerText = "";
    Err_city.innerText = "";
    Err_state.innerText = "";
    Err_pin.innerText = "";
    Err_type.innerText = "";

    let Err_flag = true;

    // -------- VALIDATION --------
    if (!namePattern.test(firstName) || firstName.length < 2) {
      Err_fname.innerText = "Enter a valid first name (min 2 chars)";
      Err_flag = false;
    }

    if (!namePattern.test(lastName) || lastName.length < 1) {
      Err_lname.innerText = "Enter a valid last name";
      Err_flag = false;
    }

    if (!phonePattern.test(phone)) {
      Err_phone.innerText = "Enter a valid 10-digit Indian phone number";
      Err_flag = false;
    }

    if (line1 === "" || line1.length < 5) {
      Err_line1.innerText = "Street address is required (min 5 chars)";
      Err_flag = false;
    }

    if (city === "") {
      Err_city.innerText = "City is required";
      Err_flag = false;
    }

    if (state === "") {
      Err_state.innerText = "Select a state";
      Err_flag = false;
    }

    if (!pinPattern.test(pincode)) {
      Err_pin.innerText = "Enter a valid 6-digit PIN code";
      Err_flag = false;
    }

    if (!addressType) {
      Err_type.innerText = "Select address type";
      Err_flag = false;
    }
    let streetAddress = line1;
    // -------- SUBMIT --------
    if (Err_flag) {
      showGlobalLoading();
      try {
        const payload = {
          firstName,
          lastName,
          phone,
          streetAddress,
          landmark,
          city,
          state,
          pincode,
          addressType,
          isDefault,
        };
        const res = await api.addAddressAxios(payload);
        if (res.data.success) {
          Swal.fire({
            icon: "success",
            title: "created",
            text: res.data.message,
            confirmButtonColor: "#667eea",
          }).then((item) => {
            location.href = "/address";
          });
        } else {
          Swal.fire({
            icon: "warning",
            text: res.data.message,
            confirmButtonColor: "#667eea",
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong while saving address",
          confirmButtonColor: "#667eea",
        });
      } finally {
        hideGlobalLoading();
      }
    }
  });
async function editForm(addressId) {
  window.location.href = `/address/edit/${addressId}`;
}

window.editForm = editForm;
