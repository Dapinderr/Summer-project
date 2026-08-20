/* ==========================================================
   SecureVote
   File: createAdmin.js

   Run once:
   node createAdmin.js
   ========================================================== */

const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const mongoose = require("mongoose");

const User = require("./models/User");


/* ==========================================================
   ADMIN DETAILS
========================================================== */

const ADMIN = {

    name: "SecureVote Administrator",

    email: "admin@securevote.com",

    phone: "9876543210",

    dob: new Date("2000-01-01"),

    voterId: "ADMIN0001",

    governmentId: "ADMIN-SYSTEM",

    password: "Admin@123",

    role: "admin",

    isVerified: true,

    accountStatus: "active"

};


/* ==========================================================
   CREATE ADMIN
========================================================== */

async function createAdmin() {

    try {

        if (!process.env.MONGO_URI) {

            throw new Error(
                "MONGO_URI is missing from .env"
            );

        }


        await mongoose.connect(
            process.env.MONGO_URI
        );


        console.log(
            "MongoDB connected"
        );


        /* ==========================
           CHECK EXISTING ADMIN
        ========================== */

        const existingAdmin =
            await User.findOne({
                email:
                    ADMIN.email
            });


        if (existingAdmin) {

            /*
             * Convert existing account into
             * a valid administrator account.
             */

            existingAdmin.role =
                "admin";

            existingAdmin.isVerified =
                true;

            existingAdmin.accountStatus =
                "active";


            await existingAdmin.save();


            console.log(
                "Existing admin account updated."
            );

            console.log(
                `Email: ${existingAdmin.email}`
            );


            return;
        }


        /* ==========================
           CREATE ADMIN
        ========================== */

        const admin =
            await User.create(
                ADMIN
            );


        console.log(
            "Admin account created successfully."
        );

        console.log(
            `Email: ${admin.email}`
        );

    } catch (error) {

        console.error(
            "Create Admin Error:",
            error.message
        );

    } finally {

        await mongoose.connection.close();

        console.log(
            "MongoDB connection closed."
        );

    }

}


createAdmin();