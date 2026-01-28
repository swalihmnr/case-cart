export default async function discountChecker(discIds,modelName,variantPrice,type){
    //disIds represents filtered offer/coupon Ids;
    //modelName represent modelName for finding offer/coupon
    //variant Price for calculte the discount
    //type represent to confirm percentange or fixedamount
    let discount=0;
    let bestDiscount=0;
    let name;
    let disType;
    let discountTypeValue;
    for(let id of discIds){
        const promotion=await modelName.findById(id._id)
        console.log(promotion)
        const discValue=Number(promotion.discountValue)||0;
        if(promotion[type]==="percentage"){
            discount=(discValue*variantPrice)/100
        }
        if(discount>bestDiscount){
            bestDiscount=discount
            name=promotion.title
            if(promotion[type]==='percentage'){
                disType="percentage"
                discountTypeValue=promotion.discountValue

            }
        }
    }

    console.log(bestDiscount,'it is the best discount')
   return{
    bestDiscount,
    name,
    disType,
    discountTypeValue
   } 
}