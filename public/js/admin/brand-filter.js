let searchInput = document.getElementById("searchInput");
let debounceTimer;

searchInput.addEventListener("input", function (e) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    let searchValue = e.target.value.trim();
    const url = new URL(window.location.href);
    if (searchValue) {
      url.searchParams.set("search", searchValue);
    } else {
      url.searchParams.delete("search");
    }
    url.searchParams.set("page", 1);
    window.location.href = url.toString();
  }, 1000); // 1 sec delay
});
