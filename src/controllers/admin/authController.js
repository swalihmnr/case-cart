import adminModel from '../../models/admin/adminModel.js'
import bcrypt from 'bcrypt';
// Render admin login page
// Used to show login UI for admin
const getLogin = (req, res) => {
    res.render('./admin/adminLogin')
}

// Logout admin safely
const adminLogout = (req, res) => {
    try {
        req.session.admin = null;
        return res.redirect("/admin/login");
    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Handle admin login
// 1. Check admin exists by email
// 2. Compare password using bcrypt
// 3. Store admin data in session on success
const postLogin = async (req, res) => {
    const { Email, Password } = req.body
    let existing = await adminModel.findOne({ email: Email })
    if (!existing) {
        res.json({ success: false, message: "it is not admin" })
    } else {
        let isValidPass = await bcrypt.compare(Password, existing.password);
        if (isValidPass) {

            req.session.admin = {
                id: existing._id,
                email: existing.email
            }
            res.json({
                success: true,
                message: 'admin logged'
            })
        } else {
            res.json({
                success: false,
                message: 'incorrect password'
            })
        }
    }


}
export default {
     getLogin,
     adminLogout,
     postLogin
}
