import offerModel from "../models/admin/offerModel.js";

const calculateBestItemOffer = async (item) => {
  const orgPrice = item.variant.orgPrice;
  const salePrice = item.variant.salePrice;
  const quantity = item.quantity;

  // Calculate current discount from sale price
  const currentDiscountPerUnit = orgPrice - salePrice;

  console.log("Original Price:", orgPrice);
  console.log("Sale Price:", salePrice);
  console.log("Current Discount per unit:", currentDiscountPerUnit);

  // First check: If sale price already gives better discount than any offer could
  // We need to find the maximum possible offer discount first
  let bestOfferDiscountPerUnit = 0;
  let bestOffer = null;

  const offers = await offerModel.find({
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    $or: [
      { applicableOn: "product", productIds: { $in: [item.product._id] } },
      { applicableOn: "category", categoryIds: { $in: [item.product.catgId] } },
    ],
  });

  console.log("Found offers:", offers.length);

  for (const offer of offers) {
    if (offer.offerType === "percentage") {
      // Calculate percentage discount on orgPrice
      let discount = (orgPrice * offer.discountValue) / 100;
      console.log(`Offer ${offer.title}: ${discount} discount`);

      // Apply max cap per unit ONLY if explicitly set on the offer
      if (offer.maximumDiscount && offer.maximumDiscount > 0) {
        if (discount > offer.maximumDiscount) {
          discount = offer.maximumDiscount;
        }
      }

      if (discount > bestOfferDiscountPerUnit) {
        bestOfferDiscountPerUnit = discount;
        bestOffer = offer;
      }
    }
    // Add other offer types if needed (fixed amount, etc.)
  }

  // Compare current discount vs best offer discount
  let finalDiscountPerUnit;
  let appliedOffer = null;

  if (currentDiscountPerUnit >= bestOfferDiscountPerUnit) {
    // Current sale price is better or equal
    finalDiscountPerUnit = currentDiscountPerUnit;
    appliedOffer = null; // No offer applied, using sale price
    console.log("Using sale price discount:", currentDiscountPerUnit);
  } else {
    // Offer is better
    finalDiscountPerUnit = bestOfferDiscountPerUnit;
    appliedOffer = bestOffer;
    console.log("Using offer discount:", bestOfferDiscountPerUnit);
  }

  // Calculate final price
  const finalUnitPrice = Math.floor(orgPrice - finalDiscountPerUnit);

  // Calculate total discount amount for quantity
  const totalDiscountAmount = finalDiscountPerUnit * quantity;
  const totalFinalPrice = finalUnitPrice * quantity;

  console.log("Final Discount per unit:", finalDiscountPerUnit);
  console.log("Final Unit Price:", finalUnitPrice);
  console.log("Total for", quantity, "items:", totalFinalPrice);
  console.log("Total Discount:", totalDiscountAmount);
  console.log(
    "Applied Offer:",
    appliedOffer ? appliedOffer.title : "None (using sale price)",
  );

  return {
    bestOffer: appliedOffer,
    discountAmount: finalDiscountPerUnit, // per unit discount
    finalPrice: finalUnitPrice, // per unit final price
  };
};

export default calculateBestItemOffer;
