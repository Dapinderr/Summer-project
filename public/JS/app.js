/* ==========================================================
   SecureVote
   File: js/app.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ============================
    // Navbar Shadow on Scroll
    // ============================

    const header = document.querySelector("header");

    window.addEventListener("scroll", () => {

        if (window.scrollY > 40) {

            header.style.boxShadow = "0 8px 25px rgba(0,0,0,.12)";

        } else {

            header.style.boxShadow = "0 2px 12px rgba(0,0,0,.08)";

        }

    });

    // ============================
    // Smooth Scroll
    // ============================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            const target = document.querySelector(this.getAttribute("href"));

            if (!target) return;

            e.preventDefault();

            target.scrollIntoView({

                behavior: "smooth"

            });

        });

    });

    // ============================
    // Progress Bar Animation
    // ============================

    const progress = document.querySelector(".progress-fill");

    if (progress) {

        progress.style.width = "0%";

        setTimeout(() => {

            progress.style.transition = "width 2s ease";

            progress.style.width = "75%";

        }, 400);

    }

    // ============================
    // Fade Animation
    // ============================

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";

            }

        });

    }, {

        threshold: 0.15

    });

    document.querySelectorAll(".feature-card,.glass-card,.hero-left,.hero-right").forEach(el => {

        el.style.opacity = "0";
        el.style.transform = "translateY(40px)";
        el.style.transition = ".8s ease";

        observer.observe(el);

    });

    // ============================
    // Counter Animation
    // ============================

    function animateValue(element, end, duration) {

        let start = 0;

        const increment = end / (duration / 20);

        const timer = setInterval(() => {

            start += increment;

            if (start >= end) {

                start = end;

                clearInterval(timer);

            }

            element.textContent = Math.floor(start);

        }, 20);

    }

    document.querySelectorAll("[data-count]").forEach(counter => {

        animateValue(

            counter,

            parseInt(counter.dataset.count),

            1800

        );

    });

    // ============================
    // Hero Buttons Ripple Effect
    // ============================

    document.querySelectorAll(".primary-btn,.secondary-btn,.btn").forEach(button => {

        button.addEventListener("click", function (e) {

            const ripple = document.createElement("span");

            const rect = this.getBoundingClientRect();

            const size = Math.max(rect.width, rect.height);

            ripple.style.width = ripple.style.height = size + "px";

            ripple.style.left = e.clientX - rect.left - size / 2 + "px";

            ripple.style.top = e.clientY - rect.top - size / 2 + "px";

            ripple.className = "ripple";

            this.appendChild(ripple);

            setTimeout(() => {

                ripple.remove();

            }, 600);

        });

    });

    // ============================
    // Active Navigation
    // ============================

    const current = location.pathname.split("/").pop();

    document.querySelectorAll(".nav-links a").forEach(link => {

        const href = link.getAttribute("href");

        if (href === current) {

            link.classList.add("active");

        }

    });

});