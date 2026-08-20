/* ==========================================================
   SecureVote - Online Voting System
   File: routes/electionRoutes.js
   ========================================================== */

const express = require("express");


/* ==============================
   CONTROLLERS
============================== */

const {

    getElections,

    getElectionById,

    getActiveElections,

    getUpcomingElections,

    /* NEW */
    getElectionCandidates

} = require(
    "../controllers/electionController"
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
   ALL ELECTION ROUTES REQUIRE LOGIN
========================================================== */

router.use(protect);


/* ==========================================================
   ALL ELECTIONS
========================================================== */

/*
   GET /api/elections
*/

router.get(
    "/",
    getElections
);


/* ==========================================================
   ACTIVE ELECTIONS
========================================================== */

/*
   GET /api/elections/active
*/

router.get(
    "/active",
    getActiveElections
);


/* ==========================================================
   UPCOMING ELECTIONS
========================================================== */

/*
   GET /api/elections/upcoming
*/

router.get(
    "/upcoming",
    getUpcomingElections
);


/* ==========================================================
   ELECTION CANDIDATES
========================================================== */

/*
   GET /api/elections/:id/candidates

   Returns active candidates registered
   for the selected election.

   IMPORTANT:
   This is a voter-accessible route.

   Do NOT use the admin candidate endpoint
   on the voter frontend.
*/

router.get(
    "/:id/candidates",
    getElectionCandidates
);


/* ==========================================================
   SINGLE ELECTION
========================================================== */

/*
   GET /api/elections/:id

   Keep dynamic routes after fixed routes
   such as /active and /upcoming.
*/

router.get(
    "/:id",
    getElectionById
);


/* ==========================================================
   EXPORT
========================================================== */

module.exports = router;