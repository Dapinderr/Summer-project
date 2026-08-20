/* ==========================================================
   SecureVote
   File: js/vote.js
   REAL BACKEND VOTING
   ========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    /* ======================================================
       ELEMENTS
    ====================================================== */

    const confirmVote =
        document.getElementById("confirmVote");

    const submitVoteBtn =
        document.getElementById("submitVoteBtn");

    const modal =
        document.getElementById("confirmationModal");

    const modalOverlay =
        document.getElementById("confirmationOverlay");

    const modalClose =
        document.getElementById("confirmationClose");

    const cancelVoteBtn =
        document.getElementById("cancelVoteBtn");

    const finalVoteBtn =
        document.getElementById("finalVoteBtn");

    const processingScreen =
        document.getElementById("processingScreen");

    const processingText =
        document.getElementById("processingText");

    const encryptStep =
        document.getElementById("encryptStep");

    const verifyStep =
        document.getElementById("verifyStep");

    const recordStep =
        document.getElementById("recordStep");

    const candidateName =
        document.getElementById("candidateName");

    const candidateParty =
        document.getElementById("candidateParty");

    const confirmCandidateName =
        document.getElementById(
            "confirmCandidateName"
        );


    /* ======================================================
       TOKEN
    ====================================================== */

    const token =
        localStorage.getItem("secureVoteToken") ||
        sessionStorage.getItem("secureVoteToken");


    if (!token) {

        clearSession();

        location.replace("login.html");

        return;

    }


    /* ======================================================
       URL PARAMETERS

       These MUST now be real MongoDB ObjectIds.
    ====================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const candidateId =
        params.get("candidate");


    const electionId =
        params.get("election");


    if (!candidateId || !electionId) {

        alert(
            "Election or candidate information is missing."
        );

        location.replace("elections.html");

        return;

    }


    /* ======================================================
       CHANGE CANDIDATE LINKS
    ====================================================== */

    const changeButton =
        document.querySelector(".change-btn");


    if (changeButton) {

        changeButton.href =
            `election-details.html?id=${encodeURIComponent(
                electionId
            )}`;

    }


    const logo =
        document.querySelector(".logo");


    if (logo) {

        logo.href =
            `election-details.html?id=${encodeURIComponent(
                electionId
            )}`;

    }


    /* ======================================================
       API HELPER
    ====================================================== */

    async function apiRequest(
        url,
        options = {}
    ) {

        const headers = {

            Accept:
                "application/json",

            Authorization:
                `Bearer ${token}`,

            ...(options.headers || {})

        };


        if (options.body) {

            headers["Content-Type"] =
                "application/json";

        }


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
            response.status === 401
        ) {

            clearSession();

            location.replace(
                "login.html"
            );

            throw new Error(
                "Your login session has expired."
            );

        }


        if (!response.ok) {

            const error =
                new Error(
                    data.message ||
                    "Unable to complete request."
                );


            error.status =
                response.status;


            error.data =
                data;


            throw error;

        }


        return data;

    }


    /* ======================================================
       LOAD REAL ELECTION + CANDIDATE
    ====================================================== */

    async function loadVoteDetails() {

        try {

            submitVoteBtn.disabled =
                true;


            /* ==============================================
               LOAD ELECTION
            ============================================== */

            const electionData =
                await apiRequest(
                    `/api/elections/${encodeURIComponent(
                        electionId
                    )}`
                );


            const election =
                electionData.election;


            if (!election) {

                throw new Error(
                    "Election not found."
                );

            }


            /* ==============================================
               ELECTION TITLE
            ============================================== */

            const electionLabel =
                document.querySelector(
                    ".election-label"
                );


            if (electionLabel) {

                electionLabel.innerHTML = `

                    <i class="fa-solid fa-box-ballot"></i>

                    ${escapeHTML(
                        election.title ||
                        "Election"
                    )}

                `;

            }


            /* ==============================================
               FIND REAL CANDIDATE
            ============================================== */

            let candidates =
                Array.isArray(
                    election.candidates
                )
                    ? election.candidates
                    : [];


            /*
             * If the single-election response
             * doesn't contain candidates,
             * load candidate endpoint.
             */

            if (
                candidates.length === 0
            ) {

                const candidateData =
                    await apiRequest(
                        `/api/elections/${encodeURIComponent(
                            electionId
                        )}/candidates`
                    );


                candidates =
                    Array.isArray(
                        candidateData.candidates
                    )
                        ? candidateData.candidates
                        : [];

            }


            const selectedCandidate =
                candidates.find(
                    candidate =>
                        String(
                            candidate._id ||
                            candidate.id
                        ) ===
                        String(candidateId)
                );


            if (!selectedCandidate) {

                throw new Error(
                    "Selected candidate was not found in this election."
                );

            }


            /* ==============================================
               DISPLAY REAL CANDIDATE
            ============================================== */

            const name =
                selectedCandidate.name ||
                "Candidate";


            const party =
                selectedCandidate.party ||
                selectedCandidate.position ||
                "Independent";


            candidateName.textContent =
                name;


            candidateParty.textContent =
                party;


            confirmCandidateName.textContent =
                name;


            /* ==============================================
               CANDIDATE TAGS
            ============================================== */

            const tagContainer =
                document.querySelector(
                    ".candidate-tags"
                );


            if (tagContainer) {

                tagContainer.innerHTML =
                    "";


                /*
                 * Your Candidate model may not have
                 * the old static tags, so show real
                 * information instead.
                 */

                const values = [];


                if (selectedCandidate.position) {

                    values.push(
                        selectedCandidate.position
                    );

                }


                if (selectedCandidate.party) {

                    values.push(
                        selectedCandidate.party
                    );

                }


                if (values.length === 0) {

                    values.push(
                        "Registered Candidate"
                    );

                }


                values.forEach(
                    value => {

                        const span =
                            document.createElement(
                                "span"
                            );


                        span.textContent =
                            value;


                        tagContainer.appendChild(
                            span
                        );

                    }
                );

            }


            /* ==============================================
               CHECK EXISTING REAL VOTE
            ============================================== */

            const voteStatus =
                await apiRequest(
                    `/api/votes/status/${encodeURIComponent(
                        electionId
                    )}`
                );


            if (
                voteStatus.hasVoted === true
            ) {

                alert(
                    "You have already voted in this election."
                );


                location.replace(
                    `election-details.html?id=${encodeURIComponent(
                        electionId
                    )}`
                );


                return;

            }


            /*
             * Page is ready.
             * Button remains disabled until checkbox.
             */

            submitVoteBtn.disabled =
                !confirmVote.checked;


        } catch (error) {

            console.error(
                "Vote Details Error:",
                error
            );


            alert(
                error.message ||
                "Unable to load voting information."
            );


            location.replace(
                `election-details.html?id=${encodeURIComponent(
                    electionId
                )}`
            );

        }

    }


    /* ======================================================
       CHECKBOX
    ====================================================== */

    confirmVote?.addEventListener(
        "change",
        () => {

            submitVoteBtn.disabled =
                !confirmVote.checked;

        }
    );


    /* ======================================================
       OPEN MODAL
    ====================================================== */

    submitVoteBtn?.addEventListener(
        "click",
        () => {

            if (
                !confirmVote.checked
            ) {

                return;

            }


            modal.classList.add(
                "show"
            );


            document.body.style.overflow =
                "hidden";

        }
    );


    /* ======================================================
       CLOSE MODAL
    ====================================================== */

    function closeModal() {

        modal?.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";

    }


    modalClose?.addEventListener(
        "click",
        closeModal
    );


    modalOverlay?.addEventListener(
        "click",
        closeModal
    );


    cancelVoteBtn?.addEventListener(
        "click",
        closeModal
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal?.classList.contains(
                    "show"
                )
            ) {

                closeModal();

            }

        }
    );


    /* ======================================================
       PROCESSING HELPERS
    ====================================================== */

    function setStepActive(
        element
    ) {

        if (!element) {
            return;
        }


        const text =
            element.textContent.trim();


        element.classList.add(
            "active"
        );


        element.innerHTML = `

            <i class="fa-solid fa-circle-notch fa-spin"></i>

            ${escapeHTML(text)}

        `;

    }


    function setStepComplete(
        element
    ) {

        if (!element) {
            return;
        }


        const text =
            element.textContent.trim();


        element.classList.remove(
            "active"
        );


        element.classList.add(
            "complete"
        );


        element.innerHTML = `

            <i class="fa-solid fa-circle-check"></i>

            ${escapeHTML(text)}

        `;

    }


    function resetProcessingSteps() {

        if (encryptStep) {

            encryptStep.classList.remove(
                "active",
                "complete"
            );

            encryptStep.innerHTML = `

                <i class="fa-regular fa-circle"></i>

                Encrypting vote

            `;

        }


        if (verifyStep) {

            verifyStep.classList.remove(
                "active",
                "complete"
            );

            verifyStep.innerHTML = `

                <i class="fa-regular fa-circle"></i>

                Verifying ballot

            `;

        }


        if (recordStep) {

            recordStep.classList.remove(
                "active",
                "complete"
            );

            recordStep.innerHTML = `

                <i class="fa-regular fa-circle"></i>

                Recording vote

            `;

        }

    }


    /* ======================================================
       REAL VOTE SUBMISSION
    ====================================================== */

    let submittingVote = false;


    finalVoteBtn?.addEventListener(
        "click",
        async () => {

            /*
             * Prevent double-click requests.
             */

            if (submittingVote) {

                return;

            }


            submittingVote =
                true;


            finalVoteBtn.disabled =
                true;


            closeModal();


            resetProcessingSteps();


            processingScreen?.classList.add(
                "show"
            );


            try {

                /* ==========================================
                   STEP 1
                ========================================== */

                processingText.textContent =
                    "Preparing secure ballot...";


                setStepActive(
                    encryptStep
                );


                await delay(500);


                setStepComplete(
                    encryptStep
                );


                /* ==========================================
                   STEP 2
                ========================================== */

                processingText.textContent =
                    "Verifying voter eligibility...";


                setStepActive(
                    verifyStep
                );


                /*
                 * Real backend duplicate check.
                 */

                const status =
                    await apiRequest(
                        `/api/votes/status/${encodeURIComponent(
                            electionId
                        )}`
                    );


                if (
                    status.hasVoted === true
                ) {

                    throw Object.assign(
                        new Error(
                            "You have already voted in this election."
                        ),
                        {
                            status:
                                409
                        }
                    );

                }


                setStepComplete(
                    verifyStep
                );


                /* ==========================================
                   STEP 3
                ========================================== */

                processingText.textContent =
                    "Recording vote in SecureVote...";


                setStepActive(
                    recordStep
                );


                /*
                 * THIS IS THE IMPORTANT PART.
                 *
                 * The old version never called
                 * the backend.
                 */

                const result =
                    await apiRequest(
                        "/api/votes",
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify({

                                    electionId:
                                        electionId,

                                    candidateId:
                                        candidateId

                                })

                        }
                    );


                if (
                    result.success !== true
                ) {

                    throw new Error(
                        result.message ||
                        "Vote could not be recorded."
                    );

                }


                setStepComplete(
                    recordStep
                );


                processingText.textContent =
                    "Vote recorded successfully.";


                /*
                 * Save receipt only.
                 *
                 * This is NOT used as the actual ballot.
                 * MongoDB is now the source of truth.
                 */

                if (result.receipt) {

                    sessionStorage.setItem(
                        "secureVoteLastReceipt",
                        JSON.stringify(
                            result.receipt
                        )
                    );

                }


                await delay(700);


                /* ==========================================
                   SUCCESS
                ========================================== */

                location.replace(
                    `vote-success.html?election=${encodeURIComponent(
                        electionId
                    )}`
                );


            } catch (error) {

                console.error(
                    "Cast Vote Error:",
                    error
                );


                processingScreen?.classList.remove(
                    "show"
                );


                document.body.style.overflow =
                    "";


                submittingVote =
                    false;


                finalVoteBtn.disabled =
                    false;


                /*
                 * Backend duplicate protection.
                 */

                if (
                    error.status === 409
                ) {

                    alert(
                        "You have already voted in this election."
                    );


                    location.replace(
                        `election-details.html?id=${encodeURIComponent(
                            electionId
                        )}`
                    );


                    return;

                }


                alert(
                    error.message ||
                    "Your vote could not be recorded. Please try again."
                );

            }

        }
    );


    /* ======================================================
       HELPERS
    ====================================================== */

    function delay(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
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


    function clearSession() {

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
       START
    ====================================================== */

    await loadVoteDetails();

});