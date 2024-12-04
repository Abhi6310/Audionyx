// Wait for DOM content to load before running the script
document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('uploadModal');
    const submitBtn = document.getElementById('submitBtn');

    // Open the modal when the 'Add song' button is clicked
    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Close the modal when the 'x' (close) button is clicked
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close the modal when the user clicks anywhere outside of the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle the form submission to send URL, track name, genre, and file type
    submitBtn.addEventListener('click', () => {
        // Close the modal after submission
        modal.style.display = 'none';
    });
});

// Wait for the DOM to load and handle the file type input changes
document.addEventListener("DOMContentLoaded", function () {
    const fileTypeSelect = document.getElementById("song-type");
    const youtubeInput = document.getElementById("youtube-link");
    const spotifyInput = document.getElementById("spotify-link");

    // Add event listener for when the file type is changed
    fileTypeSelect.addEventListener("change", function () {
        // Hide all inputs first
        youtubeInput.style.display = "none";
        spotifyInput.style.display = "none";

        // Show the corresponding input based on the selection
        if (fileTypeSelect.value === "youtube") {
            youtubeInput.style.display = "block";
        } else if (fileTypeSelect.value === "spotify") {
            spotifyInput.style.display = "block";
        }
    });

    // Trigger change event on page load to show the initial input type
    fileTypeSelect.dispatchEvent(new Event("change"));
});
