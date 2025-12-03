
const input=document.getElementById('searchInput');
let timer;
 const mode = searchInput.dataset.searchmode;
 console.log(mode)
console.log()
input.addEventListener('input',()=>{
  clearTimeout(timer)
  timer=setTimeout(()=>{

   let search= input.value.trim()
   if(mode!=="customer"){
     window.location.href=`/admin/category?page=1&search=${search}`
   }else{
     
    window.location.href=`/admin/customers?page=1&search=${search}&filter=${filter}`
   }
  },500)
})

