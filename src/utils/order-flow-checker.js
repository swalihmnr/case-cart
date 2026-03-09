export default function flowChecker(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) return false;
  console.log(currentStatus, "it is first one");
  console.log(newStatus, "second time");
  currentStatus = currentStatus.trim().toLowerCase();
  newStatus = newStatus.trim().toLowerCase();

  const ORDER_ITEM_FLOW = {
    placed: ["confirmed"],
    confirmed: ["processing"],
    processing: ["shipped"],
    shipped: ["out_for_delivery"],
    out_for_delivery: ["delivered"],
    delivered: ["return_req"],
    return_req: ["returned"],
    cancelled: [],
    returned: [],
  };

  return ORDER_ITEM_FLOW[currentStatus]?.includes(newStatus) ?? false;
}
