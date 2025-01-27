// Function to load and display games
function loadGames() {
    const gamesScrollbox = document.querySelector('.games-scrollbox');
    const availableGames = JSON.parse(localStorage.getItem('available_games') || '[]');
    
    // Filter and sort games
    const publicGames = availableGames.filter(game => !game.is_private);
    const privateGames = availableGames.filter(game => game.is_private);
    
    // Display public games first
    [...publicGames, ...privateGames].forEach(game => {
        // Format time
        let timeStr = '';
        if (game.time_per_move >= 60) {
            const minutes = Math.floor(game.time_per_move / 60);
            const seconds = game.time_per_move % 60;
            timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeStr = `0:${game.time_per_move.toString().padStart(2, '0')}`;
        }
        
        const gameItem = document.createElement('div');
        gameItem.className = 'games-scrollitem';
        
        // Add specific class for styling based on game type and status
        gameItem.classList.add(game.is_private ? 'private-game' : 'public-game');
        gameItem.classList.add(game.status);
        
        gameItem.innerHTML = `
            <div class="games-scrollid">
                #${game.game_id}
            </div>
            <div class="games-scrolltype">
                ${game.is_private ? 'Private' : 'Public'}
            </div>
            <div class="games-scrollstatus">
                ${game.status === 'ongoing' ? 'Ongoing' : 'Waiting'}
            </div>
            <div class="games-scrolljoin">
                ${timeStr}
            </div>
        `;
        
        gamesScrollbox.appendChild(gameItem);
    });

    // Color the status text
    const gameItems = document.querySelectorAll('.games-scrollitem');
    gameItems.forEach(item => {
        const statusDiv = item.querySelector('.games-scrollstatus');
        const status = statusDiv.textContent.trim().toLowerCase();
        
        if (status === 'waiting') {
            statusDiv.style.color = 'var(--clr-waiting)';
        } else if (status === 'ongoing') {
            statusDiv.style.color = 'var(--clr-ongoing)';
        }
    });
}

// Function to fetch and update games
async function fetchAndUpdateGames() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No token found. Please log in again.');
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch('https://se.ifmo.ru/~s341995/api/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch games');
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        // Store the games in localStorage - updated to use correct property
        localStorage.setItem('available_games', JSON.stringify(data.available_games || []));
        
        // Clear existing games display
        const gamesScrollbox = document.querySelector('.games-scrollbox');
        if (gamesScrollbox) {
            gamesScrollbox.innerHTML = '';
        }
        
        // Load the updated games
        loadGames();
    } catch (error) {
        console.error('Error fetching games:', error);
        if (error.message === 'Failed to fetch games') {
            localStorage.removeItem('token');
            window.location.href = '../index.html';
        }
    }
}

// Set up automatic refresh
let refreshInterval;

document.addEventListener('DOMContentLoaded', async () => {
    const refreshButton = document.getElementById('refresh-games');
    if (refreshButton) {
        refreshButton.addEventListener('click', (e) => {
            e.preventDefault();
            fetchAndUpdateGames();
        });
    }
    
    // Initial fetch and load
    await fetchAndUpdateGames();
    
    // Set up periodic refresh
    refreshInterval = setInterval(fetchAndUpdateGames, 5000);
});

// Clean up interval when leaving the page
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

// Logout function
function handleLogout() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    fetch('https://se.ifmo.ru/~s341995/api/users/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token
        })
    })
    .then(response => response.json())
    .then(data => {
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    })
    .catch(error => {
        console.error('Logout error:', error);
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    });
}

// Add logout listener
document.addEventListener('DOMContentLoaded', () => {
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});

// Token verification for games page
document.addEventListener('DOMContentLoaded', async () => {
    // Initial verification
    await verifyToken();
    
    // Set up periodic verification
    setInterval(verifyToken, 5000); // Check every minute
});

async function verifyToken() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch('https://se.ifmo.ru/~s341995/api/users/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token
            })
        });
        
        const data = await response.json();
        
        if (data.status !== 'valid') {
            localStorage.removeItem('token');
            window.location.href = '../index.html';
            return;
        }
    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    }
}