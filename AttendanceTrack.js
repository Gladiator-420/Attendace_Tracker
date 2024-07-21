document.addEventListener("DOMContentLoaded", function() {
    var elements = ["Manage Attendance ", "Track Your Subjects"];
    var currentIndex = 0;
    var typedText = document.querySelector(".typed-text");
    var cursor = document.querySelector(".cursor");
    
    function typeEffect() {
        var currentText = elements[currentIndex];
        var typingSpeed = 100;
        var deletingSpeed = 50;

        function typeChar(index) {
            if (index < currentText.length) {
                typedText.textContent += currentText.charAt(index);
                setTimeout(function() {
                    typeChar(index + 1);
                }, typingSpeed);
            } else {
                setTimeout(function() {
                    deleteChar(index - 1);
                }, 2000);
            }
        }

        function deleteChar(index) {
            if (index >= 0) {
                typedText.textContent = currentText.substring(0, index);
                setTimeout(function() {
                    deleteChar(index - 1);
                }, deletingSpeed);
            } else {
                currentIndex = (currentIndex + 1) % elements.length;
                typeEffect();
            }
        }

        typeChar(0);
    }

    typeEffect();

    // Load attendance details from localStorage
    loadAttendanceDetails();

    // Stack to store recent changes for undo functionality
    var undoStack = [];

    // Function to update card and push change to undo stack
    function updateCard(card, presentCount, totalCount) {
        var counter = card.querySelector(".counter");
        var progressBar = card.querySelector(".progress-bar");
        var progressPercentage = card.querySelector(".progress-percentage");

        // Prepare undo information
        var previousState = {
            card: card,
            counterText: counter.textContent,
            progressBarWidth: progressBar.style.width,
            progressPercentageText: progressPercentage.textContent
        };

        // Push previous state to undo stack
        undoStack.push(previousState);

        // Update card with new values
        counter.textContent = presentCount + "/" + totalCount;
        counter.classList.add("counter-updated");
        setTimeout(function() {
            counter.classList.remove("counter-updated");
        }, 500); // Duration should match the animation duration

        if (totalCount === 0) {
            progressBar.style.width = "0%";
            progressPercentage.textContent = "0%";
        } else {
            var percentage = (presentCount / totalCount) * 100;
            progressBar.style.width = percentage + "%";
            progressPercentage.textContent = percentage.toFixed(1) + "%";
        }

        saveAttendanceDetails(); // Save details after updating a card
    }

    // Function to undo the last card update
    function undoChange() {
        if (undoStack.length > 0) {
            var lastState = undoStack.pop();
            updateCard(lastState.card, lastState.counterText, lastState.progressBarWidth, lastState.progressPercentageText);
        } else {
            alert("Nothing to undo.");
        }
    }

    // Bind undo button to undoChange function
    document.getElementById("undo-button").addEventListener("click", undoChange);
});

function toggleOptions(element) {
    var options = element.nextElementSibling;
    if (options.style.display === "block") {
        options.style.display = "none";
        element.classList.remove("rotated");
    } else {
        options.style.display = "block";
        element.classList.add("rotated");
    }

    // Close toggle arrow if clicked outside
    document.addEventListener('click', function(event) {
        if (!element.contains(event.target) && !options.contains(event.target)) {
            options.style.display = 'none';
            element.classList.remove('rotated');
        }
    });
}

function deleteCard(element) {
    showDeleteDialog(element.closest('.card'));
}

function addCard() {
    var container = document.getElementById("card-container");
    var newCard = container.firstElementChild.cloneNode(true);
    newCard.querySelector(".card-title").textContent = "New Subject";
    newCard.querySelector(".counter").textContent = "0/0";
    newCard.querySelector(".progress-bar").style.width = "0%";
    newCard.querySelector(".progress-percentage").textContent = "0%";
    container.appendChild(newCard);

    saveAttendanceDetails(); // Save details after adding a card

    // Show notification
    showNotification("New card added!!!");
}

function showNotification(message) {
    var notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
        notification.remove();
    }, 3000); // Remove notification after 3 seconds
}

function editCard(element) {
    openEditDialog(element);
}

