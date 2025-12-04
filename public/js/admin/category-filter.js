
const input=document.getElementById('searchInput');
let timer;
input.addEventListener('input',()=>{
  clearTimeout(timer)
  timer=setTimeout(()=>{

   let search= input.value.trim()

     window.location.href=`/admin/category?page=1&search=${search}`
  
  },500)
})

