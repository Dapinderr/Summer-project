/* ==========================================================
   SecureVote - Online Voting System
   File: models/Election.js
   ========================================================== */

const mongoose = require("mongoose");


/* ==========================================================
   ELECTION SCHEMA
========================================================== */

const electionSchema = new mongoose.Schema(
    {

        /* ==========================
           BASIC INFORMATION
        ========================== */

        title: {
            type: String,
            required: [
                true,
                "Election title is required"
            ],
            trim: true,
            minlength: 3,
            maxlength: 150
        },


        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },


        /* ==========================
           ELECTION SCHEDULE
        ========================== */

        startDate: {
            type: Date,
            required: [
                true,
                "Election start date is required"
            ]
        },


        endDate: {
            type: Date,
            required: [
                true,
                "Election end date is required"
            ]
        },


        /* ==========================
           STATUS
        ========================== */

        status: {
            type: String,

            enum: [
                "upcoming",
                "active",
                "completed"
            ],

            default: "upcoming",

            index: true
        },


        /* ==========================
           RESULTS
        ========================== */

        resultsPublished: {
            type: Boolean,
            default: false
        },


        /* ==========================
           ELIGIBILITY
        ========================== */

        eligibility: {

            type: String,

            enum: [
                "all",
                "verified"
            ],

            default: "verified"
        },


        /* ==========================
           ADMIN WHO CREATED IT
        ========================== */

        createdBy: {

            type:
                mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true
        }

    },
    {
        timestamps: true
    }
);


/* ==========================================================
   VALIDATE ELECTION DATES
========================================================== */

electionSchema.pre(
    "validate",
    function () {

        if (
            this.startDate &&
            this.endDate &&
            this.endDate <= this.startDate
        ) {

            this.invalidate(
                "endDate",
                "Election end date must be after the start date"
            );
        }

    }
);


/* ==========================================================
   INDEXES
========================================================== */

electionSchema.index({
    startDate: 1,
    endDate: 1
});


/* ==========================================================
   EXPORT
========================================================== */

module.exports =
    mongoose.model(
        "Election",
        electionSchema
    );