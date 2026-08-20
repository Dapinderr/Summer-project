/* ==========================================================
   SecureVote - Online Voting System
   File: middleware/adminMiddleware.js
   ========================================================== */


/* ==========================================================
   ADMIN ONLY MIDDLEWARE
========================================================== */

const adminOnly = (
    req,
    res,
    next
) => {

    try {

        /* ==========================
           CHECK AUTHENTICATION
        ========================== */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required"

            });

        }


        /* ==========================
           CHECK ADMIN ROLE
        ========================== */

        if (
            req.user.role !== "admin"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Administrator access required"

            });

        }


        /* ==========================
           CHECK ACCOUNT
        ========================== */

        if (
            !req.user.isVerified ||
            req.user.accountStatus !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Administrator account is not active"

            });

        }


        /* ==========================
           ACCESS GRANTED
        ========================== */

        next();


    } catch (error) {

        console.error(
            "Admin Middleware Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to verify administrator access"

        });

    }

};


/* ==========================================================
   EXPORT
========================================================== */

module.exports = {
    adminOnly
};