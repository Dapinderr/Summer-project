/* ==========================================================
   SecureVote
   File: public/js/admin-login.js
   Real Backend Admin Authentication
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ================= ELEMENTS ================= */

    const adminLoginForm =
        document.getElementById("adminLoginForm");

    const adminEmail =
        document.getElementById("adminEmail");

    const adminPassword =
        document.getElementById("adminPassword");

    const rememberAdmin =
        document.getElementById("rememberAdmin");

    const passwordToggle =
        document.getElementById("passwordToggle");

    const loginBtn =
        document.getElementById("loginBtn");

    const loginBtnText =
        document.getElementById("loginBtnText");

    const loginLoader =
        document.getElementById("loginLoader");

    const loginAlert =
        document.getElementById("loginAlert");

    const alertText =
        document.getElementById("alertText");


    /* ==========================================================
       CLEAR OLD DEMO ADMIN SESSION
       ========================================================== */

    localStorage.removeItem("secureVoteAdminAuth");
    sessionStorage.removeItem("secureVoteAdminAuth");


    /* ==========================================================
       CHECK EXISTING REAL ADMIN SESSION
       ========================================================== */

    function checkExistingSession() {

        const token =
            localStorage.getItem("secureVoteAdminToken") ||
            sessionStorage.getItem("secureVoteAdminToken");

        const userString =
            localStorage.getItem("secureVoteAdminUser") ||
            sessionStorage.getItem("secureVoteAdminUser");


        if (!token || !userString) {
            return;
        }


        try {

            const user =
                JSON.parse(userString);


            if (user.role === "admin") {

                window.location.href =
                    "admin-dashboard.html";

            }

        } catch (error) {

            clearAdminSession();

        }

    }


    checkExistingSession();


    /* ==========================================================
       LOAD REMEMBERED EMAIL
       ========================================================== */

    const rememberedEmail =
        localStorage.getItem(
            "secureVoteRememberedAdmin"
        );


    if (rememberedEmail && adminEmail) {

        adminEmail.value =
            rememberedEmail;

        if (rememberAdmin) {
            rememberAdmin.checked = true;
        }

    }


    /* ==========================================================
       PASSWORD VISIBILITY
       ========================================================== */

    passwordToggle?.addEventListener(
        "click",
        () => {

            const hidden =
                adminPassword.type === "password";


            adminPassword.type =
                hidden
                    ? "text"
                    : "password";


            const icon =
                passwordToggle.querySelector("i");


            if (icon) {

                icon.className =
                    hidden
                        ? "fa-solid fa-eye-slash"
                        : "fa-solid fa-eye";

            }

        }
    );


    /* ==========================================================
       ADMIN LOGIN
       ========================================================== */

    adminLoginForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            hideAlert();


            const email =
                adminEmail.value
                    .trim()
                    .toLowerCase();

            const password =
                adminPassword.value;


            /* ================= VALIDATION ================= */

            if (!validateEmail(email)) {

                showAlert(
                    "Please enter a valid administrator email."
                );

                adminEmail.focus();

                return;

            }


            if (!password) {

                showAlert(
                    "Please enter your administrator password."
                );

                adminPassword.focus();

                return;

            }


            setLoading(true);


            try {

                /* ================= BACKEND LOGIN ================= */

                const response =
                    await fetch(
                        "/api/auth/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );


                const data =
                    await response.json();


                /* ================= LOGIN FAILED ================= */

                if (!response.ok || !data.success) {

                    showAlert(
                        data.message ||
                        "Invalid email or password."
                    );

                    return;

                }


                /* ================= GET USER ================= */

                const user =
                    data.user;


                if (!user) {

                    showAlert(
                        "Unable to load administrator account."
                    );

                    return;

                }


                /* ================= ADMIN ROLE CHECK ================= */

                if (user.role !== "admin") {

                    clearAdminSession();

                    showAlert(
                        "Access denied. This account is not an administrator."
                    );

                    return;

                }


                /* ================= ACCOUNT CHECK ================= */

                if (user.isVerified === false) {

                    showAlert(
                        "Administrator account is not verified."
                    );

                    return;

                }


                if (
                    user.accountStatus &&
                    user.accountStatus !== "active"
                ) {

                    showAlert(
                        "Administrator account is not active."
                    );

                    return;

                }


                /* ================= TOKEN CHECK ================= */

                if (!data.token) {

                    showAlert(
                        "Authentication token was not received."
                    );

                    return;

                }


                /* ================= REMEMBER EMAIL ================= */

                if (rememberAdmin?.checked) {

                    localStorage.setItem(
                        "secureVoteRememberedAdmin",
                        email
                    );

                } else {

                    localStorage.removeItem(
                        "secureVoteRememberedAdmin"
                    );

                }


                /* ================= CREATE SESSION ================= */

                saveAdminSession(
                    data.token,
                    user
                );


                /* ================= SUCCESS ================= */

                window.location.href =
                    "admin-dashboard.html";


            } catch (error) {

                console.error(
                    "Admin Login Error:",
                    error
                );


                showAlert(
                    "Unable to connect to SecureVote server."
                );


            } finally {

                setLoading(false);

            }

        }
    );


    /* ==========================================================
       SAVE ADMIN SESSION
       ========================================================== */

    function saveAdminSession(
        token,
        user
    ) {

        /*
         * Remember Me:
         *
         * checked   -> localStorage
         * unchecked -> sessionStorage
         */

        if (rememberAdmin?.checked) {

            sessionStorage.removeItem(
                "secureVoteAdminToken"
            );

            sessionStorage.removeItem(
                "secureVoteAdminUser"
            );


            localStorage.setItem(
                "secureVoteAdminToken",
                token
            );

            localStorage.setItem(
                "secureVoteAdminUser",
                JSON.stringify(user)
            );

        } else {

            localStorage.removeItem(
                "secureVoteAdminToken"
            );

            localStorage.removeItem(
                "secureVoteAdminUser"
            );


            sessionStorage.setItem(
                "secureVoteAdminToken",
                token
            );

            sessionStorage.setItem(
                "secureVoteAdminUser",
                JSON.stringify(user)
            );

        }

    }


    /* ==========================================================
       CLEAR ADMIN SESSION
       ========================================================== */

    function clearAdminSession() {

        localStorage.removeItem(
            "secureVoteAdminToken"
        );

        localStorage.removeItem(
            "secureVoteAdminUser"
        );

        localStorage.removeItem(
            "secureVoteAdminAuth"
        );


        sessionStorage.removeItem(
            "secureVoteAdminToken"
        );

        sessionStorage.removeItem(
            "secureVoteAdminUser"
        );

        sessionStorage.removeItem(
            "secureVoteAdminAuth"
        );

    }


    /* ==========================================================
       EMAIL VALIDATION
       ========================================================== */

    function validateEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);

    }


    /* ==========================================================
       LOGIN LOADER
       ========================================================== */

    function setLoading(isLoading) {

        if (!loginBtn) {
            return;
        }


        loginBtn.disabled =
            isLoading;


        if (loginBtnText) {

            loginBtnText.style.display =
                isLoading
                    ? "none"
                    : "flex";

        }


        if (loginLoader) {

            if (isLoading) {

                loginLoader.classList.add(
                    "show"
                );

            } else {

                loginLoader.classList.remove(
                    "show"
                );

            }

        }

    }


    /* ==========================================================
       ALERT
       ========================================================== */

    function showAlert(message) {

        if (!loginAlert || !alertText) {

            alert(message);

            return;

        }


        alertText.textContent =
            message;


        loginAlert.classList.add(
            "show"
        );

    }


    function hideAlert() {

        loginAlert?.classList.remove(
            "show"
        );

    }


    adminEmail?.addEventListener(
        "input",
        hideAlert
    );


    adminPassword?.addEventListener(
        "input",
        hideAlert
    );

});