const boardEl = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const newBtn = document.getElementById('newBtn');
const overlay = document.getElementById('overlay');
const messageText = document.getElementById('messageText');
const continueBtn = document.getElementById('continueBtn');
const modeToggle = document.getElementById('modeToggle');
const muteBtn = document.getElementById('muteBtn');
const difficultySelect = document.getElementById('difficulty');
const themeSelect = document.getElementById('themeSelect');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const moveList = document.getElementById('moveList');
const winSvg = document.getElementById('winSvg');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');

// game state
let history = []; // {i,player}
let historyIndex = -1;
let difficulty = 'easy';
let theme = 'dark';

let board = Array(9).fill(null);
let current = 'X';
let running = true;
let score = { X: 0, O: 0 };
let vsCpu = false;

const wins = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function start(){
  board.fill(null); current='X'; running=true; updateStatus();
  history = []; historyIndex = -1; moveList.innerHTML = '';
  winSvg && (winSvg.innerHTML = '');
  cells.forEach((c,i)=>{ c.textContent=''; c.dataset.mark=''; c.classList.remove('win','placed','preview'); c.removeEventListener('click', onCell); c.addEventListener('click', onCell); });
  // load persisted settings
  try{
    const s = JSON.parse(localStorage.getItem('tictac_score')||'{}'); if(s) { score.X = s.X||0; score.O = s.O||0; }
    const d = localStorage.getItem('tictac_difficulty'); if(d){ difficulty = d; difficultySelect.value = d; }
    const t = localStorage.getItem('tictac_theme'); if(t){ theme = t; themeSelect.value = t; applyTheme(t); }
    const m = localStorage.getItem('tictac_muted'); if(m==='true'){ muted = true; muteBtn.textContent='🔇'; muteBtn.setAttribute('aria-pressed','true'); }
  }catch(e){}
}

function onCell(e){
  const idx = Number(e.currentTarget.dataset.index);
  if(!running || board[idx]) return;
  // human move
  playMove(idx, current);
  if(!running) return;
  if(vsCpu && current==='O') setTimeout(cpuMove, 420);
}

function playMove(i, player){
  board[i]=player;
  const el = cells[i]; el.dataset.mark = player; el.textContent = player; el.classList.add('placed');
  // placement animation cleanup
  setTimeout(()=>el.classList.remove('placed'), 420);
  playSound('move', player);

  // push history (trim future)
  history.splice(historyIndex+1);
  history.push({i,player}); historyIndex = history.length-1; updateMoveList();

  checkState(player);
  current = player==='X' ? 'O' : 'X'; updateStatus();
  if(vsCpu && current==='O' && running) setTimeout(cpuMove, 450);
}

function cpuMove(){
  // choose by difficulty
  const diff = difficultySelect ? difficultySelect.value : difficulty;
  let idx = null;
  if(diff === 'hard'){
    idx = bestMoveMinimax(board, 'O');
  } else {
    idx = findBest('O') ?? findBest('X') ?? (board[4]===null?4:null) ?? chooseFrom([0,2,6,8]) ?? chooseRandom();
  }
  if(idx!==null) playMove(idx,'O');
}

function findBest(p){
  for(const [a,b,c] of wins){
    const vals = [board[a], board[b], board[c]];
    if(vals.filter(v=>v===p).length===2 && vals.includes(null)){
      const emptyIndex = [a,b,c].find(i=>board[i]===null); return emptyIndex;
    }
  }
  return null;
}

function chooseFrom(list){
  const avail = list.filter(i=>board[i]===null); return avail.length?avail[Math.floor(Math.random()*avail.length)]:null;
}
function chooseRandom(){
  const avail = board.map((v,i)=>v===null?i:null).filter(v=>v!==null); return avail.length?avail[Math.floor(Math.random()*avail.length)]:null;
}

function checkState(player){
  // win?
  for(const combo of wins){
    const [a,b,c]=combo; if(board[a]===player && board[b]===player && board[c]===player){
      endGame(player, combo); return;
    }
  }
  // draw?
  if(board.every(Boolean)){ endGame(null); }
}

// ----- Move history / undo / redo -----
function updateMoveList(){
  if(!moveList) return;
  moveList.innerHTML = '';
  history.forEach((m,idx)=>{
    const li = document.createElement('li'); li.textContent = `${idx+1}. ${m.player} → ${m.i+1}`;
    if(idx===historyIndex) li.classList.add('active');
    li.addEventListener('click', ()=>{
      // navigate to that history index
      while(historyIndex > idx) undoMove();
      while(historyIndex < idx) redoMove();
    });
    moveList.appendChild(li);
  });
}

function undoMove(){
  if(historyIndex < 0) return;
  const m = history[historyIndex]; board[m.i]=null; cells[m.i].textContent=''; cells[m.i].dataset.mark=''; historyIndex--; updateMoveList();
  running = true; current = m.player; updateStatus();
}
function redoMove(){
  if(historyIndex >= history.length-1) return;
  const m = history[historyIndex+1]; board[m.i]=m.player; cells[m.i].textContent = m.player; cells[m.i].dataset.mark = m.player; historyIndex++; updateMoveList();
  current = m.player==='X'?'O':'X'; updateStatus();
}

undoBtn && undoBtn.addEventListener('click', ()=>{ playSound('click'); undoMove(); });
redoBtn && redoBtn.addEventListener('click', ()=>{ playSound('click'); redoMove(); });

// ----- Theme handling -----
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('tictac_theme', t);
}
themeSelect && themeSelect.addEventListener('change', ()=>{ playSound('click'); applyTheme(themeSelect.value); });

afterSettingsLoad = ()=>{};

