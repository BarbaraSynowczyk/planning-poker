document.addEventListener("DOMContentLoaded", () => {
    const lightbox = document.getElementById("imageLightbox");
    const lightboxImage = document.getElementById("imageLightboxImage");
    const closeButton = document.getElementById("imageLightboxClose");
    const prevButton = document.getElementById("imageLightboxPrev");
    const nextButton = document.getElementById("imageLightboxNext");

    let images = [];
    let currentImageIndex = 0;

    if (!lightbox || !lightboxImage || !closeButton) {
        return;
    }

    document.addEventListener("click", (event) => {
        const image = event.target.closest(
            ".ticket-description img, .comment-bubble img, .comment-body img, .comment-content img"
        );
        if (!image) {
            return;
        }

        const imageContainer = image.closest(
            ".ticket-description, .comment-bubble, .comment-body, .comment-content, .comment"
        );

        images = Array.from(
            imageContainer.querySelectorAll("img")
        );

        currentImageIndex = images.indexOf(image);

        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt || "";

        prevButton.style.display = images.length > 1 ? "block" : "none";
        nextButton.style.display = images.length > 1 ? "block" : "none";

        lightbox.classList.add("active");
    });

    closeButton.addEventListener("click", () => {
        lightbox.classList.remove("active");
        lightboxImage.src = "";
    });

    lightbox.addEventListener("click", (event) => {
       if (event.target === lightbox) {
           lightbox.classList.remove("active");
           lightboxImage.src = "";
       }
    });

     document.addEventListener("keydown", (event) => {
         if (event.key === "Escape") {
             lightbox.classList.remove("active");
             lightboxImage.src = "";
         }
     });

     nextButton.addEventListener("click", () => {
         if (images.length <= 1) {
             return;
         }

         currentImageIndex =(currentImageIndex + 1) % images.length;
         lightboxImage.src = images[currentImageIndex].src;
         lightboxImage.alt = images[currentImageIndex].alt || "";
     });

     prevButton.addEventListener("click", () => {
         if (images.length <= 1) {
             return;
         }

         currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;

         lightboxImage.src = images[currentImageIndex].src;
         lightboxImage.alt = images[currentImageIndex].alt || "";
     });
});