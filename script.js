// 1. Update Jam Lokal Real-time
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    document.getElementById('clock').innerText = timeString;
}
setInterval(updateClock, 1000);
updateClock();

// 2. Fitur Copy Email dengan efek visual sederhana
function copyEmail() {
    const emailText = document.getElementById("email-text").innerText;
    const contactCard = document.querySelector('.contact-card');
    
    navigator.clipboard.writeText(emailText).then(() => {
        // Beri feedback visual saat berhasil copy
        const originalText = contactCard.innerHTML;
        contactCard.innerHTML = "<h3>Email Copied!</h3><i class='ri-checkbox-circle-fill'></i>";
        
        setTimeout(() => {
            contactCard.innerHTML = originalText;
        }, 2000);

    }).catch(err => {
        console.error('Gagal menyalin: ', err);
    });
}

// --- TERMINAL TYPING EFFECT ---
const terminalText = document.getElementById('typing-text');
const commands = [
    "git commit -m 'Initial commit'", 
    "npm install interactive-ui", 
    "running portfolio.exe...", 
    "ping 127.0.0.1"
];
let cmdIndex = 0;
let charIndexCmd = 0;
let isDeletingCmd = false;

function typeTerminal() {
    const currentCmd = commands[cmdIndex];
    
    if (isDeletingCmd) {
        terminalText.textContent = currentCmd.substring(0, charIndexCmd--);
    } else {
        terminalText.textContent = currentCmd.substring(0, charIndexCmd++);
    }

    let speed = isDeletingCmd ? 50 : 100;

    if (!isDeletingCmd && charIndexCmd === currentCmd.length) {
        speed = 2000; // Tunggu lama setelah selesai ngetik
        isDeletingCmd = true;
    } else if (isDeletingCmd && charIndexCmd === 0) {
        isDeletingCmd = false;
        cmdIndex = (cmdIndex + 1) % commands.length;
        speed = 500;
    }

    setTimeout(typeTerminal, speed);
}

// Jalankan efek terminal
// --- AUTO UPDATE YEAR FOOTER ---
document.getElementById('year').innerText = new Date().getFullYear();
/// --- MINI GAME: TETRIS (FIXED VERSION) ---

