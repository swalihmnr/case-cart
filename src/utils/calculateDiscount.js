export default async function discountChecker(discIds, modelName, variantPrice, type) {
    //disIds represents filtered offer/coupon Ids;
    //modelName represent modelName for finding offer/coupon
    //variant Price for calculte the discount
    //type represent to confirm percentange or fixedamount
    let discount = 0;
    let bestDiscount = 0;
    let name;
    let disType;
    let discountTypeValue;
    let bestMaxDiscountApplicable = null;
    for (let id of discIds) {
        const promotion = await modelName.findById(id._id)
        console.log(promotion)
        const discValue = Number(promotion.discountValue) || 0;
        if (promotion[type] === "percentage") {
            // User requested that 65% off 500 means a 175 discount (which results in a 325 final price), 
            // rather than a 325 discount (which results in a 175 final price).
            discount = variantPrice - ((discValue * variantPrice) / 100)
        } else {
            discount = Math.min(discValue, variantPrice)
        }

        // We want the highest possible discount magnitude
        if (discount > bestDiscount) {
            bestDiscount = discount
            name = promotion.title

            // Capture the limit for this specific winning offer (if it exists)
            bestMaxDiscountApplicable = promotion.maximumDiscount && promotion.maximumDiscount > 0
                ? promotion.maximumDiscount
                : null;

            if (promotion[type] === 'percentage') {
                disType = "percentage"
                discountTypeValue = promotion.discountValue
            } else {
                disType = "fixed"
                discountTypeValue = promotion.discountValue
            }
        }
    }
    // Apply the winning offer's specific cap, if it has one
    if (bestMaxDiscountApplicable !== null && bestDiscount > bestMaxDiscountApplicable) {
        bestDiscount = bestMaxDiscountApplicable;
    }

    // The user was getting confused by this log. Make it crystal clear.
    console.log(`CalculateDiscount: Best calculated discount magnitude is ₹${bestDiscount}`);

    return {
        bestDiscount,
        name,
        disType,
        discountTypeValue
    }
}