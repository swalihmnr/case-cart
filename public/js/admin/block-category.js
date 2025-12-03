import adminApi from "../adminApi.js";
document.querySelectorAll(".block-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to block /unblock this category?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Continue",
    }).then(async(result) => {
      if(result.isConfirmed){
        console.log('confirmed')
        let res = await adminApi.blockCategoryAxios(id);
        if (res.data.success) 
            location.reload();
        
      }
      });
    
  });
});
