/* ==========================================================
   SecureVote - Online Voting System
   File: public/js/dashboard.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    /* ======================================================
       ELEMENTS
    ====================================================== */

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const sidebarName =
        document.getElementById("sidebarUserName");

    const topName =
        document.getElementById("topUserName");

    const welcomeName =
        document.getElementById("welcomeUser");

    const electionList =
        document.getElementById("dashboardElectionList");

    const activityBody =
        document.getElementById("recentActivityBody");

    const activeCount =
        document.getElementById("activeElectionCount");

    const upcomingCount =
        document.getElementById("upcomingElectionCount");

    const completedCount =
        document.getElementById("completedElectionCount");

    const votesCastCount =
        document.getElementById("votesCastCount");


    /* ======================================================
       AUTH
    ====================================================== */

    function getAuthData() {

        const localToken =
            localStorage.getItem(
                "secureVoteToken"
            );

        const sessionToken =
            sessionStorage.getItem(
                "secureVoteToken"
            );

        const token =
            localToken ||
            sessionToken;

        const storage =
            localToken
                ? localStorage
                : sessionStorage;

        return {
            token,
            storage
        };

    }


    function clearAuthentication() {

        localStorage.removeItem(
            "secureVoteToken"
        );

        localStorage.removeItem(
            "secureVoteUser"
        );

        localStorage.removeItem(
            "secureVoteAuth"
        );

        sessionStorage.removeItem(
            "secureVoteToken"
        );

        sessionStorage.removeItem(
            "secureVoteUser"
        );

        sessionStorage.removeItem(
            "secureVoteAuth"
        );

        sessionStorage.removeItem(
            "secureVoteOtpUserId"
        );

        sessionStorage.removeItem(
            "secureVoteOtpEmail"
        );

    }


    function redirectToLogin() {

        clearAuthentication();

        window.location.replace(
            "/login.html"
        );

    }


    const {
        token,
        storage
    } = getAuthData();


    if (!token) {

        redirectToLogin();

        return;

    }


    /* ======================================================
       SIDEBAR
    ====================================================== */

    menuBtn?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sidebar?.classList.toggle(
                "open"
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                window.innerWidth <= 850 &&
                sidebar?.classList.contains("open") &&
                !sidebar.contains(event.target) &&
                !menuBtn?.contains(event.target)
            ) {

                sidebar.classList.remove(
                    "open"
                );

            }

        }
    );


    /* ======================================================
       USER DISPLAY
    ====================================================== */

    function displayUser(user) {

        if (!user) {
            return;
        }

        const name =
            user.name ||
            "Voter";

        const firstName =
            name
                .trim()
                .split(/\s+/)[0] ||
            "Voter";


        if (sidebarName) {

            sidebarName.textContent =
                name;

        }


        if (topName) {

            topName.textContent =
                firstName;

        }


        if (welcomeName) {

            welcomeName.textContent =
                firstName;

        }

    }


    /* ======================================================
       CURRENT USER
    ====================================================== */

    async function loadCurrentUser() {

        try {

            /*
             * Display cached user first.
             */

            try {

                const cached =
                    JSON.parse(
                        storage.getItem(
                            "secureVoteUser"
                        ) || "null"
                    );


                if (cached) {

                    displayUser(
                        cached
                    );

                }

            } catch (error) {

                console.warn(
                    "Unable to read cached voter."
                );

            }


            const response =
                await fetch(
                    "/api/auth/me",
                    {

                        method:
                            "GET",

                        headers: {

                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                "application/json"

                        }

                    }
                );


            const data =
                await response.json();


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                redirectToLogin();

                return null;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load voter account."
                );

            }


            if (!data.user) {

                throw new Error(
                    "User information was not returned."
                );

            }


            const user =
                data.user;


            if (
                user.role === "admin"
            ) {

                window.location.replace(
                    "/admin-dashboard.html"
                );

                return null;

            }


            if (
                user.role !== "voter"
            ) {

                redirectToLogin();

                return null;

            }


            if (
                !user.isVerified ||
                user.accountStatus !== "active"
            ) {

                clearAuthentication();

                alert(
                    "Your voter account is not active and verified."
                );

                window.location.replace(
                    "/login.html"
                );

                return null;

            }


            storage.setItem(
                "secureVoteUser",
                JSON.stringify(user)
            );


            displayUser(user);


            return user;


        } catch (error) {

            console.error(
                "Dashboard Authentication Error:",
                error
            );


            alert(
                "Unable to load your account. Please check that the server is running."
            );


            return null;

        }

    }


    /* ======================================================
       ELECTION STATUS
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


        const status =
            String(
                election.status || ""
            ).toLowerCase();


        if (
            status === "completed" ||
            status === "ended"
        ) {

            return "completed";

        }


        if (
            status === "upcoming"
        ) {

            return "upcoming";

        }


        return "active";

    }


    /* ======================================================
       LOAD REAL ELECTIONS
    ====================================================== */

    async function loadElections() {

        try {

            const response =
                await fetch(
                    "/api/elections",
                    {

                        method:
                            "GET",

                        headers: {

                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                "application/json"

                        }

                    }
                );


            const data =
                await response.json();


            if (
                response.status === 401
            ) {

                redirectToLogin();

                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load elections."
                );

            }


            let elections = [];


            if (
                Array.isArray(data)
            ) {

                elections =
                    data;

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


            /* ==========================
               COUNTS
            ========================== */

            const active =
                elections.filter(
                    election =>
                        getElectionStatus(
                            election
                        ) === "active"
                );


            const upcoming =
                elections.filter(
                    election =>
                        getElectionStatus(
                            election
                        ) === "upcoming"
                );


            const completed =
                elections.filter(
                    election =>
                        getElectionStatus(
                            election
                        ) === "completed"
                );


            if (activeCount) {

                activeCount.textContent =
                    active.length;

            }


            if (upcomingCount) {

                upcomingCount.textContent =
                    upcoming.length;

            }


            if (completedCount) {

                completedCount.textContent =
                    completed.length;

            }


            renderActiveElections(
                active
            );


        } catch (error) {

            console.error(
                "Dashboard Election Error:",
                error
            );


            if (electionList) {

                electionList.innerHTML = `

                    <p>
                        Unable to load elections.
                    </p>

                `;

            }

        }

    }


    /* ======================================================
       RENDER ACTIVE ELECTIONS
    ====================================================== */

    function renderActiveElections(
        elections
    ) {

        if (!electionList) {
            return;
        }


        electionList.innerHTML =
            "";


        if (
            elections.length === 0
        ) {

            electionList.innerHTML = `

                <div class="no-election">

                    <p>
                        No active elections are currently available.
                    </p>

                    <a
                        href="elections.html"
                        class="vote-btn"
                    >
                        View Elections
                    </a>

                </div>

            `;

            return;

        }


        /*
         * Dashboard shows maximum
         * three active elections.
         */

        elections
            .slice(0, 3)
            .forEach(
                election => {

                    const id =
                        election._id ||
                        election.id ||
                        "";


                    const title =
                        election.title ||
                        election.name ||
                        "Election";


                    const description =
                        election.description ||
                        "Participate securely in this election.";


                    const candidateCount =
                        getCandidateCount(
                            election
                        );


                    const endDate =
                        formatDate(
                            election.endDate
                        );


                    const item =
                        document.createElement(
                            "article"
                        );


                    item.className =
                        "election-item";


                    item.innerHTML = `

                        <div class="election-icon">

                            <i class="fa-solid fa-building-columns"></i>

                        </div>


                        <div class="election-info">

                            <div class="election-heading">

                                <h3>
                                    ${escapeHTML(title)}
                                </h3>

                                <span class="status live">
                                    Live
                                </span>

                            </div>


                            <p>
                                ${escapeHTML(description)}
                            </p>


                            <div class="election-meta">

                                <span>

                                    <i class="fa-regular fa-clock"></i>

                                    Ends ${escapeHTML(endDate)}

                                </span>


                                <span>

                                    <i class="fa-solid fa-users"></i>

                                    ${candidateCount}
                                    ${
                                        candidateCount === 1
                                            ? "Candidate"
                                            : "Candidates"
                                    }

                                </span>

                            </div>

                        </div>


                        <a
                            href="election-details.html?id=${encodeURIComponent(id)}"
                            class="vote-btn"
                        >
                            Vote Now
                        </a>

                    `;


                    electionList.appendChild(
                        item
                    );

                }
            );

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
            typeof election.candidateCount ===
            "number"
        ) {

            return election
                .candidateCount;

        }


        if (
            typeof election.candidatesCount ===
            "number"
        ) {

            return election
                .candidatesCount;

        }


        return 0;

    }


    /* ======================================================
       LOAD REAL VOTING HISTORY
    ====================================================== */

    async function loadVotingHistory() {

        try {

            const response =
                await fetch(
                    "/api/votes/history",
                    {

                        method:
                            "GET",

                        headers: {

                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                "application/json"

                        }

                    }
                );


            const data =
                await response.json();


            if (
                response.status === 401
            ) {

                redirectToLogin();

                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load voting history."
                );

            }


            const history =
                Array.isArray(
                    data.history
                )
                    ? data.history
                    : [];


            if (votesCastCount) {

                votesCastCount.textContent =
                    history.length;

            }


            renderVotingHistory(
                history
            );


        } catch (error) {

            console.error(
                "Voting History Error:",
                error
            );


            if (votesCastCount) {

                votesCastCount.textContent =
                    "0";

            }


            if (activityBody) {

                activityBody.innerHTML = `

                    <tr>

                        <td colspan="4">
                            Unable to load voting history.
                        </td>

                    </tr>

                `;

            }

        }

    }


    /* ======================================================
       RENDER VOTING HISTORY
    ====================================================== */

    function renderVotingHistory(
        history
    ) {

        if (!activityBody) {
            return;
        }


        activityBody.innerHTML =
            "";


        if (
            history.length === 0
        ) {

            activityBody.innerHTML = `

                <tr>

                    <td colspan="4">
                        You have not voted in any election yet.
                    </td>

                </tr>

            `;

            return;

        }


        history
            .slice(0, 5)
            .forEach(
                record => {

                    const election =
                        record.election ||
                        {};


                    const electionName =
                        election.title ||
                        election.name ||
                        "Election";


                    const date =
                        formatDate(
                            record.votedAt
                        );


                    const receiptId =
                        record.receiptId ||
                        "";


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeHTML(electionName)}
                        </td>


                        <td>
                            ${escapeHTML(date)}
                        </td>


                        <td>

                            <span class="vote-status">

                                <i class="fa-solid fa-check"></i>

                                Vote Recorded

                            </span>

                        </td>


                        <td>

                            <button
                                class="receipt-btn"
                                type="button"
                                data-receipt="${escapeHTML(receiptId)}"
                            >

                                <i class="fa-solid fa-file-shield"></i>

                                View

                            </button>

                        </td>

                    `;


                    activityBody.appendChild(
                        row
                    );

                }
            );


        attachReceiptButtons();

    }


    /* ======================================================
       RECEIPTS
    ====================================================== */

    function attachReceiptButtons() {

        document
            .querySelectorAll(
                ".receipt-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const receipt =
                                button.dataset
                                    .receipt ||
                                "Unavailable";


                            alert(
                                "SecureVote Participation Receipt\n\n" +
                                `Receipt ID: ${receipt}\n\n` +
                                "This receipt confirms election participation only.\n" +
                                "It does not reveal the candidate selected."
                            );

                        }
                    );

                }
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
            "en-US",
            {

                month:
                    "short",

                day:
                    "numeric",

                year:
                    "numeric"

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
       NOTIFICATIONS
    ====================================================== */

    const notificationBtn =
        document.querySelector(
            ".notification-btn"
        );


    notificationBtn?.addEventListener(
        "click",
        () => {

            alert(
                "Notifications\n\nElection notifications will appear here."
            );

        }
    );


    /* ======================================================
       LOGOUT
    ====================================================== */

    logoutBtn?.addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {
                return;
            }


            clearAuthentication();


            window.location.replace(
                "/login.html"
            );

        }
    );


    /* ======================================================
       INITIALIZE
    ====================================================== */

    const currentUser =
        await loadCurrentUser();


    if (!currentUser) {
        return;
    }


    /*
     * Load real MongoDB data.
     */

    await Promise.all([

        loadElections(),

        loadVotingHistory()

    ]);

});