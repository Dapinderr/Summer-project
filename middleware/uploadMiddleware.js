/* ==========================================================
   SecureVote - Online Voting System
   File: middleware/uploadMiddleware.js
   ========================================================== */

const multer = require("multer");
const path = require("path");
const fs = require("fs");


/* ==============================
   UPLOAD DIRECTORY
============================== */

const uploadDirectory =
    path.join(
        __dirname,
        "../uploads/government-ids"
    );


/* Create directory automatically */

if (!fs.existsSync(uploadDirectory)) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );

}


/* ==============================
   STORAGE
============================== */

const storage =
    multer.diskStorage({

        destination: (
            req,
            file,
            cb
        ) => {

            cb(
                null,
                uploadDirectory
            );

        },


        filename: (
            req,
            file,
            cb
        ) => {

            const extension =
                path.extname(
                    file.originalname
                ).toLowerCase();


            const uniqueName =
                `${Date.now()}-${Math.round(
                    Math.random() * 1E9
                )}${extension}`;


            cb(
                null,
                uniqueName
            );

        }

    });


/* ==============================
   FILE FILTER
============================== */

const fileFilter = (
    req,
    file,
    cb
) => {

    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];


    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf"
    ];


    const extension =
        path.extname(
            file.originalname
        ).toLowerCase();


    const validMimeType =
        allowedMimeTypes.includes(
            file.mimetype
        );


    const validExtension =
        allowedExtensions.includes(
            extension
        );


    if (
        validMimeType &&
        validExtension
    ) {

        return cb(
            null,
            true
        );

    }


    return cb(
        new Error(
            "Only JPG, JPEG, PNG and PDF files are allowed"
        ),
        false
    );

};


/* ==============================
   MULTER
============================== */

const upload =
    multer({

        storage,

        limits: {

            fileSize:
                5 * 1024 * 1024

        },

        fileFilter

    });


/* ==============================
   EXPORT
============================== */

module.exports = upload;