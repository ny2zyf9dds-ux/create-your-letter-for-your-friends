document.addEventListener("DOMContentLoaded", () => {

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

    const MAX_PHOTOS = 5;
    const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
    const MAX_VIDEO_SIZE = 25 * 1024 * 1024;
    const MAX_MEDIA_DURATION = 60;

    let selectedPhotos = [];
    let selectedVideo = null;
    let voiceBlob = null;
    let spotifyData = null;

    let mediaRecorder = null;
    let recordingStream = null;
    let recordingChunks = [];
    let recordedVoiceMimeType = "";
    let recordingSeconds = 0;
    let recordingInterval = null;


    /* ==================================================
       YARDIMCI FONKSİYONLAR
    ================================================== */

    function getLetterIdFromUrl() {
        return new URLSearchParams(
            window.location.search
        ).get("id");
    }


    function buildLetterUrl(letterId) {
        const url =
            new URL("letter.html", window.location.href);

        url.searchParams.set("id", letterId);

        return url.href;
    }


    function togglePanel(button, panel) {
        if (!button || !panel) {
            return;
        }

        const willOpen = panel.hidden;

        panel.hidden = !willOpen;

        button.setAttribute(
            "aria-expanded",
            String(willOpen)
        );
    }


    function safeFileName(fileName) {
        return fileName
            .toLowerCase()
            .replace(/[^a-z0-9.]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }


    function formatTimer(totalSeconds) {
        const minutes =
            String(Math.floor(totalSeconds / 60))
                .padStart(2, "0");

        const seconds =
            String(totalSeconds % 60)
                .padStart(2, "0");

        return `${minutes}:${seconds}`;
    }


    async function getMediaDuration(file) {
        return new Promise((resolve, reject) => {
            const mediaElement =
                document.createElement(
                    file.type.startsWith("video/")
                        ? "video"
                        : "audio"
                );

            const objectUrl =
                URL.createObjectURL(file);

            mediaElement.preload = "metadata";

            mediaElement.onloadedmetadata = () => {
                const duration =
                    mediaElement.duration;

                URL.revokeObjectURL(objectUrl);
                resolve(duration);
            };

            mediaElement.onerror = () => {
                URL.revokeObjectURL(objectUrl);

                reject(
                    new Error(
                        "The media duration could not be read."
                    )
                );
            };

            mediaElement.src = objectUrl;
        });
    }


    async function uploadFile(
        file,
        folder,
        customName
    ) {
        const extension =
            file.name?.split(".").pop() ||
            file.type.split("/").pop() ||
            "file";

        const finalName =
            customName ||
            `${crypto.randomUUID()}.${extension}`;

        const path =
            `${folder}/${safeFileName(finalName)}`;

        const { error } =
            await supabaseClient
                .storage
                .from("letter-media")
                .upload(path, file, {
                    cacheControl: "3600",
                    contentType: file.type,
                    upsert: false
                });

        if (error) {
            throw error;
        }

        const { data } =
            supabaseClient
                .storage
                .from("letter-media")
                .getPublicUrl(path);

        return data.publicUrl;
    }


    /* ==================================================
       ANA SAYFA
    ================================================== */

    const envelope =
        document.getElementById("envelope");

    const createButton =
        document.getElementById("createButton");


    envelope?.addEventListener("click", () => {
        envelope.classList.toggle("open");
    });


    createButton?.addEventListener("click", () => {
        window.location.href = "create.html";
    });


    /* ==================================================
       FORM VE CANLI ÖN İZLEME
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


    recipientName?.addEventListener(
        "input",
        updateLetterPreview
    );

    senderName?.addEventListener(
        "input",
        updateLetterPreview
    );

    letterMessage?.addEventListener(
        "input",
        updateLetterPreview
    );

    updateLetterPreview();


    /* ==================================================
       MEDYA PANELLERİ
    ================================================== */

    const photoButton =
        document.getElementById("photoButton");

    const videoButton =
        document.getElementById("videoButton");

    const voiceButton =
        document.getElementById("voiceButton");

    const songButton =
        document.getElementById("songButton");

    const photoPanel =
        document.getElementById("photoPanel");

    const videoPanel =
        document.getElementById("videoPanel");

    const voicePanel =
        document.getElementById("voicePanel");

    const spotifyPanel =
        document.getElementById("spotifyPanel");


    photoButton?.addEventListener("click", () => {
        togglePanel(photoButton, photoPanel);
    });

    videoButton?.addEventListener("click", () => {
        togglePanel(videoButton, videoPanel);
    });

    voiceButton?.addEventListener("click", () => {
        togglePanel(voiceButton, voicePanel);
    });

    songButton?.addEventListener("click", () => {
        togglePanel(songButton, spotifyPanel);
    });


    /* ==================================================
       FOTOĞRAFLAR
    ================================================== */

    const photoInput =
        document.getElementById("photoInput");

    const selectedPhotoGrid =
        document.getElementById(
            "selectedPhotoGrid"
        );

    const photoCount =
        document.getElementById("photoCount");

    const photoError =
        document.getElementById("photoError");


    function renderSelectedPhotos() {
        if (!selectedPhotoGrid) {
            return;
        }

        selectedPhotoGrid.innerHTML = "";

        selectedPhotos.forEach((file, index) => {
            const item =
                document.createElement("div");

            item.className =
                "selected-photo-item";

            const image =
                document.createElement("img");

            const objectUrl =
                URL.createObjectURL(file);

            image.src = objectUrl;
            image.alt =
                `Selected photo ${index + 1}`;

            image.onload = () => {
                URL.revokeObjectURL(objectUrl);
            };

            const removeButton =
                document.createElement("button");

            removeButton.type = "button";
            removeButton.className =
                "remove-photo-button";
            removeButton.textContent = "×";

            removeButton.addEventListener(
                "click",
                () => {
                    selectedPhotos.splice(index, 1);
                    renderSelectedPhotos();
                }
            );

            item.append(image, removeButton);
            selectedPhotoGrid.appendChild(item);
        });

        if (photoCount) {
            photoCount.textContent =
                `${selectedPhotos.length} / ${MAX_PHOTOS}`;
        }
    }


    photoInput?.addEventListener(
        "change",
        () => {
            if (photoError) {
                photoError.textContent = "";
            }

            const incomingFiles =
                Array.from(
                    photoInput.files || []
                );

            for (const file of incomingFiles) {
                if (
                    selectedPhotos.length >=
                    MAX_PHOTOS
                ) {
                    if (photoError) {
                        photoError.textContent =
                            "You can add a maximum of 5 photos.";
                    }

                    break;
                }

                if (
                    ![
                        "image/jpeg",
                        "image/png",
                        "image/webp"
                    ].includes(file.type)
                ) {
                    if (photoError) {
                        photoError.textContent =
                            "Please choose JPG, PNG or WEBP photos.";
                    }

                    continue;
                }

                if (
                    file.size >
                    MAX_PHOTO_SIZE
                ) {
                    if (photoError) {
                        photoError.textContent =
                            `${file.name} is larger than 8 MB.`;
                    }

                    continue;
                }

                selectedPhotos.push(file);
            }

            photoInput.value = "";
            renderSelectedPhotos();
        }
    );


    /* ==================================================
       VİDEO
    ================================================== */

    const videoInput =
        document.getElementById("videoInput");

    const videoPreviewContainer =
        document.getElementById(
            "videoPreviewContainer"
        );

    const videoPreview =
        document.getElementById("videoPreview");

    const removeVideoButton =
        document.getElementById(
            "removeVideoButton"
        );

    const videoError =
        document.getElementById("videoError");


    function clearVideo() {
        selectedVideo = null;

        if (videoPreview) {
            if (videoPreview.src) {
                URL.revokeObjectURL(
                    videoPreview.src
                );
            }

            videoPreview.removeAttribute("src");
            videoPreview.load();
        }

        if (videoPreviewContainer) {
            videoPreviewContainer.hidden = true;
        }

        if (videoInput) {
            videoInput.value = "";
        }
    }


    videoInput?.addEventListener(
        "change",
        async () => {
            const file =
                videoInput.files?.[0];

            if (!file) {
                return;
            }

            if (videoError) {
                videoError.textContent = "";
            }

            if (
                ![
                    "video/mp4",
                    "video/webm",
                    "video/quicktime"
                ].includes(file.type)
            ) {
                if (videoError) {
                    videoError.textContent =
                        "Please choose an MP4, WEBM or MOV video.";
                }

                clearVideo();
                return;
            }

            if (file.size > MAX_VIDEO_SIZE) {
                if (videoError) {
                    videoError.textContent =
                        "The video must be 25 MB or smaller.";
                }

                clearVideo();
                return;
            }

            try {
                const duration =
                    await getMediaDuration(file);

                if (
                    !Number.isFinite(duration) ||
                    duration >
                        MAX_MEDIA_DURATION + 0.5
                ) {
                    if (videoError) {
                        videoError.textContent =
                            "The video must be 1 minute or shorter.";
                    }

                    clearVideo();
                    return;
                }

                selectedVideo = file;

                if (videoPreview) {
                    videoPreview.src =
                        URL.createObjectURL(file);
                }

                if (videoPreviewContainer) {
                    videoPreviewContainer.hidden =
                        false;
                }

            } catch (error) {
                if (videoError) {
                    videoError.textContent =
                        "This video could not be opened.";
                }

                clearVideo();
            }
        }
    );


    removeVideoButton?.addEventListener(
        "click",
        clearVideo
    );


    /* ==================================================
       SES KAYDI — TELEFON UYUMLU
    ================================================== */

    const startRecordingButton =
        document.getElementById(
            "startRecordingButton"
        );

    const stopRecordingButton =
        document.getElementById(
            "stopRecordingButton"
        );

    const recordingTimer =
        document.getElementById(
            "recordingTimer"
        );

    const voicePreviewContainer =
        document.getElementById(
            "voicePreviewContainer"
        );

    const voicePreview =
        document.getElementById(
            "voicePreview"
        );

    const removeVoiceButton =
        document.getElementById(
            "removeVoiceButton"
        );

    const voiceError =
        document.getElementById(
            "voiceError"
        );


    function stopRecordingTimer() {
        if (recordingInterval) {
            window.clearInterval(
                recordingInterval
            );

            recordingInterval = null;
        }
    }


    function closeRecordingStream() {
        recordingStream
            ?.getTracks()
            .forEach(track => {
                track.stop();
            });

        recordingStream = null;
    }


    function resetRecordingButtons() {
        if (startRecordingButton) {
            startRecordingButton.disabled =
                false;

            startRecordingButton.textContent =
                voiceBlob
                    ? "Record again"
                    : "Start recording";
        }

        if (stopRecordingButton) {
            stopRecordingButton.disabled =
                true;
        }
    }


    function stopVoiceRecording() {
        if (
            mediaRecorder &&
            mediaRecorder.state === "recording"
        ) {
            mediaRecorder.stop();
        }
    }


    startRecordingButton?.addEventListener(
        "click",
        async () => {
            if (voiceError) {
                voiceError.textContent = "";
            }

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia ||
                !window.MediaRecorder
            ) {
                if (voiceError) {
                    voiceError.textContent =
                        "Voice recording is not supported in this browser.";
                }

                return;
            }

            try {
                recordingStream =
                    await navigator.mediaDevices
                        .getUserMedia({
                            audio: true
                        });

                recordingChunks = [];
                recordingSeconds = 0;
                voiceBlob = null;

                const supportedVoiceTypes = [
                    "audio/webm;codecs=opus",
                    "audio/webm",
                    "audio/mp4;codecs=mp4a.40.2",
                    "audio/mp4"
                ];

                const preferredMimeType =
                    supportedVoiceTypes.find(
                        type =>
                            MediaRecorder
                                .isTypeSupported(type)
                    ) || "";

                mediaRecorder =
                    preferredMimeType
                        ? new MediaRecorder(
                            recordingStream,
                            {
                                mimeType:
                                    preferredMimeType
                            }
                        )
                        : new MediaRecorder(
                            recordingStream
                        );

                recordedVoiceMimeType =
                    mediaRecorder.mimeType ||
                    preferredMimeType ||
                    "audio/mp4";

                mediaRecorder.addEventListener(
                    "dataavailable",
                    event => {
                        if (
                            event.data &&
                            event.data.size > 0
                        ) {
                            recordingChunks.push(
                                event.data
                            );
                        }
                    }
                );

                mediaRecorder.addEventListener(
                    "stop",
                    () => {
                        stopRecordingTimer();
                        closeRecordingStream();

                        const finalMimeType =
                            mediaRecorder.mimeType ||
                            recordedVoiceMimeType ||
                            "audio/mp4";

                        voiceBlob =
                            new Blob(
                                recordingChunks,
                                {
                                    type:
                                        finalMimeType
                                }
                            );

                        if (
                            !voiceBlob ||
                            voiceBlob.size === 0
                        ) {
                            voiceBlob = null;

                            if (voiceError) {
                                voiceError.textContent =
                                    "The recording was empty. Please try again.";
                            }

                            resetRecordingButtons();
                            return;
                        }

                        if (voicePreview) {
                            if (
                                voicePreview.src
                            ) {
                                URL.revokeObjectURL(
                                    voicePreview.src
                                );
                            }

                            const previewUrl =
                                URL.createObjectURL(
                                    voiceBlob
                                );

                            voicePreview.src =
                                previewUrl;

                            voicePreview.load();
                        }

                        if (
                            voicePreviewContainer
                        ) {
                            voicePreviewContainer.hidden =
                                false;
                        }

                        resetRecordingButtons();
                    }
                );

                mediaRecorder.addEventListener(
                    "error",
                    event => {
                        stopRecordingTimer();
                        closeRecordingStream();

                        console.error(
                            "Recording error:",
                            event.error
                        );

                        if (voiceError) {
                            voiceError.textContent =
                                "The recording could not be completed.";
                        }

                        resetRecordingButtons();
                    }
                );

                mediaRecorder.start(1000);

                startRecordingButton.disabled =
                    true;

                stopRecordingButton.disabled =
                    false;

                if (recordingTimer) {
                    recordingTimer.textContent =
                        "00:00";
                }

                recordingInterval =
                    window.setInterval(() => {
                        recordingSeconds += 1;

                        if (recordingTimer) {
                            recordingTimer.textContent =
                                formatTimer(
                                    recordingSeconds
                                );
                        }

                        if (
                            recordingSeconds >=
                            MAX_MEDIA_DURATION
                        ) {
                            stopVoiceRecording();
                        }
                    }, 1000);

            } catch (error) {
                console.error(
                    "Microphone error:",
                    error
                );

                stopRecordingTimer();
                closeRecordingStream();
                resetRecordingButtons();

                if (voiceError) {
                    voiceError.textContent =
                        "Microphone access was not allowed.";
                }
            }
        }
    );


    stopRecordingButton?.addEventListener(
        "click",
        stopVoiceRecording
    );


    removeVoiceButton?.addEventListener(
        "click",
        () => {
            voiceBlob = null;
            recordingChunks = [];
            recordedVoiceMimeType = "";

            if (voicePreview?.src) {
                URL.revokeObjectURL(
                    voicePreview.src
                );

                voicePreview.pause();
                voicePreview.removeAttribute(
                    "src"
                );

                voicePreview.load();
            }

            if (voicePreviewContainer) {
                voicePreviewContainer.hidden =
                    true;
            }

            if (recordingTimer) {
                recordingTimer.textContent =
                    "00:00";
            }

            resetRecordingButtons();
        }
    );


    /* ==================================================
       SPOTIFY
    ================================================== */

    const spotifyInput =
        document.getElementById(
            "spotifyInput"
        );

    const spotifyPreviewButton =
        document.getElementById(
            "spotifyPreviewButton"
        );

    const spotifyCreatorPreview =
        document.getElementById(
            "spotifyCreatorPreview"
        );

    const spotifyCreatorCover =
        document.getElementById(
            "spotifyCreatorCover"
        );

    const spotifyCreatorTitle =
        document.getElementById(
            "spotifyCreatorTitle"
        );

    const spotifyCreatorArtist =
        document.getElementById(
            "spotifyCreatorArtist"
        );

    const removeSpotifyButton =
        document.getElementById(
            "removeSpotifyButton"
        );

    const spotifyError =
        document.getElementById(
            "spotifyError"
        );


    function isSpotifyTrackUrl(value) {
        try {
            const url = new URL(value);

            return (
                (
                    url.hostname ===
                        "open.spotify.com" ||
                    url.hostname ===
                        "spotify.link"
                ) &&
                (
                    url.pathname.includes(
                        "/track/"
                    ) ||
                    url.hostname ===
                        "spotify.link"
                )
            );

        } catch {
            return false;
        }
    }


    spotifyPreviewButton?.addEventListener(
        "click",
        async () => {
            const spotifyUrl =
                spotifyInput?.value.trim();

            if (spotifyError) {
                spotifyError.textContent = "";
            }

            if (
                !spotifyUrl ||
                !isSpotifyTrackUrl(spotifyUrl)
            ) {
                if (spotifyError) {
                    spotifyError.textContent =
                        "Please paste a valid Spotify track link.";
                }

                return;
            }

            spotifyPreviewButton.disabled =
                true;

            spotifyPreviewButton.textContent =
                "Loading...";

            try {
                const response =
                    await fetch(
                        "https://open.spotify.com/oembed?url=" +
                        encodeURIComponent(
                            spotifyUrl
                        )
                    );

                if (!response.ok) {
                    throw new Error(
                        "Spotify could not read this link."
                    );
                }

                const data =
                    await response.json();

                spotifyData = {
                    url: spotifyUrl,
                    title:
                        data.title ||
                        "Spotify Song",
                    cover:
                        data.thumbnail_url ||
                        ""
                };

                if (spotifyCreatorCover) {
                    spotifyCreatorCover.src =
                        spotifyData.cover;
                }

                if (spotifyCreatorTitle) {
                    spotifyCreatorTitle.textContent =
                        spotifyData.title;
                }

                if (spotifyCreatorArtist) {
                    spotifyCreatorArtist.textContent =
                        "Spotify track";
                }

                if (spotifyCreatorPreview) {
                    spotifyCreatorPreview.hidden =
                        false;
                }

            } catch (error) {
                console.error(
                    "Spotify error:",
                    error
                );

                spotifyData = null;

                if (spotifyError) {
                    spotifyError.textContent =
                        "This Spotify song could not be loaded.";
                }

            } finally {
                spotifyPreviewButton.disabled =
                    false;

                spotifyPreviewButton.textContent =
                    "Add song";
            }
        }
    );


    removeSpotifyButton?.addEventListener(
        "click",
        () => {
            spotifyData = null;

            if (spotifyInput) {
                spotifyInput.value = "";
            }

            if (spotifyCreatorPreview) {
                spotifyCreatorPreview.hidden =
                    true;
            }
        }
    );


    /* ==================================================
       MEKTUBU VE MEDYALARI KAYDET
    ================================================== */

    const uploadStatus =
        document.getElementById(
            "uploadStatus"
        );


    letterForm?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const recipient =
                recipientName.value.trim();

            const sender =
                senderName.value.trim();

            const message =
                letterMessage.value.trim();

            if (
                !recipient ||
                !sender ||
                !message
            ) {
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

            const submitButton =
                letterForm.querySelector(
                    'button[type="submit"]'
                );

            const originalText =
                submitButton.textContent;

            submitButton.disabled = true;

            submitButton.textContent =
                "Creating your letter...";

            const mediaFolder =
                crypto.randomUUID();

            try {
                const photoUrls = [];

                for (
                    let index = 0;
                    index <
                        selectedPhotos.length;
                    index += 1
                ) {
                    if (uploadStatus) {
                        uploadStatus.textContent =
                            `Uploading photo ${index + 1} of ${selectedPhotos.length}...`;
                    }

                    const photoUrl =
                        await uploadFile(
                            selectedPhotos[index],
                            `${mediaFolder}/photos`
                        );

                    photoUrls.push(photoUrl);
                }

                let videoUrl = null;

                if (selectedVideo) {
                    if (uploadStatus) {
                        uploadStatus.textContent =
                            "Uploading video...";
                    }

                    videoUrl =
                        await uploadFile(
                            selectedVideo,
                            `${mediaFolder}/video`
                        );
                }

                let voiceUrl = null;

                if (voiceBlob) {
                    if (uploadStatus) {
                        uploadStatus.textContent =
                            "Uploading voice note...";
                    }

                    const finalVoiceType =
                        voiceBlob.type ||
                        recordedVoiceMimeType ||
                        "audio/mp4";

                    const voiceExtension =
                        finalVoiceType.includes(
                            "webm"
                        )
                            ? "webm"
                            : finalVoiceType.includes(
                                "mpeg"
                            )
                                ? "mp3"
                                : "m4a";

                    const voiceFileName =
                        `voice-note.${voiceExtension}`;

                    const voiceFile =
                        new File(
                            [voiceBlob],
                            voiceFileName,
                            {
                                type:
                                    finalVoiceType
                            }
                        );

                    voiceUrl =
                        await uploadFile(
                            voiceFile,
                            `${mediaFolder}/voice`,
                            voiceFileName
                        );
                }

                if (uploadStatus) {
                    uploadStatus.textContent =
                        "Saving your letter...";
                }

                const { data, error } =
                    await supabaseClient.rpc(
                        "create_letter",
                        {
                            p_recipient:
                                recipient,
                            p_sender:
                                sender,
                            p_message:
                                message,
                            p_photo_urls:
                                photoUrls,
                            p_video_url:
                                videoUrl,
                            p_voice_url:
                                voiceUrl,
                            p_spotify_url:
                                spotifyData?.url ||
                                null,
                            p_spotify_title:
                                spotifyData?.title ||
                                null,
                            p_spotify_artist:
                                null,
                            p_spotify_cover_url:
                                spotifyData?.cover ||
                                null
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
                    "Upload error:",
                    error
                );

                alert(
                    "Your letter or media could not be uploaded. Please try again."
                );

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText;

                if (uploadStatus) {
                    uploadStatus.textContent =
                        "";
                }
            }
        }
    );


    /* ==================================================
       ALICI SAYFASI
    ================================================== */

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

    const recipientMediaGrid =
        document.getElementById(
            "recipientMediaGrid"
        );

    const photoGalleryCard =
        document.getElementById(
            "photoGalleryCard"
        );

    const photoCardCover =
        document.getElementById(
            "photoCardCover"
        );

    const recipientPhotoGrid =
        document.getElementById(
            "recipientPhotoGrid"
        );

    const videoCard =
        document.getElementById(
            "videoCard"
        );

    const recipientVideo =
        document.getElementById(
            "recipientVideo"
        );

    const voiceCard =
        document.getElementById(
            "voiceCard"
        );

    const recipientVoice =
        document.getElementById(
            "recipientVoice"
        );

    const spotifyCard =
        document.getElementById(
            "spotifyCard"
        );

    const spotifyCardCover =
        document.getElementById(
            "spotifyCardCover"
        );

    const recipientSpotifyTitle =
        document.getElementById(
            "recipientSpotifyTitle"
        );

    const spotifyEmbedContainer =
        document.getElementById(
            "spotifyEmbedContainer"
        );

    const openSpotifyLink =
        document.getElementById(
            "openSpotifyLink"
        );


    function makeSpotifyEmbedUrl(urlValue) {
        try {
            const url =
                new URL(urlValue);

            if (
                url.hostname !==
                "open.spotify.com"
            ) {
                return null;
            }

            const parts =
                url.pathname
                    .split("/")
                    .filter(Boolean);

            const trackIndex =
                parts.indexOf("track");

            if (
                trackIndex === -1 ||
                !parts[trackIndex + 1]
            ) {
                return null;
            }

            return (
                "https://open.spotify.com/embed/track/" +
                parts[trackIndex + 1]
            );

        } catch {
            return null;
        }
    }


    function createRecipientPhotos(
        photoUrls
    ) {
        if (
            !photoUrls?.length ||
            !recipientPhotoGrid
        ) {
            return false;
        }

        recipientPhotoGrid.innerHTML = "";

        photoUrls.forEach(
            (url, index) => {
                const button =
                    document.createElement(
                        "button"
                    );

                button.type = "button";

                button.className =
                    "recipient-photo-button";

                const image =
                    document.createElement(
                        "img"
                    );

                image.src = url;

                image.alt =
                    `Memory ${index + 1}`;

                button.appendChild(image);

                button.addEventListener(
                    "click",
                    () =>
                        openPhotoLightbox(
                            url
                        )
                );

                recipientPhotoGrid
                    .appendChild(button);
            }
        );

        if (photoCardCover) {
            photoCardCover.style
                .backgroundImage =
                `url("${photoUrls[0]}")`;
        }

        if (photoGalleryCard) {
            photoGalleryCard.hidden =
                false;
        }

        return true;
    }


    function createSpotifyCard(letter) {
        if (!letter.spotify_url) {
            return false;
        }

        if (spotifyCard) {
            spotifyCard.hidden = false;
        }

        if (spotifyCardCover) {
            spotifyCardCover.src =
                letter.spotify_cover_url ||
                "";
        }

        if (recipientSpotifyTitle) {
            recipientSpotifyTitle.textContent =
                letter.spotify_title ||
                "Spotify Song";
        }

        if (openSpotifyLink) {
            openSpotifyLink.href =
                letter.spotify_url;
        }

        const embedUrl =
            makeSpotifyEmbedUrl(
                letter.spotify_url
            );

        if (
            embedUrl &&
            spotifyEmbedContainer
        ) {
            const iframe =
                document.createElement(
                    "iframe"
                );

            iframe.src = embedUrl;

            iframe.title =
                "Spotify song";

            iframe.allow =
                "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";

            iframe.loading = "lazy";

            spotifyEmbedContainer.innerHTML =
                "";

            spotifyEmbedContainer
                .appendChild(iframe);
        }

        return true;
    }


    async function loadOnlineLetter() {
        if (!finalLetterSection) {
            return;
        }

        const letterId =
            getLetterIdFromUrl();

        if (
            !letterId ||
            !supabaseClient
        ) {
            if (openLetterButton) {
                openLetterButton.disabled =
                    true;

                openLetterButton.textContent =
                    "Invalid letter link";
            }

            return;
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

            let hasMedia = false;

            if (
                createRecipientPhotos(
                    letter.photo_urls
                )
            ) {
                hasMedia = true;
            }

            if (
                letter.video_url &&
                videoCard &&
                recipientVideo
            ) {
                videoCard.hidden = false;

                recipientVideo.src =
                    letter.video_url;

                recipientVideo.load();

                hasMedia = true;
            }

            if (
                letter.voice_url &&
                voiceCard &&
                recipientVoice
            ) {
                voiceCard.hidden = false;

                recipientVoice.src =
                    letter.voice_url;

                recipientVoice.load();

                hasMedia = true;
            }

            if (
                createSpotifyCard(
                    letter
                )
            ) {
                hasMedia = true;
            }

            if (
                hasMedia &&
                recipientMediaGrid
            ) {
                recipientMediaGrid.hidden =
                    false;
            }

            if (openLetterButton) {
                openLetterButton.disabled =
                    false;

                openLetterButton.textContent =
                    "Open your letter";
            }

        } catch (error) {
            console.error(
                "Letter loading error:",
                error
            );

            if (openLetterButton) {
                openLetterButton.disabled =
                    true;

                openLetterButton.textContent =
                    "Letter unavailable";
            }
        }
    }


    function openRecipientLetter() {
        recipientEnvelope?.classList.add(
            "open"
        );

        if (openLetterButton) {
            openLetterButton.disabled =
                true;

            openLetterButton.textContent =
                "Opening...";
        }

        window.setTimeout(() => {
            recipientEnvelopeSection
                ?.classList.add(
                    "hidden"
                );

            finalLetterSection
                ?.classList.add(
                    "visible"
                );
        }, 1000);
    }


    recipientEnvelope?.addEventListener(
        "click",
        openRecipientLetter
    );


    recipientEnvelope?.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                openRecipientLetter();
            }
        }
    );


    openLetterButton?.addEventListener(
        "click",
        openRecipientLetter
    );


    loadOnlineLetter();


    /* ==================================================
       AÇILIR MEDYA KARTLARI
    ================================================== */

    function connectExpandableCard(
        triggerId,
        contentId
    ) {
        const trigger =
            document.getElementById(
                triggerId
            );

        const content =
            document.getElementById(
                contentId
            );

        trigger?.addEventListener(
            "click",
            () => {
                content.hidden =
                    !content.hidden;
            }
        );
    }


    connectExpandableCard(
        "photoGalleryTrigger",
        "photoGalleryContent"
    );

    connectExpandableCard(
        "videoCardTrigger",
        "videoCardContent"
    );

    connectExpandableCard(
        "voiceCardTrigger",
        "voiceCardContent"
    );

    connectExpandableCard(
        "spotifyCardTrigger",
        "spotifyCardContent"
    );


    /* ==================================================
       FOTOĞRAF LIGHTBOX
    ================================================== */

    const photoLightbox =
        document.getElementById(
            "photoLightbox"
        );

    const lightboxImage =
        document.getElementById(
            "lightboxImage"
        );

    const closeLightboxButton =
        document.getElementById(
            "closeLightboxButton"
        );


    function openPhotoLightbox(url) {
        if (
            !photoLightbox ||
            !lightboxImage
        ) {
            return;
        }

        lightboxImage.src = url;
        photoLightbox.hidden = false;
    }


    function closePhotoLightbox() {
        if (photoLightbox) {
            photoLightbox.hidden = true;
        }
    }


    closeLightboxButton?.addEventListener(
        "click",
        closePhotoLightbox
    );


    photoLightbox?.addEventListener(
        "click",
        event => {
            if (
                event.target ===
                photoLightbox
            ) {
                closePhotoLightbox();
            }
        }
    );


    /* ==================================================
       PAYLAŞIM SAYFASI
    ================================================== */

    const shareLinkInput =
        document.getElementById(
            "shareLink"
        );

    const copyLinkButton =
        document.getElementById(
            "copyLinkButton"
        );

    const copyStatus =
        document.getElementById(
            "copyStatus"
        );

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

        if (letterId) {
            const letterUrl =
                buildLetterUrl(
                    letterId
                );

            shareLinkInput.value =
                letterUrl;

            if (previewLetterLink) {
                previewLetterLink.href =
                    letterUrl;
            }

            copyLinkButton?.addEventListener(
                "click",
                async () => {
                    try {
                        await navigator
                            .clipboard
                            .writeText(
                                letterUrl
                            );

                        copyLinkButton.textContent =
                            "Copied!";

                        if (copyStatus) {
                            copyStatus.textContent =
                                "The link has been copied.";
                        }

                    } catch {
                        shareLinkInput.select();
                        document.execCommand(
                            "copy"
                        );
                    }
                }
            );

            whatsappButton?.addEventListener(
                "click",
                () => {
                    window.open(
                        "https://wa.me/?text=" +
                        encodeURIComponent(
                            `I made a special letter for you: ${letterUrl}`
                        ),
                        "_blank"
                    );
                }
            );

            telegramButton?.addEventListener(
                "click",
                () => {
                    window.open(
                        "https://t.me/share/url?url=" +
                        encodeURIComponent(
                            letterUrl
                        ) +
                        "&text=" +
                        encodeURIComponent(
                            "I made a special letter for you."
                        ),
                        "_blank"
                    );
                }
            );

            if (nativeShareButton) {
                if (!navigator.share) {
                    nativeShareButton.hidden =
                        true;

                } else {
                    nativeShareButton
                        .addEventListener(
                            "click",
                            async () => {
                                try {
                                    await navigator
                                        .share({
                                            title:
                                                "A letter for you",
                                            text:
                                                "I made a special letter for you.",
                                            url:
                                                letterUrl
                                        });

                                } catch (error) {
                                    if (
                                        error.name !==
                                        "AbortError"
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
    }

});
