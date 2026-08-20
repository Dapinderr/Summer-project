/* ==========================================================
   SecureVote - Online Voting System
   File: controllers/adminController.js
   ========================================================== */

const mongoose = require("mongoose");

const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const User = require("../models/User");
const {
    createAuditLog
} = require("../utils/auditLogger");

/* ==========================================================
   ADMIN DASHBOARD STATISTICS
   GET /api/admin/dashboard
========================================================== */

const getDashboardStats = async (req, res) => {

    try {

        const [
            totalElections,
            totalVoters,
            totalVotes,
            pendingVerification
        ] = await Promise.all([

            Election.countDocuments(),

            User.countDocuments({
                role: "voter"
            }),

            Vote.countDocuments(),

            User.countDocuments({
                role: "voter",
                $or: [
                    { isVerified: false },
                    { accountStatus: "pending" }
                ]
            })

        ]);


        const recentElections =
            await Election.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select(
                    "title startDate endDate status resultsPublished"
                )
                .lean();


        return res.status(200).json({

            success: true,

            stats: {
                totalElections,
                totalVoters,
                totalVotes,
                pendingVerification
            },

            recentElections

        });


    } catch (error) {

        console.error(
            "Dashboard Statistics Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load dashboard statistics"

        });

    }

};


/* ==========================================================
   GET ALL ELECTIONS
   GET /api/admin/elections
========================================================== */

const getElections = async (req, res) => {

    try {

        const elections =
            await Election.find()
                .sort({
                    createdAt: -1
                })
                .lean();


        const electionData =
            await Promise.all(

                elections.map(
                    async election => {

                        const [
                            candidateCount,
                            voteCount
                        ] = await Promise.all([

                            Candidate.countDocuments({
                                election:
                                    election._id
                            }),

                            Vote.countDocuments({
                                election:
                                    election._id
                            })

                        ]);


                        return {

                            ...election,

                            candidateCount,

                            voteCount

                        };

                    }
                )

            );


        return res.status(200).json({

            success: true,

            count:
                electionData.length,

            elections:
                electionData

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
   CREATE ELECTION
   POST /api/admin/elections
========================================================== */

const createElection = async (req, res) => {

    try {

        const {
            title,
            description,
            startDate,
            endDate
        } = req.body;


        if (!title || !startDate || !endDate) {

            return res.status(400).json({

                success: false,

                message:
                    "Title, start date and end date are required"

            });

        }


        const start =
            new Date(startDate);

        const end =
            new Date(endDate);


        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election dates"

            });

        }


        if (end <= start) {

            return res.status(400).json({

                success: false,

                message:
                    "Election end date must be after start date"

            });

        }


        let status =
            "upcoming";

        const now =
            new Date();


        if (
            now >= start &&
            now <= end
        ) {

            status =
                "active";

        }


        if (now > end) {

            status =
                "completed";

        }


        const election =
            await Election.create({

                title,

                description:
                    description || "",

                startDate:
                    start,

                endDate:
                    end,

                status,

                createdBy:
                    req.user._id

            });
            await createAuditLog({

    req,

    event:
        "Election Created",

    category:
        "Election Management",

    type:
        "success",

    details:
        `Administrator created election "${election.title}".`,

    metadata: {

        electionId:
            election._id.toString(),

        title:
            election.title

    }

});


        return res.status(201).json({

            success: true,

            message:
                "Election created successfully",

            election

        });


    } catch (error) {

        console.error(
            "Create Election Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create election"

        });

    }

};


/* ==========================================================
   UPDATE ELECTION
   PUT /api/admin/elections/:id
========================================================== */

