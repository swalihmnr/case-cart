import api from "../api.js";

window.clearFilters=clearFilters
function clearFilters() {
    const query = new URLSearchParams();

    query.set("page", 1);
    query.set("search", "");
    query.set("price", "all");
    query.set("sort", "");
    query.set("Categories", "");

    window.location.href = `/product?${query.toString()}`;
}

const search = document.getElementById("search");
const sort = document.getElementById("sort");
const priceRadios = document.querySelectorAll('input[name="price"]');
const categoryCheckboxes = document.querySelectorAll(".filter-checkbox");

let timer;

// ----------------------
// SEARCH INPUT
// ----------------------
search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(applyFilters, 700);
});

// ----------------------
// PRICE CHANGE
// ----------------------
priceRadios.forEach(r => r.addEventListener("change", applyFilters));

// ----------------------
// CATEGORY CHANGE
// ----------------------
categoryCheckboxes.forEach(cb =>
    cb.addEventListener("change", () => {
        clearTimeout(timer);
        timer = setTimeout(applyFilters, 500);
    })
);

// ----------------------
// SORT CHANGE
// ----------------------
sort.addEventListener("change", applyFilters);

// ----------------------
// APPLY FILTER
// ----------------------
function applyFilters() {
    const selectedCategories = [...document.querySelectorAll(".filter-checkbox:checked")]
        .map(cb => cb.value);

    const selectedPrice = document.querySelector('input[name="price"]:checked')?.value || "all";

    const query = new URLSearchParams();

    query.set("page", 1);
    query.set("search", search.value.trim());
    query.set("price", selectedPrice);
    query.set("sort", sort.value);
    query.set("Categories", selectedCategories);

    window.location.href = `/product?${query.toString()}`;
}
const addWishlist = async (productId, variantId) => {
    try {
        let res=await api.addWishlistAxios(productId,variantId)
        location.reload()
        if(res.data.success){
          Swal.fire({
        icon: 'success',
        title: 'added to wishlist',
        text: res.data.message,
        confirmButtonColor: '#667eea'
      });
      location.reload()
        }else{
             Swal.fire({
        icon: 'warning',
        title: 'something went wrong',
        text: res.data.message,
        confirmButtonColor: '#667eea'
      }); 
        }
    } catch (error) {
          Swal.fire({
        icon: 'error',
        title: 'something went wrong',
        text: error.response.data.message,
        confirmButtonColor: '#667eea'
      });
        console.log(error.response)
    }
    
}; 
window.addWishlist = addWishlist;