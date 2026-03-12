import otp_generator from "../utils/otpGenerator.js";
import modelOtp from "../models/otpModel.js";
import mailSender from "./mailSender.js";
export default async function otpGeneratorTodb(user, email) {
  await modelOtp.deleteOne({ userId: user._id });
  const Otp = otp_generator();
  const newOtp = new modelOtp({
    userId: await user._id,
    otp: Otp,
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  });
  await newOtp.save();
  mailSender(email, Otp);
  console.log(`otp send: ${Otp}`);
  return Otp;
}
