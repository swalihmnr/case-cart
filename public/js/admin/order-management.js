 import adminApi from "../adminApi.js";
 
 
 //search script
const filterSelect=document.getElementById('statusFilter')
const input=document.getElementById('orderSearch');
let timer;
input.addEventListener('input',()=>{
  clearTimeout(timer)
  timer=setTimeout(()=>{
    const filter=filterSelect.value.trim()
   let search= input.value.trim()  
    window.location.href=`/admin/order?page=1&search=${search}&filter=${filter}`
   
  },500)
})

filterSelect.addEventListener('change',()=>{
        const filter=filterSelect.value.trim()
        const search=input.value.trim()
        console.log(filter)
        window.location.href=`/admin/order?page=1&search=${search}&filter=${filter}`
})
 
 
 window.updateOrderStatus = async function (orderId, orderItemId, newStatus) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Change order status to "${newStatus}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, update',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    const res=await adminApi.updateStatus(newStatus,orderId,orderItemId)
  console.log(res)

    if (res.data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Order status updated successfully',
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => location.reload(), 1200);
    } else {
        
      Swal.fire('Error', res.data.message || 'Update failed', 'error');
    }

  } catch (error) {
    console.error(error.message);
    Swal.fire('Error', 'Something went wrong', 'error');
  }
}

window.approveReturn= async function(orderId,itemId){
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Change Requast status to approve?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes,approve',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    const res=await adminApi.reqApproveAxios(orderId,itemId)
  console.log(res)

    if (res.data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Approved!',
        text: 'Order Requast updated successfully',
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => location.reload(), 1200);
    } else {
        
      Swal.fire('Error', res.data.message || 'Update failed', 'error');
    }

  } catch (error) {
    console.error(error.message);
    Swal.fire('Error', 'Something went wrong', 'error');
  }
}  

window.rejectReturn= async function(orderId,itemId){
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Change Requast status to Reject?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes,Reject',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    const res=await adminApi.reqRejectAxios(orderId,itemId)
  console.log(res)

    if (res.data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Rejected!',
        text: 'Order Requast Rejected Successfully',
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => location.reload(), 1200);
    } else {
        
      Swal.fire('Error', res.data.message || 'Update failed', 'error');
    }

  } catch (error) {
    console.error(error.message);
    Swal.fire('Error', 'Something went wrong', 'error');
  }
}
