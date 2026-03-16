import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.7/+esm";

const api = axios.create({
  baseURL: "/",
  timeout: 20000,
});

const addCategoryAxios = async (data) => {
  try {
    let res = await api.post("/admin/add-category", data);

    return res;
  } catch (error) {
    return error.response;
  }
};
const blockCategoryAxios = async (data) => {
  try {
    let res = await api.patch(`/admin/category/block/${data}`);
    return res;
  } catch (err) {
    console.log(err);
  }
};
const editCategoryAxios = async (id, data) => {
  let res = await api.patch(`/admin/category/edit/${id}`, data);
  return res;
};
const blockCustomerAxios = async (id) => {
  console.log(id);
  let res = await api.patch(`/admin/customers/block/${id}`);
  return res;
};

const addProductAxios = async (formData) => {
  let res = await api.post("/admin/add-product", formData);

  return res;
};
const blockProductyAxios = async (data) => {
  try {
    let res = await api.patch(`/admin/product/list/block/${data}`);
    return res;
  } catch (err) {
    console.log(err);
  }
};
const uploadImgProductAxios = async (id, formData) => {
  let res = await api.patch(`/admin/product/edit/${id}/img-upload`, formData, {
    headers: { "content-Type": "multipart/form-data" },
  });
  return res;
};

const editImgProductAxios = async (formData, productId) => {
  let res = await api.patch(
    `/admin/product/${productId}/edit-image`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res;
};
const setMainAxios = async (id, imgIndx) => {
  try {
    let res = await api.patch(`/admin/product/edit/${id}/img-set-main`, {
      imgIndx,
    });
    return res;
  } catch (error) {
    console.log(error);
  }
};
const editImgDeleteAxios = async (id, productId) => {
  let res = await api.patch(`/admin/product/edit/${productId}/img-delete`, {
    id,
  });
  console.log(res);
  return res;
};
const editProductBasicInfoAxios = async (data, productId) => {
  return await api.patch(`/admin/product/edit/${productId}/basic-info`, data);
};

const variantDetialsAxios = async (data) => {
  return await api.patch(`/admin/product/edit/${data}/variant-data`);
};
const editVariantSaveAxios = async (id, data) => {
  return await api.post(`/admin/product/edit/${id}/variant-save`, data);
};
const toggleListUnlistAxios = async (id) => {
  return await api.patch(`/admin/product/edit/${id}/veriant-toggle`);
};
const updateStatus = async (selectedValue, orderId, orderItemId) => {
  try {
    return await api.patch(`/admin/order/${orderId}/status`, {
      orderItemId,
      selectedValue,
    });
  } catch (error) {
    return error.response;
  }
};
const reqApproveAxios = async (orderId, itemId) => {
  try {
    return await api.patch(`/admin/order/${orderId}/approve`, {
      itemId,
    });
  } catch (error) {
    return error.response;
  }
};
const reqRejectAxios = async (orderId, itemId) => {
  try {
    return await api.patch(`/admin/order/${orderId}/reject`, {
      itemId,
    });
  } catch (error) {
    return error.response;
  }
};

const createOfferAxios = async (data) => {
  try {
    return await api.post("/admin/offer/add", data);
  } catch (error) {
    return error.response;
  }
};
const offerEditAxios = async (payload) => {
  try {
    return await api.post("/admin/offer/edit", payload);
  } catch (error) {
    return error.response;
  }
};
const deleteOfferAxios = async (offerId) => {
  try {
    return await api.patch(`/admin/offer/delete/${offerId}`);
  } catch (error) {
    error.response;
  }
};
const createCouponAxios = async (payload) => {
  try {
    console.log(payload, "it si the palya");
    return await api.post("/admin/coupen/add", payload);
  } catch (error) {
    return error.response;
  }
};
const editCouponAxios = async (payload) => {
  try {
    return await api.patch("/admin/coupen/edit", payload);
  } catch (error) {
    return error.response;
  }
};
const deleteCouponAxios = async(id) => {
  try {
    return await api.patch(`/admin/coupen/del/${id}`);
  } catch (error) {
    return error.response;
  }
};
export default {
  addCategoryAxios,
  blockCategoryAxios,
  editCategoryAxios,
  blockCustomerAxios,
  addProductAxios,
  blockProductyAxios,
  editImgProductAxios,
  setMainAxios,
  uploadImgProductAxios,
  editImgDeleteAxios,
  editProductBasicInfoAxios,
  variantDetialsAxios,
  editVariantSaveAxios,
  toggleListUnlistAxios,
  updateStatus,
  reqApproveAxios,
  reqRejectAxios,
  createOfferAxios,
  offerEditAxios,
  deleteOfferAxios,
  createCouponAxios,
  editCouponAxios,
  deleteCouponAxios,
};
