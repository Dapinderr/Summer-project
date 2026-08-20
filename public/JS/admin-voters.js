/* ==========================================================
   SecureVote
   File: js/admin-voters.js
   Real MongoDB Voter Management
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ================= ELEMENTS ================= */

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const overlay = document.getElementById("mobileOverlay");

    const search = document.getElementById("voterSearch");
    const filter = document.getElementById("voterFilter");
    const empty = document.getElementById("emptyState");

    const tableBody =
        document.getElementById("voterTableBody");

    const modal = document.getElementById("voterModal");
    const modalOverlay = document.getElementById("voterOverlay");
    const modalClose = document.getElementById("voterClose");

    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toastText");

    const logoutBtn = document.getElementById("logoutBtn");

    const totalVoters =
        document.getElementById("totalVoters");

    const verifiedVoters =
        document.getElementById("verifiedVoters");

    const pendingVoters =
        document.getElementById("pendingVoters");

    const rejectedVoters =
        document.getElementById("rejectedVoters");

    let voters = [];
    let toastTimer;


    /* ==========================================================
       TOKEN
    ========================================================== */

    function getToken() {

        return (
            localStorage.getItem("secureVoteAdminToken") ||
            sessionStorage.getItem("secureVoteAdminToken")
        );
    }


    /* ==========================================================
       AUTH CHECK
    ========================================================== */

    function checkAuthentication() {

        const token = getToken();

        if (!token) {

            console.warn(
                "Admin token not found."
            );

            location.replace(
                "admin-login.html"
            );

            return false;
        }

        return true;
    }


    if (!checkAuthentication()) {
        return;
    }


    /* ==========================================================
       API REQUEST
    ========================================================== */

    async function apiRequest(
        url,
        options = {}
    ) {

        const token = getToken();


        const response =
            await fetch(
                url,
                {
                    ...options,

                    headers: {

                        Accept:
                            "application/json",

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,

                        ...(options.headers || {})
                    }
                }
            );


        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            console.error(
                "Invalid JSON response:",
                error
            );

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
                "Administrator session expired."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Request failed (${response.status})`
            );
        }


        return data;
    }


    /* ==========================================================
       LOAD VOTERS
       GET /api/admin/voters
    ========================================================== */

    async function loadVoters() {

        try {

            console.log(
                "Loading voters..."
            );


            const data =
                await apiRequest(
                    "/api/admin/voters"
                );


            console.log(
                "Voters API response:",
                data
            );


            if (
                Array.isArray(data.voters)
            ) {

                voters =
                    data.voters;

            } else {

                voters = [];

            }


            console.log(
                "Voters loaded:",
                voters.length
            );


            renderVoters();

            updateStats();


        } catch (error) {

            console.error(
                "Load voters error:",
                error
            );


            voters = [];

            renderVoters();

            updateStats();


            showToast(
                error.message ||
                "Unable to load voters.",
                false
            );

        }
    }


    /* ==========================================================
       RENDER VOTERS
    ========================================================== */

    function renderVoters() {

        if (!tableBody) {

            console.error(
                "voterTableBody not found."
            );

            return;
        }


        tableBody.innerHTML = "";


        voters.forEach(voter => {

            const row =
                createVoterRow(voter);

            tableBody.appendChild(row);

        });


        applyFilter();
    }


    /* ==========================================================
       CREATE ROW
    ========================================================== */

    function createVoterRow(voter) {

        const row =
            document.createElement("tr");


        const status =
            getStatus(voter);


        row.className =
            "voter-row";


        row.dataset.id =
            voter._id;


        row.dataset.status =
            status;


        const displayName =
            voter.name ||
            voter.fullName ||
            "Voter";


        const voterId =
            voter.voterId ||
            "—";


        row.innerHTML = `

            <td>

                <div class="voter-info">

                    <div class="voter-avatar">

                        ${escapeHTML(
                            getInitials(
                                displayName
                            )
                        )}

                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                displayName
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                capitalize(
                                    voter.role ||
                                    "voter"
                                )
                            )}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHTML(voterId)}
            </td>


            <td>
                ${escapeHTML(
                    voter.email || "—"
                )}
            </td>


            <td>

                ${getStatusHTML(status)}

            </td>


            <td>

                <span class="twofa ${
                    voter.isVerified
                        ? "enabled"
                        : ""
                }">

                    ${
                        voter.isVerified
                            ? "Enabled"
                            : "Pending"
                    }

                </span>

            </td>


            <td>

                ${formatDate(
                    voter.createdAt
                )}

            </td>


            <td>

                <div class="actions">

                    <button
                        type="button"
                        class="view-voter"
                        title="View Voter"
                    >

                        <i class="fa-solid fa-eye"></i>

                    </button>


                    ${
                        status === "pending"

                            ? `

                                <button
                                    type="button"
                                    class="approve-voter"
                                    title="Approve Voter"
                                >

                                    <i class="fa-solid fa-check"></i>

                                </button>


                                <button
                                    type="button"
                                    class="reject-voter"
                                    title="Suspend Voter"
                                >

                                    <i class="fa-solid fa-xmark"></i>

                                </button>

                            `

                            : ""
                    }


                    ${
                        status === "verified"

                            ? `

                                <button
                                    type="button"
                                    class="reject-voter"
                                    title="Suspend Voter"
                                >

                                    <i class="fa-solid fa-ban"></i>

                                </button>

                            `

                            : ""
                    }

                </div>

            </td>

        `;


        attachEvents(row);


        return row;
    }


    /* ==========================================================
       STATUS
    ========================================================== */

    function getStatus(voter) {

        if (
            voter.accountStatus ===
            "suspended"
        ) {

            return "rejected";
        }


        if (
            voter.isVerified === true &&
            voter.accountStatus ===
            "active"
        ) {

            return "verified";
        }


        return "pending";
    }


    function getStatusHTML(status) {

        if (status === "verified") {

            return `

                <span class="status verified">

                    <i class="fa-solid fa-circle-check"></i>

                    Verified

                </span>

            `;
        }


        if (status === "rejected") {

            return `

                <span class="status rejected">

                    <i class="fa-solid fa-circle-xmark"></i>

                    Suspended

                </span>

            `;
        }


        return `

            <span class="status pending">

                <i class="fa-solid fa-clock"></i>

                Pending

            </span>

        `;
    }


    /* ==========================================================
       EVENTS
    ========================================================== */

    function attachEvents(row) {

        const voterId =
            row.dataset.id;


        row.querySelector(
            ".view-voter"
        )?.addEventListener(
            "click",
            () => {

                viewVoter(voterId);

            }
        );


        row.querySelector(
            ".approve-voter"
        )?.addEventListener(
            "click",
            () => {

                approveVoter(voterId);

            }
        );


        row.querySelector(
            ".reject-voter"
        )?.addEventListener(
            "click",
            () => {

                suspendVoter(voterId);

            }
        );
    }


    /* ==========================================================
       FIND VOTER
    ========================================================== */

    function findVoter(id) {

        return voters.find(
            voter =>
                String(voter._id) ===
                String(id)
        );
    }


    /* ==========================================================
       VIEW VOTER
    ========================================================== */

    function viewVoter(id) {

        const voter =
            findVoter(id);


        if (!voter) {

            showToast(
                "Voter not found.",
                false
            );

            return;
        }


        const displayName =
            voter.name ||
            voter.fullName ||
            "Voter";


        setText(
            "profileAvatar",
            getInitials(displayName)
        );


        setText(
            "profileName",
            displayName
        );


        setText(
            "profileId",
            voter.voterId || "—"
        );


        setText(
            "profileEmail",
            voter.email || "—"
        );


        setText(
            "profileStatus",
            capitalize(
                getStatus(voter)
            )
        );


        setText(
            "profileRole",
            capitalize(
                voter.role || "voter"
            )
        );


        setText(
            "profile2FA",
            voter.isVerified
                ? "Enabled"
                : "Pending"
        );


        modal?.classList.add(
            "show"
        );
    }


    /* ==========================================================
       APPROVE VOTER
    ========================================================== */

    async function approveVoter(id) {

        const voter =
            findVoter(id);


        if (!voter) {
            return;
        }


        const displayName =
            voter.name ||
            voter.fullName ||
            "this voter";


        const confirmed =
            confirm(
                `Approve ${displayName}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            await apiRequest(
                `/api/admin/voters/${id}/approve`,
                {
                    method: "PATCH"
                }
            );


            showToast(
                "Voter approved successfully."
            );


            await loadVoters();


        } catch (error) {

            console.error(
                "Approve voter error:",
                error
            );


            showToast(
                error.message ||
                "Unable to approve voter.",
                false
            );

        }
    }


    /* ==========================================================
       SUSPEND VOTER
    ========================================================== */

    async function suspendVoter(id) {

        const voter =
            findVoter(id);


        if (!voter) {
            return;
        }


        const displayName =
            voter.name ||
            voter.fullName ||
            "this voter";


        const confirmed =
            confirm(
                `Suspend ${displayName}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            await apiRequest(
                `/api/admin/voters/${id}/suspend`,
                {
                    method: "PATCH"
                }
            );


            showToast(
                "Voter suspended successfully."
            );


            await loadVoters();


        } catch (error) {

            console.error(
                "Suspend voter error:",
                error
            );


            showToast(
                error.message ||
                "Unable to suspend voter.",
                false
            );

        }
    }


    /* ==========================================================
       SEARCH / FILTER
    ========================================================== */

    function applyFilter() {

        const query =
            search?.value
                .trim()
                .toLowerCase() || "";


        const selected =
            filter?.value ||
            "all";


        const rows =
            document.querySelectorAll(
                ".voter-row"
            );


        let visible = 0;


        rows.forEach(row => {

            const matchesSearch =
                row.innerText
                    .toLowerCase()
                    .includes(query);


            const matchesStatus =
                selected === "all" ||
                row.dataset.status ===
                    selected;


            const shouldShow =
                matchesSearch &&
                matchesStatus;


            row.style.display =
                shouldShow
                    ? ""
                    : "none";


            if (shouldShow) {
                visible++;
            }

        });


        empty?.classList.toggle(
            "show",
            visible === 0
        );
    }


    search?.addEventListener(
        "input",
        applyFilter
    );


    filter?.addEventListener(
        "change",
        applyFilter
    );


    /* ==========================================================
       STATS
    ========================================================== */

    function updateStats() {

        const verified =
            voters.filter(
                voter =>
                    getStatus(voter) ===
                    "verified"
            ).length;


        const pending =
            voters.filter(
                voter =>
                    getStatus(voter) ===
                    "pending"
            ).length;


        const rejected =
            voters.filter(
                voter =>
                    getStatus(voter) ===
                    "rejected"
            ).length;


        if (totalVoters) {

            totalVoters.textContent =
                voters.length;

        }


        if (verifiedVoters) {

            verifiedVoters.textContent =
                verified;

        }


        if (pendingVoters) {

            pendingVoters.textContent =
                pending;

        }


        if (rejectedVoters) {

            rejectedVoters.textContent =
                rejected;

        }
    }


    /* ==========================================================
       MODAL
    ========================================================== */

    function closeModal() {

        modal?.classList.remove(
            "show"
        );
    }


    modalClose?.addEventListener(
        "click",
        closeModal
    );


    modalOverlay?.addEventListener(
        "click",
        closeModal
    );


    /* ==========================================================
       SIDEBAR
    ========================================================== */

    menuBtn?.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "open"
            );

            overlay?.classList.toggle(
                "show"
            );

        }
    );


    overlay?.addEventListener(
        "click",
        () => {

            sidebar?.classList.remove(
                "open"
            );

            overlay?.classList.remove(
                "show"
            );

        }
    );


    /* ==========================================================
       HELPERS
    ========================================================== */

    function getInitials(name) {

        return String(name || "V")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word.charAt(0)
                        .toUpperCase()
            )
            .join("");
    }


    function formatDate(value) {

        if (!value) {
            return "—";
        }


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
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }


    function capitalize(value) {

        const text =
            String(value || "");


        if (!text) {
            return "";
        }


        return (
            text.charAt(0)
                .toUpperCase() +
            text.slice(1)
        );
    }


    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value;

        }
    }


    function escapeHTML(value) {

        const div =
            document.createElement("div");


        div.textContent =
            String(value ?? "");


        return div.innerHTML;
    }


    /* ==========================================================
       TOAST
    ========================================================== */

    function showToast(
        message,
        success = true
    ) {

        if (!toast || !toastText) {
            return;
        }


        clearTimeout(
            toastTimer
        );


        toastText.textContent =
            message;


        const icon =
            toast.querySelector("i");


        if (icon) {

            icon.className =
                success
                    ? "fa-solid fa-circle-check"
                    : "fa-solid fa-circle-exclamation";

        }


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


    /* ==========================================================
       CLEAR SESSION
    ========================================================== */

    function clearAdminSession() {

        const keys = [

            "secureVoteAdminToken",

            "secureVoteAdminUser",

            "secureVoteAdminAuth",

            "secureVoteAdminSession"

        ];


        keys.forEach(key => {

            localStorage.removeItem(key);

            sessionStorage.removeItem(key);

        });
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
       ESCAPE
    ========================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;
            }


            closeModal();


            sidebar?.classList.remove(
                "open"
            );


            overlay?.classList.remove(
                "show"
            );

        }
    );


    /* ==========================================================
       INITIAL LOAD
    ========================================================== */

    loadVoters();

});