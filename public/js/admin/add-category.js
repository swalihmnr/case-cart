import adminApi from "../adminApi.js";
window.submitCategory = submitCategory;
async function submitCategory(event) {
  let action = event.currentTarget.dataset.action;
  let mode = event.currentTarget.dataset.mode;
  let id = event.currentTarget.dataset.id;

  console.log(mode);
  let categoryName = document.getElementById("categoryName").value.trim();
  let categoryDescription = document
    .getElementById("categoryDescription")
    .value.trim();
  let errName = document.getElementById("nameErr");
  let errDes = document.getElementById("desErr");

  errName.innerText = "";
  errDes.innerText = "";
  let flag = true;

  // Category Name Validation
  if (!categoryName) {
    errName.innerText = "Category Name is required.";
    flag = false;
  } else if (categoryName.length < 3 || categoryName.length > 50) {
    errName.innerText = "Category Name must be between 3 and 50 characters.";
    flag = false;
  } else if (!/^[A-Za-z\s]+$/.test(categoryName)) {
    errName.innerText = "Category Name can only contain letters and spaces.";
    flag = false;
  } else if (categoryName.trim().length === 0) {
    errName.innerText = "Category Name cannot be just spaces.";
    flag = false;
  }

  // Category Description Validation
  if (!categoryDescription) {
    errDes.innerText = "Category Description is required.";
    flag = false;
  } else if (
    categoryDescription.length < 10 ||
    categoryDescription.length > 500
  ) {
    errDes.innerText =
      "Category Description must be between 10 and 500 characters.";
    flag = false;
  } else if (categoryDescription.trim().length === 0) {
    errDes.innerText = "Category Description cannot be just spaces.";
    flag = false;
  }

  if (flag) {
    let data = {
      action,
      categoryName,
      categoryDescription,
    };
    const btn = event.currentTarget;
    if (data.mode === "edit") {
      try {
        if (btn) window.setLoading(btn, true);
        window.showGlobalLoading();
        let res = await adminApi.editCategoryAxios(id, data);
        console.log(res);
        if (res.data.success) {
          if (btn) window.setLoading(btn, false);
          window.hideGlobalLoading();
          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: "Category updated successfully",
            timer: 1800,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = res.data.redirectUrl;
          });
        }
      } catch (error) {
        if (btn) window.setLoading(btn, false);
        window.hideGlobalLoading();
        Swal.fire({
          icon: "warning",
          title: "not Updated!",
          text:
            error.response?.data?.message ||
            error.response?.statusText ||
            "Something went wrong",
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } else {
      try {
        if (btn) window.setLoading(btn, true);
        window.showGlobalLoading();
        let res = await adminApi.addCategoryAxios(data);
        console.log(res, "nothing");
        if (res.data.success) {
          if (btn) window.setLoading(btn, false);
          window.hideGlobalLoading();
          Swal.fire({
            icon: "success",
            title: "product added!",
            text: res.data.message,
            timer: 1800,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = res.data.redirectUrl;
          });
        } else {
          if (btn) window.setLoading(btn, false);
          window.hideGlobalLoading();
          Swal.fire({
            icon: "warning",
            title: "not added!",
            text: res.data.message,
            timer: 1800,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        if (btn) window.setLoading(btn, false);
        window.hideGlobalLoading();
        console.log(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Something went wrong",
        });
      }
    }
  }
}
