/* ==========================================================
   SecureVote - Online Voting System
   File: models/User.js
   ========================================================== */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


/* ==========================================================
   USER SCHEMA
========================================================== */

const userSchema = new mongoose.Schema(
    {

        /* ==========================
           PERSONAL INFORMATION
        ========================== */

        name: {
            type: String,
            required: [
                true,
                "Full name is required"
            ],
            trim: true,
            minlength: 3,
            maxlength: 100
        },


        email: {
            type: String,
            required: [
                true,
                "Email is required"
            ],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },


        phone: {
            type: String,
            required: [
                true,
                "Phone number is required"
            ],
            trim: true,
            match: [
                /^[6-9]\d{9}$/,
                "Enter a valid 10-digit mobile number"
            ]
        },


        dob: {
            type: Date,
            required: [
                true,
                "Date of birth is required"
            ]
        },


        /* ==========================
           VOTER INFORMATION
        ========================== */

        voterId: {
            type: String,
            required: [
                true,
                "Voter ID is required"
            ],
            unique: true,
            trim: true,
            uppercase: true,
            index: true
        },


        /* ==========================
           GOVERNMENT ID DOCUMENT
        ========================== */

        governmentId: {
            type: String,
            required: [
                true,
                "Government ID document is required"
            ]
        },


        /* ==========================
           AUTHENTICATION
        ========================== */

        password: {
            type: String,
            required: [
                true,
                "Password is required"
            ],
            minlength: 8,
            select: false
        },


        role: {
            type: String,
            enum: [
                "voter",
                "admin"
            ],
            default: "voter"
        },


        /* ==========================
           EMAIL VERIFICATION
        ========================== */

        isVerified: {
            type: Boolean,
            default: false
        },


        otp: {
            type: String,
            select: false
        },


        otpExpires: {
            type: Date,
            select: false
        },


        /* ==========================
           ACCOUNT STATUS
        ========================== */

        accountStatus: {
            type: String,
            enum: [
                "pending",
                "active",
                "suspended"
            ],
            default: "pending"
        }

    },
    {
        timestamps: true
    }
);


/* ==========================================================
   HASH PASSWORD BEFORE SAVE
========================================================== */

userSchema.pre(
    "save",
    async function () {

        if (
            !this.isModified(
                "password"
            )
        ) {
            return;
        }


        const salt =
            await bcrypt.genSalt(12);


        this.password =
            await bcrypt.hash(
                this.password,
                salt
            );

    }
);


/* ==========================================================
   COMPARE PASSWORD
========================================================== */

userSchema.methods.comparePassword =
    async function (enteredPassword) {

        return bcrypt.compare(
            enteredPassword,
            this.password
        );

    };


/* ==========================================================
   EXPORT MODEL
========================================================== */

module.exports =
    mongoose.model(
        "User",
        userSchema
    );