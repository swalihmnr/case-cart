import api from "../api.js";
window.showOrderDetails = function (orderId,productId,orderItemId,) {

        const order = ordersData.find(o => o.orderItems._id === orderItemId);
        if (!order) return;
        console.log(order.orderItems.status,'it is the status')

        // Format dates
        const placedOn = new Date(order.createdAt).toLocaleString("en-IN", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

        // Set modal content
        document.getElementById('orderIdDetail').textContent = `Order # ${order.orderId}`;
        
        document.getElementById('modalContent').innerHTML = `
            <div class="mb-6">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-green-600 font-medium">${order.orderItems.status}</span>
                    <span class="text-gray-500 text-sm">Placed on ${placedOn}</span>
                </div>
            </div>

            <!-- Track Order Section -->
            <div class="mb-6 bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">TRACK YOUR ORDER</h4>
                <div class="flex items-center justify-between mb-3">
                    <div class="text-center">
                        <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-1">
                            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <p class="text-xs font-medium text-green-600">Order Placed</p>
                    </div>
                    <div class="flex-1 h-1 bg-green-200"></div>
                    <div class="text-center">
                        <div class="w-8 h-8 rounded-full ${order.orderItems.status === 'Processing' || order.orderItems.status === 'Shipped' || order.orderItems.status === 'Delivered' ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center mx-auto mb-1">
                            <svg class="w-4 h-4 ${order.orderItems.status === 'Processing' || order.orderItems.status === 'Shipped' || order.orderItems.status === 'Delivered' ? 'text-white' : 'text-gray-400'}" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <p class="text-xs font-medium ${order.orderItems.status === 'Processing' || order.orderItems.status === 'Shipped' || order.orderItems.status === 'Delivered' ? 'text-green-600' : 'text-gray-500'}">Processing</p>
                    </div>
                    <div class="flex-1 h-1 ${order.orderItems.status === 'Shipped' || order.orderItems.status === 'Delivered' ? 'bg-green-200' : 'bg-gray-200'}"></div>
                    <div class="text-center">
                        <div class="w-8 h-8 rounded-full ${order.orderItems.status === 'Shipped' || order.orderItems.status === 'Delivered' ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center mx-auto mb-1">
                            <svg class="w-4 h-4 ${order.orderItems.status === 'Shipped' || order.orderItems.status === 'Delivered' ? 'text-white' : 'text-gray-400'}" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h-3v5h3V7zm-6 0v5h3V7H8z"/>
                            </svg>
                        </div>
                        <p class="text-xs font-medium ${order.orderItems.status === 'Shipped' || order.orderItems.status === 'Delivered' ? 'text-green-600' : 'text-gray-500'}">Shipped</p>
                    </div>
                    <div class="flex-1 h-1 ${order.orderItems.status === 'Delivered' ? 'bg-green-200' : 'bg-gray-200'}"></div>
                    <div class="text-center">
                        <div class="w-8 h-8 rounded-full ${order.orderItems.status === 'Delivered' ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center mx-auto mb-1">
                            <svg class="w-4 h-4 ${order.orderItems.status === 'Delivered' ? 'text-white' : 'text-gray-400'}" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                            </svg>
                        </div>
                        <p class="text-xs font-medium ${order.orderItems.status === 'Delivered' ? 'text-green-600' : 'text-gray-500'}">Delivered</p>
                    </div>
                </div>
                
                
            </div>

            <div class="mb-6">
                <h4 class="font-semibold text-gray-800 mb-4">ORDER ITEM</h4>
                <div class="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                    <img src="${order.product.productImages.find(img => img.isMain).url}" 
                         class="w-16 h-16 object-cover rounded-lg flex-shrink-0">
                    <div class="flex-1">
                        <h5 class="font-medium text-gray-800">${order.product.name}</h5>
                        <p class="text-sm text-gray-500">${order.variant.deviceModel}</p>
                        <p class="text-sm text-gray-500">Qty: ${order.orderItems.quantity}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-gray-800">₹ ${order.orderItems.quantity * order.variant.salePrice}</p>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">DELIVERY ADDRESS</h4>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="font-medium text-gray-800">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                    <p class="text-gray-600 text-sm">${order.shippingAddress.streetAddress}, ${order.shippingAddress.landMark}</p>
                    <p class="text-gray-600 text-sm">${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
                    <p class="text-gray-600 text-sm mt-2">Phone: +91 ${order.shippingAddress.phone}</p>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">ORDER SUMMARY</h4>
                <div class="space-y-2">
                    <div class="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>₹ ${order.totalPrice}</span>
                    </div>
                    <div class="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>free</span>
                    </div>
                    <div class="flex justify-between font-semibold text-gray-800 text-lg pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span class="text-purple-600">₹ ${order.finalAmount}</span>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">PAYMENT METHOD</h4>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-gray-600">${order.paymentMethod}</p>
                    <p class="text-gray-500 text-sm">${order.paymentStatus}</p>
                </div>
            </div>

           <div class="flex justify-between">
  ${
    order.orderItems.status === 'cancelled'
      ? `
        <button 
          disabled
          class="px-6 py-2 border border-gray-300 text-gray-400 cursor-not-allowed rounded-lg">
          Cancelled
        </button>
      `
      : `
        <button 
          onclick="showCancelModal('${order.orderId}','${order._id}','${order.orderItems._id}')" 
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
          Cancel Order
        </button>
      `
  }

  <button 
    onclick="invoice('${order.orderId}','${order._id}','${order.orderItems._id}')" 
    class="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50">
    Download Invoice
  </button>
</div>

        `;

        // Show modal
        document.getElementById('orderDetailsModal').classList.remove('hidden');
        document.getElementById('modalOverlay').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

  

window.closeOrderDetails = function () {
        document.getElementById('orderDetailsModal').classList.add('hidden');
        document.getElementById('modalOverlay').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

window.closeAllModals = function () {
        window.closeOrderDetails();
    }
 window.showCancelModal = function (orderId, orderID, orderItemId) {
  Swal.fire({
    title: 'Cancel Order?',
    text: `Are you sure you want to cancel order #${orderId}?`,
    icon: 'warning',

    input: 'textarea',
    inputLabel: 'Reason for cancellation',
    inputPlaceholder: 'Enter your reason...',
    inputAttributes: {
      'aria-label': 'Reason for cancellation'
    },

    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, cancel it!',
    cancelButtonText: 'No, keep it',

    preConfirm: (reason) => {
      if (!reason || !reason.trim()) {
        Swal.showValidationMessage('Please provide a reason for cancellation');
        return false;
      }
      return reason.trim();
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const reason = result.value;
    const data={
        orderId: orderID,
        reason
      }
      let res=await api.ordCancelAxios(data,orderItemId);
      if(res.data.success){
          Swal.fire(
            'Cancelled!',
            `Order #${orderId} has been cancelled.`,
            'success'
          ).then(()=>{
              location.reload()
          })
      }else{
        Swal.fire(
            'Something Went wrong!',
            `Order #${orderId} not has been cancelled.`,
            'success'
          ).then(()=>{
              location.reload()
          })
      }
    }
  });
};


   window.invoice = async function (orderId, orderID, orderItemId) {    
    console.log(orderItemId,'it is printing here')
       await api.orderInvoice(orderID,orderItemId)
        Swal.fire({
            title: 'Download Invoice',
            text: `Invoice for order #${orderId} will be downloaded.`,
            icon: 'info',
            confirmButtonColor: '#8b5cf6',
            confirmButtonText: 'Download'
        });
    }


