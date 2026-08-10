import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function measure() {
  console.log("Connecting to MongoDB Atlas...");
  const startConnect = Date.now();
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const connectDuration = Date.now() - startConnect;
    console.log(`Connected successfully in ${connectDuration}ms`);

    const db = mongoose.connection.db;

    // Measure query time on users collection
    console.log("\nMeasuring query on 'users' collection...");
    const startUsers = Date.now();
    const userCount = await db.collection('users').countDocuments();
    const usersDuration = Date.now() - startUsers;
    console.log(`countDocuments() on 'users' took ${usersDuration}ms (Found ${userCount} users)`);

    // Measure query time on products collection
    console.log("\nMeasuring query on 'products' collection...");
    const startProducts = Date.now();
    const products = await db.collection('products').find({}).limit(10).toArray();
    const productsDuration = Date.now() - startProducts;
    console.log(`find().limit(10) on 'products' took ${productsDuration}ms (Found ${products.length} products)`);

    // Measure query time on orders collection
    console.log("\nMeasuring query on 'orders' collection...");
    const startOrders = Date.now();
    const orders = await db.collection('orders').find({}).limit(10).toArray();
    const ordersDuration = Date.now() - startOrders;
    console.log(`find().limit(10) on 'orders' took ${ordersDuration}ms (Found ${orders.length} orders)`);

  } catch (err) {
    console.error("Database latency test failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from database.");
  }
}

measure();
