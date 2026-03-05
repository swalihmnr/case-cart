export default async function discountChecker(discIds, modelName, variantPrice, type) {
    // discIds represents filtered offer/coupon Ids;
    // modelName represent modelName for finding offer/coupon
    // variant Price for calculate the discount
    // type represent to confirm percentage or fixedamount
    let bestDiscount = 0;
    let name;
    let disType;
    let discountTypeValue;

    for (let id of discIds) {
        const promotion = await modelName.findById(id._id);
        if (!promotion) continue;

        let currentDiscount = 0;
        const discValue = Number(promotion.discountValue) || 0;
        const price = Number(variantPrice) || 0;
        const promoType = promotion[type];

        if (promoType === "percentage") {
            currentDiscount = (discValue * price) / 100;
            // Apply promotion-specific maximum discount if it exists and is > 0
            if (promotion.maximumDiscount && promotion.maximumDiscount > 0) {
                currentDiscount = Math.min(currentDiscount, Number(promotion.maximumDiscount));
            }
        } else if (promoType === "fixedamount") {
            currentDiscount = Math.min(discValue, price);
        }

        if (currentDiscount > bestDiscount) {
            bestDiscount = currentDiscount;
            name = promotion.title;
            disType = promoType;
            discountTypeValue = discValue;
        }
    }

    console.log(bestDiscount, 'it is the best discount');
    return {
        bestDiscount,
        name,
        disType,
        discountTypeValue
    };
}