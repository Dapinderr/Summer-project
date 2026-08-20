/* ==========================================================
   SecureVote - Online Voting System
   File: controllers/electionController.js
   ========================================================== */

const mongoose = require("mongoose");

const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");


/* ==========================================================
   HELPER - DETERMINE REAL ELECTION STATUS
========================================================== */

function getElectionStatus(election) {

    const now = new Date();

    if (now < election.startDate) {
        return "upcoming";
    }

    if (now > election.endDate) {
        return "completed";
    }

    return "active";
}


/* ==========================================================
   GET ALL ELECTIONS
   GET /api/elections
========================================================== */

const getElections = async (req, res) => {

    try {

        const elections =
            await Election.find({})
                .sort({
                    startDate: 1
                })
                .lean();


        const formattedElections =
            elections.map(
                election => ({

                    ...election,

                    status:
                        getElectionStatus(
                            election
                        )

                })
            );


        return res.status(200).json({

            success: true,

            count:
                formattedElections.length,

            elections:
                formattedElections

        });


    } catch (error) {

        console.error(
            "Get Elections Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load elections"

        });

    }

};


/* ==========================================================
   GET SINGLE ELECTION
   GET /api/elections/:id
========================================================== */

const getElectionById = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        /* ==========================
           VALIDATE ID
        ========================== */

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election ID"

            });

        }


        /* ==========================
           FIND ELECTION
        ========================== */

        const election =
            await Election.findById(
                id
            ).lean();


        if (!election) {

            return res.status(404).json({

                success: false,

                message:
                    "Election not found"

            });

        }


        /* ==========================
           FIND ACTIVE CANDIDATES
        ========================== */

        const candidates =
            await Candidate.find({

                election: id,

                isActive: true

            })

                .select(
                    "name party position manifesto image isActive createdAt"
                )

                .sort({
                    createdAt: 1
                })

                .lean();


        /* ==========================
           CHECK WHETHER USER VOTED
        ========================== */

        let hasVoted = false;

        let receipt = null;


        if (
            req.user &&
            req.user.role === "voter"
        ) {

            const vote =
                await Vote.findOne({

                    voter:
                        req.user._id,

                    election:
                        id

                }).select(
                    "_id votedAt"
                );


            if (vote) {

                hasVoted = true;

                receipt = {

                    voteId:
                        vote._id,

                    votedAt:
                        vote.votedAt

                };

            }

        }


        /* ==========================
           RESPONSE
        ========================== */

        return res.status(200).json({

            success: true,

            election: {

                ...election,

                status:
                    getElectionStatus(
                        election
                    ),

                candidates,

                candidateCount:
                    candidates.length,

                hasVoted,

                receipt

            }

        });


    } catch (error) {

        console.error(
            "Get Election Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load election"

        });

    }

};


/* ==========================================================
   GET ELECTION CANDIDATES
   GET /api/elections/:id/candidates
========================================================== */

const getElectionCandidates = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        /* ==========================
           VALIDATE ELECTION ID
        ========================== */

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election ID"

            });

        }


        /* ==========================
           CHECK ELECTION EXISTS
        ========================== */

        const election =
            await Election.findById(
                id
            )
                .select(
                    "_id title startDate endDate"
                )
                .lean();


        if (!election) {

            return res.status(404).json({

                success: false,

                message:
                    "Election not found"

            });

        }


        /* ==========================
           GET REGISTERED CANDIDATES
        ========================== */

        const candidates =
            await Candidate.find({

                election:
                    id,

                isActive:
                    true

            })

                /*
                 * Only return candidate information
                 * required by the voter interface.
                 */

                .select(
                    "name party position manifesto image isActive createdAt"
                )

                .sort({
                    createdAt: 1
                })

                .lean();


        /* ==========================
           RESPONSE
        ========================== */

        return res.status(200).json({

            success: true,

            election: {

                _id:
                    election._id,

                title:
                    election.title

            },

            count:
                candidates.length,

            candidates

        });


    } catch (error) {

        console.error(
            "Get Election Candidates Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load election candidates"

        });

    }

};


/* ==========================================================
   GET ACTIVE ELECTIONS
   GET /api/elections/active
========================================================== */

const getActiveElections = async (
    req,
    res
) => {

    try {

        const now =
            new Date();


        const elections =
            await Election.find({

                startDate: {
                    $lte: now
                },

                endDate: {
                    $gte: now
                }

            })

                .sort({
                    endDate: 1
                })

                .lean();


        return res.status(200).json({

            success: true,

            count:
                elections.length,

            elections:
                elections.map(
                    election => ({

                        ...election,

                        status:
                            "active"

                    })
                )

        });


    } catch (error) {

        console.error(
            "Active Elections Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load active elections"

        });

    }

};


/* ==========================================================
   GET UPCOMING ELECTIONS
   GET /api/elections/upcoming
========================================================== */

const getUpcomingElections = async (
    req,
    res
) => {

    try {

        const now =
            new Date();


        const elections =
            await Election.find({

                startDate: {
                    $gt: now
                }

            })

                .sort({
                    startDate: 1
                })

                .lean();


        return res.status(200).json({

            success: true,

            count:
                elections.length,

            elections:
                elections.map(
                    election => ({

                        ...election,

                        status:
                            "upcoming"

                    })
                )

        });


    } catch (error) {

        console.error(
            "Upcoming Elections Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load upcoming elections"

        });

    }

};


/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

    getElections,

    getElectionById,

    getElectionCandidates,

    getActiveElections,

    getUpcomingElections

};