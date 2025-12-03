window.clearFilters=clearFilters;
function clearFilters() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if(cb.id !== 'cat1') cb.checked = false;
            });
            document.querySelectorAll('input[type="radio"]').forEach(rb => {
                if(rb.id === 'price1') rb.checked = true;
                else rb.checked = false;
            });
        }