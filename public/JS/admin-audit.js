/* ==========================================================
   SecureVote - Online Voting System
   File: js/admin-audit.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================
       ELEMENTS
    ========================================================== */

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const mobileOverlay =
        document.getElementById("mobileOverlay");

    const search =
        document.getElementById("auditSearch");

    const filter =
        document.getElementById("auditFilter");

    const emptyState =
        document.getElementById("emptyState");

    const modal =
        document.getElementById("detailsModal");

    const modalOverlay =
        document.getElementById("detailsOverlay");

    const modalClose =
        document.getElementById("detailsClose");

    const exportBtn =
        document.getElementById("exportBtn");

    const toast =
        document.getElementById("toast");

    const toastText =
        document.getElementById("toastText");

    const tableBody =
        document.querySelector(".audit-table tbody");

    const logoutBtn =
        document.getElementById("logoutBtn");


    let toastTimer;

    let auditLogs = [];


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
       MOBILE SIDEBAR
    ========================================================== */

    menuBtn?.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "open"
            );

            mobileOverlay?.classList.toggle(
                "show"
            );

        }
    );


    mobileOverlay?.addEventListener(
        "click",
        () => {

            sidebar?.classList.remove(
                "open"
            );

            mobileOverlay?.classList.remove(
                "show"
            );

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
       LOAD AUDIT LOGS
    ========================================================== */

    async function loadAuditLogs() {

        try {

            if (tableBody) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            Loading audit logs...
                        </td>
                    </tr>
                `;

            }


            const data =
                await apiRequest(
                    "/api/admin/audit-logs?limit=500"
                );


            auditLogs =
                Array.isArray(data.logs)
                    ? data.logs
                    : [];


            updateStatistics(
                data.statistics || {}
            );


            renderLogs();


        } catch (error) {

            console.error(
                "Load Audit Logs Error:",
                error
            );


            if (tableBody) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            ${escapeHTML(
                                error.message
                            )}
                        </td>
                    </tr>
                `;

            }


            showToast(
                error.message ||
                "Unable to load audit logs."
            );

        }

    }


    /* ==========================================================
       STATISTICS
    ========================================================== */

    function updateStatistics(
        statistics
    ) {

        const values =
            document.querySelectorAll(
                ".stat-card strong"
            );


        /*
         * Existing Audit HTML has four cards:
         *
         * Total
         * Success
         * Warning
         * Security
         */

        if (values[0]) {

            values[0].textContent =
                formatNumber(
                    statistics.total || 0
                );

        }


        if (values[1]) {

            values[1].textContent =
                formatNumber(
                    statistics.success || 0
                );

        }


        if (values[2]) {

            values[2].textContent =
                formatNumber(
                    statistics.warning || 0
                );

        }


        if (values[3]) {

            values[3].textContent =
                formatNumber(
                    statistics.security || 0
                );

        }

    }


    /* ==========================================================
       RENDER LOGS
    ========================================================== */

    function renderLogs() {

        if (!tableBody) {
            return;
        }


        const query =
            search?.value
                ?.toLowerCase()
                .trim() || "";


        const selectedType =
            filter?.value || "all";


        const filtered =
            auditLogs.filter(
                log => {

                    const searchable =
                        [
                            log.event,
                            log.category,
                            log.userLabel,
                            log.ipAddress,
                            log.details
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    const matchesSearch =
                        !query ||
                        searchable.includes(
                            query
                        );


                    const matchesType =
                        selectedType === "all" ||
                        log.type === selectedType;


                    return (
                        matchesSearch &&
                        matchesType
                    );

                }
            );


        tableBody.innerHTML = "";


        if (filtered.length === 0) {

            emptyState?.classList.add(
                "show"
            );

            return;

        }


        emptyState?.classList.remove(
            "show"
        );


        filtered.forEach(
            log => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.className =
                    "audit-row";


                row.dataset.id =
                    log._id || "";


                row.dataset.type =
                    log.type || "success";


                row.innerHTML = `
                    <td>

                        <div class="event-info">

                            <span class="event-icon ${escapeHTML(
                                log.type || "success"
                            )}">
                                <i class="${getEventIcon(
                                    log.type
                                )}"></i>
                            </span>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        log.event ||
                                        "Audit Event"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        log.category ||
                                        "System"
                                    )}
                                </span>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${escapeHTML(
                            log.userLabel ||
                            "System"
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            formatIpAddress(
                                log.ipAddress
                            )
                        )}
                    </td>


                    <td>

                        <span class="audit-status ${escapeHTML(
                            log.type ||
                            "success"
                        )}">

                            ${capitalize(
                                log.type ||
                                "success"
                            )}

                        </span>

                    </td>


                    <td>
                        ${escapeHTML(
                            formatDateTime(
                                log.createdAt
                            )
                        )}
                    </td>


                    <td>

                        <button
                            class="details-btn"
                            type="button"
                            title="View event details"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </button>

                    </td>
                `;


                row
                    .querySelector(
                        ".details-btn"
                    )
                    ?.addEventListener(
                        "click",
                        () =>
                            openDetails(
                                log._id
                            )
                    );


                tableBody.appendChild(
                    row
                );

            }
        );

    }


    /* ==========================================================
       SEARCH + FILTER
    ========================================================== */

    search?.addEventListener(
        "input",
        renderLogs
    );


    filter?.addEventListener(
        "change",
        renderLogs
    );


    /* ==========================================================
       EVENT DETAILS
    ========================================================== */

    async function openDetails(
        logId
    ) {

        if (!logId) {
            return;
        }


        try {

            const data =
                await apiRequest(
                    `/api/admin/audit-logs/${encodeURIComponent(
                        logId
                    )}`
                );


            const log =
                data.log;


            if (!log) {

                throw new Error(
                    "Audit event not found"
                );

            }


            const detailTitle =
                document.getElementById(
                    "detailTitle"
                );

            const detailText =
                document.getElementById(
                    "detailText"
                );

            const eventHash =
                document.getElementById(
                    "eventHash"
                );


            if (detailTitle) {

                detailTitle.textContent =
                    log.event ||
                    "Audit Event";

            }


            if (detailText) {

                detailText.textContent =
                    log.details ||
                    "No additional details available.";

            }


            /*
             * REAL backend-generated integrity hash.
             * No more DEMO hash generation.
             */

            if (eventHash) {

                eventHash.textContent =
                    log.integrityHash ||
                    "Unavailable";

            }


            updateOptionalDetail(
                "detailCategory",
                log.category
            );

            updateOptionalDetail(
                "detailUser",
                log.userLabel
            );

            updateOptionalDetail(
                "detailIp",
                formatIpAddress(
                    log.ipAddress
                )
            );

            updateOptionalDetail(
                "detailDate",
                formatDateTime(
                    log.createdAt
                )
            );

            updateOptionalDetail(
                "detailUserAgent",
                log.userAgent
            );


            modal?.classList.add(
                "show"
            );


            document.body.classList.add(
                "modal-open"
            );


        } catch (error) {

            console.error(
                "Audit Detail Error:",
                error
            );


            showToast(
                error.message ||
                "Unable to load audit event."
            );

        }

    }


    function updateOptionalDetail(
        id,
        value
    ) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value || "—";

        }

    }


    /* ==========================================================
       CLOSE DETAILS MODAL
    ========================================================== */

    function closeModal() {

        modal?.classList.remove(
            "show"
        );


        document.body.classList.remove(
            "modal-open"
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
       EXPORT CSV
    ========================================================== */

    exportBtn?.addEventListener(
        "click",
        () => {

            if (
                auditLogs.length === 0
            ) {

                showToast(
                    "No audit logs available to export."
                );

                return;

            }


            const rows = [

                [
                    "Event",
                    "Category",
                    "User",
                    "IP Address",
                    "Type",
                    "Details",
                    "Integrity Hash",
                    "Date & Time"
                ]

            ];


            auditLogs.forEach(
                log => {

                    rows.push([

                        log.event || "",

                        log.category || "",

                        log.userLabel ||
                        "System",

                        formatIpAddress(
                            log.ipAddress
                        ),

                        log.type || "",

                        log.details || "",

                        log.integrityHash || "",

                        formatDateTime(
                            log.createdAt
                        )

                    ]);

                }
            );


            const csv =
                rows
                    .map(
                        row =>
                            row
                                .map(
                                    value =>
                                        `"${String(
                                            value
                                        ).replace(
                                            /"/g,
                                            '""'
                                        )}"`
                                )
                                .join(",")
                    )
                    .join("\n");


            const blob =
                new Blob(
                    [csv],
                    {
                        type:
                            "text/csv;charset=utf-8;"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href = url;


            link.download =
                `securevote-audit-logs-${
                    new Date()
                        .toISOString()
                        .slice(0, 10)
                }.csv`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );


            showToast(
                "Audit logs exported."
            );

        }
    );


    /* ==========================================================
       HELPERS
    ========================================================== */

    function getEventIcon(
        type
    ) {

        switch (type) {

            case "security":

                return "fa-solid fa-shield-halved";


            case "warning":

                return "fa-solid fa-triangle-exclamation";


            default:

                return "fa-solid fa-circle-check";

        }

    }


    function formatDateTime(
        value
    ) {

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


        return date.toLocaleString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function formatIpAddress(
        value
    ) {

        if (!value) {
            return "Unknown";
        }


        /*
         * Node/Express on localhost may return:
         *
         * ::1
         *
         * or:
         *
         * ::ffff:127.0.0.1
         */

        if (
            value === "::1"
        ) {

            return "127.0.0.1";

        }


        return String(value)
            .replace(
                "::ffff:",
                ""
            );

    }


    function formatNumber(
        value
    ) {

        return new Intl.NumberFormat()
            .format(
                Number(value) || 0
            );

    }


    function capitalize(
        value
    ) {

        const text =
            String(
                value || ""
            );


        return (
            text.charAt(0)
                .toUpperCase() +
            text.slice(1)
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
       TOAST
    ========================================================== */

    function showToast(
        message
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


        toast.classList.add(
            "show"
        );


        toastTimer =
            setTimeout(
                () =>
                    toast.classList.remove(
                        "show"
                    ),
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
                event.key !== "Escape"
            ) {

                return;

            }


            closeModal();


            sidebar?.classList.remove(
                "open"
            );


            mobileOverlay?.classList.remove(
                "show"
            );

        }
    );


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

    loadAuditLogs();

});