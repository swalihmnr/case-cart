import Razorpay from "razorpay";
import env from "dotenv";
env.config();

const razorpayInstence = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export default razorpayInstence;
