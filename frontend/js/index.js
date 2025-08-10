// hided the contextmenu when the user right clicks on the video.

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".video").forEach((v) => {
        v.addEventListener("contextmenu", (e) => e.preventDefault());
    });
});

