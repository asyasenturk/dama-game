// botGame.js

let selectedCell = null;
let myTurn = true;
let timerInterval;
let timeLeft = 20;
const timerDisplay = document.getElementById('timer');

const board = document.getElementById('board');
const status = document.getElementById('status');

drawBoard();
updateTurnText();

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 20;
  timerDisplay.textContent = `Süre: ${timeLeft}s`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Süre: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerDisplay.textContent = "Süre doldu!";
      alert("Süre doldu! Hamle hakkını kaybettin.");
      myTurn = false;
      updateTurnText();
      setTimeout(botMove, 500);
    }
  }, 1000);
}

function drawBoard() {
  board.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      const isDark = (row + col) % 2 === 1;
      cell.classList.add(isDark ? 'dark' : 'light');
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (isDark && row < 3) {
        cell.textContent = '●';
        cell.classList.add('bot');
      } else if (isDark && row > 4) {
        cell.textContent = '●';
        cell.classList.add('player');
      }

      cell.addEventListener('click', handleClick);
      board.appendChild(cell);
    }
  }
}

function isKing(cell) {
  return cell.textContent === '♛';
}

function movePiece(from, to) {
  const fromIndex = from.row * 8 + from.col;
  const toIndex = to.row * 8 + to.col;
  const fromCell = board.children[fromIndex];
  const toCell = board.children[toIndex];

  toCell.textContent = fromCell.textContent;
  toCell.className = fromCell.className;

  fromCell.textContent = '';
  fromCell.className = (from.row + from.col) % 2 === 1 ? 'cell dark' : 'cell light';

  if (to.row === 0 && toCell.classList.contains('player')) {
    toCell.textContent = '♛';
  }
  if (to.row === 7 && toCell.classList.contains('bot')) {
    toCell.textContent = '♛';
  }
}

function handleClick(e) {
  if (!myTurn) return;

  const cell = e.target;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  if (!selectedCell) {
    if (cell.classList.contains('player')) {
      selectedCell = cell;
      cell.style.border = '2px solid yellow';
    }
    return;
  }

  const from = {
    row: parseInt(selectedCell.dataset.row),
    col: parseInt(selectedCell.dataset.col),
  };
  const to = { row, col };
  const rowDiff = to.row - from.row;
  const colDiff = Math.abs(to.col - from.col);
  const targetIndex = to.row * 8 + to.col;
  const targetCell = board.children[targetIndex];

  if (targetCell.textContent !== '') return;

  if (colDiff === 1 && rowDiff === -1) {
    movePiece(from, to);
    selectedCell.style.border = '1px solid #333';
    selectedCell = null;
    myTurn = false;
    checkGameOver();
    setTimeout(botMove, 500);
  }
}

function updateTurnText() {
  if (myTurn) {
    status.textContent = "Sıra sende!";
    startTimer();
  } else {
    status.textContent = "Bot düşünüyor...";
    clearInterval(timerInterval);
    timerDisplay.textContent = '';
  }
}

function botCanEatFrom(row, col) {
  const cell = board.children[row * 8 + col];
  const isDama = isKing(cell);
  const eatDirs = isDama ? [[2, -2], [2, 2], [-2, -2], [-2, 2]] : [[2, -2], [2, 2]];
  for (let [dr, dc] of eatDirs) {
    const toRow = row + dr;
    const toCol = col + dc;
    const midRow = row + dr / 2;
    const midCol = col + dc / 2;
    if (
      toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8 &&
      midRow >= 0 && midRow < 8 && midCol >= 0 && midCol < 8
    ) {
      const midIndex = midRow * 8 + midCol;
      const toIndex = toRow * 8 + toCol;
      const midCell = board.children[midIndex];
      const toCell = board.children[toIndex];
      if (
        midCell.classList.contains('player') &&
        toCell.textContent === ''
      ) {
        return true;
      }
    }
  }
  return false;
}

