export const isLogin=(req,res,next)=>{
  if(req.session.isLogin){
    next()
  }else{
    return res.redirect('/signup')
  }
}
export const isLogged=(req,res,next)=>{
  if(req.session.isLogin){
    res.redirect('/home');
  }else{
    next();
  }
}