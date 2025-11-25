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
  //regexpatterns
  const CatNamePattern = /^[A-Za-z\s]{3,}$/;
  errName.innerText = "";
  errDes.innerText = "";
  let flag = true;
  if (!CatNamePattern.test(categoryName)) {
    errName.innerText = "Enter Category Name";
    flag = false;
  }
  if (categoryDescription === "") {
    errDes.innerText = "Enter the Product Description";
    flag = false;
  }
  if (flag) {
    let data = {
      action,
      categoryName,
      categoryDescription,
    };
    if (mode === "edit") {
      try {
        let res = await adminApi.editCategoryAxios(id, data);
        console.log(res);
        if (res.data.success) {
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
    
        Swal.fire({
          icon: "warning",
          title: "not Updated!",
          text: error.response.statusText,
          timer: 1800,
          showConfirmButton: false,
        })
      
      }
      
    } else {
      try {
        let res = await adminApi.addCategoryAxios(data);
        console.log(res,'nothing')
        if(res.data.success){
          Swal.fire({
            icon: "success",
            title: "product added!",
            text: res.data.message,
            timer: 1800,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = res.data.redirectUrl;
          });
        }else{
          Swal.fire({
          icon: "warning",
          title: "not added!",
          text: res.data.message,
          timer: 1800,
          showConfirmButton: false,
        })
        }
      } catch (error) {
        console.log(error )
        
      }
      
    }
  }
}

