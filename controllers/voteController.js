/* ==========================================================
   SecureVote - Online Voting System
   File: controllers/voteController.js
   ========================================================== */

const mongoose = require("mongoose");

const Vote = require("../models/Vote");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");


/* ==========================================================
   AUDIT LOGGER
========================================================== */

const {
    createAuditLog,
    createSecurityLog,
    createWarningLog
} = require("../utils/auditLogger");


/* ==========================================================
   CAST VOTE
   POST /api/votes
========================================================== */

const castVote = async (req, res) => {

    try {

        const {
            electionId,
            candidateId
        } = req.body;


        /* ==========================
           VALIDATE INPUT
        ========================== */

        if (!electionId || !candidateId) {

            return res.status(400).json({

                success: false,

                message:
                    "Election and candidate are required"

            });

        }


        if (
            !mongoose.Types.ObjectId.isValid(electionId) ||
            !mongoose.Types.ObjectId.isValid(candidateId)
        ) {

            await createWarningLog({

                req,

                user:
                    req.user || null,

                event:
                    "Invalid Vote Request",

                category:
                    "Voting",

                details:
                    "A vote request contained an invalid election or candidate identifier.",

                metadata: {
                    reason:
                        "invalid-identifiers"
                }

            });


            return res.status(400).json({

                success: false,

                message:
                    "Invalid election or candidate ID"

            });

        }


        /* ==========================
           CHECK VOTER
        ========================== */

        if (!req.user) {

            await createSecurityLog({

                req,

                event:
                    "Unauthenticated Vote Attempt",

                category:
                    "Voting",

                details:
                    "An unauthenticated request attempted to cast a vote.",

                metadata: {
                    reason:
                        "authentication-required"
                }

            });


            return res.status(401).json({

                success: false,

                message:
                    "Authentication required"

            });

        }


        /* ==========================
           VOTER ROLE
        ========================== */

        if (
            req.user.role !== "voter"
        ) {

            await createSecurityLog({

                req,

                user:
                    req.user,

                event:
                    "Unauthorized Vote Attempt",

                category:
                    "Voting",

                details:
                    "A non-voter account attempted to cast a vote.",

                metadata: {

                    reason:
                        "invalid-role",

                    role:
                        req.user.role

                }

            });


            return res.status(403).json({

                success: false,

                message:
                    "Only voters can cast votes"

            });

        }


        /* ==========================
           VERIFIED + ACTIVE
        ========================== */

        if (
            !req.user.isVerified ||
            req.user.accountStatus !== "active"
        ) {

            await createSecurityLog({

                req,

                user:
                    req.user,

                event:
                    "Inactive Voter Vote Attempt",

                category:
                    "Voting",

                details:
                    "A voter without an active and verified account attempted to cast a vote.",

                metadata: {

                    reason:
                        "inactive-voter",

                    isVerified:
                        Boolean(
                            req.user.isVerified
                        ),

                    accountStatus:
                        req.user.accountStatus

                }

            });


            return res.status(403).json({

                success: false,

                message:
                    "Your voter account is not active and verified"

            });

        }


        /* ==========================
           FIND ELECTION
        ========================== */

        const election =
            await Election.findById(
                electionId
            );


        if (!election) {

            await createWarningLog({

                req,

                user:
                    req.user,

                event:
                    "Invalid Election Vote Attempt",

                category:
                    "Voting",

                details:
                    "A voter attempted to vote in an election that does not exist.",

                metadata: {
                    reason:
                        "election-not-found"
                }

            });


            return res.status(404).json({

                success: false,

                message:
                    "Election not found"

            });

        }


        /* ==========================
           CHECK ELECTION TIME
        ========================== */

        const now =
            new Date();


        /* ==========================
           NOT STARTED
        ========================== */

        if (
            now < election.startDate
        ) {

            await createWarningLog({

                req,

                user:
                    req.user,

                event:
                    "Early Vote Attempt",

                category:
                    "Voting",

                details:
                    `A voter attempted to vote before "${election.title}" started.`,

                metadata: {

                    electionId:
                        election._id.toString(),

                    reason:
                        "election-not-started"

                }

            });


            return res.status(400).json({

                success: false,

                message:
                    "Voting for this election has not started yet"

            });

        }


        /* ==========================
           ELECTION ENDED
        ========================== */

        if (
            now > election.endDate
        ) {

            await createWarningLog({

                req,

                user:
                    req.user,

                event:
                    "Late Vote Attempt",

                category:
                    "Voting",

                details:
                    `A voter attempted to vote after "${election.title}" ended.`,

                metadata: {

                    electionId:
                        election._id.toString(),

                    reason:
                        "election-ended"

                }

            });


            return res.status(400).json({

                success: false,

                message:
                    "Voting for this election has ended"

            });

        }


        /* ==========================
           ELECTION ACTIVE
        ========================== */

        if (
            election.status !== "active"
        ) {

            await createWarningLog({

                req,

                user:
                    req.user,

                event:
                    "Inactive Election Vote Attempt",

                category:
                    "Voting",

                details:
                    `A voter attempted to vote in "${election.title}" while the election was not active.`,

                metadata: {

                    electionId:
                        election._id.toString(),

                    reason:
                        "election-not-active"

                }

            });


            return res.status(400).json({

                success: false,

                message:
                    "This election is not currently active"

            });

        }


        /* ==========================
           FIND CANDIDATE
        ========================== */

        const candidate =
            await Candidate.findOne({

                _id:
                    candidateId,

                election:
                    electionId,

                isActive:
                    true

            });


        if (!candidate) {

            /*
             * BALLOT PRIVACY:
             *
             * Do not save candidateId in
             * the audit/security log.
             */

            await createSecurityLog({

                req,

                user:
                    req.user,

                event:
                    "Invalid Candidate Vote Attempt",

                category:
                    "Voting",

                details:
                    `A voter submitted an invalid candidate selection for "${election.title}".`,

                metadata: {

                    electionId:
                        election._id.toString(),

                    reason:
                        "invalid-candidate"

                }

            });


            return res.status(404).json({

                success: false,

                message:
                    "Candidate not found in this election"

            });

        }


        /* ==========================
           DUPLICATE VOTE CHECK
        ========================== */

        const existingVote =
            await Vote.findOne({

                voter:
                    req.user._id,

                election:
                    electionId

            });


        if (existingVote) {

            await createSecurityLog({

                req,

                user:
                    req.user,

                event:
                    "Duplicate Vote Attempt",

                category:
                    "Voting",

                details:
                    `A voter attempted to vote more than once in "${election.title}".`,

                metadata: {

                    electionId:
                        election._id.toString(),

                    reason:
                        "duplicate-vote"

                }

            });


            return res.status(409).json({

                success: false,

                message:
                    "You have already voted in this election"

            });

        }


        /* ==========================
           CAST VOTE
        ========================== */

        const vote =
            await Vote.create({

                voter:
                    req.user._id,

                election:
                    election._id,

                candidate:
                    candidate._id

            });


        /* ==================================================
           VOTE AUDIT

           IMPORTANT:
           Do NOT log:

           candidate._id
           candidate.name
           candidateId
           vote.candidate

           Audit log proves participation
           without recording the selection.
        ================================================== */

        await createAuditLog({

            req,

            user:
                req.user,

            event:
                "Vote Cast",

            category:
                "Voting",

            type:
                "success",

            details:
                `A verified voter successfully participated in "${election.title}".`,

            metadata: {

                electionId:
                    election._id.toString(),

                receiptId:
                    vote._id.toString()

            }

        });


        /* ==========================
           SUCCESS
        ========================== */

        return res.status(201).json({

            success: true,

            message:
                "Your vote has been cast successfully",

            receipt: {

                voteId:
                    vote._id,

                electionId:
                    election._id,

                votedAt:
                    vote.votedAt

            }

        });


    } catch (error) {

        console.error(
            "Cast Vote Error:",
            error
        );


        /* ==================================================
           DATABASE DUPLICATE PROTECTION

           This protects against two vote
           requests arriving simultaneously.

           Requires the Vote model to have
           a unique voter + election index.
        ================================================== */

        if (
            error.code === 11000
        ) {

            await createSecurityLog({

                req,

                user:
                    req.user || null,

                event:
                    "Concurrent Duplicate Vote Attempt",

                category:
                    "Voting",

                details:
                    "MongoDB blocked a duplicate vote through the unique vote constraint.",

                metadata: {
                    reason:
                        "database-duplicate-protection"
                }

            });


            return res.status(409).json({

                success: false,

                message:
                    "You have already voted in this election"

            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Unable to cast vote"

        });

    }

};


/* ==========================================================
   CHECK VOTE STATUS
   GET /api/votes/status/:electionId
========================================================== */

const getVoteStatus =
    async (req, res) => {

        try {

            const {
                electionId
            } = req.params;


            /* ==========================
               AUTH CHECK
            ========================== */

            if (!req.user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authentication required"

                });

            }


            /* ==========================
               VALIDATE ID
            ========================== */

            if (
                !mongoose.Types.ObjectId.isValid(
                    electionId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid election ID"

                });

            }


            /* ==========================
               FIND VOTE
            ========================== */

            const vote =
                await Vote.findOne({

                    voter:
                        req.user._id,

                    election:
                        electionId

                }).select(
                    "_id election votedAt"
                );


            /* ==========================
               RESPONSE
            ========================== */

            return res.status(200).json({

                success: true,

                hasVoted:
                    Boolean(vote),

                receipt:
                    vote
                        ? {

                            voteId:
                                vote._id,

                            electionId:
                                vote.election,

                            votedAt:
                                vote.votedAt

                        }
                        : null

            });


        } catch (error) {

            console.error(
                "Vote Status Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to check voting status"

            });

        }

    };


