import HomepageSettings from "../../models/admin/homepageSettingsModel.js";
import { uploadBufferTocloudnery } from "../../utils/cloudneryUpload.js";

// Helper: get or create the singleton settings doc
async function getSettings() {
  let settings = await HomepageSettings.findOne({ key: "main" });
  if (!settings) {
    settings = await HomepageSettings.create({ key: "main" });
  }
  return settings;
}

// GET /admin/homepage-settings
const getHomepageSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.render("./admin/homepage-settings", {
      settings,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load homepage settings");
    res.redirect("/admin/dashboard");
  }
};

// POST /admin/homepage-settings — save main settings
const saveHomepageSettings = async (req, res) => {
  try {
    const {
      // ticker
      tickerEnabled, tickerSpeed, showProducts, showCategories,
      // hero
      heroEnabled, heroBannerType, heroBadge, heroHeading, heroSubtext, heroCtaText, heroCtaLink,
      bannerImageLink, bannerImageAlt, bannerAspectRatio, bannerFitMode,
      // chatbot
      chatbotEnabled, chatbotGreeting,
    } = req.body;

    const updateFields = {
      "ticker.isEnabled": tickerEnabled === "on",
      "ticker.speed": Math.min(120, Math.max(10, parseInt(tickerSpeed) || 30)),
      "ticker.showProducts": showProducts === "on",
      "ticker.showCategories": showCategories === "on",
      "heroBanner.isEnabled": heroEnabled === "on",
      "heroBanner.bannerType": heroBannerType || "gradient_text",
      "heroBanner.badge": heroBadge?.trim() || "BIG SAVING DAYS",
      "heroBanner.heading": heroHeading?.trim() || "Up to 80% Off",
      "heroBanner.subtext": heroSubtext?.trim() || "",
      "heroBanner.ctaText": heroCtaText?.trim() || "Shop Now",
      "heroBanner.ctaLink": heroCtaLink?.trim() || "/product",
      "heroBanner.imageLink": bannerImageLink?.trim() || "/product",
      "heroBanner.imageAlt": bannerImageAlt?.trim() || "Promotional Banner",
      "heroBanner.aspectRatio": bannerAspectRatio || "auto",
      "heroBanner.fitMode": bannerFitMode || "cover",
      "chatbot.isEnabled": chatbotEnabled === "on",
      "chatbot.greeting": chatbotGreeting?.trim() || "👋 Hi! How can I help?",
      updatedAt: new Date(),
    };

    // If a new banner image was uploaded (Photoshop PNG/JPG/WEBP etc.)
    if (req.file) {
      const cloudUrl = await uploadBufferTocloudnery(req.file.buffer);
      updateFields["heroBanner.customImage.url"] = cloudUrl.secure_url;
      updateFields["heroBanner.customImage.publicId"] = cloudUrl.public_id;
      // Auto-switch bannerType to custom_image when a photo is uploaded unless explicitly chosen otherwise
      updateFields["heroBanner.bannerType"] = "custom_image";
    }

    await HomepageSettings.findOneAndUpdate(
      { key: "main" },
      updateFields,
      { upsert: true, new: true }
    );

    req.flash("success", "Homepage banner & settings saved successfully!");
    res.redirect("/admin/homepage-settings");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to save settings: " + err.message);
    res.redirect("/admin/homepage-settings");
  }
};

// POST /admin/homepage-settings/banner/delete-image
const deleteBannerImage = async (req, res) => {
  try {
    await HomepageSettings.findOneAndUpdate(
      { key: "main" },
      {
        "heroBanner.customImage.url": "",
        "heroBanner.customImage.publicId": "",
        "heroBanner.bannerType": "gradient_text",
        updatedAt: new Date(),
      }
    );
    req.flash("success", "Custom banner image removed. Switched to gradient banner.");
    res.redirect("/admin/homepage-settings");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to remove banner image");
    res.redirect("/admin/homepage-settings");
  }
};

// POST /admin/homepage-settings/ticker/add — add a custom ticker item
const addTickerItem = async (req, res) => {
  try {
    const { text, link, type } = req.body;
    if (!text?.trim()) {
      req.flash("error", "Ticker item text is required");
      return res.redirect("/admin/homepage-settings");
    }
    await HomepageSettings.findOneAndUpdate(
      { key: "main" },
      { $push: { "ticker.customItems": { text: text.trim(), link: link?.trim() || "/product", type: type || "promo", isActive: true } } },
      { upsert: true }
    );
    req.flash("success", "Ticker item added!");
    res.redirect("/admin/homepage-settings");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to add ticker item");
    res.redirect("/admin/homepage-settings");
  }
};

// POST /admin/homepage-settings/ticker/delete/:itemId
const deleteTickerItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await HomepageSettings.findOneAndUpdate(
      { key: "main" },
      { $pull: { "ticker.customItems": { _id: itemId } } }
    );
    req.flash("success", "Ticker item removed");
    res.redirect("/admin/homepage-settings");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to delete ticker item");
    res.redirect("/admin/homepage-settings");
  }
};

// POST /admin/homepage-settings/ticker/toggle/:itemId
const toggleTickerItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const settings = await getSettings();
    const item = settings.ticker.customItems.id(itemId);
    if (item) {
      item.isActive = !item.isActive;
      await settings.save();
    }
    res.json({ success: true, isActive: item?.isActive });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export default {
  getHomepageSettings,
  saveHomepageSettings,
  deleteBannerImage,
  addTickerItem,
  deleteTickerItem,
  toggleTickerItem,
};
