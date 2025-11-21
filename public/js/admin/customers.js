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
            statsContainer.classList.add('hidden')
            icon.classList.replace("fa-chevron-down", "fa-chevron-up");
        } else {
            text.textContent = "Show Stats";
            statsContainer.classList.remove('hidden')
            icon.classList.replace("fa-chevron-up", "fa-chevron-down");
        }
    });
}



// ----------------- MODALS -----------------
const customerDetailsModal = document.getElementById("customer-details-modal");
const blockCustomerModal = document.getElementById("block-customer-modal");
const unblockCustomerModal = document.getElementById("unblock-customer-modal");

const closeModalButtons = document.querySelectorAll(".close-modal");

closeModalButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        customerDetailsModal.classList.add("hidden");
    });
});


// ----------------- VIEW CUSTOMER (POPUP) -----------------
document.querySelectorAll(".view-customer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const id = btn.dataset.customerId;

        // Later you will fetch details using API
        document.getElementById("customer-details-content").innerHTML = `
            <p class="text-sm text-gray-700">Customer ID: ${id}</p>
            <p class="mt-2 text-gray-600">Dynamic customer details will come from backend...</p>
        `;

        customerDetailsModal.classList.remove("hidden");
    });
});



// ----------------- BLOCK CUSTOMER -----------------
let selectedCustomerId = null;
let selectedRow = null;

document.querySelectorAll(".block-customer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        selectedCustomerId = btn.dataset.customerId;
        selectedRow = btn.closest("tr");

        blockCustomerModal.classList.remove("hidden");
    });
});

document.querySelector(".cancel-block-btn").addEventListener("click", () => {
    blockCustomerModal.classList.add("hidden");
});

document.querySelector(".confirm-block-btn").addEventListener("click", () => {
    blockCustomerModal.classList.add("hidden");

    // ---------------- UI UPDATE ON BLOCK ----------------
    updateToBlocked(selectedRow);

    console.log("Customer blocked:", selectedCustomerId);
});



// ----------------- UNBLOCK CUSTOMER -----------------
document.querySelectorAll(".unblock-customer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        selectedCustomerId = btn.dataset.customerId;
        selectedRow = btn.closest("tr");

        unblockCustomerModal.classList.remove("hidden");
    });
});

document.querySelector(".cancel-unblock-btn").addEventListener("click", () => {
    unblockCustomerModal.classList.add("hidden");
});

document.querySelector(".confirm-unblock-btn").addEventListener("click", () => {
    unblockCustomerModal.classList.add("hidden");

    // ---------------- UI UPDATE ON UNBLOCK ----------------
    updateToActive(selectedRow);

    console.log("Customer unblocked:", selectedCustomerId);
});



// ---------------------- DOM UPDATE FUNCTIONS ----------------------

function updateToBlocked(row) {
    // Background color update
    row.classList.add("bg-red-50");

    // Change status badge
    row.querySelector("td:nth-child(6)").innerHTML = `
        <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
            Blocked
        </span>
    `;

    // Replace action icons
    const actionsCell = row.querySelector("td:nth-child(7) .flex");

    actionsCell.innerHTML = `
        <button class="view-customer-btn text-blue-600 hover:text-blue-800 text-sm">
            <i class="fas fa-eye"></i>
        </button>
        <button class="edit-customer-btn text-purple-600 hover:text-purple-800 text-sm">
            <i class="fas fa-edit"></i>
        </button>
        <button class="unblock-customer-btn text-green-600 hover:text-green-800 text-sm">
            <i class="fas fa-check"></i>
        </button>
    `;

    // Re-bind event listeners (important)
    actionsCell.querySelector(".unblock-customer-btn").addEventListener("click", () => {
        selectedRow = row;
        unblockCustomerModal.classList.remove("hidden");
    });
}



function updateToActive(row) {
    // Remove red background
    row.classList.remove("bg-red-50");

    // Change status badge
    row.querySelector("td:nth-child(6)").innerHTML = `
        <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Active
        </span>
    `;

    // Replace icons
    const actionsCell = row.querySelector("td:nth-child(7) .flex");

    actionsCell.innerHTML = `
        <button class="view-customer-btn text-blue-600 hover:text-blue-800 text-sm">
            <i class="fas fa-eye"></i>
        </button>
        <button class="edit-customer-btn text-purple-600 hover:text-purple-800 text-sm">
            <i class="fas fa-edit"></i>
        </button>
        <button class="block-customer-btn text-red-600 hover:text-red-800 text-sm">
            <i class="fas fa-ban"></i>
        </button>
    `;

    // Re-bind block listener
    actionsCell.querySelector(".block-customer-btn").addEventListener("click", () => {
        selectedRow = row;
        blockCustomerModal.classList.remove("hidden");
    });
}