/* ==========================================================
   VOTER VOTING HISTORY
   GET /api/votes/history
========================================================== */

const getVotingHistory =
    async (req, res) => {

        try {

            /* ==========================
               AUTH CHECK
            ========================== */

            if (!req.user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authentication required"

                });

            }


            /*
             * IMPORTANT:
             *
             * Candidate is intentionally
             * NOT populated.
             *
             * Voting history proves that
             * the voter participated without
             * exposing which candidate they
             * selected.
             */

            const votes =
                await Vote.find({

                    voter:
                        req.user._id

                })

                    .select(
                        "_id election votedAt"
                    )

                    .populate(
                        "election",
                        "title startDate endDate status"
                    )

                    .sort({
                        votedAt: -1
                    });


            /* ==========================
               BUILD SAFE HISTORY
            ========================== */

            const history =
                votes.map(
                    vote => ({

                        receiptId:
                            vote._id,

                        election:
                            vote.election,

                        votedAt:
                            vote.votedAt

                    })
                );


            /* ==========================
               RESPONSE
            ========================== */

            return res.status(200).json({

                success: true,

                count:
                    history.length,

                history

            });


        } catch (error) {

            console.error(
                "Voting History Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load voting history"

            });

        }

    };


/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

    castVote,

    getVoteStatus,

    getVotingHistory

};