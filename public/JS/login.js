/* ==========================================================
   SecureVote - Online Voting System
   File: public/js/login.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==============================
       ELEMENTS
    ============================== */

    const loginForm =
        document.getElementById("loginForm");

    const email =
        document.getElementById("email");

    const password =
        document.getElementById("password");

    const togglePassword =
        document.getElementById("togglePassword");

    const loginBtn =
        document.getElementById("loginBtn");

    const loginMessage =
        document.getElementById("loginMessage");

    const rememberMe =
        document.getElementById("rememberMe");


    /* ==============================
       MESSAGE
    ============================== */

    function showMessage(
        text,
        type = "error"
    ) {

        if (!loginMessage) {
            return;
        }

        loginMessage.textContent = text;

        loginMessage.classList.remove(
            "success",
            "error"
        );

        loginMessage.classList.add(type);
    }


    function clearMessage() {

        if (!loginMessage) {
            return;
        }

        loginMessage.textContent = "";

        loginMessage.classList.remove(
            "success",
            "error"
        );
    }


    /* ==============================
       SHOW / HIDE PASSWORD
    ============================== */

    if (
        togglePassword &&
        password
    ) {

        togglePassword.addEventListener(
            "click",
            () => {

                const icon =
                    togglePassword.querySelector("i");

                const hidden =
                    password.type === "password";

                password.type =
                    hidden
                        ? "text"
                        : "password";

                if (icon) {

                    icon.classList.toggle(
                        "fa-eye",
                        !hidden
                    );

                    icon.classList.toggle(
                        "fa-eye-slash",
                        hidden
                    );
                }

                togglePassword.setAttribute(
                    "aria-label",
                    hidden
                        ? "Hide password"
                        : "Show password"
                );
            }
        );
    }


    /* ==============================
       EMAIL VALIDATION
    ============================== */

    function validateEmail(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            value
        );
    }


    /* ==============================
       LOGIN
    ============================== */

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();


            const userEmail =
                email.value
                    .trim()
                    .toLowerCase();

            /*
               Do NOT trim password.
               Spaces can technically be
               part of a password.
            */

            const userPassword =
                password.value;


            /* ==========================
               VALIDATION
            ========================== */

            if (
                !userEmail ||
                !userPassword
            ) {

                showMessage(
                    "Please enter your email and password."
                );

                return;
            }


            if (
                !validateEmail(userEmail)
            ) {

                showMessage(
                    "Please enter a valid email address."
                );

                email.focus();

                return;
            }


            if (
                userPassword.length < 8
            ) {

                showMessage(
                    "Password must contain at least 8 characters."
                );

                password.focus();

                return;
            }


            /* ==========================
               BUTTON LOADING
            ========================== */

            const originalButton =
                loginBtn.innerHTML;

            loginBtn.disabled = true;

            loginBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Logging in...</span>
            `;


            try {

                /* ==========================
                   LOGIN API
                ========================== */

                const response =
                    await fetch(
                        "/api/auth/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email:
                                        userEmail,

                                    password:
                                        userPassword
                                })
                        }
                    );


                const data =
                    await response.json();


                /* ==========================
                   UNVERIFIED ACCOUNT
                ========================== */

                if (
                    response.status === 403 &&
                    data.requiresVerification
                ) {

                    if (data.userId) {

                        sessionStorage.setItem(
                            "secureVoteOtpUserId",
                            data.userId
                        );
                    }


                    sessionStorage.setItem(
                        "secureVoteOtpEmail",
                        data.email || userEmail
                    );


                    showMessage(
                        "Please verify your email first."
                    );


                    setTimeout(() => {

                        window.location.href =
                            "/otp.html";

                    }, 800);


                    return;
                }


                /* ==========================
                   LOGIN ERROR
                ========================== */

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Login failed."
                    );
                }


                if (
                    !data.token ||
                    !data.user
                ) {

                    throw new Error(
                        "Invalid response from server."
                    );
                }


                /* ==========================
                   SAVE AUTH DATA
                ========================== */

                /*
                   Remember Me checked:
                   keep login after browser closes.

                   Not checked:
                   keep login only in this tab/session.
                */

                const storage =
                    rememberMe?.checked
                        ? localStorage
                        : sessionStorage;


                /*
                   Remove any old login data
                   from both storage locations.
                */

                localStorage.removeItem(
                    "secureVoteToken"
                );

                localStorage.removeItem(
                    "secureVoteUser"
                );

                sessionStorage.removeItem(
                    "secureVoteToken"
                );

                sessionStorage.removeItem(
                    "secureVoteUser"
                );


                storage.setItem(
                    "secureVoteToken",
                    data.token
                );


                storage.setItem(
                    "secureVoteUser",
                    JSON.stringify(
                        data.user
                    )
                );


                /* ==========================
                   CLEAN OTP SESSION
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
                    "Login successful. Redirecting...",
                    "success"
                );


                /* ==========================
                   ROLE REDIRECT
                ========================== */

                setTimeout(() => {

                    if (
                        data.user.role ===
                        "admin"
                    ) {

                        window.location.href =
                            "/admin-dashboard.html";

                    } else {

                        window.location.href =
                            "/dashboard.html";
                    }

                }, 700);


            } catch (error) {

                console.error(
                    "Login Error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to login. Please try again."
                );


                loginBtn.disabled =
                    false;

                loginBtn.innerHTML =
                    originalButton;
            }

        }
    );

});