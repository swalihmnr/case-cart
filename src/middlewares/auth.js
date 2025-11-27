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

export const attachUser=(req,res,next)=>{
  res.locals.user=req.session.user|| null
  next()
}