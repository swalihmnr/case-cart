import mongoose from 'mongoose';
import env from 'dotenv';
env.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const sampleOrder = await db.collection('orders').findOne({});
    if (sampleOrder) {
      console.log(`Sample Order:`, JSON.stringify(sampleOrder, null, 2));
    } else {
      console.log("No orders found in the database.");
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}
run();