function markPresent(button) {
    var card = button.closest(".card");
    var counter = card.querySelector(".counter");
    var counterValues = counter.textContent.split("/");
    var presentCount = parseInt(counterValues[0]);
    var totalCount = parseInt(counterValues[1]);

    presentCount++;
    totalCount++;

    updateCard(card, presentCount, totalCount);
    var presentSound = new Audio('mouseclick.mp3');
    presentSound.volume = 0.2; // Adjust volume (0.0 to 1.0)

    presentSound.play();

}
function markAbsent(button) {
    var card = button.closest(".card");
    var counter = card.querySelector(".counter");
    var counterValues = counter.textContent.split("/");
    var presentCount = parseInt(counterValues[0]);
    var totalCount = parseInt(counterValues[1]);

    totalCount++;

    updateCard(card, presentCount, totalCount);
    var presentSound = new Audio('mouseclick.mp3');
    presentSound.volume = 0.2; // Adjust volume (0.0 to 1.0)

    presentSound.play();



}

function updateCard(card, presentCount, totalCount) {
    var counter = card.querySelector(".counter");
    var progressBar = card.querySelector(".progress-bar");
    var progressPercentage = card.querySelector(".progress-percentage");

    counter.textContent = presentCount + "/" + totalCount;
    counter.classList.add("counter-updated");
    setTimeout(function() {
        counter.classList.remove("counter-updated");
    }, 500); // Duration should match the animation duration

    if (totalCount === 0) {
        progressBar.style.width = "0%";
        progressPercentage.textContent = "0%";
    } else {
        var percentage = (presentCount / totalCount) * 100;
        progressBar.style.width = percentage + "%";
        progressPercentage.textContent = percentage.toFixed(1) + "%";
    }

    saveAttendanceDetails(); // Save details after updating a card
}

function openEditDialog(element) {
    var card = element.closest(".card");
    var cardTitle = card.querySelector(".card-title");
    var editInput = document.getElementById("edit-input");
    editInput.value = cardTitle.textContent;

    var editDialog = document.getElementById("edit-dialog");
    editDialog.style.display = "flex";

    // Restore button click handler
    document.getElementById("restore-button").onclick = function() {
        cardTitle.textContent = "New Subject";
        var counter = card.querySelector(".counter");
        counter.textContent = "0/0";
        var progressBar = card.querySelector(".progress-bar");
        progressBar.style.width = "0%";
        var progressPercentage = card.querySelector(".progress-percentage");
        progressPercentage.textContent = "0%";

        editDialog.style.display = "none";
        saveAttendanceDetails(); // Save details after restoring a card
        showNotification( " Subject restored successfully.");

    };
 
    // Save button click handler remains unchanged
    document.getElementById("save-button").onclick = function() {
        var newTitle = editInput.value.trim();
        if (newTitle !== "") {
            cardTitle.textContent = newTitle;
        }
        editDialog.style.display = "none";
        saveAttendanceDetails(); // Save details after editing a card title
    };
}


// Close edit dialog
document.querySelectorAll(".edit-dialog-close").forEach(function(closeBtn) {
    closeBtn.addEventListener("click", function() {
        document.getElementById("edit-dialog").style.display = "none";
    });
});

document.addEventListener("DOMContentLoaded", function() {
    // Reset button event listener
    document.querySelectorAll(".reset-button").forEach(function(button) {
        button.addEventListener("click", function() {
            var card = button.closest(".card");
            openResetDialog(card);
        });
    });

    // Reset confirmation (Yes) button event listener
    document.getElementById("reset-yes").addEventListener("click", function() {
        var cardToReset = document.getElementById("reset-dialog").cardToReset;
        if (cardToReset) {
            resetCounter(cardToReset);
        }
        closeResetDialog();
        saveAttendanceDetails(); // Save details after resetting a card
    });

    // Reset confirmation (No) button event listener
    document.getElementById("reset-no").addEventListener("click", function() {
        closeResetDialog();
    });

    // Reset dialog close button event listener
    document.getElementById("reset-dialog-close").addEventListener("click", function() {
        closeResetDialog();
    });
});

function openResetDialog(card) {
    var resetDialog = document.getElementById("reset-dialog");
    resetDialog.style.display = "flex";
    resetDialog.cardToReset = card;
}

function closeResetDialog() {
    var resetDialog = document.getElementById("reset-dialog");
    resetDialog.style.display = "none";
    resetDialog.cardToReset = null;
}

