/*
    DEARLY
    Ana JavaScript dosyası
*/

document.addEventListener("DOMContentLoaded", () => {

    /* =============================================
       SUPABASE BAĞLANTISI
    ============================================= */

    const SUPABASE_URL =
        "https://lzqlzvhwbheqgiutxjxb.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_4J0K3BmD7P43R2OUHm-kXQ_d9F45zSi";

    let supabaseClient = null;

    if (window.supabase) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );
    }


    /* =============================================
       YARDIMCI FONKSİYONLAR
    ============================================= */

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


    /* =============================================
       ANA SAYFA
    ============================================= */

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


    /* =============================================
       MEKTUP OLUŞTURMA SAYFASI
    ============================================= */

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
            !letterMessage
        ) {
            return;
        }

        const recipient =
            recipientName.value.trim();

        const sender =
            senderName.value.trim();

        const message =
            letterMessage.value;

        if (previewTo) {
            previewTo.textContent =
                recipient
                    ? `Dear ${recipient},`
                    : "Dear someone special,";
        }

        if (previewMessage) {
            previewMessage.textContent =
                message ||
                "Your message will appear here as you write it.";
        }

        if (previewFrom) {
            previewFrom.innerHTML =
                sender
                    ? `With love,<br>${sender}`
                    : "With love,<br>Your name";
        }

        if (characterCount) {
            characterCount.textContent =
                String(message.length);
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

    updateLetterPreview();


    /* =============================================
       GEÇİCİ EKLEME BUTONLARI
    ============================================= */

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
                "Photo upload has not been connected yet."
            );
        });
    }

    if (songButton) {
        songButton.addEventListener("click", () => {
            alert(
                "Song selection has not been connected yet."
            );
        });
    }

    if (voiceButton) {
        voiceButton.addEventListener("click", () => {
            alert(
                "Voice recording has not been connected yet."
            );
        });
    }

    if (surpriseButton) {
        surpriseButton.addEventListener("click", () => {
            alert(
                "The surprise feature has not been connected yet."
            );
        });
    }


    /* =============================================
       MEKTUBU KAYDET
    ============================================= */

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
                    recipientName
                        ? recipientName.value.trim()
                        : "";

                const sender =
                    senderName
                        ? senderName.value.trim()
                        : "";

                const message =
                    letterMessage
                        ? letterMessage.value.trim()
                        : "";

                if (!recipient || !sender || !message) {
                    alert(
                        "Please complete the recipient, your name and the message."
                    );

                    return;
                }

                if (!supabaseClient) {
                    alert(
                        "Supabase could not be loaded. Please refresh the page."
                    );

                    return;
                }

                const originalButtonText =
                    submitButton.textContent;

                submitButton.disabled = true;
                submitButton.textContent =
                    "Creating your letter...";

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
                    console.error(error);

                    alert(
                        "Your letter could not be created. Please check the Supabase SQL setup."
                    );

                    submitButton.disabled = false;
                    submitButton.textContent =
                        originalButtonText;
                }
            }
        );
    }


    /* =============================================
       ALICI SAYFASI
    ============================================= */

    const recipientEnvelope =
        document.getElementById(
            "recipientEnvelope"
        );

    const openLetterButton =
        document.getElementById(
            "openLetterButton"
        );

    const recipientEnvelopeSection =
        document.getElementById(
            "recipientEnvelopeSection"
        );

    const finalLetterSection =
        document.getElementById(
            "finalLetterSection"
        );

    const finalLetterTo =
        document.getElementById(
            "finalLetterTo"
        );

    const finalLetterMessage =
        document.getElementById(
            "finalLetterMessage"
        );

    const finalLetterFrom =
        document.getElementById(
            "finalLetterFrom"
        );


    async function loadOnlineLetter() {
        if (!finalLetterSection) {
            return;
        }

        const letterId =
            getLetterIdFromUrl();

        if (!letterId) {
            if (openLetterButton) {
                openLetterButton.disabled = true;
                openLetterButton.textContent =
                    "Invalid letter link";
            }

            return;
        }

        if (!supabaseClient) {
            if (openLetterButton) {
                openLetterButton.disabled = true;
                openLetterButton.textContent =
                    "Connection error";
            }

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
            console.error(error);

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
    }

    if (openLetterButton) {
        openLetterButton.addEventListener(
            "click",
            openRecipientLetter
        );
    }

    loadOnlineLetter();


    /* =============================================
       PAYLAŞIM SAYFASI
    ============================================= */

    const shareLinkInput =
        document.getElementById("shareLink");

    const copyLinkButton =
        document.getElementById(
            "copyLinkButton"
        );

    const copyStatus =
        document.getElementById("copyStatus");

    const whatsappButton =
        document.getElementById(
            "whatsappButton"
        );

    const telegramButton =
        document.getElementById(
            "telegramButton"
        );

    const nativeShareButton =
        document.getElementById(
            "nativeShareButton"
        );

    const previewLetterLink =
        document.getElementById(
            "previewLetterLink"
        );


    if (shareLinkInput) {
        const letterId =
            getLetterIdFromUrl();

        if (!letterId) {
            shareLinkInput.value =
                "Letter link unavailable";

            if (copyLinkButton) {
                copyLinkButton.disabled = true;
            }
        } else {
            const letterUrl =
                buildLetterUrl(letterId);

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
                        } catch (error) {
                            shareLinkInput.select();
                            document.execCommand("copy");
                        }
                    }
                );
            }

            if (whatsappButton) {
                whatsappButton.addEventListener(
                    "click",
                    () => {
                        const message =
                            `I made a special letter for you: ${letterUrl}`;

                        window.open(
                            "https://wa.me/?text=" +
                            encodeURIComponent(message),
                            "_blank"
                        );
                    }
                );
            }

            if (telegramButton) {
                telegramButton.addEventListener(
                    "click",
                    () => {
                        window.open(
                            "https://t.me/share/url?url=" +
                            encodeURIComponent(letterUrl) +
                            "&text=" +
                            encodeURIComponent(
                                "I made a special letter for you."
                            ),
                            "_blank"
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
                                    title:
                                        "A letter for you",
                                    text:
                                        "I made a special letter for you.",
                                    url: letterUrl
                                });
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    );
                }
            }
        }
    }

});
