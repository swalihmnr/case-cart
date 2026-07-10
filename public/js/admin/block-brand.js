import adminApi from "../adminApi.js";

let blockBtns = document.querySelectorAll(".block-btn");

blockBtns.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    let id = e.currentTarget.dataset.id;
    let mode = e.currentTarget.dataset.statusmode;
    try {
      let confirmResult = await Swal.fire({
        title: "Are you sure?",
        text: `Do you want to ${mode} this brand?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: mode === "block" ? "#d33" : "#3085d6",
        cancelButtonColor: "#gray",
        confirmButtonText: `Yes, ${mode} it!`,
      });

      if (confirmResult.isConfirmed) {
        window.setLoading(e.currentTarget, true);
        let response = await adminApi.blockBrandAxios(id);
        window.setLoading(e.currentTarget, false);
        
        if (response.data.success) {
          Swal.fire({
            title: "Success",
            text: `Brand has been ${response.data.success.toLowerCase()}.`,
            icon: "success",
            showConfirmButton: false,
            timer: 1500,
          }).then(() => {
            window.location.reload();
          });
        }
      }
    } catch (error) {
      window.setLoading(e.currentTarget, false);
      Swal.fire({
        title: "Error!",
        text: "Something went wrong. Please try again.",
        icon: "error",
      });
      console.log(error);
    }
  });
});
