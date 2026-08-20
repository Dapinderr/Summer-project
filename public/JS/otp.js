/* ==========================================================
   SecureVote - Online Voting System
   File: public/js/otp.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("otpForm");
    const inputs = [...document.querySelectorAll(".otp-input")];

    const emailDisplay = document.getElementById("userEmail");
    const message = document.getElementById("otpMessage");

    const verifyBtn = document.getElementById("verifyBtn");
    const resendBtn = document.getElementById("resendBtn");
    const timer = document.getElementById("timer");


    /* ==============================
       GET REGISTRATION DATA
    ============================== */

    const userId =
        sessionStorage.getItem(
            "secureVoteOtpUserId"
        );

    const email =
        sessionStorage.getItem(
            "secureVoteOtpEmail"
        );


    /* ==============================
       CHECK USER
    ============================== */

    if (!userId) {

        alert(
            "Verification session not found. Please register or login again."
        );

        window.location.href =
            "/login.html";

        return;
    }


    /* ==============================
       DISPLAY EMAIL
    ============================== */

    if (email && emailDisplay) {

        emailDisplay.textContent =
            maskEmail(email);

    }


    function maskEmail(emailAddress) {

        const parts =
            emailAddress.split("@");

        if (parts.length !== 2) {
            return emailAddress;
        }

        const name = parts[0];
        const domain = parts[1];

        if (name.length <= 2) {
            return `${name[0] || "*"}***@${domain}`;
        }

        return (
            name.substring(0, 2) +
            "***@" +
            domain
        );

    }


    /* ==============================
       MESSAGE
    ============================== */

    function showMessage(
        text,
        type = "error"
    ) {

        if (!message) {
            return;
        }

        message.textContent = text;

        message.classList.remove(
            "success",
            "error"
        );

        message.classList.add(type);

    }


    function clearMessage() {

        if (!message) {
            return;
        }

        message.textContent = "";

        message.classList.remove(
            "success",
            "error"
        );

    }


    /* ==============================
       OTP INPUT HANDLING
    ============================== */

    inputs.forEach(
        (input, index) => {

            input.addEventListener(
                "input",
                () => {

                    /*
                       Numbers only
                    */

                    input.value =
                        input.value.replace(
                            /\D/g,
                            ""
                        );


                    /*
                       Move to next box
                    */

                    if (
                        input.value &&
                        index <
                        inputs.length - 1
                    ) {

                        inputs[
                            index + 1
                        ].focus();

                    }

                }
            );


            /* ==========================
               BACKSPACE
            ========================== */

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Backspace" &&
                        !input.value &&
                        index > 0
                    ) {

                        inputs[
                            index - 1
                        ].focus();

                    }

                }
            );


            /* ==========================
               PASTE OTP
            ========================== */

            input.addEventListener(
                "paste",
                event => {

                    event.preventDefault();

                    const pasted =
                        event.clipboardData
                            .getData("text")
                            .replace(/\D/g, "")
                            .slice(0, 6);


                    if (!pasted) {
                        return;
                    }


                    pasted
                        .split("")
                        .forEach(
                            (digit, position) => {

                                if (
                                    inputs[position]
                                ) {

                                    inputs[
                                        position
                                    ].value =
                                        digit;

                                }

                            }
                        );


                    const focusIndex =
                        Math.min(
                            pasted.length,
                            inputs.length
                        ) - 1;


                    if (
                        focusIndex >= 0
                    ) {

                        inputs[
                            focusIndex
                        ].focus();

                    }

                }
            );

        }
    );


    /* ==============================
       VERIFY OTP
    ============================== */

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearMessage();


            const otp =
                inputs
                    .map(
                        input =>
                            input.value
                                .trim()
                    )
                    .join("");


            /* ==========================
               VALIDATE OTP
            ========================== */

            if (
                !/^\d{6}$/.test(otp)
            ) {

                showMessage(
                    "Please enter the complete 6-digit OTP."
                );

                return;
            }


            /* ==========================
               LOADING BUTTON
            ========================== */

            const originalButton =
                verifyBtn.innerHTML;


            verifyBtn.disabled = true;

            verifyBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Verifying...</span>
            `;


            try {

                /* ==========================
                   SEND OTP
                ========================== */

                const response =
                    await fetch(
                        "/api/auth/verify-otp",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    userId,
                                    otp
                                })
                        }
                    );


                const data =
                    await response.json();


                /* ==========================
                   ERROR
                ========================== */

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "OTP verification failed."
                    );

                }


                /* ==========================
                   SAVE JWT
                ========================== */

                if (data.token) {

                    localStorage.setItem(
                        "secureVoteToken",
                        data.token
                    );

                }


                /* ==========================
                   SAVE VERIFIED USER
                ========================== */

                if (data.user) {

                    localStorage.setItem(
                        "secureVoteUser",
                        JSON.stringify(
                            data.user
                        )
                    );

                }


                /* ==========================
                   CLEAR TEMP DATA
                ========================== */

                sessionStorage.removeItem(
                    "secureVoteOtpUserId"
                );

                sessionStorage.removeItem(
                    "secureVoteOtpEmail"
                );


                /* ==========================
                   SUCCESS
                ========================== */

                showMessage(
                    data.message ||
                    "Account verified successfully!",
                    "success"
                );


                verifyBtn.innerHTML = `
                    <i class="fa-solid fa-circle-check"></i>
                    <span>Verified</span>
                `;


                /* ==========================
                   REDIRECT
                ========================== */

                setTimeout(() => {

                    window.location.href =
                        "/login.html";

                }, 1200);


            } catch (error) {

                console.error(
                    "OTP Verification Error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to verify OTP."
                );


                /*
                   Clear boxes after
                   incorrect OTP
                */

                inputs.forEach(
                    input => {
                        input.value = "";
                    }
                );


                inputs[0]?.focus();


                verifyBtn.disabled =
                    false;

                verifyBtn.innerHTML =
                    originalButton;

            }

        }
    );


    /* ==============================
       RESEND TIMER
    ============================== */

    let remainingSeconds = 60;


    function startTimer() {

        remainingSeconds = 60;

        resendBtn.disabled = true;


        function updateTimer() {

            if (
                remainingSeconds <= 0
            ) {

                timer.textContent =
                    "";

                resendBtn.disabled =
                    false;

                return;

            }


            timer.textContent =
                `Resend available in ${remainingSeconds}s`;


            remainingSeconds--;


            setTimeout(
                updateTimer,
                1000
            );

        }


        updateTimer();

    }


    /* ==============================
       RESEND OTP
    ============================== */

    resendBtn.addEventListener(
        "click",
        async () => {

            clearMessage();


            if (!userId) {

                showMessage(
                    "Verification session not found."
                );

                return;

            }


            const originalText =
                resendBtn.textContent;


            resendBtn.disabled = true;

            resendBtn.textContent =
                "Sending...";


            try {

                const response =
                    await fetch(
                        "/api/auth/resend-otp",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({
                                    userId
                                })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to resend OTP."
                    );

                }


                showMessage(
                    data.message ||
                    "A new OTP has been sent.",
                    "success"
                );


                /* Clear old OTP */

                inputs.forEach(
                    input => {
                        input.value = "";
                    }
                );


                inputs[0]?.focus();


                resendBtn.textContent =
                    originalText;


                startTimer();


            } catch (error) {

                console.error(
                    "Resend OTP Error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to resend OTP."
                );


                resendBtn.disabled =
                    false;

                resendBtn.textContent =
                    originalText;

            }

        }
    );


    /* ==============================
       INITIALIZE
    ============================== */

    inputs[0]?.focus();

    startTimer();

});1