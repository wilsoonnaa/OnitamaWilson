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
                inviteCode: data.invite_code, // Assuming invite_code is part of the response
                winnerId: data.winner_id || null // Store winner_id if it exists
            };

            // Store the game info in local storage under a unique key
            const storageKey = `game_${gameId}`;
            const storedGameInfo = getGameInfo(gameId);

            if (storedGameInfo) {
                // Merge the new data with the existing data, preserving the invite code
                const updatedGameInfo = {
                    ...storedGameInfo,
                    ...gameInfo,
                    inviteCode: storedGameInfo.inviteCode || gameInfo.inviteCode
                };
                localStorage.setItem(storageKey, JSON.stringify(updatedGameInfo));
            } else {
                localStorage.setItem(storageKey, JSON.stringify(gameInfo));
            }

            return gameInfo;
        } else {
            return {
                gameId: gameId,
                status: data.status,
                remainingTime: data.remaining_time,
                currentMove: data.current_move,
                winnerId: data.winner_id || null
            };
        }
    } catch (error) {
        alert(`Error fetching game info: ${error.message}`);
        window.location.href = './games.html';
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

    // Find and style the throne cells
    const redThroneCell = document.querySelector('.board-cell[data-row="0"][data-col="2"]');
    const blueThroneCell = document.querySelector('.board-cell[data-row="4"][data-col="2"]');

    if (redThroneCell) {
        redThroneCell.classList.add('master-red');
    }

    if (blueThroneCell) {
        blueThroneCell.classList.add('master-blue');
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

    // Update game status and winner information
    const updateElement = document.querySelector('.update');
    if (gameInfo.status === 'finished') {
        const winnerColor = gameInfo.winnerId === gameInfo.playerId ? gameInfo.playerColor : (gameInfo.playerColor === 'blue' ? 'red' : 'blue');
        updateElement.textContent = `${winnerColor.charAt(0).toUpperCase() + winnerColor.slice(1)} wins!`;
    } else {
        updateElement.textContent = gameInfo.currentMove ?
            `${gameInfo.currentMove.color.charAt(0).toUpperCase() + gameInfo.currentMove.color.slice(1)} move` :
            'Waiting';
    }

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
    const inviteCodeContainer = document.querySelector('.gameid-code-container');
    if (storedGameInfo && storedGameInfo.inviteCode) {
        document.querySelector('.gameid-code').textContent = `Invite Code: ${storedGameInfo.inviteCode}`;
        inviteCodeContainer.style.display = 'block';
    } else {
        inviteCodeContainer.style.display = 'none';
    }

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
        createdAt: new Date().toISOString(),
        winnerId: data.winner_id || null
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

let selectedPieceCell = null;
let selectedCard = null;
const moveDeltas = {
    'Tiger': [{dx: 0, dy: 2}, {dx: 0, dy: -1}],
    'Dragon': [{dx: -2, dy: 1}, {dx: 2, dy: 1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}],
    'Frog': [{dx: -2, dy: 0}, {dx: -1, dy: 1}, {dx: 1, dy: -1}],
    'Rabbit': [{dx: 2, dy: 0}, {dx: 1, dy: 1}, {dx: -1, dy: -1}],
    'Crab': [{dx: 0, dy: 1}, {dx: -2, dy: 0}, {dx: 2, dy: 0}],
    'Elephant': [{dx: -1, dy: 1}, {dx: 1, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}],
    'Goose': [{dx: -1, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 1, dy: -1}],
    'Rooster': [{dx: 1, dy: 1}, {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: -1, dy: -1}],
    'Monkey': [{dx: -1, dy: 1}, {dx: 1, dy: 1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}],
    'Mantis': [{dx: -1, dy: 1}, {dx: 1, dy: 1}, {dx: 0, dy: -1}],
    'Horse': [{dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 0, dy: -1}],
    'Ox': [{dx: 0, dy: 1}, {dx: 1, dy: 0}, {dx: 0, dy: -1}],
    'Crane': [{dx: 0, dy: 1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}],
    'Boar': [{dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 1, dy: 0}],
    'Eel': [{dx: -1, dy: 1}, {dx: 1, dy: 0}, {dx: -1, dy: -1}],
    'Cobra': [{dx: 1, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: -1}]
};

const cardIdMapping = {
    'Tiger': 1,
    'Dragon': 2,
    'Frog': 3,
    'Rabbit': 4,
    'Crab': 5,
    'Elephant': 6,
    'Goose': 7,
    'Rooster': 8,
    'Monkey': 9,
    'Mantis': 10,
    'Horse': 11,
    'Ox': 12,
    'Crane': 13,
    'Boar': 14,
    'Eel': 15,
    'Cobra': 16
};

// Function to make a move
async function makeMove(fromCell, toCell, card) {
    const gameId = getCurrentGameId();
    const token = localStorage.getItem('token');

    if (!gameId || !token) {
        console.error('Missing game ID or token');
        return;
    }

    const gameInfo = getGameInfo(gameId);
    if (!gameInfo) {
        console.error('Game info not found');
        return;
    }

    const cardName = card.querySelector('img').alt;
    const cardId = cardIdMapping[cardName];

    if (!cardId) {
        console.error('Invalid card name:', cardName);
        return;
    }

    const moveData = {
        token: token,
        player_id: gameInfo.playerId,
        from_x: parseInt(fromCell.dataset.col),
        from_y: parseInt(fromCell.dataset.row),
        to_x: parseInt(toCell.dataset.col),
        to_y: parseInt(toCell.dataset.row),
        card_id: cardId
    };

    // Debugging: Alert the move data
    //alert(JSON.stringify(moveData, null, 2));

    try {
        const response = await fetch('https://se.ifmo.ru/~s341995/api/games/make_move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moveData)
        });
        async function makeMove(fromCell, toCell, card) {
    const gameId = getCurrentGameId();
    const token = localStorage.getItem('token');

    if (!gameId || !token) {
        console.error('Missing game ID or token');
        return;
    }

    const gameInfo = getGameInfo(gameId);
    if (!gameInfo) {
        console.error('Game info not found');
        return;
    }

    const cardName = card.querySelector('img').alt;
    const cardId = cardIdMapping[cardName];

    if (!cardId) {
        console.error('Invalid card name:', cardName);
        return;
    }

    const moveData = {
        token: token,
        player_id: gameInfo.playerId,
        from_x: parseInt(fromCell.dataset.col),
        from_y: parseInt(fromCell.dataset.row),
        to_x: parseInt(toCell.dataset.col),
        to_y: parseInt(toCell.dataset.row),
        card_id: cardId
    };

    // Debugging: Alert the move data
    //alert(JSON.stringify(moveData, null, 2));

    try {
        const response = await fetch('https://se.ifmo.ru/~s341995/api/games/make_move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moveData)
        });
        clearSelections();
        const data = await response.json();
        
        if (data.status === 'ongoing') {
            // Clear selections after successful move
            clearSelections();
            // Update game display
            const updatedInfo2 = await fetchGameInfo(gameId, token);
            if (updatedInfo2) {
                updateGameDisplay(updatedInfo);
            }
            //updateGameDisplay(data);
        } else {
            console.error('Move failed:', data.message);
            clearSelections();
            //alert('Failed to make move: ' + data.message);
        }
    } catch (error) {
        clearSelections();
        console.error('Error making move:', error);
        //alert('Error making move. Please try again.');
    }
}


        const data = await response.json();
        if (data.status === 'ongoing') {
            // Clear selections after successful move
            clearSelections();
            // Update game display
            //updateGameDisplay(data);
        } else {
            console.error('Move failed:', data.message);
            //alert('Failed to make move: ' + data.message);
        }
    } catch (error) {
        console.error('Error making move:', error);
        //alert('Error making move. Please try again.');
    }
}

