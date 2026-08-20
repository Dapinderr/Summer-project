/* ==========================================================
   SecureVote - Online Voting System
   File: models/AuditLog.js
   ========================================================== */

const mongoose = require("mongoose");
const crypto = require("crypto");


/* ==========================================================
   AUDIT LOG SCHEMA
========================================================== */

const auditLogSchema =
    new mongoose.Schema(
        {

            /* ==========================
               EVENT
            ========================== */

            event: {
                type: String,
                required: true,
                trim: true,
                maxlength: 150
            },


            category: {
                type: String,
                required: true,
                trim: true,
                maxlength: 100
            },


            type: {
                type: String,
                enum: [
                    "success",
                    "warning",
                    "security"
                ],
                default: "success",
                index: true
            },


            /* ==========================
               ACTOR
            ========================== */

            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            },


            userLabel: {
                type: String,
                default: "System",
                trim: true
            },


            /* ==========================
               REQUEST INFORMATION
            ========================== */

            ipAddress: {
                type: String,
                default: "Unknown"
            },


            userAgent: {
                type: String,
                default: ""
            },


            /* ==========================
               EVENT DETAILS
            ========================== */

            details: {
                type: String,
                required: true,
                maxlength: 1000
            },


            metadata: {
                type: mongoose.Schema.Types.Mixed,
                default: {}
            },


            /* ==========================
               INTEGRITY
            ========================== */

            integrityHash: {
                type: String,
                required: true,
                unique: true,
                index: true
            }

        },
        {
            timestamps: true
        }
    );


/* ==========================================================
   INDEXES
========================================================== */

auditLogSchema.index({
    createdAt: -1
});


auditLogSchema.index({
    category: 1,
    createdAt: -1
});


/* ==========================================================
   CREATE INTEGRITY HASH
========================================================== */

auditLogSchema.statics.createIntegrityHash =
    function ({
        event,
        category,
        type,
        userLabel,
        ipAddress,
        details,
        timestamp
    }) {

        const payload = [
            event || "",
            category || "",
            type || "",
            userLabel || "",
            ipAddress || "",
            details || "",
            timestamp || new Date().toISOString(),
            crypto.randomBytes(16).toString("hex")
        ].join("|");


        return crypto
            .createHash("sha256")
            .update(payload)
            .digest("hex");

    };


/* ==========================================================
   EXPORT MODEL
========================================================== */

module.exports =
    mongoose.model(
        "AuditLog",
        auditLogSchema
    );