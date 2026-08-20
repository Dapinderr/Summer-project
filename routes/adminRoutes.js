/* ==========================================================
   SecureVote - Online Voting System
   File: routes/adminRoutes.js
   ========================================================== */

const express = require("express");


/* ==============================
   ADMIN CONTROLLER
============================== */

const {
    /* Dashboard */
    getDashboardStats,

    /* Elections */
    getElections,
    createElection,
    updateElection,
    deleteElection,

    /* Candidates */
    getCandidates,
    addCandidate,
    updateCandidate,
    removeCandidate,

    /* Voters */
    getVoters,
    getVoter,
    approveVoter,
    suspendVoter,

    /* Results */
    publishResults,
    getElectionResults

} = require(
    "../controllers/adminController"
);


/* ==============================
   AUDIT CONTROLLER
============================== */

const {
    getAuditLogs,
    getAuditLog
} = require(
    "../controllers/auditController"
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
   ADMIN MIDDLEWARE
============================== */

const {
    adminOnly
} = require(
    "../middleware/adminMiddleware"
);


/* ==============================
   ROUTER
============================== */

const router =
    express.Router();


/* ==========================================================
   PROTECT ALL ADMIN ROUTES
========================================================== */

router.use(protect);

router.use(adminOnly);


/* ==========================================================
   ADMIN DASHBOARD
========================================================== */

/*
   GET /api/admin/dashboard
*/

router.get(
    "/dashboard",
    getDashboardStats
);


/* ==========================================================
   ELECTION MANAGEMENT
========================================================== */


/* ==============================
   GET ALL ELECTIONS

   GET /api/admin/elections
============================== */

router.get(
    "/elections",
    getElections
);


/* ==============================
   CREATE ELECTION

   POST /api/admin/elections
============================== */

router.post(
    "/elections",
    createElection
);


/* ==============================
   UPDATE ELECTION

   PUT /api/admin/elections/:id
============================== */

router.put(
    "/elections/:id",
    updateElection
);


/* ==============================
   DELETE ELECTION

   DELETE /api/admin/elections/:id
============================== */

router.delete(
    "/elections/:id",
    deleteElection
);


/* ==========================================================
   CANDIDATE MANAGEMENT
========================================================== */


/* ==============================
   GET ALL CANDIDATES

   GET /api/admin/candidates

   Optional:
   GET /api/admin/candidates?election=ELECTION_ID
============================== */

router.get(
    "/candidates",
    getCandidates
);


/* ==============================
   ADD CANDIDATE

   POST /api/admin/elections/:id/candidates
============================== */

router.post(
    "/elections/:id/candidates",
    addCandidate
);


/* ==============================
   UPDATE CANDIDATE

   PUT /api/admin/candidates/:id
============================== */

router.put(
    "/candidates/:id",
    updateCandidate
);


/* ==============================
   REMOVE CANDIDATE

   DELETE /api/admin/candidates/:id
============================== */

router.delete(
    "/candidates/:id",
    removeCandidate
);


/* ==========================================================
   VOTER MANAGEMENT
========================================================== */


/* ==============================
   GET ALL VOTERS

   GET /api/admin/voters
============================== */

router.get(
    "/voters",
    getVoters
);


/* ==============================
   GET SINGLE VOTER

   GET /api/admin/voters/:id
============================== */

router.get(
    "/voters/:id",
    getVoter
);


/* ==============================
   APPROVE VOTER

   PATCH /api/admin/voters/:id/approve
============================== */

router.patch(
    "/voters/:id/approve",
    approveVoter
);


/* ==============================
   SUSPEND VOTER

   PATCH /api/admin/voters/:id/suspend
============================== */

router.patch(
    "/voters/:id/suspend",
    suspendVoter
);


/* ==========================================================
   RESULTS
========================================================== */


/* ==============================
   GET RESULTS

   GET /api/admin/elections/:id/results
============================== */

router.get(
    "/elections/:id/results",
    getElectionResults
);


/* ==============================
   PUBLISH RESULTS

   PATCH /api/admin/elections/:id/publish-results
============================== */

router.patch(
    "/elections/:id/publish-results",
    publishResults
);


/* ==========================================================
   AUDIT LOG MANAGEMENT
========================================================== */


/* ==============================
   GET ALL AUDIT LOGS

   GET /api/admin/audit-logs

   Optional query parameters:
   ?type=success
   ?type=warning
   ?type=security
   ?search=login
   ?page=1
   ?limit=100
============================== */

router.get(
    "/audit-logs",
    getAuditLogs
);


/* ==============================
   GET SINGLE AUDIT LOG

   GET /api/admin/audit-logs/:id
============================== */

router.get(
    "/audit-logs/:id",
    getAuditLog
);


/* ==============================
   EXPORT ROUTER
============================== */

module.exports = router;