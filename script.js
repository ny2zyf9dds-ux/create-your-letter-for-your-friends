/*
    DEARLY
    Ana JavaScript dosyası
*/


/* ==================================================
   SUPABASE BAĞLANTISI
================================================== */

const SUPABASE_URL =
    "https://lzqlzvhwbheqgiutxjxb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_4J0K3BmD7P43R2OUHm-kXQ_d9F45zSi";

const supabaseClient =
    window.supabase
        ? window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        )
        : null;


/* ==================================================
   YARDIMCI FONKSİYONLAR
================================================== */

function getLetterIdFromUrl() {
    const parameters =
        new URLSearchParams(window.location.search);

    return parameters.get("id");
}


function buildLetterUrl(letterId) {
    const letterUrl =
        new URL("letter.html", window.location.href);

    letterUrl.searchParams.set("id", letterId);

    return letterUrl.href;
}


function setButtonLoading(button, isLoading, loadingText) {
    if (!button) {
        return;
    }

    if (isLoading) {
        button.dataset.originalText =
            button.textContent;

        button.disabled = true;
        button.textContent = loadingText;
    } else {
        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            button.textContent;
    }
}


/* ==================================================
   ANA SAYFA
================================================== */

const envelope =
    document.getElementById("envelope");

const createButton =
    document.getElementById("createButton");


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

const letterForm =
    document.getElementById("letterForm");

const recipientName =
    document.getElementById("recipientName");

const senderName =
    document.getElementById("senderName");

const letterMessage =
    document.getElementById("letterMessage");

const previewTo =
    document.getElementById("previewTo");

const previewMessage =
    document.getElementById("previewMessage");

const previewFrom =
    document.getElementById("previewFrom");

const characterCount =
    document.getElementById("characterCount");


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

    const recipient =
        recipientName.value.trim();

    const sender =
        senderName.value.trim();

    const message =
        letterMessage.value;

    previewTo.textContent =
        recipient
            ? `Dear ${recipient},`
            : "Dear someone special,";

    previewMessage.textContent =
        message ||
        "Your message will appear here as you write it.";

    previewFrom.innerHTML =
        sender
            ? `With love,<br>${sender}`
            : "With love,<br>Your name";

    if (characterCount) {
        characterCount.textContent =
            String(letterMessage.value.length);
    }
}


if (recipientName) {
    recipientName.addEventListener(
        "input",
        updateLetterPreview
    );
}


if (senderName) {
    senderName.addEventListener(
        "input",
        updateLetterPreview
    );
}


if (letterMessage) {
    letterMessage.addEventListener(
        "input",
        updateLetterPreview
    );
}


/* ==================================================
   MEKTUBU SUPABASE'E KAYDET
================================================== */

if (letterForm) {
    letterForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const submitButton =
                letterForm.querySelector(
                    'button[type="submit"]'
                );

            const recipient =
                recipientName.value.trim();

            const sender =
                senderName.value.trim();

            const message =
                letterMessage.value.trim();

            if (!recipient || !sender || !message) {
                alert(
                    "Please complete the recipient, your name and the message."
                );

                return;
            }

            if (!supabaseClient) {
                alert(
                    "The database connection could not be started."
                );

                return;
            }

            setButtonLoading(
                submitButton,
                true,
                "Creating your letter..."
            );

            try {
                const { data, error } =
                    await supabaseClient.rpc(
                        "create_letter",
                        {
                            p_recipient: recipient,
                            p_sender: sender,
                            p_message: message
                        }
                    );

                if (error) {
                    throw error;
                }

                const letterId =
                    typeof data === "string"
                        ? data
                        : data?.id;

                if (!letterId) {
                    throw new Error(
                        "No letter ID was returned."
                    );
                }

                window.location.href =
                    `share.html?id=${encodeURIComponent(
                        letterId
                    )}`;

            } catch (error) {
                console.error(
                    "Letter creation error:",
                    error
                );

                alert(
                    "Your letter could not be created. Please try again."
                );

                setButtonLoading(
                    submitButton,
                    false
                );
            }
        }
    );
}


/* ==================================================
   GEÇİCİ EK ÖZELLİK BUTONLARI
================================================== */

const photoButton =
    document.getElementById("photoButton");

const songButton =
    document.getElementById("songButton");

const voiceButton =
    document.getElementById("voiceButton");

const surpriseButton =
    document.getElementById("surpriseButton");


if (photoButton) {
    photoButton.addEventListener("click", () => {
        alert(
            "Photo upload will be connected next."
        );
    });
}


if (songButton) {
    songButton.addEventListener("click", () => {
        alert(
            "Song selection will be connected next."
        );
    });
}


if (voiceButton) {
    voiceButton.addEventListener("click", () => {
        alert(
            "Voice recording will be connected next."
        );
    });
}


if (surpriseButton) {
    surpriseButton.addEventListener("click", () => {
        alert(
            "The surprise feature will be connected next."
        );
    });
}


/* ==================================================
   ALICI SAYFASI
================================================== */

const recipientEnvelope =
    document.getElementById("recipientEnvelope");

const openLetterButton =
    document.getElementById("openLetterButton");

const recipientEnvelopeSection =
    document.getElementById(
        "recipientEnvelopeSection"
    );

const finalLetterSection =
    document.getElementById(
        "finalLetterSection"
    );

const finalLetterTo =
    document.getElementById("finalLetterTo");

