/* ==========================================================
   SecureVote - Online Voting System
   File: js/admin-results.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================
       ELEMENTS
    ========================================================== */

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const overlay =
        document.getElementById("mobileOverlay");

    const selector =
        document.getElementById("electionSelector");

    const logoutBtn =
        document.getElementById("logoutBtn");


    /* ==========================================================
       ADMIN TOKEN
    ========================================================== */

    const token =
        localStorage.getItem("secureVoteAdminToken") ||
        sessionStorage.getItem("secureVoteAdminToken");


    if (!token) {

        clearAdminSession();

        location.replace(
            "admin-login.html"
        );

        return;
    }


    /* ==========================================================
       SIDEBAR
    ========================================================== */

    menuBtn?.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle("open");

            overlay?.classList.toggle("show");

        }
    );


    overlay?.addEventListener(
        "click",
        () => {

            sidebar?.classList.remove("open");

            overlay?.classList.remove("show");

        }
    );


    /* ==========================================================
       API REQUEST
    ========================================================== */

    async function apiRequest(
        url,
        options = {}
    ) {

        const headers = {

            Accept:
                "application/json",

            ...(options.headers || {})

        };


        if (options.body) {

            headers["Content-Type"] =
                "application/json";

        }


        headers.Authorization =
            `Bearer ${token}`;


        const response =
            await fetch(
                url,
                {
                    ...options,
                    headers
                }
            );


        let data = {};

        try {

            data =
                await response.json();

        } catch {

            data = {};

        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            clearAdminSession();

            location.replace(
                "admin-login.html"
            );

            throw new Error(
                data.message ||
                "Administrator session expired"
            );

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to complete request"
            );

        }


        return data;
    }


    /* ==========================================================
       LOAD ELECTIONS
    ========================================================== */

    async function loadElections() {

        if (!selector) {
            return;
        }


        try {

            selector.disabled = true;

            selector.innerHTML =
                `<option value="">
                    Loading elections...
                </option>`;


            const data =
                await apiRequest(
                    "/api/admin/elections"
                );


            const elections =
                Array.isArray(data.elections)
                    ? data.elections
                    : [];


            selector.innerHTML = "";


            if (elections.length === 0) {

                selector.innerHTML =
                    `<option value="">
                        No elections available
                    </option>`;

                showEmptyResults(
                    "No elections have been created yet."
                );

                return;
            }


            elections.forEach(
                election => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        election._id;

                    option.textContent =
                        election.title;

                    selector.appendChild(
                        option
                    );

                }
            );


            selector.disabled = false;


            /*
             * Load first election automatically.
             */

            if (elections[0]?._id) {

                selector.value =
                    elections[0]._id;

                await loadResults(
                    elections[0]._id
                );

            }


        } catch (error) {

            console.error(
                "Load Elections Error:",
                error
            );

            selector.innerHTML =
                `<option value="">
                    Unable to load elections
                </option>`;

            showEmptyResults(
                error.message
            );

        }

    }


    /* ==========================================================
       ELECTION CHANGE
    ========================================================== */

    selector?.addEventListener(
        "change",
        async () => {

            const electionId =
                selector.value;


            if (!electionId) {
                return;
            }


            await loadResults(
                electionId
            );

        }
    );


    /* ==========================================================
       LOAD RESULTS
    ========================================================== */

    async function loadResults(
        electionId
    ) {

        try {

            const data =
                await apiRequest(
                    `/api/admin/elections/${encodeURIComponent(
                        electionId
                    )}/results`
                );


            console.log(
                "Results API Response:",
                data
            );


            renderResults(data);


        } catch (error) {

            console.error(
                "Load Results Error:",
                error
            );


            showEmptyResults(
                error.message
            );

        }

    }


    /* ==========================================================
       RENDER RESULTS
    ========================================================== */

    function renderResults(data) {

        /*
         * Supports common response structures:
         *
         * {
         *   election: {...},
         *   results: [...]
         * }
         *
         * Candidate result example:
         *
         * {
         *   candidateId,
         *   name,
         *   votes
         * }
         */

        const election =
            data.election || {};

        const results =
            Array.isArray(data.results)
                ? data.results
                : [];


        /* ==========================
           ELECTION HEADER
        ========================== */

        const heading =
            document.querySelector(
                ".result-header h1"
            );

        const subtitle =
            document.querySelector(
                ".result-header p"
            );


        if (heading) {

            heading.textContent =
                election.title ||
                "Election Results";

        }


        if (subtitle) {

            subtitle.textContent =
                getElectionSubtitle(
                    election
                );

        }


        /* ==========================
           CALCULATE VOTES
        ========================== */

        const totalVotes =
            getTotalVotes(
                data,
                results
            );


        const eligibleVoters =
            Number(
                data.eligibleVoters ??
                election.eligibleVoters ??
                0
            );


        const turnout =
            eligibleVoters > 0
                ? (
                    totalVotes /
                    eligibleVoters
                ) * 100
                : 0;


        /* ==========================
           STAT CARDS
        ========================== */

        const statValues =
            document.querySelectorAll(
                ".stat-card strong"
            );


        if (statValues[0]) {

            statValues[0].textContent =
                eligibleVoters > 0
                    ? formatNumber(
                        eligibleVoters
                    )
                    : "—";

        }


        if (statValues[1]) {

            statValues[1].textContent =
                formatNumber(
                    totalVotes
                );

        }


        if (statValues[2]) {

            statValues[2].textContent =
                eligibleVoters > 0
                    ? `${turnout.toFixed(1)}%`
                    : "—";

        }


        if (statValues[3]) {

            statValues[3].textContent =
                election.endDate
                    ? formatShortDate(
                        election.endDate
                    )
                    : "—";

        }


        /* ==========================
           CANDIDATE RESULTS
        ========================== */

        renderCandidateResults(
            results,
            totalVotes
        );


        /* ==========================
           ELECTION INFORMATION
        ========================== */

        renderElectionInfo(
            election,
            results
        );


        /* ==========================
           LIVE INDICATOR
        ========================== */

        updateLiveIndicator(
            election
        );


        /* ==========================
           UPDATED TEXT
        ========================== */

        const updated =
            document.querySelector(
                ".updated"
            );


        if (updated) {

            updated.textContent =
                "Updated just now";

        }

    }


    /* ==========================================================
       RENDER CANDIDATES
    ========================================================== */

    function renderCandidateResults(
        results,
        totalVotes
    ) {

        const panel =
            document.querySelector(
                ".results-grid .result-panel"
            );


        if (!panel) {
            return;
        }


        /*
         * Remove old static/demo candidate rows.
         */

        panel
            .querySelectorAll(
                ".candidate-result"
            )
            .forEach(
                element =>
                    element.remove()
            );


        if (results.length === 0) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "candidate-result";

            empty.innerHTML = `
                <div class="result-info">

                    <div class="result-name">

                        <strong>
                            No results available
                        </strong>

                        <span>
                            No votes have been recorded.
                        </span>

                    </div>

                </div>
            `;

            panel.appendChild(
                empty
            );

            return;
        }


        const sortedResults =
            [...results].sort(
                (a, b) =>
                    getCandidateVotes(b) -
                    getCandidateVotes(a)
            );


        sortedResults.forEach(
            (result, index) => {

                const candidateName =
                    getCandidateName(
                        result
                    );

                const votes =
                    getCandidateVotes(
                        result
                    );

                const percentage =
                    totalVotes > 0
                        ? (
                            votes /
                            totalVotes
                        ) * 100
                        : 0;


                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "candidate-result";


                row.innerHTML = `
                    <div class="result-position">
                        ${index + 1}
                    </div>

                    <div class="result-avatar">
                        ${escapeHTML(
                            getInitials(
                                candidateName
                            )
                        )}
                    </div>

                    <div class="result-info">

                        <div class="result-name">

                            <strong>
                                ${escapeHTML(
                                    candidateName
                                )}
                            </strong>

                            <span>
                                ${formatNumber(
                                    votes
                                )} ${
                                    votes === 1
                                        ? "vote"
                                        : "votes"
                                }
                            </span>

                        </div>

                        <div class="result-progress">

                            <div>
                                <span
                                    style="width:${Math.min(
                                        percentage,
                                        100
                                    ).toFixed(1)}%">
                                </span>
                            </div>

                            <strong>
                                ${percentage.toFixed(1)}%
                            </strong>

                        </div>

                    </div>
                `;


                panel.appendChild(
                    row
                );

            }
        );

    }


    /* ==========================================================
       ELECTION INFORMATION
    ========================================================== */

    function renderElectionInfo(
        election,
        results
    ) {

        const infoValues =
            document.querySelectorAll(
                ".info-list > div > strong"
            );


        if (infoValues[0]) {

            infoValues[0].textContent =
                election._id
                    ? shortId(
                        election._id
                    )
                    : "—";

        }


        if (infoValues[1]) {

            infoValues[1].textContent =
                election.startDate
                    ? formatDate(
                        election.startDate
                    )
                    : "—";

        }


        if (infoValues[2]) {

            infoValues[2].textContent =
                election.endDate
                    ? formatDate(
                        election.endDate
                    )
                    : "—";

        }


        if (infoValues[3]) {

            infoValues[3].textContent =
                results.length;

        }


        /*
         * Keep duplicate protection as Active.
         * Your Vote schema has a unique voter +
         * election index.
         */

        if (infoValues[4]) {

            infoValues[4].innerHTML = `
                <i class="fa-solid fa-shield-halved"></i>
                Active
            `;

        }


        const banner =
            document.querySelector(
                ".status-banner"
            );


        if (!banner) {
            return;
        }


        const title =
            banner.querySelector(
                "strong"
            );

        const description =
            banner.querySelector(
                "p"
            );


        const status =
            getElectionStatus(
                election
            );


        if (status === "active") {

            if (title) {

                title.textContent =
                    "Voting in Progress";

            }

            if (description) {

                description.textContent =
                    "Ballots are currently being accepted.";

            }

        } else if (
            status === "upcoming"
        ) {

            if (title) {

                title.textContent =
                    "Voting Not Started";

            }

            if (description) {

                description.textContent =
                    "This election has not started yet.";

            }

        } else {

            if (title) {

                title.textContent =
                    "Voting Completed";

            }

            if (description) {

                description.textContent =
                    election.resultsPublished
                        ? "Final election results have been published."
                        : "Voting has ended. Results are awaiting publication.";

            }

        }

    }


    /* ==========================================================
       LIVE INDICATOR
    ========================================================== */

    function updateLiveIndicator(
        election
    ) {

        const indicator =
            document.querySelector(
                ".live-indicator"
            );


        if (!indicator) {
            return;
        }


        const status =
            getElectionStatus(
                election
            );


        if (status === "active") {

            indicator.innerHTML = `
                <span></span>
                Live Results
            `;

        } else if (
            status === "upcoming"
        ) {

            indicator.innerHTML = `
                <i class="fa-solid fa-clock"></i>
                Upcoming
            `;

        } else {

            indicator.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                Completed
            `;

        }

    }


    /* ==========================================================
       EMPTY / ERROR RESULTS
    ========================================================== */

    function showEmptyResults(
        message
    ) {

        const panel =
            document.querySelector(
                ".results-grid .result-panel"
            );


        if (!panel) {
            return;
        }


        panel
            .querySelectorAll(
                ".candidate-result"
            )
            .forEach(
                element =>
                    element.remove()
            );


        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "candidate-result";


        empty.innerHTML = `
            <div class="result-info">

                <div class="result-name">

                    <strong>
                        Results unavailable
                    </strong>

                    <span>
                        ${escapeHTML(
                            message ||
                            "Unable to load election results."
                        )}
                    </span>

                </div>

            </div>
        `;


        panel.appendChild(
            empty
        );

    }


    /* ==========================================================
       RESULT HELPERS
    ========================================================== */

    function getCandidateName(
        result
    ) {

        return (
            result.name ||
            result.candidateName ||
            result.candidate?.name ||
            "Candidate"
        );

    }


    function getCandidateVotes(
        result
    ) {

        return Number(
            result.votes ??
            result.voteCount ??
            result.count ??
            0
        );

    }


    function getTotalVotes(
        data,
        results
    ) {

        const provided =
            Number(
                data.totalVotes ??
                data.votesCast
            );


        if (
            Number.isFinite(provided)
        ) {

            return provided;

        }


        return results.reduce(
            (total, result) =>
                total +
                getCandidateVotes(
                    result
                ),
            0
        );

    }


    function getElectionStatus(
        election
    ) {

        if (
            election.status
        ) {

            return election.status;

        }


        const now =
            new Date();


        const start =
            election.startDate
                ? new Date(
                    election.startDate
                )
                : null;


        const end =
            election.endDate
                ? new Date(
                    election.endDate
                )
                : null;


        if (
            start &&
            now < start
        ) {

            return "upcoming";

        }


        if (
            end &&
            now > end
        ) {

            return "completed";

        }


        return "active";

    }


    function getElectionSubtitle(
        election
    ) {

        const status =
            getElectionStatus(
                election
            );


        if (status === "active") {

            return "Live vote counting dashboard";

        }


        if (status === "upcoming") {

            return "Election has not started yet";

        }


        return election.resultsPublished
            ? "Final election results"
            : "Election voting has ended";

    }


    /* ==========================================================
       FORMATTING
    ========================================================== */

    function formatNumber(
        value
    ) {

        return new Intl.NumberFormat()
            .format(
                Number(value) || 0
            );

    }


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

            return "—";

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


    function formatShortDate(
        value
    ) {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }


        return date.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        );

    }


    function getInitials(
        name
    ) {

        return String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word[0]
                        ?.toUpperCase()
            )
            .join("") || "?";

    }


    function shortId(
        id
    ) {

        const value =
            String(id);


        if (
            value.length <= 12
        ) {

            return value;

        }


        return (
            value.slice(0, 6) +
            "..." +
            value.slice(-4)
        );

    }


    function escapeHTML(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            String(
                value ?? ""
            );

        return div.innerHTML;

    }


    /* ==========================================================
       CLEAR ADMIN SESSION
    ========================================================== */

    function clearAdminSession() {

        localStorage.removeItem(
            "secureVoteAdminAuth"
        );

        localStorage.removeItem(
            "secureVoteAdminSession"
        );

        localStorage.removeItem(
            "secureVoteAdminToken"
        );


        sessionStorage.removeItem(
            "secureVoteAdminAuth"
        );

        sessionStorage.removeItem(
            "secureVoteAdminSession"
        );

        sessionStorage.removeItem(
            "secureVoteAdminToken"
        );

    }


    /* ==========================================================
       LOGOUT
    ========================================================== */

    logoutBtn?.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Logout from SecureVote Admin?"
                )
            ) {

                return;
            }


            clearAdminSession();


            location.href =
                "admin-login.html";

        }
    );


    /* ==========================================================
       INITIAL LOAD
    ========================================================== */

    loadElections();

});