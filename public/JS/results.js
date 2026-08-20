/* ==========================================================
   SecureVote
   File: js/results.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const searchInput = document.getElementById("resultSearch");
    const resultFilter = document.getElementById("resultFilter");

    const resultItems = document.querySelectorAll(".result-item");
    const resultGrid = document.getElementById("resultGrid");
    const emptyState = document.getElementById("emptyState");

    const modal = document.getElementById("resultModal");
    const modalOverlay = document.getElementById("modalOverlay");
    const modalClose = document.getElementById("modalClose");
    const modalDone = document.getElementById("modalDone");

    const modalElection = document.getElementById("modalElection");
    const modalWinner = document.getElementById("modalWinner");
    const modalVotes = document.getElementById("modalVotes");
    const modalTurnout = document.getElementById("modalTurnout");

    const detailButtons = document.querySelectorAll(".details-btn");


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

            const name = user.fullName || "Voter";

            const userName = document.getElementById("userName");

            if (userName) {

                userName.textContent =
                    name.split(" ")[0];

            }

        } catch (error) {

            console.error(
                "Unable to load user information."
            );

        }

    }

    loadUser();


    /* ==========================================================
       ANIMATE RESULT BARS
       ========================================================== */

    function animateResultBars() {

        const bars = document.querySelectorAll(".bar-fill");

        bars.forEach((bar, index) => {

            const targetWidth =
                bar.dataset.width || "0";

            bar.style.width = "0%";

            setTimeout(() => {

                bar.style.width =
                    `${targetWidth}%`;

            }, 250 + index * 150);

        });

    }

    animateResultBars();


    /* ==========================================================
       SEARCH + FILTER RESULTS
       ========================================================== */

    function filterResults() {

        const searchValue =
            searchInput?.value
                .trim()
                .toLowerCase() || "";

        const filterValue =
            resultFilter?.value || "all";

        let visibleCards = 0;


        resultItems.forEach(item => {

            const text =
                item.textContent.toLowerCase();

            const status =
                item.dataset.status || "";

            const matchesSearch =
                text.includes(searchValue);

            const matchesFilter =
                filterValue === "all" ||
                status === filterValue;


            if (matchesSearch && matchesFilter) {

                item.classList.remove("hidden");

                visibleCards++;

            } else {

                item.classList.add("hidden");

            }

        });


        /*
         * Empty state applies mainly to the smaller
         * result cards section.
         */

        const visibleGridCards =
            resultGrid?.querySelectorAll(
                ".result-card:not(.hidden)"
            ).length || 0;


        if (visibleGridCards === 0) {

            if (resultGrid) {
                resultGrid.style.display = "none";
            }

            if (emptyState) {
                emptyState.style.display = "block";
            }

        } else {

            if (resultGrid) {
                resultGrid.style.display = "grid";
            }

            if (emptyState) {
                emptyState.style.display = "none";
            }

        }

    }


    searchInput?.addEventListener(
        "input",
        filterResults
    );


    resultFilter?.addEventListener(
        "change",
        filterResults
    );


    /* ==========================================================
       RESULT DETAILS MODAL
       ========================================================== */

    function openResultModal(button) {

        const election =
            button.dataset.election || "Election";

        const winner =
            button.dataset.winner || "-";

        const votes =
            button.dataset.votes || "-";

        const turnout =
            button.dataset.turnout || "-";


        modalElection.textContent = election;

        modalWinner.textContent = winner;

        modalVotes.textContent = votes;

        modalTurnout.textContent = turnout;


        modal.classList.add("show");

        document.body.style.overflow = "hidden";

    }


    function closeResultModal() {

        modal?.classList.remove("show");

        document.body.style.overflow = "";

    }


    detailButtons.forEach(button => {

        button.addEventListener("click", () => {

            openResultModal(button);

        });

    });


    modalClose?.addEventListener(
        "click",
        closeResultModal
    );


    modalDone?.addEventListener(
        "click",
        closeResultModal
    );


    modalOverlay?.addEventListener(
        "click",
        closeResultModal
    );


    document.addEventListener("keydown", event => {

        if (
            event.key === "Escape" &&
            modal?.classList.contains("show")
        ) {

            closeResultModal();

        }

    });


    /* ==========================================================
       RESULT CARD ANIMATION
       ========================================================== */

    const resultCards =
        document.querySelectorAll(".result-card");

    resultCards.forEach((card, index) => {

        card.style.opacity = "0";

        card.style.transform =
            "translateY(20px)";

        card.style.transition =
            "opacity .5s ease, transform .5s ease";


        setTimeout(() => {

            card.style.opacity = "1";

            card.style.transform =
                "translateY(0)";

        }, 150 + index * 100);

    });


    /* ==========================================================
       FEATURED RESULT ANIMATION
       ========================================================== */

    const featuredResult =
        document.querySelector(".featured-result");

    if (featuredResult) {

        featuredResult.style.opacity = "0";

        featuredResult.style.transform =
            "translateY(20px)";

        featuredResult.style.transition =
            "opacity .6s ease, transform .6s ease";


        setTimeout(() => {

            featuredResult.style.opacity = "1";

            featuredResult.style.transform =
                "translateY(0)";

        }, 150);

    }


    /* ==========================================================
       LOGOUT
       ========================================================== */

    logoutBtn?.addEventListener("click", () => {

        const confirmLogout = confirm(
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

    });

});