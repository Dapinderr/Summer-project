/* ==========================================================
   SecureVote
   File: js/history.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const historySearch = document.getElementById("historySearch");
    const historyFilter = document.getElementById("historyFilter");
    const historyCards = document.querySelectorAll(".history-card");

    const recordCount = document.getElementById("recordCount");
    const emptyState = document.getElementById("emptyState");

    const totalParticipated = document.getElementById("totalParticipated");
    const votesRecorded = document.getElementById("votesRecorded");
    const verifiedRecords = document.getElementById("verifiedRecords");

    const receiptModal = document.getElementById("receiptModal");
    const modalOverlay = document.getElementById("modalOverlay");
    const modalClose = document.getElementById("modalClose");
    const modalDone = document.getElementById("modalDone");

    const modalElection = document.getElementById("modalElection");
    const modalDate = document.getElementById("modalDate");
    const modalReceipt = document.getElementById("modalReceipt");

    const receiptButtons = document.querySelectorAll(".receipt-btn");
    const copyReceiptBtn = document.getElementById("copyReceiptBtn");

    const toast = document.getElementById("toast");


    /* ==========================================================
       MOBILE SIDEBAR
       ========================================================== */

    menuBtn?.addEventListener("click", event => {

        event.stopPropagation();

        sidebar?.classList.toggle("open");

    });


    document.addEventListener("click", event => {

        if (
            window.innerWidth <= 850 &&
            sidebar?.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {

            sidebar.classList.remove("open");

        }

    });


    /* ==========================================================
       LOAD USER
       ========================================================== */

    function loadUser() {

        try {

            const user = JSON.parse(
                localStorage.getItem("secureVoteUser") || "{}"
            );

            const userName = document.getElementById("userName");

            if (userName) {

                const name =
                    user.fullName || "Voter";

                userName.textContent =
                    name.split(" ")[0];

            }

        } catch (error) {

            console.error(
                "Unable to load user information.",
                error
            );

        }

    }

    loadUser();


    /* ==========================================================
       LOAD LATEST LOCAL DEMO VOTE
       ========================================================== */

    function loadLatestVote() {

        try {

            const votes = JSON.parse(
                localStorage.getItem("secureVoteVotes") || "{}"
            );

            const voteEntries =
                Object.entries(votes);


            if (voteEntries.length === 0) {
                return;
            }


            voteEntries.sort((a, b) => {

                const dateA =
                    new Date(a[1].timestamp || 0);

                const dateB =
                    new Date(b[1].timestamp || 0);

                return dateB - dateA;

            });


            const latestVote =
                voteEntries[0][1];


            const latestReceipt =
                document.getElementById("latestReceipt");


            if (
                latestReceipt &&
                latestVote.receipt
            ) {

                latestReceipt.textContent =
                    latestVote.receipt;

            }


            /*
             * Update the first receipt button so the
             * modal displays the real demo receipt.
             */

            const firstReceiptButton =
                document.querySelector(".receipt-btn");


            if (firstReceiptButton) {

                if (latestVote.receipt) {

                    firstReceiptButton.dataset.receipt =
                        latestVote.receipt;

                }


                if (latestVote.timestamp) {

                    const date =
                        new Date(latestVote.timestamp);

                    firstReceiptButton.dataset.date =
                        date.toLocaleString(
                            undefined,
                            {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        );

                }

            }

        } catch (error) {

            console.error(
                "Unable to load voting history.",
                error
            );

        }

    }

    loadLatestVote();


    /* ==========================================================
       UPDATE STATISTICS
       ========================================================== */

    function updateStatistics() {

        const total =
            historyCards.length;


        if (totalParticipated) {

            totalParticipated.textContent =
                total;

        }


        if (votesRecorded) {

            votesRecorded.textContent =
                total;

        }


        if (verifiedRecords) {

            verifiedRecords.textContent =
                total;

        }

    }

    updateStatistics();


    /* ==========================================================
       SEARCH + FILTER
       ========================================================== */

    function filterHistory() {

        const searchValue =
            historySearch?.value
                .trim()
                .toLowerCase() || "";


        const filterValue =
            historyFilter?.value || "all";


        let visibleCount = 0;


        historyCards.forEach(card => {

            const cardText =
                card.textContent.toLowerCase();

            const status =
                card.dataset.status || "";


            const matchesSearch =
                cardText.includes(searchValue);


            const matchesFilter =
                filterValue === "all" ||
                status === filterValue;


            if (
                matchesSearch &&
                matchesFilter
            ) {

                card.classList.remove("hidden");

                visibleCount++;

            } else {

                card.classList.add("hidden");

            }

        });


        /* Update count */

        if (recordCount) {

            recordCount.textContent =
                `${visibleCount} ${
                    visibleCount === 1
                        ? "Record"
                        : "Records"
                }`;

        }


        /* Empty state */

        if (visibleCount === 0) {

            if (emptyState) {

                emptyState.style.display =
                    "block";

            }

        } else {

            if (emptyState) {

                emptyState.style.display =
                    "none";

            }

        }

    }


    historySearch?.addEventListener(
        "input",
        filterHistory
    );


    historyFilter?.addEventListener(
        "change",
        filterHistory
    );


    /* ==========================================================
       RECEIPT MODAL
       ========================================================== */

    function openReceiptModal(button) {

        const election =
            button.dataset.election ||
            "Election";

        const date =
            button.dataset.date ||
            "-";

        const receipt =
            button.dataset.receipt ||
            "-";


        if (modalElection) {

            modalElection.textContent =
                election;

        }


        if (modalDate) {

            modalDate.textContent =
                date;

        }


        if (modalReceipt) {

            modalReceipt.textContent =
                receipt;

        }


        receiptModal?.classList.add("show");

        document.body.style.overflow =
            "hidden";

    }


    function closeReceiptModal() {

        receiptModal?.classList.remove("show");

        document.body.style.overflow =
            "";

    }


    receiptButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openReceiptModal(button);

            }
        );

    });


    modalClose?.addEventListener(
        "click",
        closeReceiptModal
    );


    modalDone?.addEventListener(
        "click",
        closeReceiptModal
    );


    modalOverlay?.addEventListener(
        "click",
        closeReceiptModal
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                receiptModal?.classList.contains("show")
            ) {

                closeReceiptModal();

            }

        }
    );


    /* ==========================================================
       COPY RECEIPT
       ========================================================== */

    copyReceiptBtn?.addEventListener(
        "click",
        async () => {

            const receipt =
                modalReceipt?.textContent.trim();


            if (
                !receipt ||
                receipt === "-"
            ) {

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    receipt
                );

                showToast();

            } catch (error) {

                fallbackCopy(receipt);

            }

        }
    );


    /* ==========================================================
       FALLBACK COPY
       ========================================================== */

    function fallbackCopy(text) {

        const textarea =
            document.createElement("textarea");


        textarea.value = text;

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand("copy");

            showToast();

        } catch (error) {

            alert(
                "Unable to copy the receipt."
            );

        }


        textarea.remove();

    }


    /* ==========================================================
       TOAST
       ========================================================== */

    let toastTimer;


    function showToast() {

        if (!toast) {
            return;
        }


        clearTimeout(toastTimer);


        toast.classList.add("show");


        toastTimer =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 2200);

    }


    /* ==========================================================
       CARD ENTRY ANIMATION
       ========================================================== */

    historyCards.forEach(
        (card, index) => {

            card.style.opacity = "0";

            card.style.transform =
                "translateY(15px)";


            card.style.transition =
                "opacity .5s ease, transform .5s ease";


            setTimeout(() => {

                card.style.opacity = "1";

                card.style.transform =
                    "translateY(0)";

            }, 100 + index * 100);

        }
    );


    /* ==========================================================
       LOGOUT
       ========================================================== */

    logoutBtn?.addEventListener(
        "click",
        () => {

            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {
                return;
            }


            localStorage.removeItem(
                "secureVoteAuth"
            );


            window.location.href =
                "login.html";

        }
    );


    /* ==========================================================
       SECURITY NOTE
       ========================================================== */

    /*
     * FRONTEND PROTOTYPE ONLY
     *
     * A production voting system should retrieve
     * participation history from the authenticated
     * backend.
     *
     * The backend should NOT return the voter's
     * candidate choice as part of participation
     * history.
     *
     * Identity/audit information and encrypted
     * ballots should be separated appropriately.
     */

});