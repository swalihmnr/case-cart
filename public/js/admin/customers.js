import adminApi from "../adminApi.js";

// ------------- TOGGLE STATS SECTION -------------
const toggleStatsBtn = document.getElementById("toggle-stats-btn");
const statsContainer = document.getElementById("stats-container");

if (toggleStatsBtn) {
  toggleStatsBtn.addEventListener("click", () => {
    statsContainer.classList.toggle("expanded");

    const text = toggleStatsBtn.querySelector("span");
    const icon = toggleStatsBtn.querySelector("i");

    if (statsContainer.classList.contains("expanded")) {
      text.textContent = "Hide Stats";
      statsContainer.classList.add("hidden");
      icon.classList.replace("fa-chevron-down", "fa-chevron-up");
    } else {
      text.textContent = "Show Stats";
      statsContainer.classList.remove("hidden");
      icon.classList.replace("fa-chevron-up", "fa-chevron-down");
    }
  });
}

// ----------------- MODALS -----------------
const customerDetailsModal = document.getElementById("customer-details-modal");
const blockCustomerModal = document.getElementById("block-customer-modal");
const unblockCustomerModal = document.getElementById("unblock-customer-modal");

const closeModalButtons = document.querySelectorAll(".close-modal");

closeModalButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    customerDetailsModal.classList.add("hidden");
  });
});

// ----------------- VIEW CUSTOMER (POPUP) -----------------
document.querySelectorAll(".view-customer-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.customerId;
    const name = btn.dataset.name;
    const email = btn.dataset.email;
    const number = btn.dataset.number;
    const createdAt = btn.dataset.createdat;
    const status = btn.dataset.status;
    console.log(status);

    document.getElementById("customer-details-content").innerHTML = `
            <div class="p-8">
                <h1 class="text-3xl font-semibold text-gray-900 mb-8">Customer Details</h1>
                
                <!-- Two Column Layout -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Personal Information -->
                    <div>
                        <h2 class="text-gray-500 text-sm font-medium mb-4">Personal Information</h2>
                        
                        <div class="space-y-3">
                            <div>
                                <span class="text-gray-900 font-medium">CustomerID :</span>
                                <span class="text-gray-900" id="customer-name">${id}</span>
                            </div>
                            <div>
                                <span class="text-gray-900 font-medium">Name : </span>
                                <span class="text-gray-900" id="customer-name">${name}</span>
                            </div>
                            
                            <div>
                                <span class="text-gray-900 font-medium">Email : </span>
                                <span class="text-gray-900" id="customer-email">${email}</span>
                            </div>
                            
                            <div>
                                <span class="text-gray-900 font-medium">Phone: </span>
                                <span class="text-gray-900" id="customer-phone">${number}</span>
                            </div>
                            
                            <div>
                                <span class="text-gray-900 font-medium">Joined: </span>
                                <span class="text-gray-900" id="customer-joined">${createdAt}</span>
                            </div>
                            
                            <div>
                                <span class="text-gray-900 font-medium">Status : </span>
                                <span id="customer-status" class="inline-block px-3 py-1 text-xs rounded bg-green-100 text-green-700">
                                    ${status === "true" ? "Block" : "Active"}
                                </span>
                            </div>
                        </div>
                        
                        <div class="mt-6">
                            <h3 class="text-gray-500 text-sm font-medium mb-2">Address</h3>
                            <p class="text-gray-900" id="customer-address">456 Oak Ave, Somewhere, india 67890</p>
                        </div>
                    </div>
                    
                    <!-- Order Information -->
                    <div>
                        <h2 class="text-gray-500 text-sm font-medium mb-4">Order Information</h2>
                        
                        <div class="space-y-3">
                            <div>
                                <span class="text-gray-900 font-medium">Total Orders: </span>
                                <span class="text-gray-900" id="total-orders">12</span>
                            </div>
                            
                            <div>
                                <span class="text-gray-900 font-medium">Total Spent: </span>
                                <span class="text-gray-900" id="total-spent">847.50</span>
                            </div>
                            
                            <div>
                                <span class="text-gray-900 font-medium">Phone: </span>
                                <span class="text-gray-900" id="order-phone">+91 453 987-6543</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    customerDetailsModal.classList.remove("hidden");
  });
});

// ----------------- BLOCK CUSTOMER -----------------
// let selectedCustomerId = null ;
// let selectedRow = null;

document.querySelectorAll(".block-customer-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      const selectedCustomerId = btn.dataset.customerId;
      const statusmode = btn.dataset.statusmode;
      const isBlocking = statusmode === "block";

      const confirmResult = await Swal.fire({
        title: "Are you sure?",
        text: isBlocking
          ? "Are you sure you want to block this customer? They will not be able to place orders or access their account."
          : "Are you sure you want to unblock this customer? They will be able to place orders and access their account.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: isBlocking ? "#d33" : "#10B981",
        cancelButtonColor: "#3085d6",
        confirmButtonText: isBlocking ? "Yes, Block" : "Yes, Unblock",
      });

      if (confirmResult.isConfirmed) {
        const res = await adminApi.blockCustomerAxios(selectedCustomerId);
        // Backend returns { success: "Message string", status: boolean }
        if (res.data.status !== undefined) {
          const newStatus = res.data.status;

          // Update the UI dynamically
          const badge = document.getElementById(`status-badge-${selectedCustomerId}`);
          const actionBtn = document.getElementById(`block-btn-${selectedCustomerId}`);

          if (badge) {
            badge.textContent = newStatus ? "blocked" : "active";
            badge.className = `text-xs ${newStatus ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} px-2 py-1 rounded-full`;
          }

          if (actionBtn) {
            const icon = actionBtn.querySelector("i");
            if (newStatus) {
              // Now blocked, show unblock option
              actionBtn.dataset.statusmode = "unblock";
              actionBtn.className = "block-customer-btn text-green-600 hover:text-green-800 text-sm";
              if (icon) icon.className = "fas fa-check";
            } else {
              // Now active, show block option
              actionBtn.dataset.statusmode = "block";
              actionBtn.className = "block-customer-btn text-red-600 hover:text-red-800 text-sm";
              if (icon) icon.className = "fas fa-ban";
            }
          }

          Toastify({
            text: res.data.success || `Customer ${newStatus ? 'blocked' : 'unblocked'} successfully`,
            duration: 3000,
            gravity: "bottom",
            position: "center",
            style: {
              background: newStatus ? "linear-gradient(to right, #ff416c, #ff4b2b)" : "linear-gradient(to right, #667eea, #764ba2)",
              borderRadius: "10px",
            }
          }).showToast();
        }
      }
    } catch (error) {
      console.error(error);
      Toastify({
        text: "An error occurred while updating customer status",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "linear-gradient(to right, #ff416c, #ff4b2b)",
          borderRadius: "10px",
        }
      }).showToast();
    }
  });
});

// ----------------- UNBLOCK CUSTOMER -----------------

// ---------------------- DOM UPDATE FUNCTIONS ----------------------
