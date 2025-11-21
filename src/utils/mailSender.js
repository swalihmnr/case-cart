import nodemailer from 'nodemailer'
export default function mailSender(mail,Otp){
    console.log('mail running')
    let clientMail=mail
    const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.USER_MAIL,
        pass:process.env.MAIL_PASS
    }
})
const mailOption={
    from:process.env.USER_MAIL,
    to:clientMail,
    subject:"Otp Verification",
    text:`Your Otp is ${Otp}`
}
transporter.sendMail(mailOption,(err,info)=>{
    if(err){
        console.log(`this error happened from mailtransporter${err}`)
    }else{
        console.log(`this ${info.response}`)
    }
})
}