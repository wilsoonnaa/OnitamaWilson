async function fetchGameInfo(gameId, token) {
    try {
        const response = await fetch(`https://se.ifmo.ru/~s341995/api/games/${gameId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                game_id: gameId
            })
        });

        if (!response.ok) {
            alert(`HTTP error! status: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Only fetch card and position information if the game status is "ongoing" or "finished"
        if (data.status === 'ongoing' || data.status === 'finished') {
            // Store game information with cards
            const playerData = data.players.find(p => p.player_id === data.querying_player.player_id);
            const opponentData = data.players.find(p => p.player_id !== data.querying_player.player_id);

            const gameInfo = {
                gameId: gameId,
                playerId: data.querying_player.player_id,
                playerColor: data.querying_player.color,
                status: data.status,
                remainingTime: data.remaining_time,
                currentMove: data.current_move,
                playerPieces: playerData.pieces,
                opponentPieces: opponentData.pieces,
                playerCards: playerData.cards,
                opponentCards: opponentData.cards,
                currentMoveColor: data.current_move ? data.current_move.color : null,
                inviteCode: data.invite_code // Assuming invite_code is part of the response
            };

            // Store the game info in local storage under a unique key
            const storageKey = `game_${gameId}`;
            localStorage.setItem(storageKey, JSON.stringify(gameInfo));

            return gameInfo;
        } else {
            return {
                gameId: gameId,
                status: data.status,
                remainingTime: data.remaining_time,
                currentMove: data.current_move
            };
        }
    } catch (error) {
        alert(`Error fetching game info: ${error.message}`);
        return null;
    }
}

function createBoard(playerColor) {
    const gameBoard = document.querySelector('.game-board');
    gameBoard.innerHTML = ''; // Clear any existing cells

    // Create 5x5 grid
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            if (playerColor === 'blue') {
                // Blue player: bottom row is 4, rightmost column is 0
                cell.dataset.row = row; // Row 0 becomes 4, Row 1 becomes 3, ..., Row 4 becomes 0
                cell.dataset.col = 4 - col;      // Column remains the same (0 to 4)
            } else {
                // Red player: bottom row is 0, rightmost column is 4
                cell.dataset.row = 4 - row;      // Row remains the same (0 to 4)
                cell.dataset.col = col;      // Column remains the same (0 to 4)
            }
            gameBoard.appendChild(cell);
        }
    }
}

function setupInitialPieces(playerColor, playerPieces, opponentPieces) {
    clearBoard();

    // Place player's pieces
    playerPieces.forEach(piece => {
        const row = piece.y; // Use the original row coordinate
        const col = piece.x; // Use the original column coordinate
        createPiece(row, col, playerColor, piece.type === 'master');
    });

    // Place opponent's pieces
    opponentPieces.forEach(piece => {
        const row = piece.y; // Use the original row coordinate
        const col = piece.x; // Use the original column coordinate
        createPiece(row, col, playerColor === 'blue' ? 'red' : 'blue', piece.type === 'master');
    });
}

function createPiece(row, col, color, isMaster = false) {
    const cell = document.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`);
    const piece = document.createElement('div');
    piece.className = `piece ${color}${isMaster ? ' master' : ''}`;
    cell.appendChild(piece);
}

function clearBoard() {
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
        cell.innerHTML = '';
    });
}

function updateGameDisplay(gameInfo) {
    if (!gameInfo) {
        alert('Error: Invalid game info');
        return;
    }

    // Update game status
    document.querySelector('.update').textContent = gameInfo.currentMove ?
        `${gameInfo.currentMove.color.charAt(0).toUpperCase() + gameInfo.currentMove.color.slice(1)} move` :
        'Waiting';

    // Update game ID
    document.querySelector('.gameid-num').textContent = `#${gameInfo.gameId}`;

    // Update game status
    document.querySelector('.gameid-status').textContent =
        gameInfo.status.charAt(0).toUpperCase() + gameInfo.status.slice(1);

    // Update timer
    const minutes = Math.floor(gameInfo.remainingTime / 60);
    const seconds = gameInfo.remainingTime % 60;
    document.querySelector('.time').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update invite code display
    const storedGameInfo = getGameInfo(gameInfo.gameId);
    const inviteCode = storedGameInfo ? storedGameInfo.inviteCode : 'N/A';
    document.querySelector('.gameid-code').textContent = `Invite Code: ${inviteCode}`;
    document.querySelector('.gameid-code-container').style.display = 'block';

    // Update cards display
    if (gameInfo.playerPieces && gameInfo.opponentPieces) {
        updateCardsDisplay(gameInfo.playerColor, gameInfo.playerCards, gameInfo.opponentCards);

        // Update piece positions
        setupInitialPieces(gameInfo.playerColor, gameInfo.playerPieces, gameInfo.opponentPieces);
    }
}

function updateCardsDisplay(playerColor, playerCards, opponentCards) {
    const playerCardsContainer = document.querySelector('.cards-player');
    const opponentCardsContainer = document.querySelector('.cards-opposite');

    playerCardsContainer.innerHTML = '';
    opponentCardsContainer.innerHTML = '';

    playerCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.active ? 'active' : 'inactive'} ${playerColor}`;
        const imgElement = document.createElement('img');
        imgElement.src = `../assets/svg/cards/${card.card_name}.svg`;
        imgElement.alt = card.card_name;
        cardElement.appendChild(imgElement);
        playerCardsContainer.appendChild(cardElement);
    });

    opponentCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.active ? 'active' : 'inactive'} ${playerColor === 'blue' ? 'red' : 'blue'}`;
        const imgElement = document.createElement('img');
        imgElement.src = `../assets/svg/cards/${card.card_name}.svg`;
        imgElement.alt = card.card_name;
        cardElement.appendChild(imgElement);
        opponentCardsContainer.appendChild(cardElement);
    });
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

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    if (!gameId) {
        alert('Error: No game ID provided');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Error: No authentication token found');
        return;
    }

    // Fetch initial game state
    const gameInfo = await fetchGameInfo(gameId, token);
    if (gameInfo) {
        createBoard(gameInfo.playerColor);
        updateGameDisplay(gameInfo);

        // Set up periodic refresh
        setInterval(async () => {
            const updatedInfo = await fetchGameInfo(gameId, token);
            if (updatedInfo) {
                updateGameDisplay(updatedInfo);
            }
        }, 5000); // Refresh every 5 seconds
    }
});
