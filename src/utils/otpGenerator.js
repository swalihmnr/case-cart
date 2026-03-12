export default function otp_generator() {
  return Math.floor(Math.random() * 900000 + 100000).toString();
}
