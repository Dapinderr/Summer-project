/* ==========================================================
   SecureVote - Online Voting System
   File: public/js/elections.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================================
       ELEMENTS
    ====================================================== */

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const searchInput =
        document.getElementById("electionSearch");

    const filterButtons =
        document.querySelectorAll(".filter-btn");

    const emptyState =
        document.getElementById("emptyState");

    const electionGrid =
        document.getElementById("electionGrid");

    const userName =
        document.getElementById("userName");


    let currentFilter = "all";

    let elections = [];


    /* ======================================================
       AUTH
    ====================================================== */

    function getToken() {

        return (
            localStorage.getItem("secureVoteToken") ||
            sessionStorage.getItem("secureVoteToken") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            ""
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
       MOBILE SIDEBAR
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
       LOAD CURRENT USER
    ====================================================== */

    async function loadUser() {

        try {

            const response =
                await fetch(
                    "/api/auth/me",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (
                response.status === 401
            ) {

                clearSession();

                window.location.replace(
                    "login.html"
                );

                return;

            }


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success ||
                !data.user
            ) {

                return;

            }


            if (userName) {

                const name =
                    data.user.name ||
                    "Voter";

                userName.textContent =
                    name.split(" ")[0];

            }


            /*
             * Keep local user information
             * synchronized with backend.
             */

            localStorage.setItem(
                "secureVoteUser",
                JSON.stringify(
                    data.user
                )
            );


        } catch (error) {

            console.error(
                "Load User Error:",
                error
            );

        }

    }


    /* ======================================================
       LOAD REAL ELECTIONS
    ====================================================== */

    async function loadElections() {

        try {

            showLoading();


            const response =
                await fetch(
                    "/api/elections",
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (
                response.status === 401
            ) {

                clearSession();

                window.location.replace(
                    "login.html"
                );

                return;

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load elections"
                );

            }


            /*
             * Support common API response
             * structures:
             *
             * { elections: [...] }
             *
             * or
             *
             * { data: [...] }
             *
             * or direct [...]
             */

            if (
                Array.isArray(data)
            ) {

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

            } else {

                elections = [];

            }


            renderElections();


        } catch (error) {

            console.error(
                "Load Elections Error:",
                error
            );


            electionGrid.innerHTML = `
                <div class="election-load-error">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Unable to load elections
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                    <button
                        type="button"
                        class="primary-btn"
                        id="retryElections"
                    >
                        Try Again
                    </button>

                </div>
            `;


            electionGrid.style.display =
                "grid";

            emptyState.style.display =
                "none";


            document
                .getElementById(
                    "retryElections"
                )
                ?.addEventListener(
                    "click",
                    loadElections
                );

        }

    }


    /* ======================================================
       LOADING
    ====================================================== */

    function showLoading() {

        electionGrid.style.display =
            "grid";

        emptyState.style.display =
            "none";


        electionGrid.innerHTML = `

            <div class="election-loading">

                <i class="fa-solid fa-circle-notch fa-spin"></i>

                <h3>
                    Loading elections...
                </h3>

                <p>
                    Please wait while SecureVote
                    retrieves available elections.
                </p>

            </div>

        `;

    }


    /* ======================================================
       DETERMINE STATUS
    ====================================================== */

    function getElectionStatus(
        election
    ) {

        const now =
            new Date();


        const startDate =
            new Date(
                election.startDate
            );


        const endDate =
            new Date(
                election.endDate
            );


        /*
         * Date is the primary source for
         * voter-side display status.
         */

        if (
            !Number.isNaN(
                startDate.getTime()
            ) &&
            now < startDate
        ) {

            return "upcoming";

        }


        if (
            !Number.isNaN(
                endDate.getTime()
            ) &&
            now > endDate
        ) {

            return "completed";

        }


        /*
         * Respect explicit backend
         * completed state if present.
         */

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
       FILTER ELECTIONS
    ====================================================== */

    function getFilteredElections() {

        const searchValue =
            searchInput
                ?.value
                .trim()
                .toLowerCase() ||
            "";


        return elections.filter(
            election => {

                const title =
                    String(
                        election.title ||
                        election.name ||
                        ""
                    )
                        .toLowerCase();


                const description =
                    String(
                        election.description ||
                        ""
                    )
                        .toLowerCase();


                const status =
                    getElectionStatus(
                        election
                    );


                const matchesSearch =
                    title.includes(
                        searchValue
                    ) ||
                    description.includes(
                        searchValue
                    );


                const matchesFilter =
                    currentFilter === "all" ||
                    status === currentFilter;


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );

    }


    /* ======================================================
       RENDER ELECTIONS
    ====================================================== */

    function renderElections() {

        const filtered =
            getFilteredElections();


        electionGrid.innerHTML = "";


        if (
            filtered.length === 0
        ) {

            electionGrid.style.display =
                "none";

            emptyState.style.display =
                "block";

            return;

        }


        electionGrid.style.display =
            "grid";

        emptyState.style.display =
            "none";


        filtered.forEach(
            (election, index) => {

                const card =
                    createElectionCard(
                        election
                    );


                electionGrid.appendChild(
                    card
                );


                animateCard(
                    card,
                    index
                );

            }
        );

    }


    /* ======================================================
       CREATE ELECTION CARD
    ====================================================== */

    function createElectionCard(
        election
    ) {

        const status =
            getElectionStatus(
                election
            );


        const electionId =
            election._id ||
            election.id ||
            "";


        const title =
            election.title ||
            election.name ||
            "Untitled Election";


        const description =
            election.description ||
            "Participate securely in this election through SecureVote.";


        const candidateCount =
            getCandidateCount(
                election
            );


        const progress =
            calculateProgress(
                election
            );


        const article =
            document.createElement(
                "article"
            );


        article.className =
            "election-card";


        article.dataset.status =
            status;


        article.innerHTML = `

            <div class="card-top">

                <div class="
                    election-icon
                    ${
                        status === "upcoming"
                            ? "upcoming-icon"
                            : ""
                    }
                    ${
                        status === "completed"
                            ? "completed-icon"
                            : ""
                    }
                ">

                    <i class="${getElectionIcon(
                        election
                    )}"></i>

                </div>

                ${createStatusBadge(
                    status
                )}

            </div>


            <h2>
                ${escapeHTML(title)}
            </h2>


            <p>
                ${escapeHTML(description)}
            </p>


            <div class="details">

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

                    <i class="fa-regular fa-calendar"></i>

                    ${escapeHTML(
                        formatDateRange(
                            election.startDate,
                            election.endDate
                        )
                    )}

                </span>

            </div>


            ${createCardBottom(
                status,
                electionId,
                progress
            )}

        `;


        return article;

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
       STATUS BADGE
    ====================================================== */

    function createStatusBadge(
        status
    ) {

        if (
            status === "active"
        ) {

            return `

                <span class="status active-status">

                    <i class="fa-solid fa-circle"></i>

                    Live

                </span>

            `;

        }


        if (
            status === "upcoming"
        ) {

            return `

                <span class="status upcoming-status">

                    Upcoming

                </span>

            `;

        }


        return `

            <span class="status completed-status">

                Completed

            </span>

        `;

    }


    /* ======================================================
       CARD ACTION
    ====================================================== */

    function createCardBottom(
        status,
        electionId,
        progress
    ) {

        const safeId =
            encodeURIComponent(
                electionId
            );


        if (
            status === "active"
        ) {

            return `

                <div class="progress-info">

                    <div>

                        <span>
                            Election Progress
                        </span>

                        <strong>
                            ${progress}%
                        </strong>

                    </div>

                    <div class="progress">

                        <div
                            class="progress-bar"
                            data-progress="${progress}"
                            style="width:0%"
                        ></div>

                    </div>

                </div>


                <a
                    href="election-details.html?id=${safeId}"
                    class="primary-btn"
                >

                    View Candidates

                    <i class="fa-solid fa-arrow-right"></i>

                </a>

            `;

        }


        if (
            status === "upcoming"
        ) {

            return `

                <button
                    class="disabled-btn"
                    disabled
                >

                    Voting Not Started

                </button>

            `;

        }


        return `

            <a
                href="results.html?id=${safeId}"
                class="result-btn"
            >

                View Results

                <i class="fa-solid fa-chart-column"></i>

            </a>

        `;

    }


    /* ======================================================
       ELECTION PROGRESS
    ====================================================== */

    function calculateProgress(
        election
    ) {

        const start =
            new Date(
                election.startDate
            ).getTime();


        const end =
            new Date(
                election.endDate
            ).getTime();


        const now =
            Date.now();


        if (
            Number.isNaN(start) ||
            Number.isNaN(end) ||
            end <= start
        ) {

            return 0;

        }


        if (
            now <= start
        ) {

            return 0;

        }


        if (
            now >= end
        ) {

            return 100;

        }


        const progress =
            (
                (now - start) /
                (end - start)
            ) * 100;


        return Math.min(
            100,
            Math.max(
                0,
                Math.round(
                    progress
                )
            )
        );

    }


    /* ======================================================
       DATE FORMAT
    ====================================================== */

    function formatDateRange(
        start,
        end
    ) {

        const startDate =
            new Date(start);

        const endDate =
            new Date(end);


        if (
            Number.isNaN(
                startDate.getTime()
            ) ||
            Number.isNaN(
                endDate.getTime()
            )
        ) {

            return "Date unavailable";

        }


        const options = {
            month: "short",
            day: "numeric"
        };


        const startText =
            startDate.toLocaleDateString(
                "en-US",
                options
            );


        const endText =
            endDate.toLocaleDateString(
                "en-US",
                {
                    ...options,
                    year: "numeric"
                }
            );


        return `${startText} – ${endText}`;

    }


    /* ======================================================
       ICON
    ====================================================== */

    function getElectionIcon(
        election
    ) {

        const text =
            `${election.title || ""} ${election.description || ""}`
                .toLowerCase();


        if (
            text.includes("sport")
        ) {

            return "fa-solid fa-medal";

        }


        if (
            text.includes("computer") ||
            text.includes("technology")
        ) {

            return "fa-solid fa-laptop-code";

        }


        if (
            text.includes("culture") ||
            text.includes("music")
        ) {

            return "fa-solid fa-music";

        }


        if (
            text.includes("environment")
        ) {

            return "fa-solid fa-leaf";

        }


        if (
            text.includes("library")
        ) {

            return "fa-solid fa-book";

        }


        return "fa-solid fa-building-columns";

    }


    /* ======================================================
       CARD ANIMATION
    ====================================================== */

    function animateCard(
        card,
        index
    ) {

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


                const progressBar =
                    card.querySelector(
                        ".progress-bar"
                    );


                if (progressBar) {

                    const target =
                        progressBar.dataset
                            .progress ||
                        "0";


                    setTimeout(
                        () => {

                            progressBar.style.transition =
                                "width 1.2s ease";

                            progressBar.style.width =
                                `${target}%`;

                        },
                        150
                    );

                }

            },
            100 + index * 80
        );

    }


    /* ======================================================
       SEARCH
    ====================================================== */

    searchInput?.addEventListener(
        "input",
        renderElections
    );


    /* ======================================================
       FILTER BUTTONS
    ====================================================== */

    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    filterButtons.forEach(
                        btn => {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter;


                    renderElections();

                }
            );

        }
    );


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
       CLEAR SESSION
    ====================================================== */

    function clearSession() {

        localStorage.removeItem(
            "secureVoteAuth"
        );

        localStorage.removeItem(
            "secureVoteToken"
        );

        localStorage.removeItem(
            "secureVoteUser"
        );

        localStorage.removeItem(
            "token"
        );


        sessionStorage.removeItem(
            "secureVoteAuth"
        );

        sessionStorage.removeItem(
            "secureVoteToken"
        );

        sessionStorage.removeItem(
            "secureVoteUser"
        );

        sessionStorage.removeItem(
            "token"
        );

    }


    /* ======================================================
       LOGOUT
    ====================================================== */

    logoutBtn?.addEventListener(
        "click",
        () => {

            const logout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!logout) {
                return;
            }


            clearSession();


            window.location.href =
                "login.html";

        }
    );


    /* ======================================================
       INITIAL LOAD
    ====================================================== */

    loadUser();

    loadElections();

});