function resetCounter(card) {
    // Reset counter logic
    var counter = card.querySelector(".counter");
    counter.textContent = "0/0";
    var progressBar = card.querySelector(".progress-bar");
    progressBar.style.width = "0%";
    var progressPercentage = card.querySelector(".progress-percentage");
    progressPercentage.textContent = "0%";
}

// Functions to handle delete dialog
let cardToDelete = null; // Variable to hold the card to be deleted

function showDeleteDialog(card) {
    cardToDelete = card;
    document.getElementById('delete-dialog').style.display = 'flex';
}

function closeDeleteDialog() {
    cardToDelete = null;
    document.getElementById('delete-dialog').style.display = 'none';
}

function confirmDelete() {
    if (cardToDelete) {
        cardToDelete.remove();
    }
    closeDeleteDialog();
    saveAttendanceDetails(); // Save details after deleting a card
}

function deleteCard(element) {
    showDeleteDialog(element.closest('.card'));
}

// Save attendance details to localStorage
function saveAttendanceDetails() {
    var cards = document.querySelectorAll(".card");
    var attendanceDetails = [];

    cards.forEach(function(card) {
        var title = card.querySelector(".card-title").textContent;
        var counter = card.querySelector(".counter").textContent;
        var progressBarWidth = card.querySelector(".progress-bar").style.width;
        var progressPercentage = card.querySelector(".progress-percentage").textContent;

        attendanceDetails.push({
            title: title,
            counter: counter,
            progressBarWidth: progressBarWidth,
            progressPercentage: progressPercentage
        });
    });

    localStorage.setItem("attendanceDetails", JSON.stringify(attendanceDetails));
}

// Load attendance details from localStorage
function loadAttendanceDetails() {
    var attendanceDetails = JSON.parse(localStorage.getItem("attendanceDetails"));
    if (attendanceDetails && attendanceDetails.length > 0) {
        var container = document.getElementById("card-container");
        container.innerHTML = ""; // Clear existing cards

        attendanceDetails.forEach(function(detail, index) {
            var newCard = document.createElement("div");
            newCard.classList.add("card");
            newCard.setAttribute('data-card-id', 'subject' + (index + 1)); // Assign unique ID for each card

            newCard.innerHTML = `
                <div class="card-options">
                    <i class="fas fa-chevron-down" onclick="toggleOptions(this)"></i>
                    <div class="options">
                        <a href="javascript:void(0)" onclick="deleteCard(this)">Delete</a>
                        <a href="javascript:void(0)" onclick="addCard(this)">Add</a>
                        <a href="javascript:void(0)" onclick="openEditDialog(this)">Edit</a>
                        <a href="javascript:void(0)" onclick="undoChange(1)">Undo</a> <!-- Adjust as needed -->
                    </div>
                </div>
                <h2 class="card-title">${detail.title}</h2>
                <div class="counter">${detail.counter}</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${detail.progressBarWidth}"></div>
                </div>
                <div class="progress-percentage">${detail.progressPercentage}</div>
                <button class="present-button" onclick="markPresent(this)">Present</button>
                <button class="absent-button" onclick="markAbsent(this)">Absent</button>
                <button class="reset-button" onclick="openResetDialog(this.closest('.card'))">
                    <i class="fas fa-redo"></i>
                </button>
            `;

            container.appendChild(newCard);
        });
    }
}