function getCurrentGameId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function showPossibleMoves(fromCell, card) {
    // Clear any previously highlighted moves
    clearPossibleMoves();

    if (!fromCell || !card) return;

    // Check if the selected cell has a piece
    const piece = fromCell.querySelector('.piece');
    if (!piece) {
        console.log('No piece in selected cell');
        return;
    }

    const fromRow = parseInt(fromCell.dataset.row);
    const fromCol = parseInt(fromCell.dataset.col);
    const cardName = card.querySelector('img').alt;
    const gameInfo = getGameInfo(getCurrentGameId());

    if (!moveDeltas[cardName] || !gameInfo) return;

    const deltas = moveDeltas[cardName];
    const yMultiplier = gameInfo.playerColor === 'red' ? 1 : -1;
    const xMultiplier = gameInfo.playerColor === 'red' ? 1 : -1;

    deltas.forEach(delta => {
        const toRow = fromRow + (delta.dy * yMultiplier);
        const toCol = fromCol + (delta.dx * xMultiplier);

        // Check if the move is within board boundaries
        if (toRow >= 0 && toRow < 5 && toCol >= 0 && toCol < 5) {
            const targetCell = document.querySelector(
                `.board-cell[data-row="${toRow}"][data-col="${toCol}"]`
            );

            if (targetCell) {
                // Check if target cell has a piece of the same color
                const targetPiece = targetCell.querySelector('.piece');
                if (!targetPiece || !targetPiece.classList.contains(gameInfo.playerColor)) {
                    targetCell.classList.add('possible-move');
                }
            }
        }
    });
}