const updateElection = async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election ID"

            });

        }


        const election =
            await Election.findById(id);


        if (!election) {

            return res.status(404).json({

                success: false,

                message:
                    "Election not found"

            });

        }


        const voteCount =
            await Vote.countDocuments({

                election:
                    election._id

            });


        if (voteCount > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Election cannot be modified after voting has started"

            });

        }


        const allowedFields = [
            "title",
            "description",
            "startDate",
            "endDate"
        ];


        allowedFields.forEach(field => {

            if (
                req.body[field] !==
                undefined
            ) {

                election[field] =
                    req.body[field];

            }

        });


        const start =
            new Date(
                election.startDate
            );

        const end =
            new Date(
                election.endDate
            );


        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election dates"

            });

        }


        if (end <= start) {

            return res.status(400).json({

                success: false,

                message:
                    "Election end date must be after start date"

            });

        }


        const now =
            new Date();


        if (now < start) {

            election.status =
                "upcoming";

        } else if (now > end) {

            election.status =
                "completed";

        } else {

            election.status =
                "active";

        }


        await election.save();
        await createAuditLog({

    req,

    event:
        "Election Updated",

    category:
        "Election Management",

    type:
        "success",

    details:
        `Administrator updated election "${election.title}".`,

    metadata: {

        electionId:
            election._id.toString(),

        title:
            election.title

    }

});


        return res.status(200).json({

            success: true,

            message:
                "Election updated successfully",

            election

        });


    } catch (error) {

        console.error(
            "Update Election Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to update election"

        });

    }

};


/* ==========================================================
   DELETE ELECTION
   DELETE /api/admin/elections/:id
========================================================== */

const deleteElection = async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election ID"

            });

        }


        const election =
            await Election.findById(id);


        if (!election) {

            return res.status(404).json({

                success: false,

                message:
                    "Election not found"

            });

        }


        const voteExists =
            await Vote.exists({

                election:
                    election._id

            });


        if (voteExists) {

            return res.status(409).json({

                success: false,

                message:
                    "Election containing votes cannot be deleted"

            });

        }


        const deletedElectionInfo = {
    id: election._id.toString(),
    title: election.title
};


await Candidate.deleteMany({
    election: election._id
});


await election.deleteOne();


await createAuditLog({

    req,

    event: "Election Deleted",

    category: "Election Management",

    type: "warning",

    details:
        `Administrator deleted election "${deletedElectionInfo.title}".`,

    metadata: {
        electionId: deletedElectionInfo.id,
        title: deletedElectionInfo.title
    }

});


        return res.status(200).json({

            success: true,

            message:
                "Election deleted successfully"

        });


    } catch (error) {

        console.error(
            "Delete Election Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to delete election"

        });

    }

};


/* ==========================================================
   GET ALL CANDIDATES
   GET /api/admin/candidates

   Optional:
   GET /api/admin/candidates?election=ELECTION_ID
========================================================== */

const getCandidates = async (req, res) => {

    try {

        const filter = {};


        if (req.query.election) {

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.query.election
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid election ID"

                });

            }


            filter.election =
                req.query.election;

        }


        const candidates =
            await Candidate.find(filter)

                .populate(
                    "election",
                    "title startDate endDate status"
                )

                .sort({
                    createdAt: -1
                })

                .lean();


        return res.status(200).json({

            success: true,

            count:
                candidates.length,

            candidates

        });


    } catch (error) {

        console.error(
            "Get Candidates Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load candidates"

        });

    }

};


/* ==========================================================
   ADD CANDIDATE
   POST /api/admin/elections/:id/candidates
========================================================== */

const addCandidate = async (req, res) => {

    try {

        const { id } =
            req.params;

        const {
            name,
            party,
            position,
            manifesto,
            image
        } = req.body;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election ID"

            });

        }


        if (
            !name ||
            !String(name).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Candidate name is required"

            });

        }


        const election =
            await Election.findById(id);


        if (!election) {

            return res.status(404).json({

                success: false,

                message:
                    "Election not found"

            });

        }


        const voteExists =
            await Vote.exists({

                election:
                    election._id

            });


        if (voteExists) {

            return res.status(409).json({

                success: false,

                message:
                    "Candidates cannot be added after voting has started"

            });

        }


        const candidate =
            await Candidate.create({

                name:
                    String(name).trim(),

                election:
                    election._id,

                party:
                    party
                        ? String(party).trim()
                        : "Independent",

                position:
                    position
                        ? String(position).trim()
                        : "",

                manifesto:
                    manifesto
                        ? String(manifesto).trim()
                        : "",

                image:
                    image
                        ? String(image).trim()
                        : ""

            });


        await candidate.populate(
            "election",
            "title startDate endDate status"
        );
await createAuditLog({

    req,

    event: "Candidate Added",

    category: "Candidate Management",

    type: "success",

    details:
        `Administrator added candidate "${candidate.name}" to "${candidate.election.title}".`,

    metadata: {
        candidateId: candidate._id.toString(),
        candidateName: candidate.name,
        electionId: candidate.election._id.toString(),
        electionTitle: candidate.election.title
    }

});

        return res.status(201).json({

            success: true,

            message:
                "Candidate added successfully",

            candidate

        });


    } catch (error) {

        console.error(
            "Add Candidate Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to add candidate"

        });

    }

};