function botMoveFrom(row, col) {
  const cell = board.children[row * 8 + col];
  const isDama = isKing(cell);
  const eatDirs = isDama ? [[2, -2], [2, 2], [-2, -2], [-2, 2]] : [[2, -2], [2, 2]];
  for (let [dr, dc] of eatDirs) {
    const toRow = row + dr;
    const toCol = col + dc;
    const midRow = row + dr / 2;
    const midCol = col + dc / 2;
    if (
      toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8 &&
      midRow >= 0 && midRow < 8 && midCol >= 0 && midCol < 8
    ) {
      const midIndex = midRow * 8 + midCol;
      const toIndex = toRow * 8 + toCol;
      const midCell = board.children[midIndex];
      const toCell = board.children[toIndex];
      if (
        midCell.classList.contains('player') &&
        toCell.textContent === ''
      ) {
        midCell.textContent = '';
        midCell.className = (midRow + midCol) % 2 === 1 ? 'cell dark' : 'cell light';
        movePiece({ row, col }, { row: toRow, col: toCol });
        setTimeout(() => {
          if (botCanEatFrom(toRow, toCol)) {
            botMoveFrom(toRow, toCol);
          } else {
            myTurn = true;
            checkGameOver();
            updateTurnText();
          }
        }, 500);
        return;
      }
    }
  }
}

function botMove() {
  const directions = [[1, -1], [1, 1]];
  const reverseDirections = [[-1, -1], [-1, 1]];
  const jumpDirs = [[2, -2], [2, 2]];
  const reverseJumps = [[-2, -2], [-2, 2]];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      const cell = board.children[index];
      if (!cell.classList.contains('bot')) continue;

      const isDama = isKing(cell);
      const eatDirs = isDama ? jumpDirs.concat(reverseJumps) : jumpDirs;

      for (let [dr, dc] of eatDirs) {
        const toRow = row + dr;
        const toCol = col + dc;
        const midRow = row + dr / 2;
        const midCol = col + dc / 2;

        if (
          toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8 &&
          midRow >= 0 && midRow < 8 && midCol >= 0 && midCol < 8
        ) {
          const midIndex = midRow * 8 + midCol;
          const toIndex = toRow * 8 + toCol;
          const midCell = board.children[midIndex];
          const toCell = board.children[toIndex];

          if (
            (midCell.classList.contains('player') || midCell.textContent === '♛') &&
            toCell.textContent === ''
          ) {
            midCell.textContent = '';
            midCell.className = (midRow + midCol) % 2 === 1 ? 'cell dark' : 'cell light';
            const from = { row, col };
            const to = { row: toRow, col: toCol };
            movePiece(from, to);
            setTimeout(() => {
              if (botCanEatFrom(to.row, to.col)) {
                botMoveFrom(to.row, to.col);
              } else {
                myTurn = true;
                checkGameOver();
                updateTurnText();
              }
            }, 500);
            return;
          }
        }
      }
    }
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      const cell = board.children[index];
      if (!cell.classList.contains('bot')) continue;

      const isDama = isKing(cell);
      const allDirs = isDama ? directions.concat(reverseDirections) : directions;

      for (let [dr, dc] of allDirs) {
        const toRow = row + dr;
        const toCol = col + dc;
        const toIndex = toRow * 8 + toCol;

        if (toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8) {
          const toCell = board.children[toIndex];
          if (toCell.textContent === '') {
            const from = { row, col };
            const to = { row: toRow, col: toCol };
            movePiece(from, to);
            myTurn = true;
            checkGameOver();
            updateTurnText();
            return;
          }
        }
      }
    }
  }

  myTurn = true;
  updateTurnText();
}

function checkGameOver() {
  let playerCount = 0;
  let botCount = 0;

  for (let cell of board.children) {
    if (cell.classList.contains('player')) playerCount++;
    if (cell.classList.contains('bot')) botCount++;
  }

  if (playerCount === 0) {
    showEndScreen("BOT KAZANDI! 🤖");
  } else if (botCount === 0) {
    showEndScreen("TEBRİKLER! SEN KAZANDIN 🏆");
  }
}

function showEndScreen(message) {
  clearInterval(timerInterval);
  document.getElementById("winnerMessage").textContent = message;
  document.getElementById("endScreen").style.display = "block";

  status.textContent = '';
  timerDisplay.textContent = '';
}
