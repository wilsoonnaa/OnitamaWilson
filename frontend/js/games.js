// Store both intervals
let autoRefreshInterval;
let buttonRefreshInterval;

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
    autoRefreshInterval = setInterval(fetchAndUpdateGames, 5000);
});

// Clean up interval when leaving the page
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    if (buttonRefreshInterval) {
        clearInterval(buttonRefreshInterval);
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

// Store game information when creating a new game
function storeGameInfo(data) {
    // Create a unique key for this game using game_id
    const storageKey = `game_${data.game_id}`;
    
    const gameInfo = {
        gameId: data.game_id,
        inviteCode: data.invite_code,
        playerId: data.player_id,
        playerColor: data.player_color,
        status: data.status,
        timePerMove: data.available_games.find(g => g.game_id === data.game_id)?.time_per_move,
        createdAt: new Date().toISOString()
    };
    
    // Store this specific game's data under its unique key
    localStorage.setItem(storageKey, JSON.stringify(gameInfo));
    
    return gameInfo;
}

// Helper function to retrieve a specific game's data
function getGameInfo(gameId) {
    const storageKey = `game_${gameId}`;
    const gameData = localStorage.getItem(storageKey);
    return gameData ? JSON.parse(gameData) : null;
}

// Define the form submission handler function before the DOMContentLoaded event
function handleGameFormSubmit(e) {
    e.preventDefault();
    
    const is_private = document.getElementById('isPrivate').checked;
    const timePerMove = document.getElementById('timePerMove').value.toString();
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Please log in first');
        return;
    }

    // Validate time
    if (!timePerMove || parseInt(timePerMove) < 30 || parseInt(timePerMove) > 1000) {
        alert('Time per move must be between 30 and 1000 seconds');
        return;
    }

    // Disable form while submitting
    const submitButton = document.querySelector('.submit-btn');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating...';

    fetch('https://se.ifmo.ru/~s341995/api/games/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token,
            is_private: is_private,
            time: timePerMove
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);
        if (data.game_id) {
            // Store game info before redirecting
            storeGameInfo(data);
            console.log('Redirecting to:', `game.html?id=${data.game_id}`);
            window.location.href = `game.html?id=${data.game_id}`;
        } else {
            throw new Error(data.message || 'Failed to create game');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message || 'Failed to create game. Please try again.');
    })
    .finally(() => {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.textContent = 'Create Game';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const createGamesLink = document.getElementById('create-games');
    const refreshGamesLink = document.getElementById('refresh-games');
    const gamesScrollbox = document.querySelector('.games-scrollbox');

    if (!createGamesLink || !refreshGamesLink || !gamesScrollbox) {
        console.error('Required elements not found');
        return;
    }

    createGamesLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Clear both intervals
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
        if (buttonRefreshInterval) {
            clearInterval(buttonRefreshInterval);
        }
        
        gamesScrollbox.innerHTML = `
            <div class="create-game-form">
                <h2>Create Game</h2>
                <form id="createGameForm" class="game-form">
                    <div class="form-group">
                        <label for="isPrivate">Private Game:</label>
                        <input type="checkbox" id="isPrivate" name="isPrivate">
                    </div>
                    <div class="form-group">
                        <label for="timePerMove">Time per move (seconds):</label>
                        <input type="number" id="timePerMove" name="timePerMove" 
                               min="30" max="1000" value="120" required>
                    </div>
                    <button type="submit" class="submit-btn">Create Game</button>
                </form>
            </div>
        `;

        const form = document.getElementById('createGameForm');
        if (form) {
            form.addEventListener('submit', handleGameFormSubmit);
        }
    });

    refreshGamesLink.addEventListener('click', (e) => {
        e.preventDefault();
        const createGameForm = gamesScrollbox.querySelector('.create-game-form');
        
        if (createGameForm) {
            gamesScrollbox.innerHTML = '';
            
            if (!buttonRefreshInterval) {
                buttonRefreshInterval = setInterval(fetchAndUpdateGames, 5000);
            }
            
            fetchAndUpdateGames().catch(error => {
                console.error('Failed to fetch games:', error);
                gamesScrollbox.innerHTML = '<p class="error">Failed to load games. Please try again.</p>';
            });
        }
    });
});

// Add click handler for game items
document.addEventListener('click', (e) => {
    // Find the closest parent with games-scrollitem class
    const gameItem = e.target.closest('.games-scrollitem');
    if (gameItem) {
        // Stop both refresh intervals while form is shown
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
        if (buttonRefreshInterval) {
            clearInterval(buttonRefreshInterval);
        }

        // Extract game ID from the games-scrollid div
        const gameIdElement = gameItem.querySelector('.games-scrollid');
        const gameId = gameIdElement ? gameIdElement.textContent.trim().replace('#', '') : null;
        
        // Check if it's a public or private game
        const isPrivate = !gameItem.classList.contains('public-game');
        const gamesScrollbox = document.querySelector('.games-scrollbox');

        // Clear current content and show join form
        gamesScrollbox.innerHTML = `
            <div class="join-game-form">
                <h2>Join Game #${gameId}</h2>
                <form id="joinGameForm" class="game-form" data-game-id="${gameId}" data-is-private="${isPrivate}">
                    ${isPrivate ? `
                        <div class="form-group">
                            <label for="inviteCode">Invite Code:</label>
                            <input type="text" id="inviteCode" name="inviteCode" required>
                        </div>
                    ` : ''}
                    <button type="submit" class="submit-btn">Join Game</button>
                </form>
            </div>
        `;

        // Set up the form submission handler
        const form = document.getElementById('joinGameForm');
        if (form) {
            form.addEventListener('submit', handleJoinGameSubmit);
        }
    }
});