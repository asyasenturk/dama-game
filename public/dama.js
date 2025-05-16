// dama.js - Türk Daması Kurallarına Göre Online 2 Kişilik Oyun
// URL'den ?room=xxx parametresini al
const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');
localStorage.setItem('room', room);

const socket = io();


if (!room) {
  alert("Oda bilgisi eksik! Lütfen geçerli bir link ile giriş yap.");
  window.location.href = "mode.html";
} else {
  localStorage.setItem('room', room);
  socket.emit('joinRoom', room);
}
let playerNumber = null;

let myTurn = false;
let selectedCell = null;
let timerInterval;
let timeLeft = 20;
const timerDisplay = document.getElementById('timer');
const board = document.getElementById('board');
const status = document.getElementById('status');

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
    }
  }, 1000);
}

 function drawBoard(boardState = null) {
  board.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      const isDark = (row + col) % 2 === 1;
      cell.classList.add(isDark ? 'dark' : 'light');
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (boardState && boardState[row][col]) {
        const piece = boardState[row][col];
        cell.textContent = piece.isQueen ? '♛' : '●';
        cell.classList.add(`player${piece.player}`);
      } else if (!boardState) {
        // Başlangıç taşları
        if (row >= 2 && row <= 3 && isDark) {
          cell.textContent = '●';
          cell.classList.add('player2');
        } else if (row >= 5 && row <= 6 && isDark) {
          cell.textContent = '●';
          cell.classList.add('player1');
        }
      }

      cell.addEventListener('click', handleClick);
      board.appendChild(cell);
    }
  }
}

function getBoardState() {
  const state = [];
  for (let row = 0; row < 8; row++) {
    state[row] = [];
    for (let col = 0; col < 8; col++) {
      const cell = board.children[row * 8 + col];
      const content = cell.textContent.trim();
      if (content !== '') {
        state[row][col] = {
          player: cell.classList.contains('player1') ? 1 : 2,
          isQueen: content === '♛'
        };
      } else {
        state[row][col] = null;
      }
    }
  }
  return state;
}



function isDama(cell) {
  return cell.textContent.trim() === '♛';
}


function movePiece(from, to, isQueen = false) {
  const fromIndex = from.row * 8 + from.col;
  const toIndex = to.row * 8 + to.col;

  const fromCell = board.children[fromIndex];
  const toCell = board.children[toIndex];

  toCell.textContent = isQueen ? '♛' : '●';

  if (fromCell.classList.contains('player1')) {
    toCell.className = 'cell dark player1';
  } else if (fromCell.classList.contains('player2')) {
    toCell.className = 'cell dark player2';
  }

  fromCell.textContent = '';
  fromCell.className = (from.row + from.col) % 2 === 1 ? 'cell dark' : 'cell light';

  checkDrawCondition?.();
}

function endGame() {
  myTurn = false;
  document.getElementById("status").textContent = "Oyun Bitti!";
}


function emitMove(from, to) {
  const fromIndex = from.row * 8 + from.col;
  const fromCell = board.children[fromIndex];
  const fromText = fromCell.textContent.trim();

  const willBeQueen =
    fromText === '♛' || // zaten dama ise koru
    (playerNumber === 1 && to.row === 7) || // siyah taş dama olur
    (playerNumber === 2 && to.row === 0);   // beyaz taş dama olur

  const boardState = getBoardState();

  socket.emit('move', {
    room,
    from,
    to,
    isQueen: willBeQueen,
    boardState: getBoardState()
  });
}


function getEnemyClass() {
  return playerNumber == 1 ? 'player2' : 'player1';
}

function getMyClass() {
  return `player${playerNumber}`;
}