/* ==========================================================
   UPDATE CANDIDATE
   PUT /api/admin/candidates/:id
========================================================== */

const updateCandidate = async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid candidate ID"

            });

        }


        const candidate =
            await Candidate.findById(id);


        if (!candidate) {

            return res.status(404).json({

                success: false,

                message:
                    "Candidate not found"

            });

        }


        const voteExists =
            await Vote.exists({

                election:
                    candidate.election

            });


        if (voteExists) {

            return res.status(409).json({

                success: false,

                message:
                    "Candidate cannot be modified after voting has started"

            });

        }


        const {
            name,
            party,
            position,
            manifesto,
            image,
            isActive
        } = req.body;


        if (
            name !== undefined &&
            !String(name).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Candidate name cannot be empty"

            });

        }


        if (name !== undefined) {

            candidate.name =
                String(name).trim();

        }


        if (party !== undefined) {

            candidate.party =
                String(party).trim() ||
                "Independent";

        }


        if (position !== undefined) {

            candidate.position =
                String(position).trim();

        }


        if (manifesto !== undefined) {

            candidate.manifesto =
                String(manifesto).trim();

        }


        if (image !== undefined) {

            candidate.image =
                String(image).trim();

        }


        if (
            typeof isActive ===
            "boolean"
        ) {

            candidate.isActive =
                isActive;

        }


        await candidate.save();


        await candidate.populate(
            "election",
            "title startDate endDate status"
        );
await createAuditLog({

    req,

    event: "Candidate Updated",

    category: "Candidate Management",

    type: "success",

    details:
        `Administrator updated candidate "${candidate.name}".`,

    metadata: {
        candidateId: candidate._id.toString(),
        candidateName: candidate.name,
        electionId: candidate.election._id.toString(),
        electionTitle: candidate.election.title
    }

});

        return res.status(200).json({

            success: true,

            message:
                "Candidate updated successfully",

            candidate

        });


    } catch (error) {

        console.error(
            "Update Candidate Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to update candidate"

        });

    }

};


/* ==========================================================
   REMOVE CANDIDATE
   DELETE /api/admin/candidates/:id
========================================================== */

const removeCandidate = async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid candidate ID"

            });

        }


        const candidate =
            await Candidate.findById(id);


        if (!candidate) {

            return res.status(404).json({

                success: false,

                message:
                    "Candidate not found"

            });

        }


        const voteExists =
            await Vote.exists({

                election:
                    candidate.election

            });


        if (voteExists) {

            return res.status(409).json({

                success: false,

                message:
                    "Candidate cannot be removed after voting has started"

            });

        }


       const removedCandidateInfo = {

    id: candidate._id.toString(),

    name: candidate.name,

    electionId:
        candidate.election.toString()

};


await candidate.deleteOne();


await createAuditLog({

    req,

    event: "Candidate Removed",

    category: "Candidate Management",

    type: "warning",

    details:
        `Administrator removed candidate "${removedCandidateInfo.name}".`,

    metadata: {
        candidateId: removedCandidateInfo.id,
        candidateName: removedCandidateInfo.name,
        electionId: removedCandidateInfo.electionId
    }

});


        return res.status(200).json({

            success: true,

            message:
                "Candidate removed successfully"

        });


    } catch (error) {

        console.error(
            "Remove Candidate Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to remove candidate"

        });

    }

};


/* ==========================================================
   PUBLISH RESULTS
   PATCH /api/admin/elections/:id/publish-results
========================================================== */

const publishResults = async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election ID"

            });

        }


        const election =
            await Election.findById(id);


        if (!election) {

            return res.status(404).json({

                success: false,

                message:
                    "Election not found"

            });

        }


        if (
            new Date() <=
            election.endDate
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Results cannot be published before the election ends"

            });

        }


        election.status =
            "completed";

        election.resultsPublished =
            true;


        await election.save();
        await createAuditLog({

    req,

    event: "Election Results Published",

    category: "Results Management",

    type: "success",

    details:
        `Administrator published results for "${election.title}".`,

    metadata: {
        electionId: election._id.toString(),
        title: election.title
    }

});


        return res.status(200).json({

            success: true,

            message:
                "Election results published successfully",

            election

        });


    } catch (error) {

        console.error(
            "Publish Results Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to publish results"

        });

    }

};