const finalLetterMessage =
    document.getElementById(
        "finalLetterMessage"
    );

const finalLetterFrom =
    document.getElementById("finalLetterFrom");


async function loadOnlineLetter() {
    if (!finalLetterSection) {
        return;
    }

    const letterId =
        getLetterIdFromUrl();

    if (!letterId) {
        alert(
            "This letter link is missing or invalid."
        );

        if (openLetterButton) {
            openLetterButton.disabled = true;
        }

        return;
    }

    if (!supabaseClient) {
        alert(
            "The database connection could not be started."
        );

        return;
    }

    if (openLetterButton) {
        openLetterButton.disabled = true;
        openLetterButton.textContent =
            "Loading your letter...";
    }

    try {
        const { data, error } =
            await supabaseClient.rpc(
                "get_letter",
                {
                    p_id: letterId
                }
            );

        if (error) {
            throw error;
        }

        const letter =
            Array.isArray(data)
                ? data[0]
                : data;

        if (!letter) {
            throw new Error(
                "Letter not found."
            );
        }

        if (finalLetterTo) {
            finalLetterTo.textContent =
                `Dear ${letter.recipient},`;
        }

        if (finalLetterMessage) {
            finalLetterMessage.textContent =
                letter.message;
        }

        if (finalLetterFrom) {
            finalLetterFrom.innerHTML =
                `With love,<br>${letter.sender}`;
        }

        if (openLetterButton) {
            openLetterButton.disabled = false;
            openLetterButton.textContent =
                "Open your letter";
        }

    } catch (error) {
        console.error(
            "Letter loading error:",
            error
        );

        alert(
            "This letter could not be found or opened."
        );

        if (openLetterButton) {
            openLetterButton.disabled = true;
            openLetterButton.textContent =
                "Letter unavailable";
        }
    }
}


function openRecipientLetter() {
    if (
        !recipientEnvelope ||
        !finalLetterSection
    ) {
        return;
    }

    recipientEnvelope.classList.add("open");

    if (openLetterButton) {
        openLetterButton.disabled = true;
        openLetterButton.textContent =
            "Opening...";
    }

    window.setTimeout(() => {
        if (recipientEnvelopeSection) {
            recipientEnvelopeSection.classList.add(
                "hidden"
            );
        }

        finalLetterSection.classList.add(
            "visible"
        );
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


loadOnlineLetter();


/* ==================================================
   PAYLAŞIM SAYFASI
================================================== */

const shareLinkInput =
    document.getElementById("shareLink");

const copyLinkButton =
    document.getElementById("copyLinkButton");

const copyStatus =
    document.getElementById("copyStatus");

const whatsappButton =
    document.getElementById("whatsappButton");

const telegramButton =
    document.getElementById("telegramButton");

const nativeShareButton =
    document.getElementById("nativeShareButton");

const previewLetterLink =
    document.getElementById("previewLetterLink");


function prepareSharePage() {
    if (!shareLinkInput) {
        return;
    }

    const letterId =
        getLetterIdFromUrl();

    if (!letterId) {
        shareLinkInput.value =
            "The letter link is unavailable.";

        if (copyLinkButton) {
            copyLinkButton.disabled = true;
        }

        return;
    }

    const letterUrl =
        buildLetterUrl(letterId);

    const shareMessage =
        `I made a special letter for you: ${letterUrl}`;

    shareLinkInput.value =
        letterUrl;

    if (previewLetterLink) {
        previewLetterLink.href =
            letterUrl;
    }

    if (copyLinkButton) {
        copyLinkButton.addEventListener(
            "click",
            async () => {
                try {
                    await navigator.clipboard.writeText(
                        letterUrl
                    );

                    copyLinkButton.textContent =
                        "Copied!";

                    if (copyStatus) {
                        copyStatus.textContent =
                            "The link has been copied.";
                    }

                    window.setTimeout(() => {
                        copyLinkButton.textContent =
                            "Copy";

                        if (copyStatus) {
                            copyStatus.textContent = "";
                        }
                    }, 2200);

                } catch (error) {
                    shareLinkInput.select();

                    document.execCommand("copy");

                    copyLinkButton.textContent =
                        "Copied!";
                }
            }
        );
    }

    if (whatsappButton) {
        whatsappButton.addEventListener(
            "click",
            () => {
                const whatsappUrl =
                    "https://wa.me/?text=" +
                    encodeURIComponent(
                        shareMessage
                    );

                window.open(
                    whatsappUrl,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        );
    }

    if (telegramButton) {
        telegramButton.addEventListener(
            "click",
            () => {
                const telegramUrl =
                    "https://t.me/share/url?url=" +
                    encodeURIComponent(letterUrl) +
                    "&text=" +
                    encodeURIComponent(
                        "I made a special letter for you."
                    );

                window.open(
                    telegramUrl,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        );
    }

    if (nativeShareButton) {
        if (!navigator.share) {
            nativeShareButton.hidden = true;
        } else {
            nativeShareButton.addEventListener(
                "click",
                async () => {
                    try {
                        await navigator.share({
                            title: "A letter for you",
                            text:
                                "I made a special letter for you.",
                            url: letterUrl
                        });
                    } catch (error) {
                        if (
                            error.name !== "AbortError"
                        ) {
                            console.error(
                                "Share error:",
                                error
                            );
                        }
                    }
                }
            );
        }
    }
}


prepareSharePage();