function getCaptureOptions(row, col, isQueen) {
  const captures = [];
  const directions = [
    [0, 1], [0, -1], // sağ–sol
    [1, 0], [-1, 0]  // aşağı–yukarı
  ];

  if (!isQueen) {
    // Normal taşlar için tek sıçrama
    for (const [dr, dc] of directions) {
      const toRow = row + dr * 2;
      const toCol = col + dc * 2;
      const midRow = row + dr;
      const midCol = col + dc;
      if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) continue;
      const mid = board.children[midRow * 8 + midCol];
      const toCell = board.children[toRow * 8 + toCol];
      if (mid && toCell && mid.classList.contains(getEnemyClass()) && toCell.textContent === '') {
        captures.push({ toRow, toCol, midRow, midCol });
      }
    }
  } else {
    // ♛ taşlar için tüm yönlere tarama
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      let enemyFound = false;
      let midRow = null;
      let midCol = null;

      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const index = r * 8 + c;
        const cell = board.children[index];

        if (cell.textContent === '') {
          if (enemyFound) {
            captures.push({ toRow: r, toCol: c, midRow, midCol });
          }
        } else if (cell.classList.contains(getEnemyClass())) {
          if (enemyFound) break; // arka arkaya iki rakip olamaz
          enemyFound = true;
          midRow = r;
          midCol = c;
        } else {
          break; // kendi taşına çarptı
        }

        r += dr;
        c += dc;
      }
    }
  }

  return captures;
}


function getBestCaptureMoves() {
  const captureMoves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      const cell = board.children[index];
      const isQueen = isDama(cell);
      if (cell.classList.contains(getMyClass())) {
        const captures = getCaptureOptions(row, col, isQueen);
        if (captures.length > 0) {
          captureMoves.push({ from: { row, col }, captures });
        }
      }
    }
  }
  return captureMoves;
}

function handleClick(e) {
  const cell = e.target;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col); 
  if (!myTurn) return;

  const allCaptures = getBestCaptureMoves(); // zorunlu hamle varsa burada olur

  // Henüz taş seçilmediyse
 if (!selectedCell) {
  if (!cell.classList.contains(getMyClass())) return;

  const canCapture = allCaptures.some(m => m.from.row === row && m.from.col === col);
  if (allCaptures.length > 0 && !canCapture) {
    alert("Zorunlu hamlenizi yapmak zorundasınız!");
    return;
  }

  selectedCell = cell;
  cell.style.border = '2px solid yellow';
  return;
}


  const from = {
    row: parseInt(selectedCell.dataset.row),  
    col: parseInt(selectedCell.dataset.col),
  };
  const to = { row, col };
  const fromIndex = from.row * 8 + from.col;
  const toIndex = to.row * 8 + to.col;
  const targetCell = board.children[toIndex];
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const isMyDama = isDama(selectedCell);

  // Gideceğimiz yerde taş varsa hamle geçersiz
  if (targetCell.textContent !== '') return;

  // Taş alma kontrolü (öncelikli)
  const captureMoves = getCaptureOptions(from.row, from.col, isMyDama);
  const validCapture = captureMoves.find(c => c.toRow === to.row && c.toCol === to.col);

  if (validCapture) {
  // Aradaki taşı tahtadan sil
  const midCellIndex = validCapture.midRow * 8 + validCapture.midCol;
  const midCell = board.children[midCellIndex];
  midCell.textContent = '';
  midCell.className = (validCapture.midRow + validCapture.midCol) % 2 === 1 ? 'cell dark' : 'cell light';

  const willBeDama = isMyDama || (playerNumber === 1 && to.row === 0) || (playerNumber === 2 && to.row === 7);
  movePiece(from, to, willBeDama);

  // 📌 Zincirleme yeme kontrolü
  const stillCaptureMoves = getCaptureOptions(to.row, to.col, willBeDama);
  if (stillCaptureMoves.length > 0) {
    selectedCell.style.border = '1px solid #333'; // önceki işareti sil
    selectedCell = board.children[to.row * 8 + to.col]; // yeni konumdaki taşı seç
    selectedCell.style.border = '2px solid yellow'; // tekrar işaretle
    // Tur bitmesin
    myTurn = true;
    return;
  }

  // Eğer zincirleme alma yoksa normal şekilde sırayı bitir
  checkWinCondition();
  selectedCell.style.border = '1px solid #333';
  selectedCell = null;
  myTurn = false;
  emitMove(from, to, willBeDama);
  return;
}
  // Eğer taş alma varken bu hamle bir capture değilse reddet
  if (allCaptures.length > 0) {
    alert("Zorunlu hamlenizi yapmak zorundasınız!");
    return;
  }

  // Normal ilerleme (capture olmayan düz hamle)
  const allowedDirection = playerNumber === 1 ? -1 : 1;
  const isSingleStep = (Math.abs(rowDiff) === 1 && colDiff === 0) || (Math.abs(colDiff) === 1 && rowDiff === 0);


  const willBeDama = isMyDama || (playerNumber === 1 && to.row === 7) || (playerNumber === 2 && to.row === 0);

  if (isMyDama) {
  const isStraight = (from.row === to.row || from.col === to.col);
  const dr = Math.sign(to.row - from.row);
  const dc = Math.sign(to.col - from.col);

  let r = from.row + dr;
  let c = from.col + dc;
  let pathClear = true;

  while (r !== to.row || c !== to.col) {
    const midCell = board.children[r * 8 + c];
    if (midCell.textContent !== '') {
      pathClear = false;
      break;
    }
    r += dr;
    c += dc;
  }

  if (isStraight && pathClear) {
    movePiece(from, to, willBeDama);
    selectedCell.style.border = '1px solid #333';
    selectedCell = null;
    myTurn = false;
    emitMove(from, to, willBeDama);
    return;
  } else {
    return;
  }
}

