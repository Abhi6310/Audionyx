// MODAL STUFFS FOR LIBRAY (adding a song to library)
// Wait for DOM content to load before running the script
document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('uploadModal');
    const submitBtn = document.getElementById('submitBtn');

    // Open the modal when the 'Add song' button is clicked
    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'flex'; // Use flex to center the modal content
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

    // Handle the file upload form submission
    submitBtn.addEventListener('click', () => {
        const fileType = document.getElementById('file-type').value;
        const fileName = document.getElementById('file-name').value;

        // Display the chosen options (or process as needed)
        console.log(`File Type: ${fileType}`);
        console.log(`File Name: ${fileName || 'No name entered'}`);

        // Close the modal after submission
        modal.style.display = 'none';

        // You can implement actual file upload logic here
    });
});

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function() {
    const fileTypeSelect = document.getElementById("file-type");
    const mp3Input = document.getElementById("mp3-upload");
    const youtubeInput = document.getElementById("youtube-link");
    const spotifyInput = document.getElementById("spotify-link");

    // Add event listener for when the file type is changed
    fileTypeSelect.addEventListener("change", function() {
        // Hide all inputs first
        mp3Input.style.display = "none";
        youtubeInput.style.display = "none";
        spotifyInput.style.display = "none";

        // Show the corresponding input based on the selection
        if (fileTypeSelect.value === "mp3") {
            mp3Input.style.display = "block";
        } else if (fileTypeSelect.value === "youtube") {
            youtubeInput.style.display = "block";
        } else if (fileTypeSelect.value === "spotify") {
            spotifyInput.style.display = "block";
        }
    });

    // Trigger change event on page load to show the initial input type
    fileTypeSelect.dispatchEvent(new Event("change"));
});
