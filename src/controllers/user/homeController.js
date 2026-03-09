// ==============================
// GET HOME PAGE
// ==============================
// Renders user home page
let getHome = (req, res) => {
  console.log(req);
  res.render("./user/home");
};

export default {
  getHome,
};
