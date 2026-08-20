const API_URL = "/api/auth";

/* ==============================
   TOKEN
============================== */

function saveAuth(data) {

    localStorage.setItem(
        "secureVoteToken",
        data.token
    );

    localStorage.setItem(
        "secureVoteUser",
        JSON.stringify(data.user)
    );
}


/* ==============================
   REGISTER
============================== */

async function registerUser(
    name,
    email,
    password
) {

    try {

        const response = await fetch(
            `${API_URL}/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Registration failed"
            );
        }

        saveAuth(data);

        return {
            success: true,
            data
        };

    } catch (error) {

        return {
            success: false,
            message: error.message
        };
    }
}


/* ==============================
   LOGIN
============================== */

async function loginUser(
    email,
    password
) {

    try {

        const response = await fetch(
            `${API_URL}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Login failed"
            );
        }

        saveAuth(data);

        return {
            success: true,
            data
        };

    } catch (error) {

        return {
            success: false,
            message: error.message
        };
    }
}


/* ==============================
   GET CURRENT USER
============================== */

async function getCurrentUser() {

    const token =
        localStorage.getItem(
            "secureVoteToken"
        );

    if (!token) {
        return null;
    }

    try {

        const response = await fetch(
            `${API_URL}/me`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            logoutUser();

            return null;
        }

        const data =
            await response.json();

        return data.user;

    } catch (error) {

        console.error(error);

        return null;
    }
}


/* ==============================
   LOGOUT
============================== */

function logoutUser() {

    localStorage.removeItem(
        "secureVoteToken"
    );

    localStorage.removeItem(
        "secureVoteUser"
    );

    location.href =
        "login.html";
}