function clearPossibleMoves() {
    document.querySelectorAll('.board-cell.possible-move').forEach(cell => {
        cell.classList.remove('possible-move');
    });
}

function clearSelections() {
    if (selectedPieceCell) {
        selectedPieceCell.classList.remove('active');
        selectedPieceCell = null;
    }
    if (selectedCard) {
        selectedCard.classList.remove('selected');
        selectedCard = null;
    }
    clearPossibleMoves();
}

document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.querySelector('.game-board');
    const playerCardsContainer = document.querySelector('.cards-player');

    if (gameBoard) {
        gameBoard.addEventListener('click', (e) => {
            const cell = e.target.closest('.board-cell');

            if (!cell) return;

            // If a card is selected, treat this as the destination cell
            if (selectedCard) {
                if (cell.classList.contains('possible-move')) {
                    //alert('Making move from (' + selectedPieceCell.dataset.row + ',' + selectedPieceCell.dataset.col + ') to (' + cell.dataset.row + ',' + cell.dataset.col + ')');
                    makeMove(selectedPieceCell, cell, selectedCard);
                    clearSelections();
                }
                return;
            }

            // Remove highlight from previously selected cell
            if (selectedPieceCell) {
                selectedPieceCell.classList.remove('active');
            }

            // If clicking the same cell, deselect it
            if (selectedPieceCell === cell) {
                selectedPieceCell = null;
                return;
            }

            // Select new cell
            selectedPieceCell = cell;
            cell.classList.add('active');
        });
    }

    if (playerCardsContainer) {
        playerCardsContainer.addEventListener('click', (e) => {
            const cardElement = e.target.closest('.card');

            if (!cardElement) return;

            const gameInfo = getGameInfo(getCurrentGameId());
            if (!gameInfo) {
                console.error('Game info not found');
                return;
            }

            // Check if the current move color matches the player's color
            if (gameInfo.currentMoveColor !== gameInfo.playerColor) {
                alert('It is not your turn to move.');
                return;
            }

            if (!cardElement.classList.contains('active')) return;

            // If no cell is selected, don't allow card selection
            if (!selectedPieceCell) return;

            // Remove selected class from previously selected card
            if (selectedCard) {
                selectedCard.classList.remove('selected');
            }

            // If clicking the same card, deselect it
            if (selectedCard === cardElement) {
                selectedCard = null;
                return;
            }

            // Select new card
            selectedCard = cardElement;
            cardElement.classList.add('selected');

            if (selectedPieceCell) {
                showPossibleMoves(selectedPieceCell, selectedCard);
            }
        });
    }
});