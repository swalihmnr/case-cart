export const otpAccess=(req,res,next)=>{
    if(req.session.tempUserId){
        next()
    }else{
        res.redirect('/signup')
    }
   
}