/* ==========================================================
   GET ELECTION RESULTS
   GET /api/admin/elections/:id/results
========================================================== */

const getElectionResults = async (req, res) => {

    try {

        const { id } = req.params;


        /* ==============================
           VALIDATE ELECTION ID
        ============================== */

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid election ID"

            });

        }


        /* ==============================
           FIND ELECTION
        ============================== */

        const election =
            await Election.findById(id)
                .lean();


        if (!election) {

            return res.status(404).json({

                success: false,

                message:
                    "Election not found"

            });

        }


        /* ==============================
           LOAD CANDIDATES
        ============================== */

        const candidates =
            await Candidate.find({

                election:
                    new mongoose.Types.ObjectId(id)

            })
                .select(
                    "name party position image isActive"
                )
                .lean();


        /* ==============================
           COUNT VOTES PER CANDIDATE
        ============================== */

        const voteCounts =
            await Vote.aggregate([

                {
                    $match: {

                        election:
                            new mongoose.Types.ObjectId(id)

                    }
                },

                {
                    $group: {

                        _id:
                            "$candidate",

                        votes: {
                            $sum: 1
                        }

                    }
                }

            ]);


        /* ==============================
           CREATE VOTE MAP
        ============================== */

        const countMap =
            new Map(

                voteCounts.map(
                    item => [

                        item._id.toString(),

                        item.votes

                    ]
                )

            );


        /* ==============================
           BUILD RESULTS
        ============================== */

        let results =
            candidates.map(
                candidate => {

                    const votes =
                        countMap.get(
                            candidate._id.toString()
                        ) || 0;


                    return {

                        candidateId:
                            candidate._id,

                        name:
                            candidate.name,

                        party:
                            candidate.party ||
                            "Independent",

                        position:
                            candidate.position ||
                            "",

                        image:
                            candidate.image ||
                            "",

                        isActive:
                            candidate.isActive !== false,

                        votes

                    };

                }
            );


        /* ==============================
           TOTAL VOTES
        ============================== */

        const totalVotes =
            results.reduce(

                (total, candidate) =>
                    total +
                    candidate.votes,

                0

            );


        /* ==============================
           ADD PERCENTAGES
        ============================== */

        results =
            results.map(
                candidate => ({

                    ...candidate,

                    percentage:
                        totalVotes > 0
                            ? Number(
                                (
                                    candidate.votes /
                                    totalVotes *
                                    100
                                ).toFixed(2)
                            )
                            : 0

                })
            );


        /* ==============================
           SORT BY HIGHEST VOTES
        ============================== */

        results.sort(
            (a, b) =>
                b.votes - a.votes
        );


        /* ==============================
           ELIGIBLE VOTERS
        ============================== */

        const eligibleVoters =
            await User.countDocuments({

                role: "voter",

                isVerified: true,

                accountStatus: "active"

            });


        /* ==============================
           TURNOUT
        ============================== */

        const turnout =
            eligibleVoters > 0

                ? Number(
                    (
                        totalVotes /
                        eligibleVoters *
                        100
                    ).toFixed(2)
                )

                : 0;


        /* ==============================
           DETERMINE LIVE STATUS
        ============================== */

        const now =
            new Date();

        const startDate =
            new Date(election.startDate);

        const endDate =
            new Date(election.endDate);


        let currentStatus =
            election.status;


        if (now < startDate) {

            currentStatus =
                "upcoming";

        } else if (now > endDate) {

            currentStatus =
                "completed";

        } else {

            currentStatus =
                "active";

        }


        /* ==============================
           RESPONSE
        ============================== */

        return res.status(200).json({

            success: true,

            election: {

                id:
                    election._id,

                _id:
                    election._id,

                title:
                    election.title,

                description:
                    election.description || "",

                startDate:
                    election.startDate,

                endDate:
                    election.endDate,

                status:
                    currentStatus,

                resultsPublished:
                    Boolean(
                        election.resultsPublished
                    ),

                createdAt:
                    election.createdAt,

                updatedAt:
                    election.updatedAt

            },

            statistics: {

                eligibleVoters,

                totalVotes,

                turnout,

                totalCandidates:
                    results.length

            },

            /*
             * Keep these top-level values too
             * for compatibility with the current
             * frontend code.
             */

            totalVotes,

            eligibleVoters,

            turnout,

            candidateCount:
                results.length,

            results

        });


    } catch (error) {

        console.error(
            "Election Results Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load election results"

        });

    }

};
/* ==========================================================
   GET ALL VOTERS
   GET /api/admin/voters
========================================================== */