// --- NEON TETRIS ENGINE ---
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetrisCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const startBtn = document.getElementById('startBtn');
    const overlay = document.getElementById('gameOverlay');

    const ROW = 20;
    const COL = 12;
    const SQ = 20;
    const VACANT = "#020617"; // Warna background (kosong)

    // --- 1. DEFINISI BENTUK (Ditaruh di ATAS agar terbaca) ---
    const I = [
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    ];

    const J = [
        [ [1, 0, 0], [1, 1, 1], [0, 0, 0] ],
        [ [0, 1, 1], [0, 1, 0], [0, 1, 0] ],
        [ [0, 0, 0], [1, 1, 1], [0, 0, 1] ],
        [ [0, 1, 0], [0, 1, 0], [1, 1, 0] ]
    ];

    const L = [
        [ [0, 0, 1], [1, 1, 1], [0, 0, 0] ],
        [ [0, 1, 0], [0, 1, 0], [0, 1, 1] ],
        [ [0, 0, 0], [1, 1, 1], [1, 0, 0] ],
        [ [1, 1, 0], [0, 1, 0], [0, 1, 0] ]
    ];

    const O = [
        [ [0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0] ]
    ];

    const S = [
        [ [0, 1, 1], [1, 1, 0], [0, 0, 0] ],
        [ [0, 1, 0], [0, 1, 1], [0, 0, 1] ],
        [ [0, 0, 0], [0, 1, 1], [1, 1, 0] ],
        [ [1, 0, 0], [1, 1, 0], [0, 1, 0] ]
    ];

    const T = [
        [ [0, 1, 0], [1, 1, 1], [0, 0, 0] ],
        [ [0, 1, 0], [0, 1, 1], [0, 1, 0] ],
        [ [0, 0, 0], [1, 1, 1], [0, 1, 0] ],
        [ [0, 1, 0], [1, 1, 0], [0, 1, 0] ]
    ];

    const Z = [
        [ [1, 1, 0], [0, 1, 1], [0, 0, 0] ],
        [ [0, 0, 1], [0, 1, 1], [0, 1, 0] ],
        [ [0, 0, 0], [1, 1, 0], [0, 1, 1] ],
        [ [0, 1, 0], [1, 1, 0], [1, 0, 0] ]
    ];

    // --- 2. SETUP WARNA DAN PIECES ---
    const PIECES = [
        [Z, "#ff0055"],
        [S, "#00ff00"],
        [T, "#ae00ff"],
        [O, "#ffff00"],
        [L, "#ff9900"],
        [I, "#00f7ff"],
        [J, "#0000ff"]
    ];

    // --- 3. VARIABEL GAME ---
    let board = [];
    let score = 0;
    let gameOver = false;
    let dropStart = Date.now();
    let p; 
    let animationFrameId; // Untuk kontrol loop

    // --- 4. FUNGSI UTAMA ---
    
    function createBoard() {
        for (let r = 0; r < ROW; r++) {
            board[r] = [];
            for (let c = 0; c < COL; c++) {
                board[r][c] = VACANT;
            }
        }
    }

    function drawSquare(x, y, color) {
        ctx.fillStyle = color;
        // Efek Neon Glow
        if (color !== VACANT) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.fillRect(x * SQ, y * SQ, SQ, SQ);
        ctx.strokeStyle = "#111";
        ctx.strokeRect(x * SQ, y * SQ, SQ, SQ);
        ctx.shadowBlur = 0; // Reset
    }

    function drawBoard() {
        for (let r = 0; r < ROW; r++) {
            for (let c = 0; c < COL; c++) {
                drawSquare(c, r, board[r][c]);
            }
        }
    }

    function randomPiece() {
        let r = Math.floor(Math.random() * PIECES.length);
        return new Piece(PIECES[r][0], PIECES[r][1]);
    }

    // --- 5. CLASS TETROMINO ---
    class Piece {
        constructor(tetromino, color) {
            this.tetromino = tetromino;
            this.color = color;
            this.tetrominoN = 0; 
            this.activeTetromino = this.tetromino[this.tetrominoN];
            this.x = 4; // Start tengah
            this.y = -2;
        }

        fill(color) {
            for (let r = 0; r < this.activeTetromino.length; r++) {
                for (let c = 0; c < this.activeTetromino.length; c++) {
                    if (this.activeTetromino[r][c]) {
                        drawSquare(this.x + c, this.y + r, color);
                    }
                }
            }
        }

        draw() { this.fill(this.color); }
        unDraw() { this.fill(VACANT); }

        moveDown() {
            if (!this.collision(0, 1, this.activeTetromino)) {
                this.unDraw();
                this.y++;
                this.draw();
            } else {
                this.lock();
                if (!gameOver) {
                    p = randomPiece();
                }
            }
        }

        moveRight() {
            if (!this.collision(1, 0, this.activeTetromino)) {
                this.unDraw();
                this.x++;
                this.draw();
            }
        }

        moveLeft() {
            if (!this.collision(-1, 0, this.activeTetromino)) {
                this.unDraw();
                this.x--;
                this.draw();
            }
        }

        rotate() {
            let nextPattern = this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
            let kick = 0;

            if (this.collision(0, 0, nextPattern)) {
                if (this.x > COL / 2) { kick = -1; } else { kick = 1; }
            }

            if (!this.collision(kick, 0, nextPattern)) {
                this.unDraw();
                this.x += kick;
                this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length;
                this.activeTetromino = this.tetromino[this.tetrominoN];
                this.draw();
            }
        }

        collision(x, y, piece) {
            for (let r = 0; r < piece.length; r++) {
                for (let c = 0; c < piece.length; c++) {
                    if (!piece[r][c]) { continue; }
                    let newX = this.x + c + x;
                    let newY = this.y + r + y;

                    if (newX < 0 || newX >= COL || newY >= ROW) { return true; }
                    if (newY < 0) { continue; }
                    if (board[newY][newX] != VACANT) { return true; }
                }
            }
            return false;
        }

        lock() {
            for (let r = 0; r < this.activeTetromino.length; r++) {
                for (let c = 0; c < this.activeTetromino.length; c++) {
                    if (!this.activeTetromino[r][c]) { continue; }
                    if (this.y + r < 0) {
                        // Game Over Condition
                        gameOver = true;
                        overlay.style.display = "flex";
                        startBtn.innerText = "GAME OVER - RETRY";
                        cancelAnimationFrame(animationFrameId);
                        return;
                    }
                    board[this.y + r][this.x + c] = this.color;
                }
            }
            
            // Hapus baris
            for (let r = 0; r < ROW; r++) {
                let isRowFull = true;
                for (let c = 0; c < COL; c++) {
                    isRowFull = isRowFull && (board[r][c] != VACANT);
                }
                if (isRowFull) {
                    for (let y = r; y > 1; y--) {
                        for (let c = 0; c < COL; c++) {
                            board[y][c] = board[y - 1][c];
                        }
                    }
                    for (let c = 0; c < COL; c++) { board[0][c] = VACANT; }
                    score += 10;
                    scoreEl.innerText = score;
                }
            }
            drawBoard();
        }
    }

    // --- 6. LOGIKA KONTROL & GAME LOOP ---
    
    document.addEventListener("keydown", (event) => {
        if (gameOver || overlay.style.display !== "none") return;
        
        // Cegah scroll saat main game
        if([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
            event.preventDefault();
        }

        if (event.keyCode == 37) { p.moveLeft(); dropStart = Date.now(); }
        else if (event.keyCode == 38) { p.rotate(); dropStart = Date.now(); }
        else if (event.keyCode == 39) { p.moveRight(); dropStart = Date.now(); }
        else if (event.keyCode == 40) { p.moveDown(); }
    });

    function drop() {
        if(gameOver) return;
        
        let now = Date.now();
        let delta = now - dropStart;
        if (delta > 800) { // Kecepatan jatuhnya balok
            p.moveDown();
            dropStart = Date.now();
        }
        animationFrameId = requestAnimationFrame(drop);
    }

    // --- 7. START GAME ---
    startBtn.addEventListener("click", () => {
        console.log("Game Started"); // Cek di console browser jika tombol diklik
        overlay.style.display = "none";
        
        createBoard();
        drawBoard();
        
        score = 0;
        scoreEl.innerText = score;
        gameOver = false;
        
        p = randomPiece();
        p.draw();
        
        dropStart = Date.now();
        
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        drop();
    });
});