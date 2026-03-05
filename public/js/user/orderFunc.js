import api from "../api.js";

const within7Days = (date) => {
  const now = new Date();
  const deliveredDate = new Date(date);
  const diffInMs = now - deliveredDate;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  return diffInDays <= 7;
};

window.showOrderDetails = function (orderId, productId, orderItemId) {
  const order = ordersData.find(o => o.orderItems._id === orderItemId);
  if (!order) return;
  console.log(order, 'it is the status');

  // Format dates
  let shippingTextContent = order.shipping;
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
        
        <!-- Order Placed -->
        <div class="text-center">
          <div class="w-8 h-8 rounded-full ${
            order.orderItems.status === 'cancelled'
            ? 'bg-gray-300'
            : 'bg-green-500'
          } flex items-center justify-center mx-auto mb-1">
            <svg class="w-4 h-4 ${
              order.orderItems.status === 'cancelled'
              ? 'text-gray-400'
              : 'text-white'
            }" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.7 5.3l-8 8-4-4"/>
            </svg>
          </div>
          <p class="text-xs ${
            order.orderItems.status === 'cancelled'
            ? 'text-gray-500'
            : 'text-green-600'
          }">Order Placed</p>
        </div>
        
        <div class="flex-1 h-1 ${
          order.orderItems.status === 'cancelled'
          ? 'bg-gray-200'
          : 'bg-green-200'
        }"></div>
        
        <!-- Processing -->
        <div class="text-center">
          <div class="w-8 h-8 rounded-full ${
            ['processing','shipped','out_for_delivery','delivered','return_req'].includes(order.orderItems.status)
            ? 'bg-green-500'
            : 'bg-gray-300'
          } flex items-center justify-center mx-auto mb-1">
            <svg class="w-4 h-4 ${
              ['processing','shipped','out_for_delivery','delivered','return_req'].includes(order.orderItems.status)
              ? 'text-white'
              : 'text-gray-400'
            }" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8"/>
            </svg>
          </div>
          <p class="text-xs ${
            ['processing','shipped','out_for_delivery','delivered','return_req'].includes(order.orderItems.status)
            ? 'text-green-600'
            : 'text-gray-500'
          }">Processing</p>
        </div>
        
        <div class="flex-1 h-1 ${
          ['shipped','out_for_delivery','delivered','return_req'].includes(order.orderItems.status)
          ? 'bg-green-200'
          : 'bg-gray-200'
        }"></div>
        
        <!-- Shipped -->
        <div class="text-center">
          <div class="w-8 h-8 rounded-full ${
            ['shipped','out_for_delivery','delivered','return_req'].includes(order.orderItems.status)
            ? 'bg-green-500'
            : 'bg-gray-300'
          } flex items-center justify-center mx-auto mb-1">
            <svg class="w-4 h-4 ${
              ['shipped','out_for_delivery','delivered','return_req'].includes(order.orderItems.status)
              ? 'text-white'
              : 'text-gray-400'
            }" fill="currentColor" viewBox="0 0 20 20">
              <rect x="3" y="6" width="14" height="8"/>
            </svg>
          </div>
          <p class="text-xs ${
            ['shipped','out_for_delivery','delivered','return_req'].includes(order.orderItems.status)
            ? 'text-green-600'
            : 'text-gray-500'
          }">Shipped</p>
        </div>
        
        <div class="flex-1 h-1 ${
          ['out_for_delivery','delivered','return_req'].includes(order.orderItems.status)
          ? 'bg-green-200'
          : 'bg-gray-200'
        }"></div>
        
        <!-- Out for Delivery -->
        <div class="text-center">
          <div class="w-8 h-8 rounded-full ${
            ['out_for_delivery','delivered','return_req','returned'].includes(order.orderItems.status)
            ? 'bg-green-500'
            : 'bg-gray-300'
          } flex items-center justify-center mx-auto mb-1">
            <svg class="w-4 h-4 ${
              ['out_for_delivery','delivered','return_req','returned'].includes(order.orderItems.status)
              ? 'text-white'
              : 'text-gray-400'
            }" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6l3 3-3 3M7 6l-3 3 3 3"/>
            </svg>
          </div>
          <p class="text-xs ${
            ['out_for_delivery','delivered','return_req','returned'].includes(order.orderItems.status)
            ? 'text-green-600'
            : 'text-gray-500'
          }">Out for Delivery</p>
        </div>
        
        <div class="flex-1 h-1 ${
          order.orderItems.status === 'delivered' || order.orderItems.status === 'return_req' || order.orderItems.status === 'returned'
          ? 'bg-green-200'
          : 'bg-gray-200'
        }"></div>
        
        <!-- Delivered -->
        <div class="text-center">
          <div class="w-8 h-8 rounded-full ${
            ['delivered','return_req','returned'].includes(order.orderItems.status)
            ? 'bg-green-500'
            : 'bg-gray-300'
          } flex items-center justify-center mx-auto mb-1">
            <svg class="w-4 h-4 ${
              ['delivered','return_req','returned'].includes(order.orderItems.status)
              ? 'text-white'
              : 'text-gray-400'
            }" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10l8-8 8 8"/>
            </svg>
          </div>
          <p class="text-xs ${
            ['delivered','return_req','returned'].includes(order.orderItems.status)
            ? 'text-green-600'
            : 'text-gray-500'
          }">Delivered</p>
        </div>
        
      </div>
      
      ${
        order.orderItems.status === 'cancelled'
        ? `<p class="text-sm text-red-600 font-semibold text-center mt-2">
            ❌ Order Cancelled
           </p>`
        : order.orderItems.status === 'return_req'
        ? `<p class="text-sm text-red-600 font-semibold text-center mt-2">
              Order Return Requested
           </p>`
        : ''
      }
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
          <!-- FINAL PRICE -->
          <p class="font-bold text-lg text-gray-900">
            ₹ ${order.orderItems.finalPrice}
          </p>
        
          <!-- ORIGINAL PRICE -->
          <p class="text-sm text-gray-400 line-through">
            ₹ ${order.orderItems.price}
          </p>
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
        <!-- Subtotal -->
        <div class="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>₹ ${order.totalPrice}</span>
        </div>
    
        <!-- Offer / Discount -->
        <div class="flex justify-between text-green-600">
          <span>Offer Discount</span>
          <span>- ₹ ${order.totalDiscount}</span>
        </div>
        
        <div class="flex justify-between text-green-600">
          <span>discount</span>
          <span> ${order.orderItems?.offer.value}%</span>
        </div>

        <!-- Shipping - Only show if finalAmount > 1500 -->
        ${order.finalAmount < 1500 ? `
          <div class="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>${shippingTextContent}</span>
          </div>
        ` : ''}

        <!-- Total -->
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
        // ❌ Cancelled / Return Requested / Returned
        ['cancelled', 'return_req', 'returned'].includes(order.orderItems.status)
          ? `
            <button 
              disabled
              class="px-6 py-2 border border-gray-300 text-gray-400 cursor-not-allowed rounded-lg">
              Not Available
            </button>
          `

        // ❌ Return rejected by admin
        : order.orderItems.status === 'delivered'
          && order.orderItems.isReject === true
          ? `
            <button 
              disabled
              class="px-6 py-2 border border-red-300 text-red-400 cursor-not-allowed rounded-lg">
              Return Rejected
            </button>
          `

        // 🔄 Delivered + within 7 days → Return allowed
        : order.orderItems.status === 'delivered'
          && within7Days(order.orderItems.deliveredAt)
          ? `
            <button 
              onclick="showReturnModal('${order.orderId}','${order._id}','${order.orderItems._id}')"
              class="px-6 py-2 border border-yellow-400 rounded-lg text-yellow-600 hover:bg-yellow-50">
              Return Order
            </button>
          `

        // ❌ Delivered but return window expired
        : order.orderItems.status === 'delivered'
          ? `
            <button 
              disabled
              class="px-6 py-2 border border-gray-300 text-gray-400 cursor-not-allowed rounded-lg">
              Return Period Expired
            </button>
          `

        // ❌ Shipped or Out for Delivery
        : ['shipped', 'out_for_delivery'].includes(order.orderItems.status)
          ? `
            <button 
              disabled
              class="px-6 py-2 border border-gray-300 text-gray-400 cursor-not-allowed rounded-lg">
              Cannot Cancel Now
            </button>
          `

        // ✅ Before shipping → Cancel allowed
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
};

