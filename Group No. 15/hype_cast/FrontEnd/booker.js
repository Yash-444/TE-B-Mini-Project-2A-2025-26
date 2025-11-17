// booker.js

document.addEventListener('DOMContentLoaded', function() {
    const initialForm = document.getElementById('initialForm');
    const bookingForm = document.getElementById('bookingForm');
    const nextBtn = document.getElementById('nextBtn');
    const artistInitial = document.getElementById('artistInitial');
    const artistName = document.getElementById('artistName');
    const loading = document.getElementById('loading');

    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (artistInitial.value.trim() === '') {
                alert('Please enter an artist name');
                return;
            }
            artistName.value = artistInitial.value.trim();
            initialForm.classList.remove('visible');
            initialForm.classList.add('hidden');
            setTimeout(function() {
                bookingForm.classList.remove('hidden');
                bookingForm.classList.add('visible');
            }, 300);
        });
    } else {
        console.error('Next button not found!');
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            loading.classList.remove('hidden');

            const data = {
                artistName: artistName.value.trim(),
                city: document.getElementById('city').value.trim(),
                ticketPrice: parseFloat(document.getElementById('estimatedCost').value),
                genre: document.getElementById('genre').value.trim(),
                date: document.getElementById('date').value.trim()
            };

            if (isNaN(data.ticketPrice) || data.ticketPrice <= 0) {
                alert('Please enter a valid positive ticket price.');
                loading.classList.add('hidden');
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:5000/agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'API error');
                }

                const result = await response.json();
                localStorage.setItem('agentResult', JSON.stringify(result));
                window.location.href = 'agent_analysis.html';
            } catch (error) {
                alert('Something went wrong. ' + error.message);
            } finally {
                loading.classList.add('hidden');
            }
        });
    } else {
        console.error('Booking form not found!');
    }
});
