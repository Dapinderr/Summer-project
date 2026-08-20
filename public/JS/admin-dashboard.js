/* ==========================================================
   SecureVote - Online Voting System
   File: public/js/admin-dashboard.js
   Real MongoDB Admin Dashboard
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================================
       ELEMENTS
    ====================================================== */

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const mobileOverlay =
        document.getElementById("mobileOverlay");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const notificationBtn =
        document.getElementById("notificationBtn");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const notificationClose =
        document.getElementById("notificationClose");

    const sidebarAdminEmail =
        document.getElementById("sidebarAdminEmail");

    const currentDate =
        document.getElementById("currentDate");


    /* STATISTICS */

    const totalElections =
        document.getElementById("totalElections");

    const totalVoters =
        document.getElementById("totalVoters");

    const totalVotes =
        document.getElementById("totalVotes");

    const pendingVerification =
        document.getElementById("pendingVerification");


    /* STAT SUMMARIES */

    const activeElectionSummary =
        document.getElementById("activeElectionSummary");

    const voterSummary =
        document.getElementById("voterSummary");

    const participationSummary =
        document.getElementById("participationSummary");

    const pendingSummary =
        document.getElementById("pendingSummary");


    /* ACTIVE ELECTION LIST */

    const activeElectionList =
        document.getElementById(
            "adminActiveElectionList"
        );


    /* ======================================================
       ADMIN TOKEN
    ====================================================== */

    function getAdminToken() {

        return (
            localStorage.getItem(
                "secureVoteAdminToken"
            ) ||
            sessionStorage.getItem(
                "secureVoteAdminToken"
            )
        );

    }


    /* ======================================================
       ADMIN USER
    ====================================================== */

    function getAdminUser() {

        const value =
            localStorage.getItem(
                "secureVoteAdminUser"
            ) ||
            sessionStorage.getItem(
                "secureVoteAdminUser"
            );


        if (!value) {
            return null;
        }


        try {

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "Unable to read admin user:",
                error
            );

            return null;

        }

    }


    /* ======================================================
       CLEAR ADMIN SESSION
    ====================================================== */

    function clearAdminSession() {

        [
            "secureVoteAdminToken",
            "secureVoteAdminUser",
            "secureVoteAdminAuth",
            "secureVoteAdminSession"
        ].forEach(key => {

            localStorage.removeItem(key);

            sessionStorage.removeItem(key);

        });

    }


    /* ======================================================
       LOGOUT / REDIRECT
    ====================================================== */

    function logoutAdmin() {

        clearAdminSession();

        window.location.replace(
            "admin-login.html"
        );

    }


    /* ======================================================
       AUTH CHECK
    ====================================================== */

    function checkAuthentication() {

        const token =
            getAdminToken();

        const user =
            getAdminUser();


        if (
            !token ||
            !user ||
            user.role !== "admin"
        ) {

            logoutAdmin();

            return false;

        }


        return true;

    }


    if (!checkAuthentication()) {
        return;
    }


    /* ======================================================
       ADMIN INFORMATION
    ====================================================== */

    function loadAdminInformation() {

        const user =
            getAdminUser();


        if (!user) {
            return;
        }


        if (sidebarAdminEmail) {

            sidebarAdminEmail.textContent =
                user.email ||
                "admin@securevote.com";

        }

    }


    loadAdminInformation();


    /* ======================================================
       CURRENT DATE
    ====================================================== */

    if (currentDate) {

        currentDate.textContent =
            new Date().toLocaleDateString(
                undefined,
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }


    /* ======================================================
       COMMON REQUEST
    ====================================================== */

    async function adminFetch(url) {

        const token =
            getAdminToken();


        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {

                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            "application/json"

                    }
                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "Invalid response from server"
            );

        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            logoutAdmin();

            throw new Error(
                "Administrator session expired"
            );

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Request failed"
            );

        }


        return data;

    }


    /* ======================================================
       DASHBOARD STATISTICS
    ====================================================== */

    async function loadDashboardStats() {

        try {

            const data =
                await adminFetch(
                    "/api/admin/dashboard"
                );


            const stats =
                data.stats || {};


            setCounter(
                totalElections,
                stats.totalElections
            );


            setCounter(
                totalVoters,
                stats.totalVoters
            );


            setCounter(
                totalVotes,
                stats.totalVotes
            );


            setCounter(
                pendingVerification,
                stats.pendingVerification
            );


            /*
             * These fields are used only when
             * returned by adminController.
             */

            if (activeElectionSummary) {

                const active =
                    Number(
                        stats.activeElections
                    ) || 0;


                activeElectionSummary.innerHTML = `

                    <i class="fa-solid fa-circle"></i>

                    ${active}
                    ${
                        active === 1
                            ? "active"
                            : "active"
                    }

                `;

            }


            if (voterSummary) {

                voterSummary.textContent =
                    `${formatNumber(
                        stats.totalVoters || 0
                    )} registered`;

            }


            if (participationSummary) {

                participationSummary.textContent =
                    `${formatNumber(
                        stats.totalVotes || 0
                    )} votes recorded`;

            }


            if (pendingSummary) {

                const pending =
                    Number(
                        stats.pendingVerification
                    ) || 0;


                pendingSummary.textContent =
                    pending > 0
                        ? "Requires attention"
                        : "No pending requests";

            }


        } catch (error) {

            console.error(
                "Dashboard Stats Error:",
                error
            );


            setCounter(
                totalElections,
                0
            );

            setCounter(
                totalVoters,
                0
            );

            setCounter(
                totalVotes,
                0
            );

            setCounter(
                pendingVerification,
                0
            );

        }

    }


    /* ======================================================
       LOAD REAL ELECTIONS
    ====================================================== */

    async function loadElections() {

        if (!activeElectionList) {
            return;
        }


        try {

            /*
             * Use the admin election API because
             * this is the administration panel.
             */

            const data =
                await adminFetch(
                    "/api/admin/elections"
                );


            let elections = [];


            if (Array.isArray(data)) {

                elections = data;

            } else if (
                Array.isArray(
                    data.elections
                )
            ) {

                elections =
                    data.elections;

            } else if (
                Array.isArray(
                    data.data
                )
            ) {

                elections =
                    data.data;

            }


            const active =
                elections.filter(
                    election =>
                        getElectionStatus(
                            election
                        ) === "active"
                );


            /*
             * This guarantees the small
             * "X active" value matches the
             * elections actually displayed.
             */

            if (activeElectionSummary) {

                activeElectionSummary.innerHTML = `

                    <i class="fa-solid fa-circle"></i>

                    ${active.length} active

                `;

            }


            renderActiveElections(
                active
            );


        } catch (error) {

            console.error(
                "Admin Elections Error:",
                error
            );


            activeElectionList.innerHTML = `

                <div class="dashboard-empty">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <p>
                        Unable to load active elections.
                    </p>

                </div>

            `;

        }

    }


    /* ======================================================
       DETERMINE ELECTION STATUS
    ====================================================== */

    function getElectionStatus(
        election
    ) {

        const now =
            new Date();


        const start =
            new Date(
                election.startDate
            );


        const end =
            new Date(
                election.endDate
            );


        if (
            !Number.isNaN(
                start.getTime()
            ) &&
            now < start
        ) {

            return "upcoming";

        }


        if (
            !Number.isNaN(
                end.getTime()
            ) &&
            now > end
        ) {

            return "completed";

        }


        const backendStatus =
            String(
                election.status || ""
            ).toLowerCase();


        if (
            backendStatus === "completed" ||
            backendStatus === "ended"
        ) {

            return "completed";

        }


        if (
            backendStatus === "upcoming"
        ) {

            return "upcoming";

        }


        return "active";

    }


    /* ======================================================
       RENDER ACTIVE ELECTIONS
    ====================================================== */

    function renderActiveElections(
        elections
    ) {

        activeElectionList.innerHTML =
            "";


        if (
            elections.length === 0
        ) {

            activeElectionList.innerHTML = `

                <div class="dashboard-empty">

                    <i class="fa-solid fa-box-ballot"></i>

                    <p>
                        No active elections currently.
                    </p>

                    <a href="admin-elections.html">
                        Manage Elections
                    </a>

                </div>

            `;

            return;

        }


        elections
            .slice(0, 5)
            .forEach(
                election => {

                    const item =
                        document.createElement(
                            "article"
                        );


                    item.className =
                        "election-item";


                    const title =
                        election.title ||
                        election.name ||
                        "Untitled Election";


                    const candidateCount =
                        getCandidateCount(
                            election
                        );


                    const eligible =
                        Number(
                            election.eligibleVoters ||
                            election.eligibleCount ||
                            0
                        );


                    const votes =
                        Number(
                            election.totalVotes ||
                            election.voteCount ||
                            0
                        );


                    const turnout =
                        eligible > 0
                            ? Math.min(
                                100,
                                Math.round(
                                    (
                                        votes /
                                        eligible
                                    ) * 100
                                )
                            )
                            : 0;


                    const endDate =
                        formatDate(
                            election.endDate
                        );


                    item.innerHTML = `

                        <div class="election-top">

                            <div>

                                <span class="live-badge">

                                    <i class="fa-solid fa-circle"></i>

                                    LIVE

                                </span>


                                <h3>
                                    ${escapeHTML(title)}
                                </h3>

                            </div>


                            <button
                                class="more-btn"
                                type="button"
                                aria-label="Manage election"
                            >

                                <i class="fa-solid fa-ellipsis-vertical"></i>

                            </button>

                        </div>


                        <div class="election-meta">

                            <span>

                                <i class="fa-solid fa-users"></i>

                                ${candidateCount}
                                ${
                                    candidateCount === 1
                                        ? "Candidate"
                                        : "Candidates"
                                }

                            </span>


                            <span>

                                <i class="fa-solid fa-user-check"></i>

                                ${formatNumber(eligible)}
                                Eligible

                            </span>


                            <span>

                                <i class="fa-solid fa-clock"></i>

                                Ends ${escapeHTML(endDate)}

                            </span>

                        </div>


                        <div class="progress-info">

                            <span>
                                Voter Turnout
                            </span>

                            <strong>
                                ${turnout}%
                            </strong>

                        </div>


                        <div class="progress-bar">

                            <div
                                class="progress-fill"
                                data-width="${turnout}"
                                style="width:0%"
                            ></div>

                        </div>

                    `;


                    item
                        .querySelector(
                            ".more-btn"
                        )
                        ?.addEventListener(
                            "click",
                            () => {

                                const id =
                                    election._id ||
                                    election.id ||
                                    "";


                                window.location.href =
                                    id
                                        ? `admin-elections.html?id=${encodeURIComponent(id)}`
                                        : "admin-elections.html";

                            }
                        );


                    activeElectionList
                        .appendChild(
                            item
                        );

                }
            );


        animateProgressBars();

    }


    /* ======================================================
       CANDIDATE COUNT
    ====================================================== */

    function getCandidateCount(
        election
    ) {

        if (
            Array.isArray(
                election.candidates
            )
        ) {

            return election
                .candidates
                .length;

        }


        if (
            Number.isFinite(
                Number(
                    election.candidateCount
                )
            )
        ) {

            return Number(
                election.candidateCount
            );

        }


        if (
            Number.isFinite(
                Number(
                    election.candidatesCount
                )
            )
        ) {

            return Number(
                election.candidatesCount
            );

        }


        return 0;

    }


    /* ======================================================
       PROGRESS BARS
    ====================================================== */

    function animateProgressBars() {

        document
            .querySelectorAll(
                "#adminActiveElectionList .progress-fill"
            )
            .forEach(
                (bar, index) => {

                    const width =
                        Math.min(
                            100,
                            Math.max(
                                0,
                                Number(
                                    bar.dataset.width
                                ) || 0
                            )
                        );


                    setTimeout(
                        () => {

                            bar.style.width =
                                `${width}%`;

                        },
                        150 + index * 100
                    );

                }
            );

    }


    /* ======================================================
       COUNTER
    ====================================================== */

    function setCounter(
        element,
        value
    ) {

        if (!element) {
            return;
        }


        const target =
            Math.max(
                0,
                Number(value) || 0
            );


        animateCounter(
            element,
            target
        );

    }


    function animateCounter(
        element,
        target
    ) {

        if (
            target === 0
        ) {

            element.textContent =
                "0";

            return;

        }


        const duration =
            700;


        const started =
            performance.now();


        function update(time) {

            const progress =
                Math.min(
                    (
                        time -
                        started
                    ) /
                    duration,
                    1
                );


            const current =
                Math.round(
                    target *
                    (
                        1 -
                        Math.pow(
                            1 - progress,
                            3
                        )
                    )
                );


            element.textContent =
                formatNumber(
                    current
                );


            if (
                progress < 1
            ) {

                requestAnimationFrame(
                    update
                );

            }

        }


        requestAnimationFrame(
            update
        );

    }


    /* ======================================================
       FORMAT NUMBER
    ====================================================== */

    function formatNumber(
        value
    ) {

        return new Intl.NumberFormat()
            .format(
                Number(value) || 0
            );

    }


    /* ======================================================
       DATE
    ====================================================== */

    function formatDate(
        value
    ) {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Unavailable";

        }


        return date.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    }


    /* ======================================================
       ESCAPE HTML
    ====================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* ======================================================
       SIDEBAR
    ====================================================== */

    function openSidebar() {

        sidebar?.classList.add(
            "open"
        );

        mobileOverlay?.classList.add(
            "show"
        );

        document.body.style.overflow =
            "hidden";

    }


    function closeSidebar() {

        sidebar?.classList.remove(
            "open"
        );


        if (
            !notificationPanel
                ?.classList
                .contains("show")
        ) {

            mobileOverlay
                ?.classList
                .remove("show");

        }


        document.body.style.overflow =
            "";

    }


    menuBtn?.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            if (
                sidebar
                    ?.classList
                    .contains("open")
            ) {

                closeSidebar();

            } else {

                openSidebar();

            }

        }
    );


    /* ======================================================
       NOTIFICATIONS
    ====================================================== */

    function openNotifications() {

        notificationPanel
            ?.classList
            .add("show");


        mobileOverlay
            ?.classList
            .add("show");

    }


    function closeNotifications() {

        notificationPanel
            ?.classList
            .remove("show");


        if (
            !sidebar
                ?.classList
                .contains("open")
        ) {

            mobileOverlay
                ?.classList
                .remove("show");

        }

    }


    notificationBtn?.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            if (
                notificationPanel
                    ?.classList
                    .contains("show")
            ) {

                closeNotifications();

            } else {

                openNotifications();

            }

        }
    );


    notificationClose
        ?.addEventListener(
            "click",
            closeNotifications
        );


    mobileOverlay
        ?.addEventListener(
            "click",
            () => {

                closeSidebar();

                closeNotifications();

            }
        );


    /* ======================================================
       NOTIFICATION ITEMS
    ====================================================== */

    document
        .querySelectorAll(
            ".notification-item"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        item.classList.remove(
                            "unread"
                        );

                        updateNotificationCount();

                    }
                );

            }
        );


    function updateNotificationCount() {

        const unread =
            document.querySelectorAll(
                ".notification-item.unread"
            ).length;


        const dot =
            document.querySelector(
                ".notification-dot"
            );


        const text =
            document.querySelector(
                ".notification-header span"
            );


        if (dot) {

            dot.style.display =
                unread
                    ? "block"
                    : "none";

        }


        if (text) {

            text.textContent =
                unread === 1
                    ? "1 new notification"
                    : `${unread} new notifications`;

        }

    }


    updateNotificationCount();


    /* ======================================================
       LOGOUT
    ====================================================== */

    logoutBtn?.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Are you sure you want to logout from the admin panel?"
                )
            ) {

                return;

            }


            logoutAdmin();

        }
    );


    /* ======================================================
       ESCAPE KEY
    ====================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeSidebar();

                closeNotifications();

            }

        }
    );


    /* ======================================================
       RESIZE
    ====================================================== */

    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth > 850
            ) {

                closeSidebar();

            }

        }
    );


    /* ======================================================
       INITIAL LOAD
    ====================================================== */

    Promise.all([

        loadDashboardStats(),

        loadElections()

    ]).catch(error => {

        console.error(
            "Admin Dashboard Initialization Error:",
            error
        );

    });

});