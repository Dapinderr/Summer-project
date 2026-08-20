const jwt = require("jsonwebtoken");
const User = require("../models/User");


/* ==============================
   PROTECT ROUTES
============================== */

exports.protect = async (req, res, next) => {
    try {

        const authorization =
            req.headers.authorization;

        if (
            !authorization ||
            !authorization.startsWith(
                "Bearer "
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required"
            });
        }

        const token =
            authorization.split(" ")[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await User.findById(
                decoded.id
            ).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "User account no longer exists"
            });
        }

        req.user = user;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired token"
        });
    }
};


/* ==============================
   ADMIN ONLY
============================== */

exports.adminOnly =
    (req, res, next) => {

        if (
            !req.user ||
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Administrator access required"
            });
        }

        next();
    };