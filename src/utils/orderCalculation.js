export const calculateRefund = (order, cancelledItemPrice) => {

    let remainingAmount = order.finalAmount - cancelledItemPrice;
    let refundAmount = cancelledItemPrice;
    let couponRemoved = false;

    // If coupon exists
    if (order.couponDiscount && order.couponMinOrder) {

        // Check if remaining order meets minimum order value
        if (remainingAmount < order.couponMinOrder) {

            // Coupon becomes invalid
            remainingAmount += order.couponDiscount;

            refundAmount = cancelledItemPrice - order.couponDiscount;

            couponRemoved = true;
        }
    }

    return {
        remainingAmount,
        refundAmount,
        couponRemoved
    };
};