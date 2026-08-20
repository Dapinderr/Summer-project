/* ==========================================================
   SecureVote
   File: public/js/admin-candidates.js
   Real MongoDB Candidate Management
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ================= ELEMENTS ================= */

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const overlay =
        document.getElementById("mobileOverlay");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const sidebarAdminEmail =
        document.getElementById("sidebarAdminEmail");


    /* ================= CANDIDATE FORM ================= */

    const addBtn =
        document.getElementById("addCandidateBtn");

    const modal =
        document.getElementById("candidateModal");

    const modalOverlay =
        document.getElementById("modalOverlay");

    const modalClose =
        document.getElementById("modalClose");

    const cancelBtn =
        document.getElementById("cancelBtn");

    const form =
        document.getElementById("candidateForm");

    const modalTitle =
        document.getElementById("modalTitle");

    const editingId =
        document.getElementById("editingCandidateId");

    const nameInput =
        document.getElementById("candidateName");

    const positionInput =
        document.getElementById("candidatePosition");

    const electionInput =
        document.getElementById("candidateElection");

    const manifestoInput =
        document.getElementById("candidateManifesto");

    const statusInput =
        document.getElementById("candidateStatus");

    const saveCandidateBtn =
        document.getElementById("saveCandidateBtn");


    /* ================= DIRECTORY ================= */

    const searchInput =
        document.getElementById("candidateSearch");

    const filter =
        document.getElementById("candidateFilter");

    const grid =
        document.getElementById("candidateGrid");

    const emptyState =
        document.getElementById("emptyState");


    /* ================= STATS ================= */

    const totalCandidates =
        document.getElementById("totalCandidates");

    const approvedCandidates =
        document.getElementById("approvedCandidates");

    const pendingCandidates =
        document.getElementById("pendingCandidates");

    const activeElections =
        document.getElementById("activeElections");


    /* ================= VIEW MODAL ================= */

    const viewModal =
        document.getElementById("viewModal");

    const viewOverlay =
        document.getElementById("viewOverlay");

    const viewClose =
        document.getElementById("viewClose");


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

    let candidates = [];

    let elections = [];

    let deleteTargetId = null;

    let toastTimer;


    /* ==========================================================
       ADMIN TOKEN
    ========================================================== */

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


    /* ==========================================================
       ADMIN USER
    ========================================================== */

    function getAdminUser() {

        const raw =
            localStorage.getItem(
                "secureVoteAdminUser"
            ) ||
            sessionStorage.getItem(
                "secureVoteAdminUser"
            );


        if (!raw) {
            return null;
        }


        try {

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "Invalid admin user:",
                error
            );

            return null;

        }

    }


    /* ==========================================================
       AUTH CHECK
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
            sidebarAdminEmail &&
            user?.email
        ) {

            sidebarAdminEmail.textContent =
                user.email;

        }

    }


    loadAdmin();


    /* ==========================================================
       API REQUEST
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
       LOAD ALL DATA
    ========================================================== */

    async function loadPageData() {

        try {

            await Promise.all([

                loadElections(),

                loadCandidates()

            ]);

        } catch (error) {

            console.error(
                "Candidate Page Load Error:",
                error
            );

        }

    }


    /* ==========================================================
       LOAD ELECTIONS
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


            populateElectionDropdown();

            updateStatistics();


        } catch (error) {

            elections = [];

            populateElectionDropdown();

            updateStatistics();


            console.error(
                "Load Elections Error:",
                error
            );


            showToast(
                error.message ||
                "Unable to load elections.",
                false
            );

        }

    }


    /* ==========================================================
       ELECTION DROPDOWN
    ========================================================== */

    function populateElectionDropdown() {

        if (!electionInput) {
            return;
        }


        const currentValue =
            electionInput.value;


        electionInput.innerHTML = `
            <option value="">
                Select election
            </option>
        `;


        elections.forEach(
            election => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    election._id;


                option.textContent =
                    `${election.title} (${capitalize(
                        election.status || "upcoming"
                    )})`;


                electionInput.appendChild(
                    option
                );

            }
        );


        if (
            currentValue &&
            elections.some(
                election =>
                    String(election._id) ===
                    String(currentValue)
            )
        ) {

            electionInput.value =
                currentValue;

        }

    }


    /* ==========================================================
       LOAD CANDIDATES
       GET /api/admin/candidates
    ========================================================== */

    async function loadCandidates() {

        try {

            const data =
                await apiRequest(
                    "/api/admin/candidates"
                );


            candidates =
                Array.isArray(data.candidates)
                    ? data.candidates
                    : [];


            renderCandidates();

            updateStatistics();


        } catch (error) {

            candidates = [];

            renderCandidates();

            updateStatistics();


            console.error(
                "Load Candidates Error:",
                error
            );


            showToast(
                error.message ||
                "Unable to load candidates.",
                false
            );

        }

    }


    /* ==========================================================
       RENDER CANDIDATES
    ========================================================== */

    function renderCandidates() {

        if (!grid) {
            return;
        }


        grid.innerHTML = "";


        candidates.forEach(
            candidate => {

                grid.appendChild(
                    createCandidateCard(
                        candidate
                    )
                );

            }
        );


        filterCandidates();

    }


    /* ==========================================================
       CREATE CANDIDATE CARD
    ========================================================== */

    function createCandidateCard(
        candidate
    ) {

        const card =
            document.createElement(
                "article"
            );


        const id =
            String(
                candidate._id || ""
            );


        const status =
            candidate.isActive
                ? "approved"
                : "pending";


        const electionName =
            getElectionName(
                candidate.election
            );


        card.className =
            "candidate-card";

        card.dataset.id =
            id;

        card.dataset.status =
            status;


        card.innerHTML = `

            <div class="candidate-header">

                <div class="candidate-avatar">

                    ${escapeHTML(
                        getInitials(
                            candidate.name
                        )
                    )}

                </div>


                <span class="status ${status}">

                    <i class="fa-solid ${
                        status === "approved"
                            ? "fa-circle-check"
                            : "fa-clock"
                    }"></i>

                    ${capitalize(status)}

                </span>

            </div>


            <h3>
                ${escapeHTML(
                    candidate.name ||
                    "Candidate"
                )}
            </h3>


            <span class="candidate-id">

                ${escapeHTML(
                    shortId(id)
                )}

            </span>


            <p class="position">

                ${escapeHTML(
                    candidate.position ||
                    "Candidate"
                )}

            </p>


            <div class="candidate-election">

                <i class="fa-solid fa-box-ballot"></i>

                ${escapeHTML(
                    electionName
                )}

            </div>


            <p class="manifesto">

                ${escapeHTML(
                    candidate.manifesto ||
                    "No manifesto provided."
                )}

            </p>


            <div class="candidate-actions">

                <button
                    type="button"
                    class="view-btn"
                >

                    <i class="fa-solid fa-eye"></i>

                    View

                </button>


                <button
                    type="button"
                    class="edit-btn"
                    title="Edit candidate"
                >

                    <i class="fa-solid fa-pen"></i>

                </button>


                <button
                    type="button"
                    class="delete-btn"
                    title="Delete candidate"
                >

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        `;


        attachCardEvents(
            card
        );


        return card;

    }


    /* ==========================================================
       CARD EVENTS
    ========================================================== */

    function attachCardEvents(
        card
    ) {

        const id =
            card.dataset.id;


        card
            .querySelector(
                ".view-btn"
            )
            ?.addEventListener(
                "click",
                () =>
                    viewCandidate(id)
            );


        card
            .querySelector(
                ".edit-btn"
            )
            ?.addEventListener(
                "click",
                () =>
                    editCandidate(id)
            );


        card
            .querySelector(
                ".delete-btn"
            )
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
       FIND CANDIDATE
    ========================================================== */

    function findCandidate(id) {

        return (
            candidates.find(
                candidate =>
                    String(
                        candidate._id
                    ) === String(id)
            ) || null
        );

    }


    /* ==========================================================
       ADD CANDIDATE MODAL
    ========================================================== */

    addBtn?.addEventListener(
        "click",
        () => {

            form?.reset();


            if (editingId) {

                editingId.value =
                    "";

            }


            if (modalTitle) {

                modalTitle.textContent =
                    "Add Candidate";

            }


            if (statusInput) {

                statusInput.value =
                    "pending";

            }


            populateElectionDropdown();


            openModal(
                modal
            );


            setTimeout(
                () =>
                    nameInput?.focus(),
                100
            );

        }
    );


    /* ==========================================================
       ?action=add
    ========================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );


    if (
        params.get("action") ===
        "add"
    ) {

        setTimeout(
            () =>
                addBtn?.click(),
            250
        );

    }


    /* ==========================================================
       SAVE CANDIDATE
    ========================================================== */

    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                nameInput.value.trim();

            const position =
                positionInput.value.trim();

            const electionId =
                electionInput.value;

            const manifesto =
                manifestoInput.value.trim();

            const status =
                statusInput.value;


            if (
                !name ||
                !position ||
                !electionId
            ) {

                showToast(
                    "Complete all required fields.",
                    false
                );

                return;

            }


            const id =
                editingId
                    ?.value
                    .trim();


            const candidateData = {

                name,

                position,

                manifesto,

                isActive:
                    status === "approved"

            };


            setButtonLoading(
                saveCandidateBtn,
                true
            );


            try {

                if (id) {

                    /* =====================
                       UPDATE CANDIDATE
                    ===================== */

                    await apiRequest(
                        `/api/admin/candidates/${id}`,
                        {
                            method:
                                "PUT",

                            body:
                                JSON.stringify(
                                    candidateData
                                )
                        }
                    );


                    showToast(
                        "Candidate updated successfully."
                    );


                } else {

                    /* =====================
                       ADD CANDIDATE
                    ===================== */

                    await apiRequest(
                        `/api/admin/elections/${electionId}/candidates`,
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    candidateData
                                )
                        }
                    );


                    showToast(
                        "Candidate added successfully."
                    );

                }


                closeModal(
                    modal
                );


                form.reset();


                if (editingId) {

                    editingId.value =
                        "";

                }


                await loadCandidates();


                /*
                 * Reload elections because
                 * candidateCount has changed.
                 */

                await loadElections();


            } catch (error) {

                console.error(
                    "Save Candidate Error:",
                    error
                );


                showToast(
                    error.message ||
                    "Unable to save candidate.",
                    false
                );


            } finally {

                setButtonLoading(
                    saveCandidateBtn,
                    false
                );

            }

        }
    );


    /* ==========================================================
       EDIT CANDIDATE
    ========================================================== */

    function editCandidate(id) {

        const candidate =
            findCandidate(id);


        if (!candidate) {

            showToast(
                "Candidate could not be found.",
                false
            );

            return;

        }


        editingId.value =
            candidate._id;


        nameInput.value =
            candidate.name || "";


        positionInput.value =
            candidate.position || "";


        manifestoInput.value =
            candidate.manifesto || "";


        statusInput.value =
            candidate.isActive
                ? "approved"
                : "pending";


        populateElectionDropdown();


        electionInput.value =
            getElectionId(
                candidate.election
            );


        /*
         * Election cannot currently be
         * changed through updateCandidate.
         */

        electionInput.disabled =
            true;


        modalTitle.textContent =
            "Edit Candidate";


        openModal(
            modal
        );

    }


    /* ==========================================================
       VIEW CANDIDATE
    ========================================================== */

    function viewCandidate(id) {

        const candidate =
            findCandidate(id);


        if (!candidate) {

            showToast(
                "Candidate could not be found.",
                false
            );

            return;

        }


        const status =
            candidate.isActive
                ? "approved"
                : "pending";


        const viewAvatar =
            document.getElementById(
                "viewAvatar"
            );

        const viewName =
            document.getElementById(
                "viewName"
            );

        const viewPosition =
            document.getElementById(
                "viewPosition"
            );

        const viewId =
            document.getElementById(
                "viewId"
            );

        const viewElection =
            document.getElementById(
                "viewElection"
            );

        const viewStatus =
            document.getElementById(
                "viewStatus"
            );

        const viewManifesto =
            document.getElementById(
                "viewManifesto"
            );


        if (viewAvatar) {

            viewAvatar.textContent =
                getInitials(
                    candidate.name
                );

        }


        if (viewName) {

            viewName.textContent =
                candidate.name ||
                "Candidate";

        }


        if (viewPosition) {

            viewPosition.textContent =
                candidate.position ||
                "—";

        }


        if (viewId) {

            viewId.textContent =
                shortId(
                    candidate._id
                );

        }


        if (viewElection) {

            viewElection.textContent =
                getElectionName(
                    candidate.election
                );

        }


        if (viewStatus) {

            viewStatus.textContent =
                capitalize(status);

        }


        if (viewManifesto) {

            viewManifesto.textContent =
                candidate.manifesto ||
                "No manifesto provided.";

        }


        openModal(
            viewModal
        );

    }


    /* ==========================================================
       DELETE CANDIDATE
    ========================================================== */

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
                    `/api/admin/candidates/${id}`,
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
                    "Candidate deleted successfully."
                );


                await loadCandidates();

                await loadElections();


            } catch (error) {

                console.error(
                    "Delete Candidate Error:",
                    error
                );


                showToast(
                    error.message ||
                    "Unable to delete candidate.",
                    false
                );


            } finally {

                confirmDelete.disabled =
                    false;

            }

        }
    );


    /* ==========================================================
       CANCEL DELETE
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


    /* ==========================================================
       CLOSE MODALS
    ========================================================== */

    modalClose?.addEventListener(
        "click",
        () => {

            resetCandidateModal();

            closeModal(
                modal
            );

        }
    );


    cancelBtn?.addEventListener(
        "click",
        () => {

            resetCandidateModal();

            closeModal(
                modal
            );

        }
    );


    modalOverlay?.addEventListener(
        "click",
        () => {

            resetCandidateModal();

            closeModal(
                modal
            );

        }
    );


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
       RESET CANDIDATE MODAL
    ========================================================== */

    function resetCandidateModal() {

        if (form) {

            form.reset();

        }


        if (editingId) {

            editingId.value =
                "";

        }


        if (electionInput) {

            electionInput.disabled =
                false;

        }


        if (modalTitle) {

            modalTitle.textContent =
                "Add Candidate";

        }

    }


    /* ==========================================================
       MODAL HELPERS
    ========================================================== */

    function openModal(element) {

        if (!element) {
            return;
        }


        element.classList.add(
            "show"
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    function closeModal(element) {

        if (!element) {
            return;
        }


        element.classList.remove(
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
       SEARCH + FILTER
    ========================================================== */

    function filterCandidates() {

        if (!grid) {
            return;
        }


        const search =
            searchInput
                ?.value
                .trim()
                .toLowerCase() || "";


        const selected =
            filter?.value ||
            "all";


        let visible =
            0;


        grid
            .querySelectorAll(
                ".candidate-card"
            )
            .forEach(
                card => {

                    const text =
                        card.innerText
                            .toLowerCase();


                    const matchesSearch =
                        text.includes(
                            search
                        );


                    const matchesStatus =
                        selected === "all" ||
                        card.dataset.status ===
                            selected;


                    const show =
                        matchesSearch &&
                        matchesStatus;


                    card.style.display =
                        show
                            ? ""
                            : "none";


                    if (show) {

                        visible++;

                    }

                }
            );


        if (emptyState) {

            emptyState.classList.toggle(
                "show",
                visible === 0
            );

        }

    }


    searchInput?.addEventListener(
        "input",
        filterCandidates
    );


    filter?.addEventListener(
        "change",
        filterCandidates
    );


    /* ==========================================================
       STATISTICS
    ========================================================== */

    function updateStatistics() {

        const approved =
            candidates.filter(
                candidate =>
                    candidate.isActive ===
                    true
            ).length;


        const pending =
            candidates.length -
            approved;


        const activeElectionCount =
            elections.filter(
                election =>
                    election.status ===
                    "active"
            ).length;


        if (totalCandidates) {

            totalCandidates.textContent =
                formatNumber(
                    candidates.length
                );

        }


        if (approvedCandidates) {

            approvedCandidates.textContent =
                formatNumber(
                    approved
                );

        }


        if (pendingCandidates) {

            pendingCandidates.textContent =
                formatNumber(
                    pending
                );

        }


        if (activeElections) {

            activeElections.textContent =
                formatNumber(
                    activeElectionCount
                );

        }

    }


    /* ==========================================================
       ELECTION HELPERS
    ========================================================== */

    function getElectionId(
        election
    ) {

        if (!election) {
            return "";
        }


        if (
            typeof election ===
            "object"
        ) {

            return String(
                election._id || ""
            );

        }


        return String(
            election
        );

    }


    function getElectionName(
        election
    ) {

        if (!election) {

            return "Unknown Election";

        }


        if (
            typeof election ===
            "object"
        ) {

            return (
                election.title ||
                "Unknown Election"
            );

        }


        const found =
            elections.find(
                item =>
                    String(item._id) ===
                    String(election)
            );


        return (
            found?.title ||
            "Unknown Election"
        );

    }


    /* ==========================================================
       INITIALS
    ========================================================== */

    function getInitials(name) {

        return String(
            name || "C"
        )
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word.charAt(0)
                        .toUpperCase()
            )
            .join("");

    }


    /* ==========================================================
       SHORT ID
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

    function capitalize(text) {

        const value =
            String(text || "");


        return (
            value.charAt(0)
                .toUpperCase() +
            value.slice(1)
        );

    }


    function formatNumber(value) {

        return new Intl.NumberFormat()
            .format(
                Number(value) || 0
            );

    }


    function escapeHTML(value) {

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
       SIDEBAR
    ========================================================== */

    function closeSidebar() {

        sidebar?.classList.remove(
            "open"
        );


        overlay?.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";

    }


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
        closeSidebar
    );


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


            resetCandidateModal();


            closeModal(
                modal
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

    loadPageData();

});