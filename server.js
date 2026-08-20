/* ==========================================================
   SecureVote - Online Voting System
   File: server.js
   ========================================================== */


/* ==============================
   ENVIRONMENT - LOAD FIRST
============================== */

const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});


/* ==============================
   IMPORTS
============================== */

const express = require("express");
const cors = require("cors");

const connectDB =
    require("./config/db");


/* ==============================
   ROUTES
============================== */

const authRoutes =
    require("./routes/authRoutes");

const electionRoutes =
    require("./routes/electionRoutes");

const voteRoutes =
    require("./routes/voteRoutes");

const adminRoutes =
    require("./routes/adminRoutes");


/* ==============================
   DATABASE
============================== */

connectDB();


/* ==============================
   APP
============================== */

const app = express();


/* ==============================
   MIDDLEWARE
============================== */

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/* ==============================
   FRONTEND
============================== */

const publicPath =
    path.join(
        __dirname,
        "public"
    );

app.use(
    express.static(publicPath)
);


/* ==============================
   TEST API
============================== */

app.get(
    "/api/status",
    (req, res) => {

        return res.status(200).json({

            success: true,

            message:
                "SecureVote API is running"

        });

    }
);


/* ==============================
   HOME
============================== */

app.get(
    "/",
    (req, res) => {

        return res.sendFile(
            path.join(
                publicPath,
                "index.html"
            )
        );

    }
);


/* ==========================================================
   API ROUTES
========================================================== */


/* ==============================
   AUTHENTICATION

   /api/auth/*
============================== */

app.use(
    "/api/auth",
    authRoutes
);


/* ==============================
   PUBLIC ELECTIONS

   /api/elections/*
============================== */

app.use(
    "/api/elections",
    electionRoutes
);


/* ==============================
   VOTING

   /api/votes/*
============================== */

app.use(
    "/api/votes",
    voteRoutes
);


/* ==============================
   ADMINISTRATION

   /api/admin/*
============================== */

app.use(
    "/api/admin",
    adminRoutes
);


/* ==========================================================
   API 404
========================================================== */

/*
 * IMPORTANT:
 * Keep this AFTER all API routes.
 */

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                "API route not found",

            path:
                req.originalUrl,

            method:
                req.method

        });

    }
);


/* ==========================================================
   ERROR HANDLER
========================================================== */

app.use(
    (err, req, res, next) => {

        console.error(
            "Server Error:",
            err.stack || err
        );


        /* ==========================
           MULTER FILE SIZE
        ========================== */

        if (
            err.code ===
            "LIMIT_FILE_SIZE"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "File size must not exceed 5 MB"

            });

        }


        /* ==========================
           MULTER OTHER ERRORS
        ========================== */

        if (
            err.name ===
            "MulterError"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    err.message

            });

        }


        /* ==========================
           GENERAL ERROR
        ========================== */

        return res.status(
            err.status || 500
        ).json({

            success: false,

            message:
                err.message ||
                "Internal server error"

        });

    }
);


/* ==========================================================
   SERVER
========================================================== */

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `SecureVote Server: http://localhost:${PORT}`
        );

        console.log(
            `Admin Voters API: http://localhost:${PORT}/api/admin/voters`
        );

    }
);