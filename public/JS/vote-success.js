/* ==========================================================
   SecureVote
   File: js/vote-success.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const electionName =
        document.getElementById("electionName");

    const receiptElection =
        document.getElementById("receiptElection");

    const voteTime =
        document.getElementById("voteTime");

    const receiptId =
        document.getElementById("receiptId");

    const copyReceiptBtn =
        document.getElementById("copyReceiptBtn");

    const toast =
        document.getElementById("toast");


    /* ==========================================================
       GET ELECTION ID
       ========================================================== */

    const params =
        new URLSearchParams(window.location.search);

    const electionId =
        params.get("election") || "1";


    /* ==========================================================
       ELECTION DATA
       ========================================================== */

    const elections = {

        "1": "Student Council Election 2026",

        "2": "Computer Science Representative"

    };

    const currentElection =
        elections[electionId] ||
        "SecureVote Election";


    /* ==========================================================
       DISPLAY ELECTION
       ========================================================== */

    if (electionName) {

        electionName.textContent =
            currentElection;

    }

    if (receiptElection) {

        receiptElection.textContent =
            currentElection;

    }


    /* ==========================================================
       LOAD VOTE RECEIPT
       ========================================================== */

    function loadVoteReceipt() {

        try {

            const votes = JSON.parse(
                localStorage.getItem(
                    "secureVoteVotes"
                ) || "{}"
            );

            const vote =
                votes[electionId];


            if (!vote) {

                /*
                 * User reached this page without
                 * completing a vote.
                 */

                alert(
                    "No voting receipt was found for this election."
                );

                window.location.href =
                    "elections.html";

                return;

            }


            /* Receipt ID */

            if (receiptId) {

                receiptId.textContent =
                    vote.receipt ||
                    "Receipt unavailable";

            }


            /* Vote timestamp */

            if (voteTime) {

                const date =
                    new Date(vote.timestamp);

                voteTime.textContent =
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

        } catch (error) {

            console.error(
                "Unable to load voting receipt.",
                error
            );

        }

    }

    loadVoteReceipt();


    /* ==========================================================
       COPY RECEIPT
       ========================================================== */

    copyReceiptBtn?.addEventListener(
        "click",
        async () => {

            const receipt =
                receiptId.textContent.trim();

            if (!receipt) {
                return;
            }

            try {

                await navigator.clipboard.writeText(
                    receipt
                );

                showToast();

            } catch (error) {

                /*
                 * Clipboard fallback for browsers
                 * that block Clipboard API.
                 */

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

        textarea.style.position = "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        try {

            document.execCommand("copy");

            showToast();

        } catch (error) {

            alert(
                "Unable to copy receipt automatically."
            );

        }

        textarea.remove();

    }


    /* ==========================================================
       TOAST
       ========================================================== */

    let toastTimer;

    function showToast() {

        clearTimeout(toastTimer);

        toast.classList.add("show");

        toastTimer = setTimeout(() => {

            toast.classList.remove("show");

        }, 2200);

    }


    /* ==========================================================
       PROTECT CANDIDATE PRIVACY
       ========================================================== */

    /*
     * Notice that this page intentionally does NOT
     * display:
     *
     * - Candidate ID
     * - Candidate name
     * - Candidate party
     *
     * The receipt confirms participation only.
     *
     * In the real backend implementation, the
     * participation/audit record and encrypted ballot
     * will be stored separately.
     */


    /* ==========================================================
       PREVENT ACCIDENTAL BACK NAVIGATION
       ========================================================== */

    history.replaceState(
        null,
        "",
        window.location.href
    );

});