window.invoicePrint=function(){
    window.print()
}
window.onafterprint=function(){
    setTimeout(() => {
        
        window.location.href='/order'
    }, 300);
}