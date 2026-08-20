/* ==========================================================
   SecureVote - Online Voting System
   File: routes/authRoutes.js
   ========================================================== */

const express = require("express");

const router = express.Router();


/* ==============================
   CONTROLLERS
============================== */

const {
    register,
    login,
    getMe,
    verifyOTP,
    resendOTP
} = require("../controllers/authController");


/* ==============================
   MIDDLEWARE
============================== */

const {
    protect
} = require("../middleware/authMiddleware");

const upload =
    require("../middleware/uploadMiddleware");


/* ==============================
   REGISTER
============================== */

/*
   governmentId must match:

   formData.append(
       "governmentId",
       selectedFile
   );
*/

router.post(
    "/register",
    upload.single("governmentId"),
    register
);


/* ==============================
   VERIFY OTP
============================== */

router.post(
    "/verify-otp",
    verifyOTP
);


/* ==============================
   RESEND OTP
============================== */

router.post(
    "/resend-otp",
    resendOTP
);


/* ==============================
   LOGIN
============================== */

router.post(
    "/login",
    login
);


/* ==============================
   CURRENT LOGGED-IN USER
============================== */

router.get(
    "/me",
    protect,
    getMe
);



/* ==============================
   EXPORT
============================== */

module.exports = router;