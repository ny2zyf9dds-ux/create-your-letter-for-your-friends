/* Ana sayfadaki öğeleri bul */
const envelope = document.getElementById("envelope");
const createButton = document.getElementById("createButton");

/* Ana sayfadaysak zarfı çalıştır */
if (envelope) {
    envelope.addEventListener("click", () => {
        envelope.classList.toggle("open");
    });
}

/* Ana sayfadaysak oluşturma sayfasına git */
if (createButton) {
    createButton.addEventListener("click", () => {
        window.location.href = "create.html";
    });
}

/* Oluşturma sayfasındaki form öğelerini bul */
const letterForm = document.getElementById("letterForm");
const recipientName = document.getElementById("recipientName");
const senderName = document.getElementById("senderName");
const letterMessage = document.getElementById("letterMessage");

const previewTo = document.getElementById("previewTo");
const previewMessage = document.getElementById("previewMessage");
const previewFrom = document.getElementById("previewFrom");
const characterCount = document.getElementById("characterCount");

/* İsim ve mesaj yazıldıkça ön izlemeyi yenile */
function updateLetterPreview() {
    if (!recipientName || !senderName || !letterMessage) {
        return;
    }

    const recipient = recipientName.value.trim();
    const sender = senderName.value.trim();
    const message = letterMessage.value;

    previewTo.textContent = recipient
        ? `Dear ${recipient},`
        : "Dear someone special,";

    previewMessage.textContent = message
        ? message
        : "Your message will appear here as you write it.";

    previewFrom.innerHTML = sender
        ? `With love,<br>${sender}`
        : "With love,<br>Your name";

    characterCount.textContent = letterMessage.value.length;
}

/* Her yazma işleminde fonksiyonu çalıştır */
if (recipientName) {
    recipientName.addEventListener("input", updateLetterPreview);
}

if (senderName) {
    senderName.addEventListener("input", updateLetterPreview);
}

if (letterMessage) {
    letterMessage.addEventListener("input", updateLetterPreview);
}

/* Ek özellik butonları */
const photoButton = document.getElementById("photoButton");
const songButton = document.getElementById("songButton");
const voiceButton = document.getElementById("voiceButton");
const surpriseButton = document.getElementById("surpriseButton");

if (photoButton) {
    photoButton.addEventListener("click", () => {
        alert("Photo upload will be added in the next steps.");
    });
}

if (songButton) {
    songButton.addEventListener("click", () => {
        alert("Song selection will be added in the next steps.");
    });
}

if (voiceButton) {
    voiceButton.addEventListener("click", () => {
        alert("Voice recording will be added in the next steps.");
    });
}

if (surpriseButton) {
    surpriseButton.addEventListener("click", () => {
        alert("The surprise feature will be added in the next steps.");
    });
}

/* Form gönderildiğinde sayfanın yenilenmesini engelle */
if (letterForm) {
    letterForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const recipient = recipientName.value.trim();
        const sender = senderName.value.trim();
        const message = letterMessage.value.trim();

        if (!recipient || !sender || !message) {
            alert("Please complete the recipient, your name and the message.");
            return;
        }

        alert("Your letter is ready for the next step!");
    });
}
