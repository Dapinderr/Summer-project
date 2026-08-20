/* ==========================================================
   SecureVote - Online Voting System
   File: utils/auditLogger.js
   ========================================================== */

const AuditLog =
    require("../models/AuditLog");


/* ==========================================================
   GET CLIENT IP
========================================================== */

function getClientIp(req) {

    if (!req) {
        return "Unknown";
    }


    const forwarded =
        req.headers?.["x-forwarded-for"];


    if (forwarded) {

        return forwarded
            .split(",")[0]
            .trim();

    }


    return (
        req.ip ||
        req.socket?.remoteAddress ||
        "Unknown"
    );

}


/* ==========================================================
   CREATE AUDIT LOG
========================================================== */

async function createAuditLog({

    req = null,

    user = null,

    event,

    category,

    type = "success",

    details,

    metadata = {}

}) {

    try {

        /* ==========================
           ACTOR
        ========================== */

        const actor =
            user ||
            req?.user ||
            null;


        const userId =
            actor?._id ||
            actor?.id ||
            null;


        const userLabel =
            actor?.email ||
            actor?.voterId ||
            actor?.name ||
            "System";


        /* ==========================
           REQUEST INFORMATION
        ========================== */

        const ipAddress =
            getClientIp(req);


        const userAgent =
            req?.headers?.["user-agent"] ||
            "";


        /* ==========================
           TIMESTAMP
        ========================== */

        const timestamp =
            new Date().toISOString();


        /* ==========================
           INTEGRITY HASH
        ========================== */

        const integrityHash =
            AuditLog.createIntegrityHash({

                event,

                category,

                type,

                userLabel,

                ipAddress,

                details,

                timestamp

            });


        /* ==========================
           CREATE LOG
        ========================== */

        const log =
            await AuditLog.create({

                event,

                category,

                type,

                user:
                    userId,

                userLabel,

                ipAddress,

                userAgent,

                details,

                metadata,

                integrityHash

            });


        return log;


    } catch (error) {

        /*
         * IMPORTANT:
         *
         * Audit logging failure should not normally
         * crash the main user/admin operation.
         */

        console.error(
            "Audit Log Error:",
            error.message
        );


        return null;

    }

}


/* ==========================================================
   SECURITY EVENT
========================================================== */

async function createSecurityLog({

    req = null,

    user = null,

    event,

    category = "Security",

    details,

    metadata = {}

}) {

    return createAuditLog({

        req,

        user,

        event,

        category,

        type:
            "security",

        details,

        metadata

    });

}


/* ==========================================================
   WARNING EVENT
========================================================== */

async function createWarningLog({

    req = null,

    user = null,

    event,

    category,

    details,

    metadata = {}

}) {

    return createAuditLog({

        req,

        user,

        event,

        category,

        type:
            "warning",

        details,

        metadata

    });

}


/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

    createAuditLog,

    createSecurityLog,

    createWarningLog,

    getClientIp

};