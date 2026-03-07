import api from "../api.js";

// ======================
// CLEAR FILTERS
// ======================
window.clearFilters = clearFilters;

function clearFilters() {

    const query = new URLSearchParams();

    query.set("page", 1);
    query.set("search", "");
    query.set("price", "all");
    query.set("sort", "");
    query.set("Categories", "");

    window.location.href = `/product?${query.toString()}`;

}


// ======================
// ELEMENTS
// ======================
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const priceRadios = document.querySelectorAll('input[name="price"]');
const categoryCheckboxes = document.querySelectorAll(".filter-checkbox");

let timer;


// ======================
// SEARCH INPUT (DEBOUNCE)
// ======================
search?.addEventListener("input", function () {

    clearTimeout(timer);

    const value = this.value.trim();

    timer = setTimeout(() => {

        if (value.length === 0) {
            clearFilters();
            return;
        }

        if (value.length < 2) return;

        applyFilters();

    }, 800); // wait 800ms after typing stops

});


// ======================
// PRICE FILTER
// ======================
priceRadios.forEach(radio => {

    radio.addEventListener("change", () => {

        clearTimeout(timer);

        timer = setTimeout(applyFilters, 300);

    });

});


// ======================
// CATEGORY FILTER
// ======================
categoryCheckboxes.forEach(cb => {

    cb.addEventListener("change", () => {

        clearTimeout(timer);

        timer = setTimeout(applyFilters, 300);

    });

});


// ======================
// SORT FILTER
// ======================
sort?.addEventListener("change", () => {

    clearTimeout(timer);

    timer = setTimeout(applyFilters, 200);

});


// ======================
// APPLY FILTER FUNCTION
// ======================
function applyFilters() {

    const selectedCategories = [...document.querySelectorAll(".filter-checkbox:checked")]
        .map(cb => cb.value);

    const selectedPrice =
        document.querySelector('input[name="price"]:checked')?.value || "all";

    const query = new URLSearchParams();

    query.set("page", 1);
    query.set("search", search?.value.trim() || "");
    query.set("price", selectedPrice);
    query.set("sort", sort?.value || "");
    query.set("Categories", selectedCategories.join(","));

    window.location.href = `/product?${query.toString()}`;

}


// ======================
// ADD TO WISHLIST
// ======================
const addWishlist = async (productId, variantId) => {

    try {

        const res = await api.addWishlistAxios(productId, variantId);

        console.log(res);

        Swal.fire({
            icon: "success",
            title: "Added to Wishlist",
            text: res.data.message,
            confirmButtonColor: "#667eea",
            timer: 1200,
            showConfirmButton: false
        });

        setTimeout(() => location.reload(), 800);

    } catch (error) {

        console.log(error.response);

        Swal.fire({
            icon: "info",
            title: "Notice",
            text: error.response?.data?.message || "Something went wrong",
            confirmButtonColor: "#667eea"
        });

    }

};

window.addWishlist = addWishlist;