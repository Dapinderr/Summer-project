/* ==========================================================
   SecureVote
   File: js/profile.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ================= ELEMENTS ================= */

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const profileForm = document.getElementById("profileForm");
    const editProfileBtn = document.getElementById("editProfileBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const formActions = document.getElementById("formActions");

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const dob = document.getElementById("dob");

    const displayName = document.getElementById("displayName");
    const displayEmail = document.getElementById("displayEmail");
    const topUserName = document.getElementById("topUserName");
    const profileInitials = document.getElementById("profileInitials");

    const voterId = document.getElementById("voterId");
    const electionCount = document.getElementById("electionCount");
    const memberSince = document.getElementById("memberSince");

    const twoFactorToggle = document.getElementById("twoFactorToggle");
    const twoFactorText = document.getElementById("twoFactorText");

    const emailNotifications = document.getElementById("emailNotifications");
    const resultNotifications = document.getElementById("resultNotifications");
    const electionReminders = document.getElementById("electionReminders");

    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const passwordModal = document.getElementById("passwordModal");
    const passwordOverlay = document.getElementById("passwordOverlay");
    const passwordClose = document.getElementById("passwordClose");
    const passwordForm = document.getElementById("passwordForm");

    const currentPassword = document.getElementById("currentPassword");
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const activityBtn = document.getElementById("activityBtn");
    const activityModal = document.getElementById("activityModal");
    const activityOverlay = document.getElementById("activityOverlay");
    const activityClose = document.getElementById("activityClose");
    const activityDone = document.getElementById("activityDone");

    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toastText");


    /* ================= MOBILE SIDEBAR ================= */

    menuBtn?.addEventListener("click", event => {

        event.stopPropagation();

        sidebar?.classList.toggle("open");

    });


    document.addEventListener("click", event => {

        if (
            window.innerWidth <= 850 &&
            sidebar?.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {

            sidebar.classList.remove("open");

        }

    });


    /* ================= DEFAULT USER ================= */

    const defaultUser = {

        fullName: "SecureVote User",

        email: "voter@example.com",

        phone: "+91 98765 43210",

        dob: "2005-01-01",

        voterId: "SV-VOTER-2026-001",

        memberSince: "2026"

    };


    /* ================= GET USER ================= */

    function getUser() {

        try {

            const savedUser = JSON.parse(
                localStorage.getItem("secureVoteUser")
            );

            return {
                ...defaultUser,
                ...(savedUser || {})
            };

        } catch (error) {

            return defaultUser;

        }

    }


    /* ================= LOAD PROFILE ================= */

    function loadProfile() {

        const user = getUser();


        fullName.value =
            user.fullName || defaultUser.fullName;


        email.value =
            user.email || defaultUser.email;


        phone.value =
            user.phone || defaultUser.phone;


        dob.value =
            user.dob || defaultUser.dob;


        voterId.textContent =
            user.voterId || defaultUser.voterId;


        memberSince.textContent =
            user.memberSince || defaultUser.memberSince;


        updateProfileDisplay(user);


        updateElectionCount();

    }


    /* ================= UPDATE DISPLAY ================= */

    function updateProfileDisplay(user) {

        const name =
            user.fullName || "SecureVote User";

        const userEmail =
            user.email || "voter@example.com";


        displayName.textContent = name;

        displayEmail.textContent = userEmail;


        topUserName.textContent =
            name.split(" ")[0];


        profileInitials.textContent =
            getInitials(name);

    }


    /* ================= GET INITIALS ================= */

    function getInitials(name) {

        const words =
            name
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (words.length === 0) {
            return "SV";
        }


        if (words.length === 1) {

            return words[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            words[0][0] +
            words[words.length - 1][0]
        ).toUpperCase();

    }


    /* ================= ELECTION COUNT ================= */

    function updateElectionCount() {

        try {

            const votes = JSON.parse(
                localStorage.getItem("secureVoteVotes") || "{}"
            );


            const totalVotes =
                Object.keys(votes).length;


            electionCount.textContent =
                totalVotes > 0
                    ? totalVotes
                    : "4";

        } catch (error) {

            electionCount.textContent = "4";

        }

    }


    /* ================= EDIT PROFILE ================= */

    const editableFields = [
        fullName,
        email,
        phone,
        dob
    ];


    let originalValues = {};


    editProfileBtn?.addEventListener("click", () => {

        originalValues = {

            fullName: fullName.value,

            email: email.value,

            phone: phone.value,

            dob: dob.value

        };


        editableFields.forEach(field => {

            field.disabled = false;

        });


        formActions?.classList.add("show");

        editProfileBtn.style.display = "none";


        fullName.focus();

    });


    /* ================= CANCEL EDIT ================= */

    cancelEditBtn?.addEventListener("click", () => {

        fullName.value =
            originalValues.fullName || fullName.value;

        email.value =
            originalValues.email || email.value;

        phone.value =
            originalValues.phone || phone.value;

        dob.value =
            originalValues.dob || dob.value;


        disableProfileEditing();

    });


    /* ================= SAVE PROFILE ================= */

    profileForm?.addEventListener("submit", event => {

        event.preventDefault();


        const nameValue =
            fullName.value.trim();

        const emailValue =
            email.value.trim();

        const phoneValue =
            phone.value.trim();


        if (!nameValue) {

            showToast(
                "Please enter your full name.",
                false
            );

            return;

        }


        if (!validateEmail(emailValue)) {

            showToast(
                "Please enter a valid email address.",
                false
            );

            return;

        }


        if (!phoneValue) {

            showToast(
                "Please enter your mobile number.",
                false
            );

            return;

        }


        const existingUser = getUser();


        const updatedUser = {

            ...existingUser,

            fullName: nameValue,

            email: emailValue,

            phone: phoneValue,

            dob: dob.value

        };


        localStorage.setItem(
            "secureVoteUser",
            JSON.stringify(updatedUser)
        );


        updateProfileDisplay(updatedUser);

        disableProfileEditing();


        showToast(
            "Profile updated successfully."
        );

    });


    /* ================= DISABLE EDITING ================= */

    function disableProfileEditing() {

        editableFields.forEach(field => {

            field.disabled = true;

        });


        formActions?.classList.remove("show");

        editProfileBtn.style.display = "flex";

    }


    /* ================= EMAIL VALIDATION ================= */

    function validateEmail(emailValue) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            emailValue
        );

    }


    /* ================= TWO FACTOR AUTH ================= */

    function loadSecuritySettings() {

        const stored2FA =
            localStorage.getItem("secureVote2FA");


        if (stored2FA !== null) {

            twoFactorToggle.checked =
                stored2FA === "true";

        }


        updateTwoFactorText();

    }


    function updateTwoFactorText() {

        if (!twoFactorText) {
            return;
        }


        twoFactorText.textContent =
            twoFactorToggle.checked
                ? "Two-factor authentication is enabled"
                : "Two-factor authentication is disabled";

    }


    twoFactorToggle?.addEventListener(
        "change",
        () => {

            localStorage.setItem(
                "secureVote2FA",
                twoFactorToggle.checked
            );


            updateTwoFactorText();


            showToast(
                twoFactorToggle.checked
                    ? "Two-factor authentication enabled."
                    : "Two-factor authentication disabled."
            );

        }
    );


    /* ================= NOTIFICATION SETTINGS ================= */

    function loadPreferences() {

        loadToggle(
            emailNotifications,
            "secureVoteEmailNotifications",
            true
        );


        loadToggle(
            resultNotifications,
            "secureVoteResultNotifications",
            true
        );


        loadToggle(
            electionReminders,
            "secureVoteElectionReminders",
            true
        );

    }


    function loadToggle(element, key, defaultValue) {

        if (!element) {
            return;
        }


        const saved =
            localStorage.getItem(key);


        element.checked =
            saved === null
                ? defaultValue
                : saved === "true";


        element.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    key,
                    element.checked
                );


                showToast(
                    "Preference updated."
                );

            }
        );

    }


    /* ================= PASSWORD MODAL ================= */

    changePasswordBtn?.addEventListener(
        "click",
        () => {

            openModal(passwordModal);

            currentPassword?.focus();

        }
    );


    passwordClose?.addEventListener(
        "click",
        () => closeModal(passwordModal)
    );


    passwordOverlay?.addEventListener(
        "click",
        () => closeModal(passwordModal)
    );


    /* ================= PASSWORD FORM ================= */

    passwordForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const current =
                currentPassword.value;

            const newPass =
                newPassword.value;

            const confirmPass =
                confirmPassword.value;


            if (!current) {

                showToast(
                    "Enter your current password.",
                    false
                );

                return;

            }


            if (newPass.length < 8) {

                showToast(
                    "New password must contain at least 8 characters.",
                    false
                );

                return;

            }


            if (newPass !== confirmPass) {

                showToast(
                    "New passwords do not match.",
                    false
                );

                return;

            }


            /*
             * DEMO ONLY:
             * Passwords should never be stored directly
             * in localStorage in a production system.
             */


            closeModal(passwordModal);

            passwordForm.reset();


            showToast(
                "Password updated successfully."
            );

        }
    );


    /* ================= LOGIN ACTIVITY ================= */

    activityBtn?.addEventListener(
        "click",
        () => {

            openModal(activityModal);

        }
    );


    activityClose?.addEventListener(
        "click",
        () => closeModal(activityModal)
    );


    activityOverlay?.addEventListener(
        "click",
        () => closeModal(activityModal)
    );


    activityDone?.addEventListener(
        "click",
        () => closeModal(activityModal)
    );


    /* ================= MODAL FUNCTIONS ================= */

    function openModal(modal) {

        if (!modal) {
            return;
        }


        modal.classList.add("show");

        document.body.style.overflow =
            "hidden";

    }


    function closeModal(modal) {

        if (!modal) {
            return;
        }


        modal.classList.remove("show");

        document.body.style.overflow =
            "";

    }


    /* ================= ESC CLOSE ================= */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }


            if (
                passwordModal?.classList.contains("show")
            ) {

                closeModal(passwordModal);

            }


            if (
                activityModal?.classList.contains("show")
            ) {

                closeModal(activityModal);

            }

        }
    );


    /* ================= CAMERA BUTTON ================= */

    document.getElementById("cameraBtn")
        ?.addEventListener("click", () => {

            showToast(
                "Profile photo upload will be connected with the backend."
            );

        });


    /* ================= TOAST ================= */

    let toastTimer;


    function showToast(message, success = true) {

        if (!toast || !toastText) {
            return;
        }


        clearTimeout(toastTimer);


        toastText.textContent = message;


        const icon =
            toast.querySelector("i");


        if (icon) {

            icon.className =
                success
                    ? "fa-solid fa-circle-check"
                    : "fa-solid fa-circle-exclamation";

        }


        toast.classList.add("show");


        toastTimer =
            setTimeout(() => {

                toast.classList.remove("show");

            }, 2500);

    }


    /* ================= LOGOUT ================= */

    logoutBtn?.addEventListener(
        "click",
        () => {

            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {
                return;
            }


            localStorage.removeItem(
                "secureVoteAuth"
            );


            window.location.href =
                "login.html";

        }
    );


    /* ================= INITIALIZE ================= */

    loadProfile();

    loadSecuritySettings();

    loadPreferences();


    /* ==========================================================
       PRODUCTION SECURITY NOTE

       This frontend uses localStorage only for demonstration.

       In the final backend version:

       - User profile must come from authenticated API.
       - Password changes must happen on the server.
       - Passwords must be hashed using bcrypt/Argon2.
       - 2FA secrets must never be stored in localStorage.
       - Authentication should use secure sessions/JWT.
       - Government ID documents require protected storage.
       - Sensitive voter data should be encrypted.
       ========================================================== */

});