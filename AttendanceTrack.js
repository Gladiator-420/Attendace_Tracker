// attendancetrack.js
// This code finds the user's "folder" and puts the attendance data inside it.

// --- Firebase Global Variables ---
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;
let userDocRef = null;

// --- Authentication Check ---
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user.uid);
        currentUser = user;
        // CHANGE 1: Point to the user's document in the 'users' collection
        userDocRef = db.collection('users').doc(currentUser.uid);
        loadAttendanceDetails();
    } else {
        console.log("No user logged in. Redirecting...");
        window.location.href = 'login.html';
    }
});

// --- Typing Effect and Hamburger Menu (No changes here) ---
document.addEventListener("DOMContentLoaded", function () {
    var elements = ["Manage Attendance ", "Track Your Subjects"];
    var currentIndex = 0;
    var typedText = document.querySelector(".typed-text");

    function typeEffect() {
        var currentText = elements[currentIndex];
        var typingSpeed = 100;
        var deletingSpeed = 50;

        function typeChar(index) {
            if (index < currentText.length) {
                typedText.textContent += currentText.charAt(index);
                setTimeout(() => typeChar(index + 1), typingSpeed);
            } else {
                setTimeout(() => deleteChar(currentText.length), 2000);
            }
        }

        function deleteChar(index) {
            if (index > 0) {
                typedText.textContent = currentText.substring(0, index - 1);
                setTimeout(() => deleteChar(index - 1), deletingSpeed);
            } else {
                currentIndex = (currentIndex + 1) % elements.length;
                typeEffect();
            }
        }
        typeChar(0);
    }
    typeEffect();

    const toggleButton = document.querySelector('.toggle-button');
    const navLinks = document.querySelector('.nav-links');
    if (toggleButton && navLinks) {
        toggleButton.addEventListener('click', () => {
            toggleButton.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        document.addEventListener('click', (event) => {
            if (!toggleButton.contains(event.target) && !navLinks.contains(event.target)) {
                navLinks.classList.remove('active');
                toggleButton.classList.remove('active');
            }
        });
    }
});


// --- Functions for cards, buttons, etc. (No changes in most of these) ---

var undoStack = [];

function updateCard(card, presentCount, totalCount) {
    var counter = card.querySelector(".counter");
    var progressBar = card.querySelector(".progress-bar");
    var progressPercentage = card.querySelector(".progress-percentage");
    var previousState = {
        card: card,
        counterText: counter.textContent,
        progressBarWidth: progressBar.style.width,
        progressPercentageText: progressPercentage.textContent
    };
    undoStack.push(previousState);
    counter.textContent = presentCount + "/" + totalCount;
    counter.classList.add("counter-updated");
    setTimeout(() => counter.classList.remove("counter-updated"), 500);
    if (totalCount === 0) {
        progressBar.style.width = "0%";
        progressPercentage.textContent = "0%";
    } else {
        var percentage = (presentCount / totalCount) * 100;
        progressBar.style.width = percentage + "%";
        progressPercentage.textContent = percentage.toFixed(1) + "%";
    }
    saveAttendanceDetails(); // This will now save to the correct place
}

function undoChange() {
    if (undoStack.length > 0) {
        var lastState = undoStack.pop();
        var card = lastState.card;
        card.querySelector(".counter").textContent = lastState.counterText;
        card.querySelector(".progress-bar").style.width = lastState.progressBarWidth;
        card.querySelector(".progress-percentage").textContent = lastState.progressPercentageText;
        saveAttendanceDetails();
        showNotification("Undo successful!");
    } else {
        showNotification("Nothing to undo.");
    }
}

function toggleOptions(element) {
    var options = element.nextElementSibling;
    var isVisible = options.style.display === "block";

    // Toggle options visibility
    options.style.display = isVisible ? "none" : "block";

    // Toggle icon rotation
    element.classList.toggle("rotated");
}


function deleteCard(element) {
    showDeleteDialog(element.closest('.card'));
}

function addCard() {
    var container = document.getElementById("card-container");
    var newCardHTML = `
        <div class="card-options">
            <i class="fas fa-chevron-down" onclick="toggleOptions(this)"></i>
            <div class="options">
                <a href="javascript:void(0)" onclick="deleteCard(this)">Delete</a>
                <a href="javascript:void(0)" onclick="addCard(this)">Add</a>
                <a href="javascript:void(0)" onclick="openEditDialog(this)">Edit</a>
                <a href="javascript:void(0)" onclick="undoChange()">Undo</a>
            </div>
        </div>
        <h2 class="card-title">New Subject</h2>
        <div class="counter">0/0</div>
        <div class="progress-container"><div class="progress-bar" style="width: 0%;"></div></div>
        <div class="progress-percentage">0%</div>
        <button class="present-button" onclick="markPresent(this)">Present</button>
        <button class="absent-button" onclick="markAbsent(this)">Absent</button>
        <button class="reset-button" onclick="openResetDialog(this.closest('.card'))"><i class="fas fa-redo"></i></button>
    `;
    var newCard = document.createElement('div');
    newCard.className = 'card';
    newCard.innerHTML = newCardHTML;
    container.appendChild(newCard);
    saveAttendanceDetails();
    showNotification("New card added!");
}

function showNotification(message) {
    var notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function markPresent(button) {
    var card = button.closest(".card");
    var counter = card.querySelector(".counter");
    var [presentCount, totalCount] = counter.textContent.split("/").map(Number);
    presentCount++;
    totalCount++;
    updateCard(card, presentCount, totalCount);
    new Audio('mouseclick.mp3').play();
}

function markAbsent(button) {
    var card = button.closest(".card");
    var counter = card.querySelector(".counter");
    var [presentCount, totalCount] = counter.textContent.split("/").map(Number);
    totalCount++;
    updateCard(card, presentCount, totalCount);
    new Audio('mouseclick.mp3').play();
}

// Dialog functions (no changes)
let cardToEdit = null;
function openEditDialog(element) {
    cardToEdit = element.closest(".card");
    document.getElementById("edit-input").value = cardToEdit.querySelector(".card-title").textContent;
    document.getElementById("edit-dialog").style.display = "flex";
}
document.getElementById("save-button").onclick = function () {
    if (cardToEdit) {
        var newTitle = document.getElementById("edit-input").value.trim();
        if (newTitle) {
            cardToEdit.querySelector(".card-title").textContent = newTitle;
        }
        document.getElementById("edit-dialog").style.display = "none";
        saveAttendanceDetails();
    }
};
document.querySelector("#edit-dialog .edit-dialog-close").onclick = () => {
    document.getElementById("edit-dialog").style.display = "none";
};
let cardToReset = null;
function openResetDialog(card) {
    cardToReset = card;
    document.getElementById("reset-dialog").style.display = "flex";
}
document.getElementById("reset-yes").onclick = function () {
    if (cardToReset) {
        updateCard(cardToReset, 0, 0);
    }
    document.getElementById("reset-dialog").style.display = "none";
};
document.getElementById("reset-no").onclick = () => {
    document.getElementById("reset-dialog").style.display = "none";
};
let cardToDelete = null;
function showDeleteDialog(card) {
    cardToDelete = card;
    document.getElementById('delete-dialog').style.display = 'flex';
}
function closeDeleteDialog() {
    document.getElementById('delete-dialog').style.display = 'none';
}
function confirmDelete() {
    if (cardToDelete) {
        cardToDelete.remove();
        saveAttendanceDetails();
    }
    closeDeleteDialog();
}

// --- Firestore Save and Load Functions (THESE ARE THE IMPORTANT CHANGES) ---

async function saveAttendanceDetails() {
    if (!userDocRef) return;
    var cards = document.querySelectorAll(".card");
    var attendanceDetails = [];
    cards.forEach(card => {
        attendanceDetails.push({
            title: card.querySelector(".card-title").textContent,
            counter: card.querySelector(".counter").textContent,
            progressBarWidth: card.querySelector(".progress-bar").style.width,
            progressPercentage: card.querySelector(".progress-percentage").textContent
        });
    });
    try {
        // CHANGE 2: Use .update() to add/modify the 'cards' field without deleting username/email
        await userDocRef.update({ cards: attendanceDetails });
        console.log("Attendance data saved to user's document.");
    } catch (error) {
        console.error("Error saving data: ", error);
    }
}

async function loadAttendanceDetails() {
    if (!userDocRef) return;
    try {
        const doc = await userDocRef.get();
        // CHANGE 3: Check if the 'cards' field exists in the user's document
        if (doc.exists && doc.data().cards) {
            renderCards(doc.data().cards);
        } else {
            // If no cards, give the user a default set and save it
            renderCards(getInitialCards());
            await saveAttendanceDetails();
        }
    } catch (error) {
        console.error("Error loading data: ", error);
    }
}

function renderCards(cardData) {
    var container = document.getElementById("card-container");
    container.innerHTML = "";
    cardData.forEach(detail => {
        var newCard = document.createElement("div");
        newCard.classList.add("card");
        newCard.innerHTML = `
            <div class="card-options">
                <i class="fas fa-chevron-down" onclick="toggleOptions(this)"></i>
                <div class="options">
                    <a href="javascript:void(0)" onclick="deleteCard(this)">Delete</a>
                    <a href="javascript:void(0)" onclick="addCard()">Add</a>
                    <a href="javascript:void(0)" onclick="openEditDialog(this)">Edit</a>
                    <a href="javascript:void(0)" onclick="undoChange()">Undo</a>
                </div>
            </div>
            <h2 class="card-title">${detail.title}</h2>
            <div class="counter">${detail.counter}</div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${detail.progressBarWidth || '0%'}"></div>
            </div>
            <div class="progress-percentage">${detail.progressPercentage || '0%'}</div>
            <button class="present-button" onclick="markPresent(this)">Present</button>
            <button class="absent-button" onclick="markAbsent(this)">Absent</button>
            <button class="reset-button" onclick="openResetDialog(this.closest('.card'))"><i class="fas fa-redo"></i></button>
        `;
        container.appendChild(newCard);
    });
}

function getInitialCards() {
    return [
        { title: "Subject 1", counter: "0/0", progressBarWidth: "0%", progressPercentage: "0%" },
        { title: "Subject 2", counter: "0/0", progressBarWidth: "0%", progressPercentage: "0%" },
        { title: "Subject 3", counter: "0/0", progressBarWidth: "0%", progressPercentage: "0%" }
    ];
}

// --- PROFILE DROPDOWN LOGIC (No changes here) ---
document.addEventListener('DOMContentLoaded', () => {
    const profileIcon = document.getElementById('profile-icon');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from bubbling up to the document
            const isVisible = profileDropdown.style.display === 'block';
            profileDropdown.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', (event) => {
            if (!profileIcon.contains(event.target) && !profileDropdown.contains(event.target)) {
                profileDropdown.style.display = 'none';
            }
        });
    }

    const userNameElem = document.getElementById('user-name');
    const userEmailElem = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');

    auth.onAuthStateChanged(user => {
        if (user) {
            // This now correctly uses the displayName we set during registration
            userNameElem.textContent = user.displayName || "Unknown User";
            userEmailElem.textContent = user.email || "No Email";
            const welcomeUsername = document.getElementById('welcome-username');
if (welcomeUsername) {
    welcomeUsername.textContent = user.displayName || "User";
}
        }
    });

    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                alert("Logged out successfully");
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error("Logout error:", error);
            });
        });
    }
});
// --- PARALLAX BACKGROUND EFFECT ---
window.addEventListener('scroll', function () {
  const scrolled = window.scrollY;
  document.body.style.backgroundPositionY = `${-scrolled * 0.5}px`;
});