window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    document.body.style.backgroundPosition = `center ${-scrollPosition * 0.5}px`;
});
 // Stack to store recent changes for undo functionality
 var undoStack = [];

 // Function to update card and push change to undo stack
 function updateCard(card, presentCount, totalCount) {
     var counter = card.querySelector(".counter");
     var progressBar = card.querySelector(".progress-bar");
     var progressPercentage = card.querySelector(".progress-percentage");

     // Prepare undo information
     var previousState = {
         card: card,
         counterText: counter.textContent,
         progressBarWidth: progressBar.style.width,
         progressPercentageText: progressPercentage.textContent
     };

     // Push previous state to undo stack
     undoStack.push(previousState);

     // Update card with new values
     counter.textContent = presentCount + "/" + totalCount;
     counter.classList.add("counter-updated");
     setTimeout(function () {
         counter.classList.remove("counter-updated");
     }, 500); // Duration should match the animation duration

     if (totalCount === 0) {
         progressBar.style.width = "0%";
         progressPercentage.textContent = "0%";
     } else {
         var percentage = (presentCount / totalCount) * 100;
         progressBar.style.width = percentage + "%";
         progressPercentage.textContent = percentage.toFixed(1) + "%";
     }

     saveAttendanceDetails(); // Save details after updating a card
 }

 // Function to undo the last few card updates
 function undoChange(steps = 1) {
     for (let i = 0; i < steps; i++) {
         if (undoStack.length > 0) {
             var lastState = undoStack.pop();
             var card = lastState.card;
             var counter = card.querySelector(".counter");
             var progressBar = card.querySelector(".progress-bar");
             var progressPercentage = card.querySelector(".progress-percentage");

             counter.textContent = lastState.counterText;
             progressBar.style.width = lastState.progressBarWidth;
             progressPercentage.textContent = lastState.progressPercentageText;
         } else {
             alert("Nothing to undo.");
             break;
         }
     }
 }

 // Bind undo button to undoChange function
 function restoreCards() {
    var initialData = {
        subject1: {
            title: "Subject 1",
            counter: "0/0",
            progressPercentage: "0%",
        },
        subject2: {
            title: "Subject 2",
            counter: "0/0",
            progressPercentage: "0%",
        },
        subject3: {
            title: "Subject 3",
            counter: "0/0",
            progressPercentage: "0%",
        }
        // Add more subjects as necessary
    };

    var container = document.getElementById("card-container");
    container.innerHTML = ""; // Clear existing cards

    // Add initial cards from initialData
    Object.keys(initialData).forEach(function(cardId, index) {
        var initialCardData = initialData[cardId];

        var newCard = document.createElement("div");
        newCard.classList.add("card");
        newCard.setAttribute('data-card-id', cardId);

        newCard.innerHTML = `
            <div class="card-options">
                <i class="fas fa-chevron-down" onclick="toggleOptions(this)"></i>
                <div class="options">
                    <a href="javascript:void(0)" onclick="deleteCard(this)">Delete</a>
                    <a href="javascript:void(0)" onclick="addCard(this)">Add</a>
                    <a href="javascript:void(0)" onclick="openEditDialog(this)">Edit</a>
                    <a href="javascript:void(0)" onclick="undoChange(1)">Undo</a> <!-- Adjust as needed -->
                </div>
            </div>
            <h2 class="card-title">${initialCardData.title}</h2>
            <div class="counter">${initialCardData.counter}</div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${initialCardData.progressPercentage}"></div>
            </div>
            <div class="progress-percentage">${initialCardData.progressPercentage}</div>
            <button class="present-button" onclick="markPresent(this)">Present</button>
            <button class="absent-button" onclick="markAbsent(this)">Absent</button>
            <button class="reset-button" onclick="openResetDialog(this.closest('.card'))">
                <i class="fas fa-redo"></i>
            </button>
        `;

        container.appendChild(newCard);
    });

    saveAttendanceDetails(); // Save restored details to localStorage
}


function showConfirmationDialog(iconElement) {
    var confirmationDialog = document.getElementById('confirmation-dialog');
    confirmationDialog.style.display = 'block';

    // Set up event listener for the confirm restore button
    var confirmRestoreButton = document.getElementById('confirm-restore');
    confirmRestoreButton.onclick = function() {
        restoreCards(); // Call function to restore cards
        confirmationDialog.style.display = 'none'; // Hide dialog after confirmation
    };

    // Event listener for cancel restore button
    var cancelRestoreButton = document.getElementById('cancel-restore');
    cancelRestoreButton.onclick = function() {
        confirmationDialog.style.display = 'none'; // Simply hide dialog if canceled
    };
}

const toggleButton = document.querySelector('.toggle-button');
const navLinks = document.querySelector('.nav-links');
toggleButton.addEventListener('click', () => {
    toggleButton.classList.toggle('active');
    navLinks.classList.toggle('active');
});

document.addEventListener('click', (event) => {
    if (!toggleButton.contains(event.target) && !navLinks.contains(event.target)) {
        navLinks.classList.remove('active');
    }
});

const links = document.querySelectorAll('.nav-item a');
