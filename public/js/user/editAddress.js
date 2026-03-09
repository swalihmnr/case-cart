import api from "../api.js";
async function editForm(addressId) {
  console.log(addressId);
  window.location.href = `/address/edit/${addressId}`;
}

async function deleteAddress(addressId) {
  Swal.fire({
    title: "Are you sure?",
    text: "This address will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  }).then(async (result) => {
    if (result.isConfirmed) {
      const res = await api.deleteAddressAxios(addressId);
      if (res.data.success) {
        location.reload();
      }
    }
  });
}
window.deleteAddress = deleteAddress;
window.editForm = editForm;
