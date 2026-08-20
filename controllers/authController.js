/* ==========================================================
   SecureVote - Online Voting System
   File: controllers/authController.js
   ========================================================== */

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");


/* ==============================
   AUDIT LOGGER
============================== */

const {
    createAuditLog,
    createSecurityLog,
    createWarningLog
} = require("../utils/auditLogger");


/* ==========================================================
   GENERATE JWT
========================================================== */

const generateToken = (user) => {

    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN || "1d"
        }
    );

};


/* ==========================================================
   GENERATE OTP
========================================================== */

const generateOTP = () => {

    return crypto
        .randomInt(100000, 1000000)
        .toString();

};


/* ==========================================================
   DELETE UPLOADED FILE
========================================================== */

const deleteUploadedFile = (file) => {

    if (!file || !file.path) {
        return;
    }

    fs.unlink(
        file.path,
        error => {

            if (
                error &&
                error.code !== "ENOENT"
            ) {

                console.error(
                    "File Cleanup Error:",
                    error
                );

            }

        }
    );

};


/* ==========================================================
   SEND OTP EMAIL
========================================================== */

const sendOTPEmail =
    async (user, otp) => {

        await sendEmail({

            to: user.email,

            subject:
                "SecureVote Email Verification",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    padding: 25px;
                    max-width: 600px;
                    margin: auto;
                ">

                    <h2 style="color:#2563eb;">
                        SecureVote
                    </h2>

                    <p>
                        Hello ${user.name},
                    </p>

                    <p>
                        Your SecureVote verification code is:
                    </p>

                    <h1 style="
                        letter-spacing:8px;
                        color:#0f172a;
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This code expires in
                        <strong>10 minutes</strong>.
                    </p>

                    <p>
                        Do not share this verification
                        code with anyone.
                    </p>

                </div>
            `

        });

};


/* ==========================================================
   REGISTER
========================================================== */

exports.register =
    async (req, res) => {

        let userCreated = false;

        try {

            const {
                name,
                email,
                phone,
                dob,
                voterId,
                password
            } = req.body;


            /* ==========================
               REQUIRED FIELDS
            ========================== */

            if (
                !name ||
                !email ||
                !phone ||
                !dob ||
                !voterId ||
                !password
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "All registration fields are required"

                });

            }


            /* ==========================
               GOVERNMENT ID
            ========================== */

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Government ID document is required"

                });

            }


            /* ==========================
               NORMALIZE
            ========================== */

            const normalizedName =
                String(name).trim();

            const normalizedEmail =
                String(email)
                    .toLowerCase()
                    .trim();

            const normalizedPhone =
                String(phone).trim();

            const normalizedVoterId =
                String(voterId)
                    .trim()
                    .toUpperCase();


            /* ==========================
               NAME
            ========================== */

            if (
                normalizedName.length < 3
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid full name"

                });

            }


            /* ==========================
               EMAIL
            ========================== */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (
                !emailPattern.test(
                    normalizedEmail
                )
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid email address"

                });

            }


            /* ==========================
               PHONE
            ========================== */

            if (
                !/^[6-9]\d{9}$/.test(
                    normalizedPhone
                )
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid 10-digit mobile number"

                });

            }


            /* ==========================
               VOTER ID
            ========================== */

            if (
                normalizedVoterId.length < 8
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid Voter ID"

                });

            }


            /* ==========================
               PASSWORD
            ========================== */

            if (
                String(password).length < 8
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must contain at least 8 characters"

                });

            }


            /* ==========================
               DATE OF BIRTH
            ========================== */

            const birthDate =
                new Date(dob);


            if (
                Number.isNaN(
                    birthDate.getTime()
                )
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid date of birth"

                });

            }


            const today =
                new Date();


            if (
                birthDate > today
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Date of birth cannot be in the future"

                });

            }


            /* ==========================
               AGE
            ========================== */

            let age =
                today.getFullYear() -
                birthDate.getFullYear();


            const monthDifference =
                today.getMonth() -
                birthDate.getMonth();


            if (
                monthDifference < 0 ||
                (
                    monthDifference === 0 &&
                    today.getDate() <
                    birthDate.getDate()
                )
            ) {

                age--;

            }


            if (
                age < 18
            ) {

                deleteUploadedFile(
                    req.file
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "You must be at least 18 years old to register"

                });

            }


            /* ==========================
               DUPLICATE CHECK
            ========================== */

            const existingUser =
                await User.findOne({

                    $or: [

                        {
                            email:
                                normalizedEmail
                        },

                        {
                            voterId:
                                normalizedVoterId
                        }

                    ]

                });


            if (
                existingUser
            ) {

                deleteUploadedFile(
                    req.file
                );


                await createWarningLog({

                    req,

                    user:
                        existingUser,

                    event:
                        "Duplicate Registration Attempt",

                    category:
                        "Authentication",

                    details:
                        "A registration attempt used an email address or Voter ID that is already registered.",

                    metadata: {
                        reason:
                            "duplicate-account"
                    }

                });


                if (
                    existingUser.email ===
                    normalizedEmail
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "An account with this email already exists"

                    });

                }


                return res.status(409).json({

                    success: false,

                    message:
                        "This Voter ID is already registered"

                });

            }


            /* ==========================
               CREATE USER
            ========================== */

            const user =
                await User.create({

                    name:
                        normalizedName,

                    email:
                        normalizedEmail,

                    phone:
                        normalizedPhone,

                    dob:
                        birthDate,

                    voterId:
                        normalizedVoterId,

                    governmentId:
                        req.file.filename,

                    password,

                    role:
                        "voter",

                    isVerified:
                        false,

                    accountStatus:
                        "pending"

                });


            userCreated = true;


            /* ==========================
               CREATE OTP
            ========================== */

            const otp =
                generateOTP();


            user.otp =
                otp;


            user.otpExpires =
                new Date(
                    Date.now() +
                    10 * 60 * 1000
                );


            await user.save();


            /* ==========================
               REGISTRATION AUDIT
            ========================== */

            await createAuditLog({

                req,

                user,

                event:
                    "Voter Registered",

                category:
                    "Authentication",

                type:
                    "success",

                details:
                    "A new voter account was registered and is awaiting email verification.",

                metadata: {

                    accountStatus:
                        user.accountStatus,

                    emailVerified:
                        false

                }

            });


            /* ==========================
               SEND OTP
            ========================== */

            try {

                await sendOTPEmail(
                    user,
                    otp
                );

            } catch (emailError) {

                console.error(
                    "OTP Email Error:",
                    emailError
                );


                await createWarningLog({

                    req,

                    user,

                    event:
                        "Verification Email Failed",

                    category:
                        "Authentication",

                    details:
                        "The voter account was created, but the verification email could not be sent.",

                    metadata: {
                        reason:
                            "email-delivery-failure"
                    }

                });


                return res.status(201).json({

                    success: true,

                    emailSent: false,

                    message:
                        "Account created, but verification email could not be sent. Please use Resend OTP.",

                    user: {

                        id:
                            user._id,

                        name:
                            user.name,

                        email:
                            user.email,

                        phone:
                            user.phone,

                        dob:
                            user.dob,

                        voterId:
                            user.voterId,

                        role:
                            user.role,

                        isVerified:
                            user.isVerified,

                        accountStatus:
                            user.accountStatus

                    }

                });

            }


            return res.status(201).json({

                success: true,

                emailSent: true,

                message:
                    "Registration successful. Verification code sent.",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    phone:
                        user.phone,

                    dob:
                        user.dob,

                    voterId:
                        user.voterId,

                    role:
                        user.role,

                    isVerified:
                        user.isVerified,

                    accountStatus:
                        user.accountStatus

                }

            });


        } catch (error) {

            console.error(
                "Registration Error:",
                error
            );


            if (
                !userCreated
            ) {

                deleteUploadedFile(
                    req.file
                );

            }


            if (
                error.code === 11000
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Email or Voter ID is already registered"

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Registration failed"

            });

        }

    };


/* ==========================================================
   VERIFY OTP
========================================================== */

exports.verifyOTP =
    async (req, res) => {

        try {

            const {
                userId,
                otp
            } = req.body;


            if (
                !userId ||
                !otp
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "User ID and OTP are required"

                });

            }


            const user =
                await User
                    .findById(
                        userId
                    )
                    .select(
                        "+otp +otpExpires"
                    );


            if (
                !user
            ) {

                await createSecurityLog({

                    req,

                    event:
                        "OTP Verification Failed",

                    category:
                        "Authentication",

                    details:
                        "OTP verification was attempted for an unknown user.",

                    metadata: {
                        reason:
                            "user-not-found"
                    }

                });


                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"

                });

            }


            if (
                user.isVerified
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Account is already verified"

                });

            }


            if (
                !user.otp ||
                !user.otpExpires
            ) {

                await createWarningLog({

                    req,

                    user,

                    event:
                        "OTP Verification Failed",

                    category:
                        "Authentication",

                    details:
                        "OTP verification was attempted without an active verification code.",

                    metadata: {
                        reason:
                            "no-active-otp"
                    }

                });


                return res.status(400).json({

                    success: false,

                    message:
                        "No active OTP found. Please request a new OTP."

                });

            }


            /* ==========================
               EXPIRED OTP
            ========================== */

            if (
                user.otpExpires.getTime() <
                Date.now()
            ) {

                user.otp =
                    undefined;

                user.otpExpires =
                    undefined;


                await user.save();


                await createWarningLog({

                    req,

                    user,

                    event:
                        "OTP Expired",

                    category:
                        "Authentication",

                    details:
                        "The voter attempted to verify an expired OTP.",

                    metadata: {
                        reason:
                            "otp-expired"
                    }

                });


                return res.status(400).json({

                    success: false,

                    expired: true,

                    message:
                        "OTP has expired. Please request a new OTP."

                });

            }


            /* ==========================
               CHECK OTP
            ========================== */

            const submittedOTP =
                String(otp)
                    .trim();


            if (
                String(user.otp) !==
                submittedOTP
            ) {

                await createSecurityLog({

                    req,

                    user,

                    event:
                        "Invalid OTP Attempt",

                    category:
                        "Authentication",

                    details:
                        "An invalid email verification code was submitted.",

                    metadata: {
                        reason:
                            "invalid-otp"
                    }

                });


                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid OTP"

                });

            }


            /* ==========================
               EMAIL VERIFIED
            ========================== */

            user.isVerified =
                true;


            user.accountStatus =
                user.role === "admin"
                    ? "active"
                    : "pending";


            user.otp =
                undefined;

            user.otpExpires =
                undefined;


            await user.save();


            await createAuditLog({

                req,

                user,

                event:
                    "Email Verification Completed",

                category:
                    "Authentication",

                type:
                    "success",

                details:
                    user.role === "voter"
                        ? "Voter email verification completed. The account is awaiting administrator approval."
                        : "Administrator email verification completed.",

                metadata: {

                    role:
                        user.role,

                    accountStatus:
                        user.accountStatus,

                    emailVerified:
                        true

                }

            });


            /* ==========================
               VOTER
            ========================== */

            if (
                user.role === "voter"
            ) {

                return res.status(200).json({

                    success: true,

                    verified: true,

                    pendingApproval: true,

                    message:
                        "Email verified successfully. Your voter account is awaiting administrator approval.",

                    user: {

                        id:
                            user._id,

                        name:
                            user.name,

                        email:
                            user.email,

                        phone:
                            user.phone,

                        dob:
                            user.dob,

                        voterId:
                            user.voterId,

                        role:
                            user.role,

                        isVerified:
                            user.isVerified,

                        accountStatus:
                            user.accountStatus

                    }

                });

            }


            /* ==========================
               ADMIN
            ========================== */

            const token =
                generateToken(
                    user
                );


            return res.status(200).json({

                success: true,

                verified: true,

                message:
                    "Account verified successfully",

                token,

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    phone:
                        user.phone,

                    dob:
                        user.dob,

                    voterId:
                        user.voterId,

                    role:
                        user.role,

                    isVerified:
                        user.isVerified,

                    accountStatus:
                        user.accountStatus

                }

            });


        } catch (error) {

            console.error(
                "OTP Verification Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "OTP verification failed"

            });

        }

    };


/* ==========================================================
   RESEND OTP
========================================================== */

exports.resendOTP =
    async (req, res) => {

        try {

            const {
                userId
            } = req.body;


            if (
                !userId
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "User ID is required"

                });

            }


            const user =
                await User.findById(
                    userId
                );


            if (
                !user
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"

                });

            }


            if (
                user.isVerified
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Account is already verified"

                });

            }


            const otp =
                generateOTP();


            user.otp =
                otp;


            user.otpExpires =
                new Date(
                    Date.now() +
                    10 * 60 * 1000
                );


            await user.save();


            await sendOTPEmail(
                user,
                otp
            );


            await createAuditLog({

                req,

                user,

                event:
                    "Verification OTP Resent",

                category:
                    "Authentication",

                type:
                    "success",

                details:
                    "A new email verification code was sent to the account.",

                metadata: {
                    emailVerified:
                        false
                }

            });


            return res.status(200).json({

                success: true,

                message:
                    "A new OTP has been sent to your email"

            });


        } catch (error) {

            console.error(
                "Resend OTP Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to resend OTP"

            });

        }

    };


/* ==========================================================
   LOGIN
========================================================== */

exports.login =
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required"

                });

            }


            const normalizedEmail =
                String(email)
                    .toLowerCase()
                    .trim();


            const user =
                await User
                    .findOne({

                        email:
                            normalizedEmail

                    })
                    .select(
                        "+password"
                    );


            /* ==========================
               UNKNOWN ACCOUNT
            ========================== */

            if (
                !user
            ) {

                await createSecurityLog({

                    req,

                    event:
                        "Failed Login Attempt",

                    category:
                        "Authentication",

                    details:
                        "A login attempt was made using an unrecognized account.",

                    metadata: {
                        reason:
                            "invalid-credentials"
                    }

                });


                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password"

                });

            }


            /* ==========================
               PASSWORD
            ========================== */

            const passwordMatches =
                await user.comparePassword(
                    password
                );


            if (
                !passwordMatches
            ) {

                await createSecurityLog({

                    req,

                    user,

                    event:
                        "Failed Login Attempt",

                    category:
                        "Authentication",

                    details:
                        "An incorrect password was submitted for an existing account.",

                    metadata: {
                        reason:
                            "invalid-credentials"
                    }

                });


                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password"

                });

            }


            /* ==========================
               EMAIL NOT VERIFIED
            ========================== */

            if (
                !user.isVerified
            ) {

                await createWarningLog({

                    req,

                    user,

                    event:
                        "Unverified Account Login Attempt",

                    category:
                        "Authentication",

                    details:
                        "A login attempt was made before email verification was completed.",

                    metadata: {
                        reason:
                            "email-not-verified"
                    }

                });


                return res.status(403).json({

                    success: false,

                    requiresVerification:
                        true,

                    userId:
                        user._id,

                    email:
                        user.email,

                    message:
                        "Please verify your email before logging in"

                });

            }


            /* ==========================
               PENDING APPROVAL
            ========================== */

            if (
                user.role === "voter" &&
                user.accountStatus ===
                    "pending"
            ) {

                await createWarningLog({

                    req,

                    user,

                    event:
                        "Pending Voter Login Attempt",

                    category:
                        "Authentication",

                    details:
                        "A verified voter attempted to log in before administrator approval.",

                    metadata: {
                        reason:
                            "pending-admin-approval"
                    }

                });


                return res.status(403).json({

                    success: false,

                    pendingApproval:
                        true,

                    message:
                        "Your email is verified. Your voter account is awaiting administrator approval."

                });

            }


            /* ==========================
               SUSPENDED
            ========================== */

            if (
                user.accountStatus ===
                "suspended"
            ) {

                await createSecurityLog({

                    req,

                    user,

                    event:
                        "Suspended Account Login Attempt",

                    category:
                        "Authentication",

                    details:
                        "A suspended account attempted to log in.",

                    metadata: {
                        reason:
                            "account-suspended"
                    }

                });


                return res.status(403).json({

                    success: false,

                    suspended:
                        true,

                    message:
                        "Your account has been suspended"

                });

            }


            /* ==========================
               ACTIVE CHECK
            ========================== */

            if (
                user.accountStatus !==
                "active"
            ) {

                await createWarningLog({

                    req,

                    user,

                    event:
                        "Inactive Account Login Attempt",

                    category:
                        "Authentication",

                    details:
                        "A login attempt was blocked because the account is not active.",

                    metadata: {
                        reason:
                            "account-not-active"
                    }

                });


                return res.status(403).json({

                    success: false,

                    message:
                        "Your account is not active"

                });

            }


            /* ==========================
               JWT
            ========================== */

            const token =
                generateToken(
                    user
                );


            /* ==========================
               LOGIN AUDIT
            ========================== */

            await createAuditLog({

                req,

                user,

                event:
                    user.role === "admin"
                        ? "Administrator Login"
                        : "Voter Login",

                category:
                    "Authentication",

                type:
                    "success",

                details:
                    user.role === "admin"
                        ? "Administrator authenticated successfully."
                        : "Voter authenticated successfully.",

                metadata: {
                    role:
                        user.role
                }

            });


            /* ==========================
               SUCCESS
            ========================== */

            return res.status(200).json({

                success: true,

                message:
                    "Login successful",

                token,

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    phone:
                        user.phone,

                    dob:
                        user.dob,

                    voterId:
                        user.voterId,

                    role:
                        user.role,

                    isVerified:
                        user.isVerified,

                    accountStatus:
                        user.accountStatus

                }

            });


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to login"

            });

        }

    };


/* ==========================================================
   CURRENT USER
========================================================== */

exports.getMe =
    async (req, res) => {

        try {

            const user =
                await User
                    .findById(
                        req.user.id
                    )
                    .select(
                        "-password -governmentId -otp -otpExpires"
                    );


            if (
                !user
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"

                });

            }


            return res.status(200).json({

                success: true,

                user

            });


        } catch (error) {

            console.error(
                "Get User Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve user"

            });

        }

    };