/* ==========================================================
   SecureVote - Online Voting System
   File: utils/sendEmail.js
   ========================================================== */

const nodemailer = require("nodemailer");


/* ==============================
   CHECK SMTP CONFIG
============================== */

const requiredEnv = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "EMAIL_FROM"
];

for (const key of requiredEnv) {

    if (!process.env[key]) {

        console.warn(
            `Warning: ${key} is missing from .env`
        );

    }

}


/* ==============================
   CREATE TRANSPORTER
============================== */

const smtpPort =
    Number(process.env.SMTP_PORT) || 587;


const transporter =
    nodemailer.createTransport({

        host:
            process.env.SMTP_HOST,

        port:
            smtpPort,

        secure:
            smtpPort === 465,

        auth: {

            user:
                process.env.SMTP_USER,

            pass:
                process.env.SMTP_PASS

        }

    });


/* ==============================
   SEND EMAIL
============================== */

const sendEmail =
    async ({
        to,
        subject,
        html
    }) => {

        try {

            if (!to) {
                throw new Error(
                    "Recipient email is required"
                );
            }


            const info =
                await transporter.sendMail({

                    from:
                        `"SecureVote" <${process.env.EMAIL_FROM}>`,

                    to,

                    subject,

                    html

                });


            console.log(
                "Email sent successfully:",
                info.messageId
            );


            return info;


        } catch (error) {

            console.error(
                "Email sending failed:",
                error.message
            );

            throw error;

        }

    };


module.exports = sendEmail;