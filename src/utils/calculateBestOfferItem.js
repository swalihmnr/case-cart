import offerModel from "../models/admin/offerModel.js";
const calculateBestItemOffer = async (item) => {
  const itemTotal = item.quantity * item.variant.salePrice;

  const offers = await offerModel.find({
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    $or: [
      {
        applicableOn: "product",
        productIds: { $in: [item.product._id] }
      },
      {
        applicableOn: "category",
        categoryIds: { $in: [item.product.catgId] }
      }
    ]
  });

  let bestOffer = null;
  let bestDiscount = 0;

  for (const offer of offers) {
    // Safe minimum order check
    if (
      offer.minimumOrderValue &&
      itemTotal < offer.minimumOrderValue
    ) {
      continue;
    }

    if (offer.offerType === "percentage") {
      const discount = Math.round(
        (itemTotal * offer.discountValue) / 100
      );

      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    }
  }

  return {
    bestOffer,
    discountAmount: bestDiscount,
    finalPrice: itemTotal - bestDiscount
  };
};

export default calculateBestItemOffer;
