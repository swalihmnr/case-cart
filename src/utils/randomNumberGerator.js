import crypto from "crypto";

function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000);
}
console.log(generateSecureOTP());
export default generateSecureOTP