window.closeOrderDetails = function () {
  document.getElementById('orderDetailsModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = 'auto';
};

window.closeAllModals = function () {
  window.closeOrderDetails();
};

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
      const data = {
        orderId: orderID,
        reason
      };
      let res = await api.ordCancelAxios(data, orderItemId);
      if (res.data.success) {
        Swal.fire(
          'Cancelled!',
          `Order #${orderId} has been cancelled.`,
          'success'
        ).then(() => {
          location.reload();
        });
      } else {
        Swal.fire(
          'Something Went wrong!',
          `Order #${orderId} not has been cancelled.`,
          'success'
        ).then(() => {
          location.reload();
        });
      }
    }
  });
};

window.showReturnModal = function (orderId, orderID, orderItemId) {
  Swal.fire({
    title: 'Return Order?',
    text: `Are you sure you want to return order #${orderId}?`,
    icon: 'warning',

    input: 'textarea',
    inputLabel: 'Reason for Return',
    inputPlaceholder: 'Enter your reason...',
    inputAttributes: {
      'aria-label': 'Reason for return '
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
      const data = {
        orderId: orderID,
        reason
      };
      let res = await api.ordReturnAxios(data, orderItemId);
      if (res.data.success) {
        Swal.fire(
          'Returned requast Success!',
          `Order #${orderId} has been Returned.`,
          'success'
        ).then(() => {
          location.reload();
        });
      } else {
        Swal.fire(
          'Something Went wrong!',
          `Order #${orderId} not has been Returned.`,
          'success'
        ).then(() => {
          location.reload();
        });
      }
    }
  });
};

window.invoice = async function (orderId, orderID, orderItemId) {
  console.log(orderItemId, 'it is printing here');
  await api.orderInvoice(orderID, orderItemId);
  Swal.fire({
    title: 'Download Invoice',
    text: `Invoice for order #${orderId} will be downloaded.`,
    icon: 'info',
    confirmButtonColor: '#8b5cf6',
    confirmButtonText: 'Download'
  });
};