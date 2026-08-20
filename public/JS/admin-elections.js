/* ==========================================================
   SecureVote
   File: public/js/admin-elections.js
   Real MongoDB Election Management
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ================= ELEMENTS ================= */

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const mobileOverlay = document.getElementById("mobileOverlay");

    const logoutBtn = document.getElementById("logoutBtn");
    const adminEmail = document.getElementById("adminEmail");

    const createElectionBtn =
        document.getElementById("createElectionBtn");

    const electionSearch =
        document.getElementById("electionSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    const tableBody =
        document.getElementById("electionTableBody");

    const emptyState =
        document.getElementById("emptyState");

    const totalElections =
        document.getElementById("totalElections");

    const activeElections =
        document.getElementById("activeElections");

    const upcomingElections =
        document.getElementById("upcomingElections");

    const completedElections =
        document.getElementById("completedElections");


    /* ================= CREATE / EDIT MODAL ================= */

    const electionModal =
        document.getElementById("electionModal");

    const modalOverlay =
        document.getElementById("modalOverlay");

    const modalClose =
        document.getElementById("modalClose");

    const cancelBtn =
        document.getElementById("cancelBtn");

    const modalTitle =
        document.getElementById("modalTitle");

    const electionForm =
        document.getElementById("electionForm");

    const editingElectionId =
        document.getElementById("editingElectionId");

    const electionName =
        document.getElementById("electionName");

    const electionDescription =
        document.getElementById("electionDescription");

    const startDate =
        document.getElementById("startDate");

    const endDate =
        document.getElementById("endDate");

    const voterPool =
        document.getElementById("voterPool");

    const resultVisibility =
        document.getElementById("resultVisibility");

    const otpRequired =
        document.getElementById("otpRequired");


    /* ================= VIEW MODAL ================= */

    const viewModal =
        document.getElementById("viewModal");

    const viewOverlay =
        document.getElementById("viewOverlay");

    const viewClose =
        document.getElementById("viewClose");

    const viewElectionName =
        document.getElementById("viewElectionName");

    const viewElectionId =
        document.getElementById("viewElectionId");

    const viewElectionStatus =
        document.getElementById("viewElectionStatus");

    const viewElectionSchedule =
        document.getElementById("viewElectionSchedule");

    const viewCandidateCount =
        document.getElementById("viewCandidateCount");

    const viewVoterCount =
        document.getElementById("viewVoterCount");


    /* ================= DELETE MODAL ================= */

    const deleteModal =
        document.getElementById("deleteModal");

    const deleteOverlay =
        document.getElementById("deleteOverlay");

    const cancelDelete =
        document.getElementById("cancelDelete");

    const confirmDelete =
        document.getElementById("confirmDelete");


    /* ================= TOAST ================= */

    const toast =
        document.getElementById("toast");

    const toastText =
        document.getElementById("toastText");


    /* ================= STATE ================= */

    let elections = [];

    let deleteTargetId = null;

    let toastTimer;


    /* ==========================================================
       ADMIN TOKEN
       ========================================================== */

    function getAdminToken() {

        return (
            localStorage.getItem("secureVoteAdminToken") ||
            sessionStorage.getItem("secureVoteAdminToken")
        );

    }


    /* ==========================================================
       ADMIN USER
       ========================================================== */

    function getAdminUser() {

        const raw =
            localStorage.getItem("secureVoteAdminUser") ||
            sessionStorage.getItem("secureVoteAdminUser");


        if (!raw) {
            return null;
        }


        try {

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "Invalid admin user data:",
                error
            );

            return null;

        }

    }


    /* ==========================================================
       ADMIN AUTH CHECK
       ========================================================== */

    function checkAdminAuth() {

        const token =
            getAdminToken();

        const user =
            getAdminUser();


        if (
            !token ||
            !user ||
            user.role !== "admin"
        ) {

            clearAdminSession();

            window.location.replace(
                "admin-login.html"
            );

            return false;

        }


        return true;

    }


    if (!checkAdminAuth()) {
        return;
    }


    /* ==========================================================
       LOAD ADMIN INFORMATION
       ========================================================== */

    function loadAdmin() {

        const user =
            getAdminUser();


        if (
            user &&
            user.email &&
            adminEmail
        ) {

            adminEmail.textContent =
                user.email;

        }

    }


    loadAdmin();


    /* ==========================================================
       AUTHENTICATED API REQUEST
       ========================================================== */

    async function apiRequest(
        url,
        options = {}
    ) {

        const token =
            getAdminToken();


        if (!token) {

            logout(false);

            throw new Error(
                "Administrator session expired"
            );

        }


        const response =
            await fetch(
                url,
                {
                    ...options,

                    headers: {

                        "Content-Type":
                            "application/json",

                        Accept:
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

        } catch {

            data = {};

        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            clearAdminSession();

            window.location.replace(
                "admin-login.html"
            );

            throw new Error(
                data.message ||
                "Administrator authorization failed"
            );

        }


        if (
            !response.ok ||
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Request failed"
            );

        }


        return data;

    }


    /* ==========================================================
       LOAD ELECTIONS FROM MONGODB
       GET /api/admin/elections
       ========================================================== */

    async function loadElections() {

        try {

            const data =
                await apiRequest(
                    "/api/admin/elections"
                );


            elections =
                Array.isArray(data.elections)
                    ? data.elections
                    : [];


            renderElections();

            updateStatistics();


        } catch (error) {

            console.error(
                "Load Elections Error:",
                error
            );


            elections = [];

            renderElections();

            updateStatistics();


            showToast(
                error.message ||
                "Unable to load elections.",
                false
            );

        }

    }


    /* ==========================================================
       RENDER ELECTIONS
       ========================================================== */

    function renderElections() {

        if (!tableBody) {
            return;
        }


        /*
         * This removes the old hard-coded demo rows
         * from the HTML automatically.
         */

        tableBody.innerHTML = "";


        elections.forEach(
            election => {

                tableBody.appendChild(
                    createElectionRow(
                        election
                    )
                );

            }
        );


        filterElections();

    }


    /* ==========================================================
       CREATE TABLE ROW
       ========================================================== */

    function createElectionRow(
        election
    ) {

        const row =
            document.createElement("tr");


        const id =
            String(
                election._id || ""
            );


        const title =
            election.title ||
            "Untitled Election";


        const status =
            election.status ||
            calculateStatus(
                election.startDate,
                election.endDate
            );


        const candidateCount =
            Number(
                election.candidateCount
            ) || 0;


        const voteCount =
            Number(
                election.voteCount
            ) || 0;


        row.className =
            "election-row";

        row.dataset.id =
            id;

        row.dataset.status =
            status;


        row.innerHTML = `

            <td>

                <div class="election-name">

                    <div class="election-icon blue">

                        <i class="fa-solid fa-box-ballot"></i>

                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(title)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                shortId(id)
                            )}
                        </span>

                    </div>

                </div>

            </td>


            <td>

                ${createStatusHTML(
                    status
                )}

            </td>


            <td>

                <strong class="date">

                    ${formatDateRange(
                        election.startDate,
                        election.endDate
                    )}

                </strong>

                <span class="year">

                    ${getElectionYear(
                        election.startDate
                    )}

                </span>

            </td>


            <td>
                ${formatNumber(
                    candidateCount
                )}
            </td>


            <td>
                —
            </td>


            <td>

                ${
                    status === "upcoming"

                        ? "—"

                        : `
                            <strong>
                                ${formatNumber(
                                    voteCount
                                )} votes
                            </strong>
                        `
                }

            </td>


            <td>

                <div class="actions">

                    <button
                        type="button"
                        class="view-btn"
                        title="View election"
                    >

                        <i class="fa-solid fa-eye"></i>

                    </button>


                    <button
                        type="button"
                        class="edit-btn"
                        title="Edit election"
                    >

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        type="button"
                        class="delete-btn"
                        title="Delete election"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        `;


        attachRowEvents(row);


        return row;

    }


    /* ==========================================================
       SIDEBAR
       ========================================================== */

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

        mobileOverlay?.classList.remove(
            "show"
        );

        document.body.style.overflow =
            "";

    }


    menuBtn?.addEventListener(
        "click",
        () => {

            if (
                sidebar?.classList.contains(
                    "open"
                )
            ) {

                closeSidebar();

            } else {

                openSidebar();

            }

        }
    );


    mobileOverlay?.addEventListener(
        "click",
        closeSidebar
    );


    /* ==========================================================
       MODALS
       ========================================================== */

    function openModal(modal) {

        modal?.classList.add(
            "show"
        );

        document.body.classList.add(
            "modal-open"
        );

    }


    function closeModal(modal) {

        modal?.classList.remove(
            "show"
        );


        if (
            !document.querySelector(
                ".modal.show"
            )
        ) {

            document.body.classList.remove(
                "modal-open"
            );

        }

    }


    /* ==========================================================
       OPEN CREATE ELECTION
       ========================================================== */

    createElectionBtn?.addEventListener(
        "click",
        () => {

            electionForm?.reset();


            if (editingElectionId) {

                editingElectionId.value =
                    "";

            }


            if (modalTitle) {

                modalTitle.textContent =
                    "Create Election";

            }


            if (otpRequired) {

                otpRequired.checked =
                    true;

            }


            openModal(
                electionModal
            );


            setTimeout(
                () =>
                    electionName?.focus(),
                100
            );

        }
    );


    /* ==========================================================
       ?action=create
       ========================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );


    if (
        params.get("action") ===
        "create"
    ) {

        setTimeout(
            () =>
                createElectionBtn?.click(),
            200
        );

    }


    /* ==========================================================
       CLOSE CREATE / EDIT MODAL
       ========================================================== */

    modalClose?.addEventListener(
        "click",
        () =>
            closeModal(
                electionModal
            )
    );


    cancelBtn?.addEventListener(
        "click",
        () =>
            closeModal(
                electionModal
            )
    );


    modalOverlay?.addEventListener(
        "click",
        () =>
            closeModal(
                electionModal
            )
    );


    /* ==========================================================
       DATE VALIDATION
       ========================================================== */

    function validateDates() {

        const start =
            new Date(
                startDate.value
            );

        const end =
            new Date(
                endDate.value
            );


        if (
            Number.isNaN(
                start.getTime()
            ) ||
            Number.isNaN(
                end.getTime()
            )
        ) {

            showToast(
                "Please select valid election dates.",
                false
            );

            return false;

        }


        if (end <= start) {

            showToast(
                "Election end date must be after the start date.",
                false
            );

            return false;

        }


        return true;

    }


    /* ==========================================================
       CREATE / UPDATE ELECTION
       ========================================================== */

    electionForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const title =
                electionName.value.trim();


            if (!title) {

                showToast(
                    "Please enter an election name.",
                    false
                );

                return;

            }


            if (!validateDates()) {
                return;
            }


            const electionData = {

                title,

                description:
                    electionDescription
                        .value
                        .trim(),

                startDate:
                    startDate.value,

                endDate:
                    endDate.value

            };


            const id =
                editingElectionId
                    ?.value
                    .trim();


            const submitButton =
                electionForm.querySelector(
                    'button[type="submit"]'
                );


            setButtonLoading(
                submitButton,
                true
            );


            try {

                if (id) {

                    /* ======================
                       UPDATE
                       ====================== */

                    await apiRequest(
                        `/api/admin/elections/${id}`,
                        {
                            method:
                                "PUT",

                            body:
                                JSON.stringify(
                                    electionData
                                )
                        }
                    );


                    showToast(
                        "Election updated successfully."
                    );


                } else {

                    /* ======================
                       CREATE
                       ====================== */

                    await apiRequest(
                        "/api/admin/elections",
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    electionData
                                )
                        }
                    );


                    showToast(
                        "Election created successfully."
                    );

                }


                closeModal(
                    electionModal
                );


                electionForm.reset();


                if (editingElectionId) {

                    editingElectionId.value =
                        "";

                }


                /*
                 * Reload directly from MongoDB.
                 */

                await loadElections();


            } catch (error) {

                console.error(
                    "Save Election Error:",
                    error
                );


                showToast(
                    error.message ||
                    "Unable to save election.",
                    false
                );


            } finally {

                setButtonLoading(
                    submitButton,
                    false
                );

            }

        }
    );


    /* ==========================================================
       BUTTON LOADING
       ========================================================== */

    function setButtonLoading(
        button,
        loading
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            button.dataset.originalText =
                button.innerHTML;

            button.disabled =
                true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;

        } else {

            button.disabled =
                false;


            if (
                button.dataset.originalText
            ) {

                button.innerHTML =
                    button.dataset.originalText;

            }

        }

    }


    /* ==========================================================
       ROW EVENTS
       ========================================================== */

    function attachRowEvents(row) {

        const id =
            row.dataset.id;


        row
            .querySelector(".view-btn")
            ?.addEventListener(
                "click",
                () =>
                    viewElection(id)
            );


        row
            .querySelector(".edit-btn")
            ?.addEventListener(
                "click",
                () =>
                    editElection(id)
            );


        row
            .querySelector(".delete-btn")
            ?.addEventListener(
                "click",
                () => {

                    deleteTargetId =
                        id;

                    openModal(
                        deleteModal
                    );

                }
            );

    }


    /* ==========================================================
       FIND ELECTION
       ========================================================== */

    function findElection(id) {

        return (
            elections.find(
                election =>
                    String(
                        election._id
                    ) === String(id)
            ) || null
        );

    }


    /* ==========================================================
       VIEW ELECTION
       ========================================================== */

    function viewElection(id) {

        const election =
            findElection(id);


        if (!election) {

            showToast(
                "Election could not be found.",
                false
            );

            return;

        }


        if (viewElectionName) {

            viewElectionName.textContent =
                election.title ||
                "Election";

        }


        if (viewElectionId) {

            viewElectionId.textContent =
                shortId(
                    election._id
                );

        }


        if (viewElectionStatus) {

            const status =
                election.status ||
                "upcoming";


            viewElectionStatus.textContent =
                capitalize(status);

        }


        if (viewElectionSchedule) {

            viewElectionSchedule.textContent =
                formatFullSchedule(
                    election.startDate,
                    election.endDate
                );

        }


        if (viewCandidateCount) {

            viewCandidateCount.textContent =
                formatNumber(
                    election.candidateCount
                );

        }


        if (viewVoterCount) {

            /*
             * Current Election schema does not
             * contain an eligible voter count.
             */

            viewVoterCount.textContent =
                "—";

        }


        openModal(
            viewModal
        );

    }


    viewClose?.addEventListener(
        "click",
        () =>
            closeModal(
                viewModal
            )
    );


    viewOverlay?.addEventListener(
        "click",
        () =>
            closeModal(
                viewModal
            )
    );


    /* ==========================================================
       EDIT ELECTION
       ========================================================== */

    function editElection(id) {

        const election =
            findElection(id);


        if (!election) {

            showToast(
                "Election could not be found.",
                false
            );

            return;

        }


        editingElectionId.value =
            election._id;


        electionName.value =
            election.title || "";


        electionDescription.value =
            election.description || "";


        startDate.value =
            toDateTimeLocal(
                election.startDate
            );


        endDate.value =
            toDateTimeLocal(
                election.endDate
            );


        /*
         * These fields currently exist only
         * in the frontend design.
         */

        if (voterPool) {

            voterPool.value =
                "all";

        }


        if (resultVisibility) {

            resultVisibility.value =
                election.resultsPublished
                    ? "immediate"
                    : "after";

        }


        if (otpRequired) {

            otpRequired.checked =
                true;

        }


        modalTitle.textContent =
            "Edit Election";


        openModal(
            electionModal
        );

    }


    /* ==========================================================
       DELETE ELECTION
       ========================================================== */

    cancelDelete?.addEventListener(
        "click",
        () => {

            deleteTargetId =
                null;

            closeModal(
                deleteModal
            );

        }
    );


    deleteOverlay?.addEventListener(
        "click",
        () => {

            deleteTargetId =
                null;

            closeModal(
                deleteModal
            );

        }
    );


    confirmDelete?.addEventListener(
        "click",
        async () => {

            if (!deleteTargetId) {
                return;
            }


            const id =
                deleteTargetId;


            confirmDelete.disabled =
                true;


            try {

                await apiRequest(
                    `/api/admin/elections/${id}`,
                    {
                        method:
                            "DELETE"
                    }
                );


                deleteTargetId =
                    null;


                closeModal(
                    deleteModal
                );


                showToast(
                    "Election deleted successfully."
                );


                await loadElections();


            } catch (error) {

                console.error(
                    "Delete Election Error:",
                    error
                );


                showToast(
                    error.message ||
                    "Unable to delete election.",
                    false
                );


            } finally {

                confirmDelete.disabled =
                    false;

            }

        }
    );


    /* ==========================================================
       SEARCH + FILTER
       ========================================================== */

    function filterElections() {

        if (!tableBody) {
            return;
        }


        const search =
            electionSearch
                ?.value
                .trim()
                .toLowerCase() || "";


        const selectedStatus =
            statusFilter?.value ||
            "all";


        let visible =
            0;


        tableBody
            .querySelectorAll(
                ".election-row"
            )
            .forEach(row => {

                const text =
                    row.innerText
                        .toLowerCase();


                const status =
                    row.dataset.status;


                const matchesSearch =
                    text.includes(
                        search
                    );


                const matchesStatus =
                    selectedStatus ===
                        "all" ||
                    selectedStatus ===
                        status;


                const show =
                    matchesSearch &&
                    matchesStatus;


                row.style.display =
                    show
                        ? ""
                        : "none";


                if (show) {

                    visible++;

                }

            });


        if (emptyState) {

            emptyState.classList.toggle(
                "show",
                visible === 0
            );

        }

    }


    electionSearch?.addEventListener(
        "input",
        filterElections
    );


    statusFilter?.addEventListener(
        "change",
        filterElections
    );


    /* ==========================================================
       STATISTICS
       ========================================================== */

    function updateStatistics() {

        const active =
            elections.filter(
                election =>
                    election.status ===
                    "active"
            ).length;


        const upcoming =
            elections.filter(
                election =>
                    election.status ===
                    "upcoming"
            ).length;


        const completed =
            elections.filter(
                election =>
                    election.status ===
                    "completed"
            ).length;


        if (totalElections) {

            totalElections.textContent =
                formatNumber(
                    elections.length
                );

        }


        if (activeElections) {

            activeElections.textContent =
                formatNumber(
                    active
                );

        }


        if (upcomingElections) {

            upcomingElections.textContent =
                formatNumber(
                    upcoming
                );

        }


        if (completedElections) {

            completedElections.textContent =
                formatNumber(
                    completed
                );

        }

    }


    /* ==========================================================
       STATUS
       ========================================================== */

    function calculateStatus(
        start,
        end
    ) {

        const now =
            new Date();

        const startTime =
            new Date(start);

        const endTime =
            new Date(end);


        if (now < startTime) {

            return "upcoming";

        }


        if (
            now >= startTime &&
            now <= endTime
        ) {

            return "active";

        }


        return "completed";

    }


    function createStatusHTML(
        status
    ) {

        const icons = {

            active:
                "fa-solid fa-circle",

            upcoming:
                "fa-solid fa-clock",

            completed:
                "fa-solid fa-circle-check"

        };


        return `
            <span class="status ${escapeHTML(status)}">

                <i class="${
                    icons[status] ||
                    "fa-solid fa-circle"
                }"></i>

                ${escapeHTML(
                    capitalize(status)
                )}

            </span>
        `;

    }


    /* ==========================================================
       DATE HELPERS
       ========================================================== */

    function formatDateRange(
        start,
        end
    ) {

        const startValue =
            new Date(start);

        const endValue =
            new Date(end);


        if (
            Number.isNaN(
                startValue.getTime()
            ) ||
            Number.isNaN(
                endValue.getTime()
            )
        ) {

            return "Not scheduled";

        }


        const startText =
            startValue.toLocaleDateString(
                undefined,
                {
                    month:
                        "short",

                    day:
                        "2-digit"
                }
            );


        const endText =
            endValue.toLocaleDateString(
                undefined,
                {
                    month:
                        "short",

                    day:
                        "2-digit"
                }
            );


        return `${startText} - ${endText}`;

    }


    function formatFullSchedule(
        start,
        end
    ) {

        const startValue =
            new Date(start);

        const endValue =
            new Date(end);


        if (
            Number.isNaN(
                startValue.getTime()
            ) ||
            Number.isNaN(
                endValue.getTime()
            )
        ) {

            return "Not scheduled";

        }


        const options = {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        };


        return (
            `${startValue.toLocaleString(
                undefined,
                options
            )} — ` +
            `${endValue.toLocaleString(
                undefined,
                options
            )}`
        );

    }


    function toDateTimeLocal(
        value
    ) {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        /*
         * datetime-local requires local time,
         * not UTC ISO time.
         */

        const offset =
            date.getTimezoneOffset() *
            60000;


        return new Date(
            date.getTime() - offset
        )
            .toISOString()
            .slice(0, 16);

    }


    function getElectionYear(
        value
    ) {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return date.getFullYear();

    }


    /* ==========================================================
       ID DISPLAY
       ========================================================== */

    function shortId(id) {

        const value =
            String(id || "");


        if (!value) {

            return "—";

        }


        if (value.length <= 12) {

            return value;

        }


        return (
            value.slice(0, 6) +
            "..." +
            value.slice(-4)
        );

    }


    /* ==========================================================
       HELPERS
       ========================================================== */

    function capitalize(value) {

        const text =
            String(value || "");


        return (
            text.charAt(0)
                .toUpperCase() +
            text.slice(1)
        );

    }


    function formatNumber(value) {

        return new Intl.NumberFormat()
            .format(
                Number(value) || 0
            );

    }


    function escapeHTML(value) {

        const element =
            document.createElement(
                "div"
            );


        element.textContent =
            String(
                value ?? ""
            );


        return element.innerHTML;

    }


    /* ==========================================================
       TOAST
       ========================================================== */

    function showToast(
        message,
        success = true
    ) {

        if (
            !toast ||
            !toastText
        ) {

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
       ESCAPE KEY
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


            closeSidebar();

            closeModal(
                electionModal
            );

            closeModal(
                viewModal
            );

            closeModal(
                deleteModal
            );


            deleteTargetId =
                null;

        }
    );


    /* ==========================================================
       LOGOUT
       ========================================================== */

    logoutBtn?.addEventListener(
        "click",
        () => {

            if (
                confirm(
                    "Logout from SecureVote Admin?"
                )
            ) {

                logout(true);

            }

        }
    );


    function logout(
        redirect = true
    ) {

        clearAdminSession();


        if (redirect) {

            window.location.href =
                "admin-login.html";

        } else {

            window.location.replace(
                "admin-login.html"
            );

        }

    }


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

        localStorage.removeItem(
            "secureVoteAdminSession"
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

        sessionStorage.removeItem(
            "secureVoteAdminSession"
        );

    }


    /* ==========================================================
       INITIAL LOAD
       ========================================================== */

    loadElections();

});
