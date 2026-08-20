/* ==========================================================
   SecureVote
   File: public/js/election-details.js
   Real MongoDB Election + Candidates
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

    const electionTitle =
        document.getElementById("electionTitle");

    const electionDescription =
        document.getElementById("electionDescription");

    const electionStatus =
        document.getElementById("electionStatus");

    const votingPeriod =
        document.getElementById("votingPeriod");

    const countdown =
        document.getElementById("countdown");

    const candidateGrid =
        document.getElementById("candidateGrid");

    const candidateCount =
        document.getElementById("candidateCount");

    const candidateInfoCount =
        document.getElementById("candidateInfoCount");

    const voteStatusCard =
        document.getElementById("voteStatusCard");

    const voteStatusTitle =
        document.getElementById("voteStatusTitle");

    const voteStatusText =
        document.getElementById("voteStatusText");


    /* MODAL */

    const modal =
        document.getElementById("manifestoModal");

    const modalOverlay =
        document.getElementById("modalOverlay");

    const modalClose =
        document.getElementById("modalClose");

    const modalDone =
        document.getElementById("modalDone");

    const modalCandidate =
        document.getElementById("modalCandidate");

    const modalManifesto =
        document.getElementById("modalManifesto");


    /* ======================================================
       TOKEN
    ====================================================== */

    function getToken() {

        return (
            localStorage.getItem("secureVoteToken") ||
            sessionStorage.getItem("secureVoteToken")
        );

    }


    const token =
        getToken();


    if (!token) {

        window.location.replace(
            "login.html"
        );

        return;

    }


    /* ======================================================
       ELECTION ID

       IMPORTANT:
       No fallback to "1".
    ====================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const electionId =
        params.get("id");


    if (!electionId) {

        alert(
            "Election ID is missing."
        );

        window.location.replace(
            "elections.html"
        );

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
       USER
    ====================================================== */

    function loadUser() {

        try {

            const raw =
                localStorage.getItem(
                    "secureVoteUser"
                ) ||
                sessionStorage.getItem(
                    "secureVoteUser"
                );


            if (!raw) {
                return;
            }


            const user =
                JSON.parse(raw);


            /*
             * Your User model uses "name",
             * not "fullName".
             */

            const name =
                user.name ||
                "Voter";


            const userName =
                document.getElementById(
                    "userName"
                );


            if (userName) {

                userName.textContent =
                    name
                        .trim()
                        .split(/\s+/)[0];

            }


        } catch (error) {

            console.error(
                "Unable to load user:",
                error
            );

        }

    }


    loadUser();


    /* ======================================================
       API REQUEST
    ====================================================== */

    async function apiGet(url) {

        const response =
            await fetch(
                url,
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


        let data = {};


        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "Invalid server response"
            );

        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            clearAuthentication();

            window.location.replace(
                "login.html"
            );

            throw new Error(
                "Session expired"
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
       LOAD ELECTION
    ====================================================== */

    let currentElection = null;

    let electionEnd = null;

    let countdownTimer = null;


    async function loadElection() {

        try {

            /*
             * We already know GET /api/elections
             * works because elections.html uses it.
             */

            const data =
                await apiGet(
                    "/api/elections"
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


            currentElection =
                elections.find(
                    election =>
                        String(
                            election._id ||
                            election.id
                        ) ===
                        String(electionId)
                );


            if (!currentElection) {

                throw new Error(
                    "Election not found."
                );

            }


            renderElection(
                currentElection
            );


            return currentElection;


        } catch (error) {

            console.error(
                "Election Load Error:",
                error
            );


            if (electionTitle) {

                electionTitle.textContent =
                    "Unable to load election";

            }


            if (electionDescription) {

                electionDescription.textContent =
                    error.message;

            }


            throw error;

        }

    }


    /* ======================================================
       RENDER ELECTION
    ====================================================== */

    function renderElection(
        election
    ) {

        const title =
            election.title ||
            election.name ||
            "Election";


        const description =
            election.description ||
            "SecureVote election";


        electionTitle.textContent =
            title;


        electionDescription.textContent =
            description;


        const start =
            new Date(
                election.startDate
            );


        const end =
            new Date(
                election.endDate
            );


        electionEnd =
            end;


        votingPeriod.textContent =
            `${formatDate(start)} – ${formatDate(end)}`;


        const status =
            calculateElectionStatus(
                election
            );


        renderElectionStatus(
            status
        );


        if (countdownTimer) {

            clearInterval(
                countdownTimer
            );

        }


        updateCountdown();


        countdownTimer =
            setInterval(
                updateCountdown,
                1000
            );

    }


    /* ======================================================
       ELECTION STATUS
    ====================================================== */

    function calculateElectionStatus(
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


    function renderElectionStatus(
        status
    ) {

        if (!electionStatus) {
            return;
        }


        if (status === "active") {

            electionStatus.innerHTML = `

                <i class="fa-solid fa-circle"></i>

                Voting Live

            `;

            return;

        }


        if (status === "upcoming") {

            electionStatus.innerHTML = `

                <i class="fa-solid fa-clock"></i>

                Upcoming

            `;

            return;

        }


        electionStatus.innerHTML = `

            <i class="fa-solid fa-circle-check"></i>

            Voting Closed

        `;

    }


    /* ======================================================
       COUNTDOWN
    ====================================================== */

    function updateCountdown() {

        if (
            !electionEnd ||
            Number.isNaN(
                electionEnd.getTime()
            )
        ) {

            countdown.textContent =
                "Unavailable";

            return;

        }


        const now =
            new Date();


        const difference =
            electionEnd.getTime() -
            now.getTime();


        if (
            difference <= 0
        ) {

            countdown.textContent =
                "Voting Closed";


            if (countdownTimer) {

                clearInterval(
                    countdownTimer
                );

            }

            return;

        }


        const days =
            Math.floor(
                difference /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        const hours =
            Math.floor(
                (
                    difference /
                    (
                        1000 *
                        60 *
                        60
                    )
                ) %
                24
            );


        const minutes =
            Math.floor(
                (
                    difference /
                    (
                        1000 *
                        60
                    )
                ) %
                60
            );


        const seconds =
            Math.floor(
                (
                    difference /
                    1000
                ) %
                60
            );


        countdown.textContent =
            `${days}d ${hours}h ${minutes}m ${seconds}s`;

    }


    /* ======================================================
       LOAD REAL CANDIDATES
    ====================================================== */

    async function loadCandidates() {

        try {

            /*
             * Your admin API already supports:
             *
             * GET /api/admin/candidates?election=...
             *
             * But voter pages must NOT depend on
             * an admin-only route.
             *
             * First try the public/voter election
             * candidate endpoint.
             */

            let candidates = [];


            try {

                const data =
                    await apiGet(
                        `/api/elections/${encodeURIComponent(
                            electionId
                        )}/candidates`
                    );


                candidates =
                    extractCandidates(
                        data
                    );


            } catch (firstError) {

                /*
                 * Fallback to candidates returned
                 * inside /api/elections if your
                 * electionController populates them.
                 */

                if (
                    currentElection &&
                    Array.isArray(
                        currentElection.candidates
                    )
                ) {

                    candidates =
                        currentElection.candidates;

                } else {

                    throw firstError;

                }

            }


            /*
             * Only active candidates should
             * be selectable by voters.
             */

            candidates =
                candidates.filter(
                    candidate =>
                        candidate.isActive !== false
                );


            renderCandidates(
                candidates
            );


        } catch (error) {

            console.error(
                "Candidate Load Error:",
                error
            );


            candidateGrid.innerHTML = `

                <div class="candidate-loading">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <p>
                        Unable to load registered candidates.
                    </p>

                    <small>
                        ${escapeHTML(error.message)}
                    </small>

                </div>

            `;


            updateCandidateCount(
                0
            );

        }

    }


    function extractCandidates(
        data
    ) {

        if (Array.isArray(data)) {

            return data;

        }


        if (
            Array.isArray(
                data.candidates
            )
        ) {

            return data.candidates;

        }


        if (
            Array.isArray(
                data.data
            )
        ) {

            return data.data;

        }


        return [];

    }


    /* ======================================================
       RENDER REAL CANDIDATES
    ====================================================== */

    function renderCandidates(
        candidates
    ) {

        candidateGrid.innerHTML =
            "";


        updateCandidateCount(
            candidates.length
        );


        if (
            candidates.length === 0
        ) {

            candidateGrid.innerHTML = `

                <div class="candidate-loading">

                    <i class="fa-solid fa-users-slash"></i>

                    <p>
                        No candidates have been registered
                        for this election yet.
                    </p>

                </div>

            `;

            return;

        }


        candidates.forEach(
            (candidate, index) => {

                const candidateId =
                    candidate._id ||
                    candidate.id;


                const name =
                    candidate.name ||
                    candidate.fullName ||
                    "Candidate";


                const party =
                    candidate.party ||
                    candidate.partyName ||
                    candidate.group ||
                    "Independent";


                const bio =
                    candidate.bio ||
                    candidate.description ||
                    candidate.about ||
                    "Candidate registered for this election.";


                const manifesto =
                    candidate.manifesto ||
                    "Manifesto has not been provided.";


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "candidate-card";


                card.innerHTML = `

                    <div class="candidate-photo">

                        <i class="fa-solid fa-user"></i>

                        <span class="candidate-number">

                            ${String(
                                index + 1
                            ).padStart(2, "0")}

                        </span>

                    </div>


                    <div class="candidate-content">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>


                        <span class="party">

                            ${escapeHTML(party)}

                        </span>


                        <p>

                            ${escapeHTML(bio)}

                        </p>


                        <div class="candidate-tags">

                            <span>
                                Registered Candidate
                            </span>

                            <span>
                                Verified
                            </span>

                        </div>


                        <button
                            class="manifesto-btn"
                            type="button"
                        >

                            <i class="fa-solid fa-file-lines"></i>

                            View Manifesto

                        </button>


                        <a
                            href="vote.html?candidate=${encodeURIComponent(
                                candidateId
                            )}&election=${encodeURIComponent(
                                electionId
                            )}"
                            class="select-btn"
                            data-candidate-id="${escapeHTML(
                                candidateId
                            )}"
                        >

                            Select Candidate

                            <i class="fa-solid fa-arrow-right"></i>

                        </a>

                    </div>

                `;


                const manifestoButton =
                    card.querySelector(
                        ".manifesto-btn"
                    );


                manifestoButton
                    ?.addEventListener(
                        "click",
                        () => {

                            openManifesto(
                                name,
                                manifesto
                            );

                        }
                    );


                candidateGrid.appendChild(
                    card
                );


                /*
                 * Entry animation
                 */

                card.style.opacity =
                    "0";


                card.style.transform =
                    "translateY(25px)";


                card.style.transition =
                    "opacity .5s ease, transform .5s ease";


                setTimeout(
                    () => {

                        card.style.opacity =
                            "1";

                        card.style.transform =
                            "translateY(0)";

                    },
                    100 + index * 80
                );

            }
        );

    }


    /* ======================================================
       CANDIDATE COUNT
    ====================================================== */

    function updateCandidateCount(
        count
    ) {

        const text =
            `${count} ${
                count === 1
                    ? "Candidate"
                    : "Candidates"
            }`;


        if (candidateCount) {

            candidateCount.innerHTML = `

                <i class="fa-solid fa-users"></i>

                ${text}

            `;

        }


        if (candidateInfoCount) {

            candidateInfoCount.textContent =
                text;

        }

    }


    /* ======================================================
       CHECK REAL VOTE STATUS
    ====================================================== */

    async function checkVoteStatus() {

        try {

            const data =
                await apiGet(
                    `/api/votes/status/${encodeURIComponent(
                        electionId
                    )}`
                );


            if (
                data.hasVoted === true
            ) {

                showAlreadyVoted(
                    data.receipt
                );

            }


        } catch (error) {

            console.error(
                "Vote Status Error:",
                error
            );

        }

    }


    function showAlreadyVoted(
        receipt
    ) {

        if (voteStatusCard) {

            voteStatusCard.style.display =
                "flex";

        }


        if (voteStatusTitle) {

            voteStatusTitle.textContent =
                "Vote already recorded";

        }


        if (voteStatusText) {

            const date =
                receipt?.votedAt
                    ? formatDateTime(
                        receipt.votedAt
                    )
                    : "";


            voteStatusText.textContent =
                date
                    ? `You already voted in this election on ${date}.`
                    : "You have already voted in this election.";

        }


        /*
         * Disable candidate selection.
         *
         * IMPORTANT:
         * This is only UI protection.
         * Backend duplicate-vote protection
         * remains the real security control.
         */

        document
            .querySelectorAll(
                ".select-btn"
            )
            .forEach(
                button => {

                    button.removeAttribute(
                        "href"
                    );


                    button.style.opacity =
                        "0.55";


                    button.style.cursor =
                        "not-allowed";


                    button.innerHTML = `

                        Already Voted

                        <i class="fa-solid fa-check"></i>

                    `;


                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            alert(
                                "You have already voted in this election."
                            );

                        }
                    );

                }
            );

    }


    /* ======================================================
       MANIFESTO
    ====================================================== */

    function openManifesto(
        candidate,
        manifesto
    ) {

        if (modalCandidate) {

            modalCandidate.textContent =
                candidate ||
                "Candidate";

        }


        if (modalManifesto) {

            modalManifesto.textContent =
                manifesto ||
                "Manifesto unavailable.";

        }


        modal?.classList.add(
            "show"
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    function closeManifesto() {

        modal?.classList.remove(
            "show"
        );


        document.body.classList.remove(
            "modal-open"
        );

    }


    modalClose?.addEventListener(
        "click",
        closeManifesto
    );


    modalDone?.addEventListener(
        "click",
        closeManifesto
    );


    modalOverlay?.addEventListener(
        "click",
        closeManifesto
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeManifesto();

            }

        }
    );


    /* ======================================================
       DATE HELPERS
    ====================================================== */

    function formatDate(
        value
    ) {

        const date =
            value instanceof Date
                ? value
                : new Date(value);


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

                month:
                    "short",

                day:
                    "numeric",

                year:
                    "numeric"

            }
        );

    }


    function formatDateTime(
        value
    ) {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "an earlier time";

        }


        return date.toLocaleString();

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
       AUTH CLEAR
    ====================================================== */

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

    }


    /* ======================================================
       LOGOUT
    ====================================================== */

    logoutBtn?.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Are you sure you want to logout?"
                )
            ) {

                return;

            }


            clearAuthentication();


            window.location.replace(
                "login.html"
            );

        }
    );


    /* ======================================================
       INITIALIZE
    ====================================================== */

    try {

        await loadElection();

        /*
         * Load candidates first so that if the voter
         * already voted, the generated Select buttons
         * can then be disabled.
         */

        await loadCandidates();

        await checkVoteStatus();


    } catch (error) {

        console.error(
            "Election Details Initialization Error:",
            error
        );

    }

});