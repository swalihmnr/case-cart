import mongoose from "mongoose";
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`db connected on ${process.env.MONGO_URI}`);
  } catch (err) {
    console.log(`db is not connectd to ${process.env.MONGO_URI}`);
  }
};
export default connectDB;
