/*
    DEARLY - ANA JAVASCRIPT DOSYASI

    Bu dosya üç sayfayı kontrol eder:

    1. index.html
       Ana sayfadaki zarf ve buton

    2. create.html
       Mektup yazma ve canlı ön izleme

    3. letter.html
       Hazırlanan mektubun alıcıya gösterilmesi
*/


/* ==================================================
   ANA SAYFA
================================================== */

const envelope = document.getElementById("envelope");
const createButton = document.getElementById("createButton");

if (envelope) {
    envelope.addEventListener("click", () => {
        envelope.classList.toggle("open");
    });
}

if (createButton) {
    createButton.addEventListener("click", () => {
        window.location.href = "create.html";
    });
}


/* ==================================================
   MEKTUP OLUŞTURMA SAYFASI
================================================== */

const letterForm = document.getElementById("letterForm");

const recipientName = document.getElementById("recipientName");
const senderName = document.getElementById("senderName");
const letterMessage = document.getElementById("letterMessage");

const previewTo = document.getElementById("previewTo");
const previewMessage = document.getElementById("previewMessage");
const previewFrom = document.getElementById("previewFrom");

const characterCount = document.getElementById("characterCount");


function updateLetterPreview() {
    if (
        !recipientName ||
        !senderName ||
        !letterMessage ||
        !previewTo ||
        !previewMessage ||
        !previewFrom
    ) {
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

    if (characterCount) {
        characterCount.textContent = letterMessage.value.length;
    }
}


if (recipientName) {
    recipientName.addEventListener("input", updateLetterPreview);
}

if (senderName) {
    senderName.addEventListener("input", updateLetterPreview);
}

if (letterMessage) {
    letterMessage.addEventListener("input", updateLetterPreview);
}


/* ==================================================
   EK ÖZELLİK BUTONLARI
================================================== */

const photoButton = document.getElementById("photoButton");
const songButton = document.getElementById("songButton");
const voiceButton = document.getElementById("voiceButton");
const surpriseButton = document.getElementById("surpriseButton");

if (photoButton) {
    photoButton.addEventListener("click", () => {
        alert("Photo upload will be added soon.");
    });
}

if (songButton) {
    songButton.addEventListener("click", () => {
        alert("Song selection will be added soon.");
    });
}

if (voiceButton) {
    voiceButton.addEventListener("click", () => {
        alert("Voice recording will be added soon.");
    });
}

if (surpriseButton) {
    surpriseButton.addEventListener("click", () => {
        alert("The surprise feature will be added soon.");
    });
}


/* ==================================================
   MEKTUBU KAYDET
================================================== */

if (letterForm) {
    letterForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const recipient = recipientName.value.trim();
        const sender = senderName.value.trim();
        const message = letterMessage.value.trim();

        if (!recipient || !sender || !message) {
            alert(
                "Please write the recipient's name, your name and your message."
            );

            return;
        }

        const letterData = {
            recipient: recipient,
            sender: sender,
            message: message,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem(
            "dearlyLetter",
            JSON.stringify(letterData)
        );

        window.location.href = "letter.html";
    });
}


/* ==================================================
   ALICI SAYFASI
================================================== */

const recipientEnvelope = document.getElementById(
    "recipientEnvelope"
);

const openLetterButton = document.getElementById(
    "openLetterButton"
);

const recipientEnvelopeSection = document.getElementById(
    "recipientEnvelopeSection"
);

const finalLetterSection = document.getElementById(
    "finalLetterSection"
);

const finalLetterTo = document.getElementById(
    "finalLetterTo"
);

const finalLetterMessage = document.getElementById(
    "finalLetterMessage"
);

const finalLetterFrom = document.getElementById(
    "finalLetterFrom"
);


/*
    Tarayıcıya kaydedilen mektubu alıyoruz.
*/

function loadSavedLetter() {
    const savedLetter = localStorage.getItem("dearlyLetter");

    if (!savedLetter) {
        return;
    }

    try {
        const letterData = JSON.parse(savedLetter);

        if (finalLetterTo) {
            finalLetterTo.textContent =
                `Dear ${letterData.recipient},`;
        }

        if (finalLetterMessage) {
            finalLetterMessage.textContent =
                letterData.message;
        }

        if (finalLetterFrom) {
            finalLetterFrom.innerHTML =
                `With love,<br>${letterData.sender}`;
        }
    } catch (error) {
        console.error(
            "The saved letter could not be opened.",
            error
        );
    }
}


/*
    Zarfa veya butona basıldığında açılma işlemi.
*/

function openRecipientLetter() {
    if (recipientEnvelope) {
        recipientEnvelope.classList.add("open");
    }

    if (openLetterButton) {
        openLetterButton.disabled = true;
        openLetterButton.textContent = "Opening...";
    }

    window.setTimeout(() => {
        if (recipientEnvelopeSection) {
            recipientEnvelopeSection.classList.add("hidden");
        }

        if (finalLetterSection) {
            finalLetterSection.classList.add("visible");
        }
    }, 1000);
}


if (recipientEnvelope) {
    recipientEnvelope.addEventListener(
        "click",
        openRecipientLetter
    );

    recipientEnvelope.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                openRecipientLetter();
            }
        }
    );
}

if (openLetterButton) {
    openLetterButton.addEventListener(
        "click",
        openRecipientLetter
    );
}


/*
    letter.html açıldığında kaydedilmiş mektubu yükler.
*/

loadSavedLetter();