if (!isMyDama && isSingleStep && rowDiff === allowedDirection) {
  movePiece(from, to, willBeDama);
  selectedCell.style.border = '1px solid #333';
  selectedCell = null;
  myTurn = false;
  emitMove(from, to, willBeDama);
  return;
}


}








function checkWinCondition() {
  const boardState = getBoardState();
  let player1Count = 0;
  let player2Count = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (piece) {
        if (piece.player === 1) player1Count++;
        if (piece.player === 2) player2Count++;
      }
    }
  }


  if (player1Count === 0) {
    alert("Beyaz Oyuncu (Player 2) Kazandı! 🎉");
    endGame();
  } else if (player2Count === 0) {
    alert("Siyah Oyuncu (Player 1) Kazandı! 🎉");
    endGame();
  }
}

function checkDrawCondition() {
  let myPieces = 0, enemyPieces = 0;
  for (let i = 0; i < 64; i++) {
    const cell = board.children[i];
    if (cell.classList.contains(getMyClass())) myPieces++;
    if (cell.classList.contains(getEnemyClass())) enemyPieces++;
  }
  if (myPieces === 1 && enemyPieces === 1) {
    alert("Berabere!");
    location.reload();
  }
}
socket.on('startGame', () => {
  const status = document.getElementById("status");
  status.textContent = "Eşleşme tamam, oyun başlıyor!";

  if (playerNumber === 1) {
    myTurn = true;
    status.textContent += " Sen başlıyorsun!";
  } else {
    myTurn = false;
    status.textContent += " Rakip başlıyor.";
  }

  drawBoard(); // oyun burada başlasın
});


socket.on('waiting', () => {
  status.textContent = 'Rakip bekleniyor...';
});

socket.on('roomJoined', (data) => {
  playerNumber = data.player;
  localStorage.setItem('player', playerNumber);
  console.log("Odaya katıldın. Oyuncu numarası:", playerNumber);
});

socket.on('turnChanged', (data) => {
  myTurn = (data.turn == playerNumber);
  updateTurnText();
});

socket.on("opponentMove", ({ boardState }) => {
  if (selectedCell) {
    selectedCell.style.border = "1px solid #333";
    selectedCell = null;
  }

  drawBoard(boardState); // ✅ gelen boardState'e göre çiz
  myTurn = true;
});



socket.on('move', (data) => {
  io.to(data.room).emit('opponentMove', data);

  roomTurns[data.room] = roomTurns[data.room] === 1 ? 2 : 1;
  io.to(data.room).emit('turnChanged', { turn: roomTurns[data.room] });
});


socket.on('gameOver', (winner) => {
  alert(winner === playerNumber ? "Kazandın!" : "Kaybettin!");
  location.reload();
});

function updateTurnText() {
  if (myTurn) {
    status.textContent = "Sıra sende!";
    startTimer();
  } else {
    status.textContent = "Rakip düşünüyor...";
    clearInterval(timerInterval);
    timerDisplay.textContent = '';
  }
}
