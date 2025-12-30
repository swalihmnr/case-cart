const  within7Days=(date)=>{
     const now =new Date();
     const deliveredDate=new Date(date);
     const diffInMs = now - deliveredDate;
     const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
     return diffInDays <= 7;

}
export default {
    within7Days
}