import mongoose from 'mongoose';
import env from 'dotenv';
import productModel from './src/models/admin/productModel.js';

env.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    const products = await productModel.find({}).limit(5);
    console.log("Sample Products in DB:");
    products.forEach(p => {
      console.log({
        id: p._id,
        name: p.name,
        productImages: p.productImages,
        hasImages: !!p.productImages,
        imagesLength: p.productImages ? p.productImages.length : 'N/A'
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error inspecting products:", error);
  }
}

run();
