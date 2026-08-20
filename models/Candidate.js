/* ==========================================================
   SecureVote - Online Voting System
   File: models/Candidate.js
   ========================================================== */

const mongoose = require("mongoose");


/* ==========================================================
   CANDIDATE SCHEMA
========================================================== */

const candidateSchema = new mongoose.Schema(
    {

        /* ==========================
           CANDIDATE INFORMATION
        ========================== */

        name: {
            type: String,
            required: [
                true,
                "Candidate name is required"
            ],
            trim: true,
            minlength: 2,
            maxlength: 100
        },


        /* ==========================
           ELECTION
        ========================== */

        election: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Election",
            required: [
                true,
                "Election is required"
            ],
            index: true
        },


        /* ==========================
           PARTY / GROUP
        ========================== */

        party: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "Independent"
        },


        /* ==========================
           POSITION
        ========================== */

        position: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },


        /* ==========================
           MANIFESTO
        ========================== */

        manifesto: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },


        /* ==========================
           CANDIDATE IMAGE
        ========================== */

        image: {
            type: String,
            trim: true,
            default: ""
        },


        /* ==========================
           STATUS
        ========================== */

        isActive: {
            type: Boolean,
            default: true
        }

    },
    {
        timestamps: true
    }
);


/* ==========================================================
   INDEXES
========================================================== */

/*
   Makes queries such as:

   Candidate.find({
       election: electionId,
       isActive: true
   })

   more efficient.
*/

candidateSchema.index({
    election: 1,
    isActive: 1
});


/* ==========================================================
   EXPORT MODEL
========================================================== */

module.exports =
    mongoose.model(
        "Candidate",
        candidateSchema
    );