const getVoters = async (req, res) => {

    try {

        const voters =
            await User.find({
                role: "voter"
            })
                .select(
                    "name email phone dob voterId governmentId role isVerified accountStatus createdAt updatedAt"
                )
                .sort({
                    createdAt: -1
                })
                .lean();


        return res.status(200).json({

            success: true,

            count:
                voters.length,

            voters

        });


    } catch (error) {

        console.error(
            "Get Voters Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load voters"

        });

    }

};


/* ==========================================================
   GET SINGLE VOTER
   GET /api/admin/voters/:id
========================================================== */

const getVoter = async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid voter ID"

            });

        }


        const voter =
            await User.findOne({

                _id: id,

                role: "voter"

            })
                .select(
                    "name email phone dob voterId governmentId role isVerified accountStatus createdAt updatedAt"
                )
                .lean();


        if (!voter) {

            return res.status(404).json({

                success: false,

                message:
                    "Voter not found"

            });

        }


        return res.status(200).json({

            success: true,

            voter

        });


    } catch (error) {

        console.error(
            "Get Voter Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load voter"

        });

    }

};


/* ==========================================================
   APPROVE VOTER
   PATCH /api/admin/voters/:id/approve
========================================================== */

const approveVoter = async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid voter ID"

            });

        }


        const voter =
            await User.findOne({

                _id: id,

                role: "voter"

            });


        if (!voter) {

            return res.status(404).json({

                success: false,

                message:
                    "Voter not found"

            });

        }


        voter.isVerified =
            true;

        voter.accountStatus =
            "active";


        await voter.save();
        await createAuditLog({

    req,

    event: "Voter Approved",

    category: "Voter Management",

    type: "success",

    details:
        `Administrator approved voter "${voter.name}".`,

    metadata: {
        voterId: voter._id.toString(),
        voterReference: voter.voterId
    }

});


        return res.status(200).json({

            success: true,

            message:
                "Voter approved successfully",

            voter: {

                _id:
                    voter._id,

                name:
                    voter.name,

                email:
                    voter.email,

                voterId:
                    voter.voterId,

                isVerified:
                    voter.isVerified,

                accountStatus:
                    voter.accountStatus

            }

        });


    } catch (error) {

        console.error(
            "Approve Voter Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to approve voter"

        });

    }

};


/* ==========================================================
   SUSPEND VOTER
   PATCH /api/admin/voters/:id/suspend
========================================================== */

const suspendVoter = async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid voter ID"

            });

        }


        const voter =
            await User.findOne({

                _id: id,

                role: "voter"

            });


        if (!voter) {

            return res.status(404).json({

                success: false,

                message:
                    "Voter not found"

            });

        }


        voter.accountStatus =
            "suspended";


        await voter.save();
        await createAuditLog({

    req,

    event: "Voter Suspended",

    category: "Voter Management",

    type: "warning",

    details:
        `Administrator suspended voter "${voter.name}".`,

    metadata: {
        voterId: voter._id.toString(),
        voterReference: voter.voterId
    }

});


        return res.status(200).json({

            success: true,

            message:
                "Voter suspended successfully",

            voter: {

                _id:
                    voter._id,

                name:
                    voter.name,

                email:
                    voter.email,

                voterId:
                    voter.voterId,

                isVerified:
                    voter.isVerified,

                accountStatus:
                    voter.accountStatus

            }

        });


    } catch (error) {

        console.error(
            "Suspend Voter Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to suspend voter"

        });

    }

};


/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

    /* =========================
       DASHBOARD
    ========================= */

    getDashboardStats,


    /* =========================
       ELECTIONS
    ========================= */

    getElections,

    createElection,

    updateElection,

    deleteElection,


    /* =========================
       CANDIDATES
    ========================= */

    getCandidates,

    addCandidate,

    updateCandidate,

    removeCandidate,


    /* =========================
       VOTERS
    ========================= */

    getVoters,

    getVoter,

    approveVoter,

    suspendVoter,


    /* =========================
       RESULTS
    ========================= */

    publishResults,

    getElectionResults

};