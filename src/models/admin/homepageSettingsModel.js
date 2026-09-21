import mongoose from "mongoose";

const tickerItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  link: { type: String, default: "/product" },
  type: { type: String, enum: ["promo", "product", "category", "brand"], default: "promo" },
  isActive: { type: Boolean, default: true },
}, { _id: true });

const homepageSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },

  // Ticker
  ticker: {
    isEnabled: { type: Boolean, default: true },
    speed: { type: Number, default: 30, min: 10, max: 120 }, // seconds
    showProducts: { type: Boolean, default: true },
    showCategories: { type: Boolean, default: true },
    customItems: [tickerItemSchema],
  },

  // Hero Banner
  heroBanner: {
    isEnabled: { type: Boolean, default: true },
    bannerType: { type: String, enum: ["gradient_text", "custom_image"], default: "gradient_text" },
    customImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    imageLink: { type: String, default: "/product" },
    imageAlt: { type: String, default: "Promotional Banner" },
    aspectRatio: { type: String, default: "auto" }, // 'auto', '16/9', '21/9', '3/1', '4/1'
    fitMode: { type: String, enum: ["cover", "contain", "fill"], default: "cover" },
    badge: { type: String, default: "BIG SAVING DAYS" },
    heading: { type: String, default: "Up to 80% Off" },
    subtext: { type: String, default: "Top Cases, Leather Accessories & MagSafe Essentials at Unbeatable Prices." },
    ctaText: { type: String, default: "Shop Now" },
    ctaLink: { type: String, default: "/product" },
  },

  // Chatbot
  chatbot: {
    isEnabled: { type: Boolean, default: true },
    greeting: { type: String, default: "👋 Hi! I'm CaseCart's AI assistant.\nHow can I help you today?" },
  },

  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("HomepageSettings", homepageSettingsSchema);
