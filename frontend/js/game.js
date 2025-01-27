function createBoard(playerColor) {
    const gameBoard = document.querySelector('.game-board');
    
    // Create 5x5 grid
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.row = Math.floor(i / 5);
        cell.dataset.col = i % 5;
        gameBoard.appendChild(cell);
    }
    
    // Initial piece setup based on player color
    setupInitialPieces(playerColor);
}

function setupInitialPieces(playerColor) {
    const isPlayerBlue = playerColor === 'blue';
    
    // Player's pieces (bottom)
    createPiece(4, 0, playerColor);
    createPiece(4, 1, playerColor);
    createPiece(4, 2, playerColor, true); // Master
    createPiece(4, 3, playerColor);
    createPiece(4, 4, playerColor);
    
    // Opponent's pieces (top)
    const opponentColor = isPlayerBlue ? 'red' : 'blue';
    createPiece(0, 0, opponentColor);
    createPiece(0, 1, opponentColor);
    createPiece(0, 2, opponentColor, true); // Master
    createPiece(0, 3, opponentColor);
    createPiece(0, 4, opponentColor);
}

function createPiece(row, col, color, isMaster = false) {
    const cell = document.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`);
    const piece = document.createElement('div');
    piece.className = `piece ${color}${isMaster ? ' master' : ''}`;
    cell.appendChild(piece);
}

document.addEventListener('DOMContentLoaded', () => {
    // Get player color from game state or API
    const playerColor = 'red' // This function needs to be implemented
    createBoard(playerColor);
});