// ----- Minimax AI (hard) -----
function bestMoveMinimax(boardState, player){
  // returns index for best move for player 'O'
  const opponent = player === 'O' ? 'X' : 'O';
  function availableMoves(b){ return b.map((v,i)=>v===null?i:null).filter(v=>v!==null); }
  function winner(b){
    for(const [a,b1,c] of wins){ if(b[a] && b[a]===b[b1] && b[a]===b[c]) return b[a]; }
    return b.every(Boolean)?'draw':null;
  }
  function scoreResult(res, depth){ if(res==='O') return 10 - depth; if(res==='X') return depth - 10; return 0; }

  function minimax(b, depth, isMax){
    const res = winner(b);
    if(res) return scoreResult(res, depth);
    const moves = availableMoves(b);
    let best = isMax? -Infinity : Infinity;
    for(const m of moves){ b[m] = isMax? 'O' : 'X'; const val = minimax(b, depth+1, !isMax); b[m]=null; if(isMax){ best = Math.max(best, val); } else { best = Math.min(best, val); } }
    return best;
  }
  const moves = availableMoves(boardState);
  let bestVal = -Infinity; let bestMove = null;
  for(const m of moves){ boardState[m] = 'O'; const val = minimax(boardState, 0, false); boardState[m]=null; if(val > bestVal){ bestVal = val; bestMove = m; } }
  return bestMove;
}

// ----- Win-line drawing -----
function drawWinLine(combo){
  if(!winSvg) return;
  const [a,b,c] = combo;
  const r1 = cells[a].getBoundingClientRect();
  const r3 = cells[c].getBoundingClientRect();
  const parent = boardEl.getBoundingClientRect();
  const x1 = r1.left + r1.width/2 - parent.left;
  const y1 = r1.top + r1.height/2 - parent.top;
  const x2 = r3.left + r3.width/2 - parent.left;
  const y2 = r3.top + r3.height/2 - parent.top;
  winSvg.innerHTML = `<line class="win-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
}
function clearWinLine(){ if(winSvg) winSvg.innerHTML = ''; }

// persist score
function persistScore(){ localStorage.setItem('tictac_score', JSON.stringify(score)); }



function endGame(winner, combo){
  running=false; clearWinLine();
  if(winner){
    playSound('win', winner);
    messageText.textContent = `${winner} wins!`;
    score[winner]++; updateScores(); persistScore();
    combo.forEach(i=>cells[i].classList.add('win'));
    // draw line
    setTimeout(()=>drawWinLine(combo), 60);
  } else { playSound('draw'); messageText.textContent = `Draw!`; persistScore(); }
  overlay.classList.remove('hidden');
}

function updateScores(){ scoreXEl.textContent = score.X; scoreOEl.textContent = score.O; }
function updateStatus(){ if(!running) statusEl.textContent = 'Round over'; else statusEl.textContent = `${current}'s turn`; }

resetBtn.addEventListener('click', ()=>{ playSound('reset'); start(); overlay.classList.add('hidden'); });
newBtn.addEventListener('click', ()=>{ playSound('reset'); score = { X:0, O:0 }; persistScore(); updateScores(); start(); overlay.classList.add('hidden'); });
continueBtn.addEventListener('click', ()=>{ playSound('click'); overlay.classList.add('hidden'); start(); });
modeToggle.addEventListener('change', ()=>{ playSound('click'); vsCpu = modeToggle.checked; start(); });

difficultySelect && difficultySelect.addEventListener('change', ()=>{ playSound('click'); difficulty = difficultySelect.value; localStorage.setItem('tictac_difficulty', difficulty); });

// init
start();
updateScores();

// Accessibility: allow keyboard play + hover preview
cells.forEach((c,i)=>{
  c.tabIndex=0;
  c.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' ') onCell({currentTarget:c}); });
  c.addEventListener('mouseenter', ()=>{
    if(!running) return; if(board[i]!==null) return;
    c.classList.add('preview'); c.dataset.preview = current;
  });
  c.addEventListener('mouseleave', ()=>{ c.classList.remove('preview'); delete c.dataset.preview; });
});

// Sound system (WebAudio) + controls
let audioCtx = null;
let masterGain = null;
let muted = false;

function ensureAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(audioCtx.destination);
  }
  if(audioCtx.state === 'suspended'){ audioCtx.resume().catch(()=>{}); }
}

function playTone(freq, type='sine', dur=0.12, vol=0.6, when=0){
  if(!audioCtx) ensureAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime + when);
  g.gain.setValueAtTime(vol, audioCtx.currentTime + when);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + when + dur);
  o.connect(g); g.connect(masterGain);
  o.start(audioCtx.currentTime + when);
  o.stop(audioCtx.currentTime + when + dur + 0.02);
}

function playSound(name, who){
  if(muted) return;
  ensureAudio();
  if(audioCtx.state === 'suspended'){ audioCtx.resume().catch(()=>{}); }
  switch(name){
    case 'move':
      if(who === 'X') playTone(880,'triangle',0.12,0.5);
      else playTone(440,'triangle',0.12,0.5);
      break;
    case 'win':
      playTone(1000,'sawtooth',0.28,0.9);
      setTimeout(()=>playTone(1400,'sawtooth',0.2,0.6), 140);
      break;
    case 'draw':
      playTone(260,'sine',0.28,0.6);
      break;
    case 'click':
      playTone(660,'square',0.08,0.45);
      break;
    case 'reset':
      playTone(520,'sine',0.12,0.6);
      break;
  }
}

muteBtn && muteBtn.addEventListener('click', ()=>{
  muted = !muted;
  muteBtn.setAttribute('aria-pressed', String(muted));
  muteBtn.textContent = muted ? '🔇' : '🔊';
  playSound('click');
});

// Expose small helper for debugging
window.__tic = { board, score };
