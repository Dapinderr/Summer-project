/* ==========================================================
   SecureVote - Online Voting System
   File: public/js/register.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==============================
       ELEMENTS
    ============================== */

    const form = document.getElementById("registerForm");

    const fullName = document.getElementById("fullname");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const dob = document.getElementById("dob");
    const voterId = document.getElementById("voterid");
    const govId = document.getElementById("govid");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const terms = document.getElementById("terms");

    const messageBox = document.getElementById("registerMessage");
    const submitButton = document.getElementById("registerBtn");


    /* ==============================
       FORM CHECK
    ============================== */

    if (!form) {
        console.error("Register form not found.");
        return;
    }


    /* ==============================
       MESSAGE
    ============================== */

    function showMessage(message, type = "error") {

        if (!messageBox) {
            return;
        }

        messageBox.textContent = message;

        messageBox.classList.remove(
            "success",
            "error"
        );

        messageBox.classList.add(type);
    }


    function clearMessage() {

        if (!messageBox) {
            return;
        }

        messageBox.textContent = "";

        messageBox.classList.remove(
            "success",
            "error"
        );
    }


    /* ==============================
       SHOW / HIDE PASSWORD
    ============================== */

    document
        .querySelectorAll(".toggle-password")
        .forEach(button => {

            button.addEventListener("click", () => {

                const targetId =
                    button.dataset.target;

                const target =
                    document.getElementById(targetId);

                if (!target) {
                    return;
                }

                const icon =
                    button.querySelector("i");


                if (target.type === "password") {

                    target.type = "text";

                    icon?.classList.remove(
                        "fa-eye"
                    );

                    icon?.classList.add(
                        "fa-eye-slash"
                    );

                } else {

                    target.type = "password";

                    icon?.classList.remove(
                        "fa-eye-slash"
                    );

                    icon?.classList.add(
                        "fa-eye"
                    );

                }

            });

        });


    /* ==============================
       EMAIL VALIDATION
    ============================== */

    function validateEmail(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(value);

    }


    /* ==============================
       PHONE VALIDATION
    ============================== */

    function validatePhone(value) {

        return /^[6-9]\d{9}$/
            .test(value);

    }


    /* ==============================
       AGE CALCULATION
    ============================== */

    function calculateAge(date) {

        const today = new Date();
        const birth = new Date(date);


        if (Number.isNaN(birth.getTime())) {
            return 0;
        }


        let age =
            today.getFullYear() -
            birth.getFullYear();


        const monthDifference =
            today.getMonth() -
            birth.getMonth();


        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() <
                birth.getDate()
            )
        ) {

            age--;

        }


        return age;
    }


    /* ==============================
       FORM SUBMIT
    ============================== */

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();


            /* ==========================
               FULL NAME
            ========================== */

            if (
                !fullName ||
                fullName.value.trim().length < 3
            ) {

                showMessage(
                    "Enter a valid full name."
                );

                fullName?.focus();

                return;
            }


            /* ==========================
               EMAIL
            ========================== */

            if (
                !email ||
                !validateEmail(
                    email.value.trim()
                )
            ) {

                showMessage(
                    "Enter a valid email address."
                );

                email?.focus();

                return;
            }


            /* ==========================
               PHONE
            ========================== */

            if (
                !phone ||
                !validatePhone(
                    phone.value.trim()
                )
            ) {

                showMessage(
                    "Enter a valid 10-digit Indian mobile number."
                );

                phone?.focus();

                return;
            }


            /* ==========================
               DATE OF BIRTH
            ========================== */

            if (!dob || !dob.value) {

                showMessage(
                    "Please enter your date of birth."
                );

                dob?.focus();

                return;
            }


            if (calculateAge(dob.value) < 18) {

                showMessage(
                    "You must be at least 18 years old to register."
                );

                dob.focus();

                return;
            }


            /* ==========================
               VOTER ID
            ========================== */

            if (
                !voterId ||
                voterId.value.trim().length < 8
            ) {

                showMessage(
                    "Enter a valid Voter ID."
                );

                voterId?.focus();

                return;
            }


            /* ==========================
               GOVERNMENT ID
            ========================== */

            if (
                !govId ||
                !govId.files ||
                !govId.files.length
            ) {

                showMessage(
                    "Please upload your Government ID."
                );

                govId?.focus();

                return;
            }


            const selectedFile =
                govId.files[0];


            /* ==========================
               FILE TYPE
            ========================== */

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "application/pdf"
            ];


            if (
                !allowedTypes.includes(
                    selectedFile.type
                )
            ) {

                showMessage(
                    "Government ID must be JPG, PNG or PDF."
                );

                govId.value = "";

                return;
            }


            /* ==========================
               FILE SIZE
               Maximum = 5 MB
            ========================== */

            const maximumFileSize =
                5 * 1024 * 1024;


            if (
                selectedFile.size >
                maximumFileSize
            ) {

                showMessage(
                    "Government ID must be smaller than 5 MB."
                );

                govId.value = "";

                return;
            }


            /* ==========================
               PASSWORD
            ========================== */

            if (
                !password ||
                password.value.length < 8
            ) {

                showMessage(
                    "Password must contain at least 8 characters."
                );

                password?.focus();

                return;
            }


            /* ==========================
               CONFIRM PASSWORD
            ========================== */

            if (
                !confirmPassword ||
                password.value !==
                confirmPassword.value
            ) {

                showMessage(
                    "Passwords do not match."
                );

                confirmPassword?.focus();

                return;
            }


            /* ==========================
               TERMS
            ========================== */

            if (!terms || !terms.checked) {

                showMessage(
                    "Please accept the SecureVote terms."
                );

                terms?.focus();

                return;
            }


            /* ==============================
               BUTTON LOADING
            ============================== */

            const originalButtonHTML =
                submitButton
                    ? submitButton.innerHTML
                    : "";


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Creating Account...</span>
                `;

            }


            try {

                /* ==============================
                   CREATE FORM DATA
                ============================== */

                const formData =
                    new FormData();


                formData.append(
                    "name",
                    fullName.value.trim()
                );


                formData.append(
                    "email",
                    email.value
                        .trim()
                        .toLowerCase()
                );


                formData.append(
                    "phone",
                    phone.value.trim()
                );


                formData.append(
                    "dob",
                    dob.value
                );


                formData.append(
                    "voterId",
                    voterId.value
                        .trim()
                        .toUpperCase()
                );


                formData.append(
                    "password",
                    password.value
                );


                /* Government ID file */

                formData.append(
                    "governmentId",
                    selectedFile
                );


                console.log(
                    "Sending registration request..."
                );


                /* ==============================
                   BACKEND REQUEST
                ============================== */

                const response =
                    await fetch(
                        "/api/auth/register",
                        {
                            method: "POST",

                            /*
                              Do NOT manually add
                              Content-Type.

                              Browser will generate the
                              multipart/form-data boundary.
                            */

                            body: formData
                        }
                    );


                /* ==============================
                   SERVER RESPONSE
                ============================== */

                const contentType =
                    response.headers.get(
                        "content-type"
                    );


                if (
                    !contentType ||
                    !contentType.includes(
                        "application/json"
                    )
                ) {

                    throw new Error(
                        "Invalid response from server."
                    );

                }


                const data =
                    await response.json();


                /* ==============================
                   SERVER ERROR
                ============================== */

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Registration failed."
                    );

                }


                /* ==============================
                   VALIDATE RESPONSE
                ============================== */

                if (
                    !data.user ||
                    !data.user.id
                ) {

                    throw new Error(
                        "Server did not return a valid user."
                    );

                }


                /* ==============================
                   SAVE USER
                ============================== */

                localStorage.setItem(
                    "secureVoteUser",
                    JSON.stringify(
                        data.user
                    )
                );


                /* ==============================
                   SAVE JWT
                ============================== */

                if (data.token) {

                    localStorage.setItem(
                        "secureVoteToken",
                        data.token
                    );

                }


                /* ==============================
                   SAVE OTP DATA
                ============================== */

                sessionStorage.setItem(
                    "secureVoteOtpUserId",
                    data.user.id
                );


                sessionStorage.setItem(
                    "secureVoteOtpEmail",
                    data.user.email
                );


                /* ==============================
                   SUCCESS
                ============================== */

                showMessage(
                    data.message ||
                    "Registration successful.",
                    "success"
                );


                console.log(
                    "Registration successful:"
                );

                console.table(
                    data.user
                );


                /* ==============================
                   REDIRECT TO OTP
                ============================== */

                setTimeout(() => {

                    window.location.href =
                        "/otp.html";

                }, 1000);


            } catch (error) {

                console.error(
                    "Registration Error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to register. Please try again."
                );


            } finally {

                /* ==============================
                   RESTORE BUTTON
                ============================== */

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML =
                        originalButtonHTML;

                }

            }

        }
    );

});