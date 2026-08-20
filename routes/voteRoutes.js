/* ==========================================================
   SecureVote - Online Voting System
   File: routes/voteRoutes.js
   ========================================================== */

const express = require("express");


/* ==============================
   CONTROLLERS
============================== */

const {
    castVote,
    getVoteStatus,
    getVotingHistory
} = require(
    "../controllers/voteController"
);


/* ==============================
   AUTH MIDDLEWARE
============================== */

const {
    protect
} = require(
    "../middleware/authMiddleware"
);


/* ==============================
   ROUTER
============================== */

const router =
    express.Router();


/* ==========================================================
   ALL VOTE ROUTES REQUIRE LOGIN
========================================================== */

router.use(protect);


/* ==============================
   CAST VOTE
============================== */

/*
   POST /api/votes

   Body:
   {
       "electionId": "...",
       "candidateId": "..."
   }
*/

router.post(
    "/",
    castVote
);


/* ==============================
   VOTING HISTORY
============================== */

/*
   GET /api/votes/history
*/

router.get(
    "/history",
    getVotingHistory
);


/* ==============================
   CHECK VOTE STATUS
============================== */

/*
   GET /api/votes/status/:electionId
*/

router.get(
    "/status/:electionId",
    getVoteStatus
);


/* ==============================
   EXPORT
============================== */

module.exports = router;