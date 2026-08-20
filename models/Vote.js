/* ==========================================================
   SecureVote - Online Voting System
   File: models/Vote.js
   ========================================================== */

const mongoose = require("mongoose");


/* ==========================================================
   VOTE SCHEMA
========================================================== */

const voteSchema = new mongoose.Schema(
    {

        /* ==========================
           VOTER
        ========================== */

        voter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [
                true,
                "Voter is required"
            ],
            immutable: true
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
            immutable: true
        },


        /* ==========================
           SELECTED CANDIDATE
        ========================== */

        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Candidate",
            required: [
                true,
                "Candidate is required"
            ],
            immutable: true
        },


        /* ==========================
           VOTE TIMESTAMP
        ========================== */

        votedAt: {
            type: Date,
            default: Date.now,
            immutable: true
        }

    },
    {
        timestamps: true
    }
);


/* ==========================================================
   ONE VOTE PER VOTER PER ELECTION
========================================================== */

/*
   Critical database-level protection.

   The same voter cannot create two votes
   for the same election.
*/

voteSchema.index(
    {
        voter: 1,
        election: 1
    },
    {
        unique: true
    }
);


/* ==========================================================
   RESULT QUERY INDEX
========================================================== */

/*
   Helps when counting votes for candidates
   inside an election.
*/

voteSchema.index({
    election: 1,
    candidate: 1
});


/* ==========================================================
   EXPORT MODEL
========================================================== */

module.exports =
    mongoose.model(
        "Vote",
        voteSchema
    );