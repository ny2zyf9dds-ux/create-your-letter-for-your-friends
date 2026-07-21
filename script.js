const envelope = document.getElementById("envelope");
const createButton = document.getElementById("createButton");

envelope.addEventListener("click", () => {
    envelope.classList.toggle("open");
});

createButton.addEventListener("click", () => {
    window.location.href = "create.html";
});
