//search script
const filterSelect=document.getElementById('product-filter')
console.log(filterSelect,"hlow")
const input=document.getElementById('searchInput');
let timer;
input.addEventListener('input',()=>{
  clearTimeout(timer)
  timer=setTimeout(()=>{
    const filter=filterSelect.value
    console.log(filter)
   let search= input.value.trim()  
    window.location.href=`/admin/product-list?page=1&search=${search}&filter=${filter}`
   
  },500)
})

filterSelect.addEventListener('change',()=>{
        const filter=filterSelect.value.trim()
        const search=input.value.trim()
        console.log(filter)
        window.location.href=`/admin/product-list?page=1&search=${search}&filter=${filter}`
})