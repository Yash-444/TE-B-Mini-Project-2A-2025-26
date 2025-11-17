// attendee.js

document.addEventListener("DOMContentLoaded", () => {
    // Get the form element to attach the submit listener
    const hypeForm = document.getElementById("hypeForm");
    const artistInput = document.getElementById("artistName");
    const priceInput = document.getElementById("ticketPrice");

    artistInput.addEventListener("input", (e) => {
        localStorage.setItem("currentArtist", e.target.value.trim());
    });
    
    // Set the input field listener for form state persistence
    // This function is what gets triggered when the "Check Hype" button is pressed (due to form submit)
    hypeForm.addEventListener("submit", async function(e) {
        // !!! THIS IS THE CRUCIAL FIX !!!
        // Stop the default form submission behavior (which causes a page reload)
        e.preventDefault(); 
        // -----------------------------

        const artist = localStorage.getItem("currentArtist");
        const price = priceInput.value.trim();
        const nextButton = document.getElementById("Nextbtn");
        const loadingElement = document.getElementById("loading");

        if (!artist || !price) {
            alert("⚠️ Please enter both artist name and ticket price");
            return;
        }

        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            alert("⚠️ Please enter a valid positive ticket price");
            return;
        }

        // Show loading state and disable button
        if (loadingElement) loadingElement.classList.remove("hidden");
        if (nextButton) nextButton.setAttribute("disabled", "true");


        try {
            const response = await fetch("http://127.0.0.1:5000/attendee", {
                method: "POST",
                // Crucial header for Flask to parse JSON body
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    artistName: artist,
                    ticketPrice: numericPrice // Use the validated numeric price
                })
            });

            const result = await response.json();

            // Check for successful HTTP status (response.ok) AND application status
            if (response.ok && result.status === "success") {
                localStorage.setItem("attendeeResult", JSON.stringify(result));
                // Redirect to the analysis page
                window.location.href = "attendee_analysis.html";
            } else {
                // Handle non-200 responses or application-level errors (like artist not found)
                const errorMsg = result.error || "Unknown issue on the server.";
                alert(`❌ Error: ${errorMsg}`);
            }
        } catch (error) {
            alert("❌ Failed to connect to the API. Please ensure the Flask server is running at http://127.0.0.1:5000.");
        } finally {
            // Hide loading state and re-enable button
            if (loadingElement) loadingElement.classList.add("hidden");
            if (nextButton) nextButton.removeAttribute("disabled");
        }
    });
    
    // Removed the redundant 'window.submitAttendee' function.
});