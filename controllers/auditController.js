/* ==========================================================
   SecureVote - Online Voting System
   File: controllers/auditController.js
   ========================================================== */

const AuditLog =
    require("../models/AuditLog");


/* ==========================================================
   GET AUDIT LOGS
   GET /api/admin/audit-logs
========================================================== */

const getAuditLogs = async (req, res) => {

    try {

        /* ==========================
           QUERY PARAMETERS
        ========================== */

        const {
            type,
            search,
            page = 1,
            limit = 100
        } = req.query;


        const query = {};


        /* ==========================
           FILTER BY TYPE
        ========================== */

        if (
            type &&
            [
                "success",
                "warning",
                "security"
            ].includes(type)
        ) {

            query.type = type;

        }


        /* ==========================
           SEARCH
        ========================== */

        if (
            search &&
            search.trim()
        ) {

            const searchRegex =
                new RegExp(
                    escapeRegex(
                        search.trim()
                    ),
                    "i"
                );


            query.$or = [

                {
                    event:
                        searchRegex
                },

                {
                    category:
                        searchRegex
                },

                {
                    userLabel:
                        searchRegex
                },

                {
                    ipAddress:
                        searchRegex
                },

                {
                    details:
                        searchRegex
                }

            ];

        }


        /* ==========================
           PAGINATION
        ========================== */

        const pageNumber =
            Math.max(
                Number.parseInt(
                    page,
                    10
                ) || 1,
                1
            );


        const limitNumber =
            Math.min(
                Math.max(
                    Number.parseInt(
                        limit,
                        10
                    ) || 100,
                    1
                ),
                500
            );


        const skip =
            (
                pageNumber - 1
            ) * limitNumber;


        /* ==========================
           LOAD LOGS
        ========================== */

        const [
            logs,
            filteredCount
        ] =
            await Promise.all([

                AuditLog
                    .find(query)

                    .select(
                        "event category type userLabel ipAddress details metadata integrityHash createdAt"
                    )

                    .sort({
                        createdAt: -1
                    })

                    .skip(skip)

                    .limit(limitNumber)

                    .lean(),


                AuditLog.countDocuments(
                    query
                )

            ]);


        /* ==========================
           STATISTICS
        ========================== */

        const stats =
            await AuditLog.aggregate([

                {
                    $group: {

                        _id:
                            "$type",

                        count: {
                            $sum: 1
                        }

                    }
                }

            ]);


        const statistics = {

            total:
                0,

            success:
                0,

            warning:
                0,

            security:
                0

        };


        stats.forEach(item => {

            if (
                item._id &&
                Object.prototype.hasOwnProperty.call(
                    statistics,
                    item._id
                )
            ) {

                statistics[item._id] =
                    item.count;

            }


            statistics.total +=
                item.count;

        });


        /* ==========================
           RESPONSE
        ========================== */

        return res.status(200).json({

            success: true,

            statistics,

            pagination: {

                page:
                    pageNumber,

                limit:
                    limitNumber,

                count:
                    filteredCount,

                pages:
                    Math.ceil(
                        filteredCount /
                        limitNumber
                    )

            },

            logs

        });


    } catch (error) {

        console.error(
            "Get Audit Logs Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load audit logs"

        });

    }

};


/* ==========================================================
   GET SINGLE AUDIT LOG
   GET /api/admin/audit-logs/:id
========================================================== */

const getAuditLog = async (req, res) => {

    try {

        const log =
            await AuditLog
                .findById(
                    req.params.id
                )
                .select(
                    "event category type userLabel ipAddress userAgent details metadata integrityHash createdAt"
                )
                .lean();


        if (!log) {

            return res.status(404).json({

                success: false,

                message:
                    "Audit event not found"

            });

        }


        return res.status(200).json({

            success: true,

            log

        });


    } catch (error) {

        console.error(
            "Get Audit Log Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load audit event"

        });

    }

};


/* ==========================================================
   ESCAPE REGEX
========================================================== */

function escapeRegex(value) {

    return String(value)
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}


/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

    getAuditLogs,

    getAuditLog

};