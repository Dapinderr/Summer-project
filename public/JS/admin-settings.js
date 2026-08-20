document.addEventListener("DOMContentLoaded", () => {

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const overlay =
        document.getElementById("mobileOverlay");

    const saveBtn =
        document.getElementById("saveTopBtn");

    const clearBtn =
        document.getElementById("clearDataBtn");

    const confirmModal =
        document.getElementById("confirmModal");

    const confirmOverlay =
        document.getElementById("confirmOverlay");

    const cancelClear =
        document.getElementById("cancelClear");

    const confirmClear =
        document.getElementById("confirmClear");

    const toast =
        document.getElementById("toast");

    const toastText =
        document.getElementById("toastText");

    let toastTimer;


    /* =========================
       AUTH CHECK
    ========================= */

    const authenticated =
        localStorage.getItem(
            "secureVoteAdminAuth"
        ) === "true" ||

        sessionStorage.getItem(
            "secureVoteAdminAuth"
        ) === "true";


    if (!authenticated) {

        location.replace(
            "admin-login.html"
        );

        return;
    }


    /* =========================
       SIDEBAR
    ========================= */

    menuBtn?.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

            overlay.classList.toggle(
                "show"
            );

        }
    );


    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    function closeSidebar() {

        sidebar.classList.remove(
            "open"
        );

        overlay.classList.remove(
            "show"
        );
    }


    /* =========================
       SETTINGS
    ========================= */

    const settingIds = [

        "systemName",
        "organizationName",
        "supportEmail",
        "timezone",

        "admin2FA",
        "voterOTP",
        "duplicateProtection",
        "sessionTimeout",

        "liveTurnout",
        "hideResults",
        "ballotConfirmation",
        "electionNotifications",

        "auditLogging",
        "loginLogging",
        "ballotAnonymity",
        "logRetention",

        "maintenanceMode"

    ];


    /* =========================
       LOAD SETTINGS
    ========================= */

    function loadSettings() {

        let settings;

        try {

            settings =
                JSON.parse(
                    localStorage.getItem(
                        "secureVoteSettings"
                    )
                );

        } catch {

            settings = null;

        }


        if (!settings) {
            return;
        }


        settingIds.forEach(id => {

            const element =
                document.getElementById(id);


            if (!element) {
                return;
            }


            if (
                element.type ===
                "checkbox"
            ) {

                if (
                    typeof settings[id]
                    === "boolean"
                ) {

                    element.checked =
                        settings[id];
                }

            } else {

                if (
                    settings[id] !==
                    undefined
                ) {

                    element.value =
                        settings[id];
                }
            }

        });

    }


    loadSettings();


    /* =========================
       SAVE SETTINGS
    ========================= */

    function saveSettings() {

        const settings = {};


        settingIds.forEach(id => {

            const element =
                document.getElementById(id);


            if (!element) {
                return;
            }


            if (
                element.type ===
                "checkbox"
            ) {

                settings[id] =
                    element.checked;

            } else {

                settings[id] =
                    element.value.trim();

            }

        });


        /* EMAIL CHECK */

        const email =
            settings.supportEmail;


        if (
            email &&
            !isValidEmail(email)
        ) {

            showToast(
                "Enter a valid support email."
            );

            return;
        }


        localStorage.setItem(
            "secureVoteSettings",
            JSON.stringify(settings)
        );


        showToast(
            "Settings saved successfully."
        );

    }


    saveBtn?.addEventListener(
        "click",
        saveSettings
    );


    /* =========================
       EMAIL VALIDATION
    ========================= */

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);

    }


    /* =========================
       MAINTENANCE MODE
    ========================= */

    const maintenance =
        document.getElementById(
            "maintenanceMode"
        );


    maintenance?.addEventListener(
        "change",
        () => {

            if (
                maintenance.checked
            ) {

                showToast(
                    "Maintenance mode enabled."
                );

            } else {

                showToast(
                    "Maintenance mode disabled."
                );

            }

        }
    );


    /* =========================
       CLEAR DATA MODAL
    ========================= */

    clearBtn?.addEventListener(
        "click",
        () => {

            confirmModal.classList.add(
                "show"
            );

        }
    );


    function closeConfirmModal() {

        confirmModal.classList.remove(
            "show"
        );

    }


    cancelClear?.addEventListener(
        "click",
        closeConfirmModal
    );


    confirmOverlay?.addEventListener(
        "click",
        closeConfirmModal
    );


    /* =========================
       CLEAR DEMO DATA
    ========================= */

    confirmClear?.addEventListener(
        "click",
        () => {

            /*
                Do NOT remove admin auth
                here because the admin
                should remain logged in.
            */

            const keysToRemove = [

                "secureVoteCandidates",
                "secureVoteSettings",
                "secureVoteElections",
                "secureVoteVoters",
                "secureVoteResults",
                "secureVoteAuditLogs"

            ];


            keysToRemove.forEach(
                key =>
                    localStorage.removeItem(
                        key
                    )
            );


            closeConfirmModal();


            showToast(
                "Demo data cleared."
            );


            setTimeout(
                () => {
                    location.reload();
                },
                900
            );

        }
    );


    /* =========================
       ESC KEY
    ========================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeConfirmModal();

                closeSidebar();

            }

        }
    );


    /* =========================
       TOAST
    ========================= */

    function showToast(message) {

        clearTimeout(
            toastTimer
        );


        toastText.textContent =
            message;


        toast.classList.add(
            "show"
        );


        toastTimer =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                2500
            );

    }


    /* =========================
       LOGOUT
    ========================= */

    document
        .getElementById(
            "logoutBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                const logout =
                    confirm(
                        "Logout from SecureVote Admin?"
                    );


                if (!logout) {
                    return;
                }


                localStorage.removeItem(
                    "secureVoteAdminAuth"
                );

                localStorage.removeItem(
                    "secureVoteAdminSession"
                );

                sessionStorage.removeItem(
                    "secureVoteAdminAuth"
                );

                sessionStorage.removeItem(
                    "secureVoteAdminSession"
                );


                location.href =
                    "admin-login.html";

            }
        );

});