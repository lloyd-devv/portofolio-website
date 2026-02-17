document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CLOCK ---
    function updateClock() {
        document.getElementById('clock').innerText = new Date().toLocaleTimeString('id-ID', { hour12: false });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- 2. FOOTER YEAR ---
    document.getElementById('year').innerText = new Date().getFullYear();

    // --- 3. TERMINAL TYPING ---
    const termText = document.getElementById('typing-text');
    const cmds = ["git commit -m 'Initial'", "npm install life", "ping 127.0.0.1", "running portfolio.exe"];
    let cmdIdx = 0, charIdx = 0, isDeleting = false;
    
    function typeTerminal() {
        const current = cmds[cmdIdx];
        if(isDeleting) termText.textContent = current.substring(0, charIdx--);
        else termText.textContent = current.substring(0, charIdx++);

        if(!isDeleting && charIdx === current.length) { isDeleting = true; setTimeout(typeTerminal, 2000); }
        else if(isDeleting && charIdx === 0) { isDeleting = false; cmdIdx = (cmdIdx + 1) % cmds.length; setTimeout(typeTerminal, 500); }
        else setTimeout(typeTerminal, isDeleting ? 50 : 100);
    }
    typeTerminal();

    // --- 4. COPY EMAIL ---
    window.copyEmail = function() {
        const email = document.getElementById("email-text").innerText;
        navigator.clipboard.writeText(email).then(() => alert("Email Copied: " + email));
    }

    // --- 5. VIDEO MODAL ---
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');

    window.openVideo = function(id) {
        player.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
        modal.classList.add('active');
    }

    window.closeVideo = function() {
        modal.classList.remove('active');
        setTimeout(() => player.src = "", 300);
    }

    // --- 6. TETRIS GAME ENGINE (FIXED) ---
    const canvas = document.getElementById('tetrisCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const startBtn = document.getElementById('startBtn');
    const overlay = document.getElementById('gameOverlay');

    const ROW = 20, COL = 12, SQ = 20;
    const VACANT = "#020617";
    
    // Shapes
    const I = [[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]], [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]], [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]];
    const J = [[[1,0,0],[1,1,1],[0,0,0]], [[0,1,1],[0,1,0],[0,1,0]], [[0,0,0],[1,1,1],[0,0,1]], [[0,1,0],[0,1,0],[1,1,0]]];
    const L = [[[0,0,1],[1,1,1],[0,0,0]], [[0,1,0],[0,1,0],[0,1,1]], [[0,0,0],[1,1,1],[1,0,0]], [[1,1,0],[0,1,0],[0,1,0]]];
    const O = [[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]];
    const S = [[[0,1,1],[1,1,0],[0,0,0]], [[0,1,0],[0,1,1],[0,0,1]], [[0,0,0],[0,1,1],[1,1,0]], [[1,0,0],[1,1,0],[0,1,0]]];
    const T = [[[0,1,0],[1,1,1],[0,0,0]], [[0,1,0],[0,1,1],[0,1,0]], [[0,0,0],[1,1,1],[0,1,0]], [[0,1,0],[1,1,0],[0,1,0]]];
    const Z = [[[1,1,0],[0,1,1],[0,0,0]], [[0,0,1],[0,1,1],[0,1,0]], [[0,0,0],[1,1,0],[0,1,1]], [[0,1,0],[1,1,0],[1,0,0]]];

    const PIECES = [[Z,"#ff0055"],[S,"#00ff00"],[T,"#ae00ff"],[O,"#ffff00"],[L,"#ff9900"],[I,"#00f7ff"],[J,"#0000ff"]];

    let board = [], score = 0, p, dropStart, gameOver = false, animId;

    function createBoard() {
        for(let r=0; r<ROW; r++) { board[r] = []; for(let c=0; c<COL; c++) board[r][c] = VACANT; }
    }

    function drawSquare(x,y,color) {
        ctx.fillStyle = color;
        if(color !== VACANT) { ctx.shadowBlur = 10; ctx.shadowColor = color; } else { ctx.shadowBlur = 0; }
        ctx.fillRect(x*SQ, y*SQ, SQ, SQ);
        ctx.strokeStyle = "#111"; ctx.strokeRect(x*SQ, y*SQ, SQ, SQ);
        ctx.shadowBlur = 0;
    }

    function drawBoard() {
        for(let r=0; r<ROW; r++) for(let c=0; c<COL; c++) drawSquare(c,r,board[r][c]);
    }

    class Piece {
        constructor(tetromino,color){
            this.tetromino = tetromino; this.color = color;
            this.tetrominoN = 0; this.activeTetromino = this.tetromino[this.tetrominoN];
            this.x = 4; this.y = -2;
        }
        fill(color){
            for(let r=0; r<this.activeTetromino.length; r++)
                for(let c=0; c<this.activeTetromino.length; c++)
                    if(this.activeTetromino[r][c]) drawSquare(this.x+c,this.y+r, color);
        }
        draw(){ this.fill(this.color); }
        unDraw(){ this.fill(VACANT); }
        moveDown(){
            if(!this.collision(0,1,this.activeTetromino)) { this.unDraw(); this.y++; this.draw(); }
            else { this.lock(); if(!gameOver) p = randomPiece(); }
        }
        moveRight(){ if(!this.collision(1,0,this.activeTetromino)){ this.unDraw(); this.x++; this.draw(); } }
        moveLeft(){ if(!this.collision(-1,0,this.activeTetromino)){ this.unDraw(); this.x--; this.draw(); } }
        rotate(){
            let nextPattern = this.tetromino[(this.tetrominoN + 1)%this.tetromino.length];
            let kick = 0;
            if(this.collision(0,0,nextPattern)) kick = this.x > COL/2 ? -1 : 1;
            if(!this.collision(kick,0,nextPattern)){
                this.unDraw(); this.x+=kick; this.tetrominoN=(this.tetrominoN+1)%this.tetromino.length;
                this.activeTetromino=this.tetromino[this.tetrominoN]; this.draw();
            }
        }
        collision(x,y,piece){
            for(let r=0; r<piece.length; r++)
                for(let c=0; c<piece.length; c++)
                    if(piece[r][c]){
                        let newX = this.x + c + x, newY = this.y + r + y;
                        if(newX < 0 || newX >= COL || newY >= ROW) return true;
                        if(newY < 0) continue;
                        if(board[newY][newX] != VACANT) return true;
                    }
            return false;
        }
        lock(){
            for(let r=0; r<this.activeTetromino.length; r++)
                for(let c=0; c<this.activeTetromino.length; c++)
                    if(this.activeTetromino[r][c]) {
                        if(this.y+r < 0) { gameOver = true; overlay.style.display="flex"; startBtn.innerText="RETRY"; cancelAnimationFrame(animId); return; }
                        board[this.y+r][this.x+c] = this.color;
                    }
            for(let r=0; r<ROW; r++){
                let isRowFull = true;
                for(let c=0; c<COL; c++) isRowFull = isRowFull && (board[r][c] != VACANT);
                if(isRowFull){
                    for(let y=r; y>1; y--) for(let c=0; c<COL; c++) board[y][c] = board[y-1][c];
                    for(let c=0; c<COL; c++) board[0][c] = VACANT;
                    score+=10; scoreEl.innerText = score;
                }
            }
            drawBoard();
        }
    }

    function randomPiece(){ let r = Math.floor(Math.random() * PIECES.length); return new Piece(PIECES[r][0], PIECES[r][1]); }

    document.addEventListener("keydown", (e)=>{
        if(gameOver || overlay.style.display !== "none") return;
        if([32,37,38,39,40].includes(e.keyCode)) e.preventDefault();
        if(e.keyCode == 37) p.moveLeft();
        else if(e.keyCode == 38) p.rotate();
        else if(e.keyCode == 39) p.moveRight();
        else if(e.keyCode == 40) p.moveDown();
    });

    function drop(){
        if(gameOver) return;
        let now = Date.now(), delta = now - dropStart;
        if(delta > 800){ p.moveDown(); dropStart = Date.now(); }
        animId = requestAnimationFrame(drop);
    }

    startBtn.addEventListener("click", ()=>{
        overlay.style.display = "none";
        createBoard(); drawBoard();
        score = 0; scoreEl.innerText = score;
        gameOver = false;
        p = randomPiece(); p.draw();
        dropStart = Date.now();
        if(animId) cancelAnimationFrame(animId);
        drop();
    });
});
