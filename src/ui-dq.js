const $=s=>document.querySelector(s);
const NW=150, NH=60;
const C={white:'#fcfcfc',gold:'#fcd34d',hurt:'#f8d878',crit:'#f87858',good:'#9cf07c',dim:'#a8a8a8',
  road:'#c8a060',roadEdge:'#7a5a2a',roadSel:'#fcd34d',read:'#fcfcfc',write:'#f8a838',bg:'#b8a0f8'};
const FONT='22px VT323', FONT_N='20px VT323', FONT_S='19px VT323';

/* ---------- SPRITE PIXEL ---------- */
const SPR={
  users:["..XX...XX.",".XXXX.XXXX",".XXXX.XXXX","..XX...XX.","..........",".XXXX.XXXX","XXXXXXXXXX","XXXXXXXXXX","XXXXXXXXXX"],
  lb:["......XXX","X.....XXX","XX...XX..","XXXXXX...","XXXXXX...","XX...XX..","X.....XXX","......XXX"],
  server:["XXXXXXXXX","X.......X","X.XX..O.X","XXXXXXXXX","X.......X","X.XX..O.X","XXXXXXXXX","X.......X","X.XX..O.X","XXXXXXXXX"],
  cache:["....XXXX","...XXXX.","..XXXX..",".XXXXXXX","XXXXXXX.","...XXX..","..XXX...",".XX.....","X......."],
  db:[".XXXXXXX.","X.......X","XXXXXXXXX","X.......X","XXXXXXXXX","X.......X","XXXXXXXXX","X.......X",".XXXXXXX."],
  replica:["XX.XX.XX.","XX.XX.XX.","XX.XX.XX.","X..X..X..","XX.XX.XX.","XX.XX.XX.","XX.XX.XX.","XXXXXXXXX","XXXXXXXXX"],
  queue:["XXXXXXXXX","XX.....XX","X.X...X.X","X..XXX..X","XXXXXXXXX",".........","XXX.XX.X.","XXX.XX.X."],
  skull:[".XXXXXXX.","XXXXXXXXX","X..XXX..X","X..XXX..X","XXXX.XXXX",".XXXXXXX.","..X.X.X.."],
  cur:["X....","XX...","XXX..","XXXX.","XXXXX","XXXX.","XXX..","XX...","X...."],
  down:["XXXXXXX",".XXXXX.","..XXX..","...X..."],
  star:["....X....","....X....","...XXX...","XXXXXXXXX",".XXXXXXX.","..XXXXX..","..XX.XX..",".XX...XX.","X.......X"],
};
function drawSprite(g,name,x,y,s,col){
  const rows=SPR[name];
  for(let j=0;j<rows.length;j++) for(let i=0;i<rows[j].length;i++){
    const ch=rows[j][i]; if(ch==='.') continue;
    g.fillStyle=col[ch]||col.X; g.fillRect(Math.round(x+i*s),Math.round(y+j*s),s,s);
  }
}
function spriteCanvas(name,s,col){
  const rows=SPR[name], w=Math.max(...rows.map(r=>r.length)), h=rows.length;
  const c=document.createElement('canvas'); c.className='spr'; c.width=w*s; c.height=h*s;
  drawSprite(c.getContext('2d'),name,0,0,s,col); return c;
}
document.documentElement.style.setProperty('--cur',`url(${spriteCanvas('cur',2,{X:C.white}).toDataURL()})`);
document.documentElement.style.setProperty('--down',`url(${spriteCanvas('down',2,{X:C.white}).toDataURL()})`);
const STAR={on:spriteCanvas('star',1,{X:C.gold}).toDataURL(),off:spriteCanvas('star',1,{X:'#4a4a4a'}).toDataURL()};
const starHTML=(on,s=2)=>`<img src="${on?STAR.on:STAR.off}" alt="" style="image-rendering:pixelated;width:${9*s}px;height:${9*s}px">`;

/* ---------- SAVE ---------- */
let save={stars:{},done:{}};
try{save=JSON.parse(localStorage.getItem('uptime-save'))||save}catch(e){}
function persist(){try{localStorage.setItem('uptime-save',JSON.stringify(save))}catch(e){}}

let LV=null, sim=null, running=false, ended=false, speed=1, acc=0, sel=null, selEdge=null;
let particles=[], sparks=[], drag=null, hover=null, lastUI=0, phaseFired=new Set(), blinkT=0;

/* ---------- TITLE: NHẬT KÝ PHIÊU LƯU ---------- */
function renderMenu(){
  const box=$('#log'); box.innerHTML='';
  LEVELS.forEach((L,i)=>{
    const unlocked = i===0 || save.done[LEVELS[i-1].id] || (L.sandbox && save.done[5]);
    const st=save.stars[L.id]||0;
    const b=document.createElement('button'); b.className='cmd row'; b.disabled=!unlocked;
    const stars=L.sandbox?'':`<span class="stars">${[0,1,2].map(k=>starHTML(k<st)).join('')}</span>`;
    b.innerHTML=`<span style="min-width:0"><span class="ch">${L.chapter}</span>${unlocked?L.title:'???'}<span class="desc">${unlocked?L.blurb:'Hoàn thành chương trước để mở.'}</span></span>${unlocked?stars:''}`;
    b.onclick=()=>{if(unlocked) startLevel(L)};
    box.appendChild(b);
  });
  const first=box.querySelector('.cmd:not(:disabled):last-of-type');
  [...box.querySelectorAll('.cmd')].filter(b=>!b.disabled).pop()?.classList.add('on');
}

/* ---------- LEVEL ---------- */
function startLevel(L){
  LV=L; $('#menu').classList.add('hidden'); $('#game').classList.remove('hidden');
  buildTray(); resetLevel(); resize();
  playDialog(L.intro);
}
function resetLevel(){
  sim=new Sim(LV); running=false; ended=false; acc=0; sel=null; selEdge=null; particles=[]; sparks=[]; phaseFired=new Set();
  const ns=LV.preset.nodes.map(([t,x,y,lk])=>sim.addNode(t,Math.round(((x-440)*1.12+440)/4)*4,y,lk));
  for(const [a,b] of LV.preset.edges) sim.connect(ns[a],ns[b]);
  $('#lvTitle').textContent=LV.title;
  updPlay(); updateUI(true); renderInsp();
}
function updPlay(){$('#bPlay').textContent=running?'Tạm dừng':(sim&&sim.t>0?'Tiếp tục':'Chạy')}

/* ---------- TÚI ĐỒ ---------- */
function buildTray(){
  const p=$('#tray'); p.innerHTML='<span class="lbl">TÚI ĐỒ</span>';
  for(const t of LV.palette){
    const d=DEF[t]; const c=document.createElement('div'); c.className='item'; c.dataset.t=t; c.title=d.desc;
    c.appendChild(spriteCanvas(t,2,{X:C.white,O:C.good}));
    c.insertAdjacentHTML('beforeend',`<span>${d.name}</span><span class="g">${d.cost}G</span>`);
    c.addEventListener('pointerdown',e=>{e.preventDefault(); drag={kind:'new',type:t,x:-999,y:-999}; window.addEventListener('pointermove',onWinMove); window.addEventListener('pointerup',onWinUp,{once:true})});
    p.appendChild(c);
  }
  p.insertAdjacentHTML('beforeend','<span class="tip">Kéo đồ lên bản đồ · kéo từ mũi tên ▸ để làm đường</span>');
}
function refreshTray(){const left=LV.budget-sim.spent(); document.querySelectorAll('.item').forEach(c=>c.classList.toggle('na',DEF[c.dataset.t].cost>left))}

/* ---------- VIEW ---------- */
const cv=$('#cv'), ctx=cv.getContext('2d');
let view={s:1,ox:0,oy:0}, CW=0, CH=0;
function resize(){
  const r=$('#stage').getBoundingClientRect(); CW=r.width; CH=r.height;
  const dpr=window.devicePixelRatio||1; cv.width=CW*dpr; cv.height=CH*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.imageSmoothingEnabled=false;
  const fit=Math.min(1.3,CW/1010,CH/510);
  if(CW<820 && fit<0.7){ const s=Math.min(0.8,CH/540); view={s,ox:16+50*s,oy:(CH-480*s)/2}; }
  else view={s:fit,ox:(CW-900*fit)/2,oy:(CH-480*fit)/2};
  const ch=$('#chart'); ch.width=120; ch.height=40;
}
window.addEventListener('resize',()=>{if(LV)resize()});
function toWorld(cx,cy){const r=cv.getBoundingClientRect();return{x:(cx-r.left-view.ox)/view.s,y:(cy-r.top-view.oy)/view.s}}
function inStage(cx,cy){const r=cv.getBoundingClientRect();return cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom}

/* ---------- ĐƯỜNG ĐI (vuông góc như bản đồ ô) ---------- */
function route(e){
  const ax=e.a.x+NW/2+12, ay=e.a.y, bx=e.b.x-NW/2-2, by=e.b.y;
  if(Math.abs(ay-by)<1) return [[ax,ay],[bx,by]];
  if(bx-ax>24){const mx=Math.round((ax+(bx-ax)/2)/8)*8; return [[ax,ay],[mx,ay],[mx,by],[bx,by]]}
  const mx=ax+14, ex=bx-14, yy=(ay+by)/2; return [[ax,ay],[mx,ay],[mx,yy],[ex,yy],[ex,by],[bx,by]];
}
function plen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L}
function pAt(pts,t){
  let L=plen(pts)*t;
  for(let i=1;i<pts.length;i++){const sx=pts[i][0]-pts[i-1][0], sy=pts[i][1]-pts[i-1][1], l=Math.hypot(sx,sy);
    if(L<=l||i===pts.length-1){const f=l?Math.min(1,L/l):0;return{x:pts[i-1][0]+sx*f,y:pts[i-1][1]+sy*f}} L-=l}
  return {x:pts[0][0],y:pts[0][1]};
}
function segDist(p,a,b){const vx=b[0]-a[0],vy=b[1]-a[1],l=vx*vx+vy*vy;let t=l?((p.x-a[0])*vx+(p.y-a[1])*vy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p.x-a[0]-vx*t,p.y-a[1]-vy*t)}

/* ---------- HIT TEST ---------- */
function nodeAt(p){for(let i=sim.nodes.length-1;i>=0;i--){const n=sim.nodes[i];if(Math.abs(p.x-n.x)<=NW/2&&Math.abs(p.y-n.y)<=NH/2)return n}return null}
function portAt(p){for(const n of sim.nodes){if(n.type==='db'||n.type==='replica')continue;const px=n.x+NW/2+6,py=n.y;if(Math.abs(p.x-px)<=13&&Math.abs(p.y-py)<=14)return n}return null}
function edgeAt(p){for(const e of sim.edges){const pts=route(e);for(let i=1;i<pts.length;i++) if(segDist(p,pts[i-1],pts[i])<8) return e}return null}

/* ---------- POINTER ---------- */
cv.addEventListener('pointerdown',e=>{
  if(!sim) return; const p=toWorld(e.clientX,e.clientY);
  const pn=portAt(p);
  if(pn){drag={kind:'link',from:pn,x:p.x,y:p.y}; cv.setPointerCapture(e.pointerId); return}
  const n=nodeAt(p);
  if(n){sel=n;selEdge=null;drag={kind:'move',n,dx:p.x-n.x,dy:p.y-n.y}; cv.setPointerCapture(e.pointerId); renderInsp(); return}
  drag={kind:'pan',sx:e.clientX,sy:e.clientY,ox:view.ox,oy:view.oy,moved:false,p}; cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove',e=>{
  if(!sim) return; const p=toWorld(e.clientX,e.clientY);
  const po=portAt(p), no=nodeAt(p); hover=po||no;
  cv.style.cursor=po?'crosshair':no?'grab':edgeAt(p)?'pointer':'default';
  if(!drag) return;
  if(drag.kind==='move'){drag.n.x=Math.round(Math.max(-40,Math.min(940,p.x-drag.dx))/4)*4;drag.n.y=Math.round(Math.max(24,Math.min(468,p.y-drag.dy))/4)*4}
  if(drag.kind==='link'){drag.x=p.x;drag.y=p.y}
  if(drag.kind==='pan'){const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy; if(Math.abs(dx)+Math.abs(dy)>6) drag.moved=true;
    if(drag.moved){const w=900*view.s, h=500*view.s; view.ox=Math.max(Math.min(drag.ox+dx,CW*0.5),CW*0.5-w); view.oy=Math.max(Math.min(drag.oy+dy,CH*0.5),CH*0.5-h)}}
});
cv.addEventListener('pointerup',e=>{
  if(!drag) return; const p=toWorld(e.clientX,e.clientY);
  if(drag.kind==='link'){const t=nodeAt(p); if(t&&t!==drag.from){const err=sim.connect(drag.from,t); if(err) toast(err,'info')}}
  if(drag.kind==='pan'&&!drag.moved){selEdge=edgeAt(drag.p); sel=null; renderInsp()}
  if(drag.kind!=='new') drag=null;
});
function onWinMove(e){if(drag&&drag.kind==='new'){const p=toWorld(e.clientX,e.clientY);drag.x=p.x;drag.y=p.y;drag.inside=inStage(e.clientX,e.clientY)}}
function onWinUp(e){
  window.removeEventListener('pointermove',onWinMove);
  if(drag&&drag.kind==='new'&&inStage(e.clientX,e.clientY)){
    const d=DEF[drag.type]; const p=toWorld(e.clientX,e.clientY);
    if(sim.spent()+d.cost>LV.budget) toast(`Không đủ vàng! Còn ${LV.budget-sim.spent()}G, cần ${d.cost}G.`,'bad');
    else {const n=sim.addNode(drag.type,Math.round(Math.max(80,Math.min(820,p.x))/4)*4,Math.round(Math.max(44,Math.min(448,p.y))/4)*4); sel=n; selEdge=null; renderInsp()}
  }
  drag=null;
}
window.addEventListener('keydown',e=>{
  if(!$('#dlg').classList.contains('hidden')){ if(e.key==='Enter'||e.key===' '){e.preventDefault();nextLine()} return }
  if(!LV||$('#game').classList.contains('hidden')) return;
  if(e.key==='Delete'||e.key==='Backspace') deleteSel();
  if(e.key===' '&&!ended){e.preventDefault();togglePlay()}
});
function deleteSel(){
  if(selEdge){sim.edges=sim.edges.filter(x=>x!==selEdge);selEdge=null;renderInsp();return}
  if(sel&&!sel.locked){sim.removeNode(sel);sel=null;renderInsp()}
}

/* ---------- CỬA SỔ TRẠNG THÁI ---------- */
function hpOf(n){return Math.max(0,Math.round(100-Math.min(1,n.util)*100))}
function hpCls(hp){return hp>50?'':hp>20?'hurt':'crit'}
function renderInsp(){
  const el=$('#insp');
  if(selEdge){
    el.classList.remove('hidden');
    el.innerHTML=`<span class="ttl">CON ĐƯỜNG</span><div class="row"><span class="dim">Từ</span>${DEF[selEdge.a.type].name} ${selEdge.a.id}</div><div class="row"><span class="dim">Tới</span>${DEF[selEdge.b.type].name} ${selEdge.b.id}</div>
      <button class="cmd" onclick="deleteSel()">Phá đường</button>`;
    return;
  }
  if(!sel||!sim.nodes.includes(sel)){el.classList.add('hidden');sel=null;return}
  el.classList.remove('hidden'); const n=sel,d=DEF[n.type];
  let rows='';
  if(n.type!=='users') rows+=`<div class="row"><span class="dim">HP</span><span id="iU"></span></div><div class="row"><span class="dim">Hàng chờ</span><span id="iQ"></span></div>`;
  if(n.type==='cache') rows+=`<div class="row"><span class="dim">Cache hit</span><span id="iH"></span></div>`;
  if(n.type==='queue') rows+=`<div class="row"><span class="dim">Đơn chờ</span><span id="iB"></span></div>`;
  if(n.type!=='users') rows+=`<div class="row"><span class="dim">Giá</span><span class="y">${d.cost}G</span></div>`;
  let acts='';
  if(n.down) acts+=`<button class="cmd main" id="bRestart" onclick="restartSel()">Hồi sinh</button>`;
  if(!n.locked) acts+=`<button class="cmd" onclick="deleteSel()">Bán lại (+${d.cost}G)</button>`;
  el.innerHTML=`<span class="ttl">${d.name.toUpperCase()} ${n.id}</span>${rows}<p>${d.desc}${n.locked?' Cố định trong màn này.':''}</p>${acts}`;
  liveInsp();
}
function restartSel(){if(sel&&sel.down){sel.down=false;sel.downUntil=0;sel.bootUntil=sim.t+3;toast(`${DEF[sel.type].name} ${sel.id} đang hồi sinh... 3 giây`,'info');renderInsp()}}
function liveInsp(){
  if(!sel) return; const n=sel;
  const u=$('#iU'); if(u){const hp=hpOf(n); u.textContent=n.down?'0 · ĐÃ GỤC':(sim.t<n.bootUntil?'đang hồi sinh':hp); u.className=n.down?'crit':hpCls(hp)}
  const q=$('#iQ'); if(q) q.textContent=n.queue.length;
  const h=$('#iH'); if(h) h.textContent=Math.round(n.hitRate*100)+'%';
  const b=$('#iB'); if(b) b.textContent=Math.round(n.backlog);
  if(!!$('#bRestart')!==n.down) renderInsp();
}

/* ---------- CONTROLS ---------- */
function togglePlay(){if(ended)return; running=!running; updPlay()}
$('#bPlay').onclick=togglePlay;
$('#bReset').onclick=()=>resetLevel();
$('#bSpeed').onclick=()=>{speed=speed===1?2:speed===2?4:1; $('#bSpeed').textContent=`Tốc độ ${speed}x`};
$('#bHint').onclick=()=>{running=false;updPlay();playDialog(LV.hint)};
$('#bMenu').onclick=()=>{running=false;$('#game').classList.add('hidden');$('#result').classList.add('hidden');$('#menu').classList.remove('hidden');renderMenu();LV=null};

/* ---------- KHUNG THOẠI ---------- */
let dq=[], dcb=null, dTotal=0, typer=null, typeSpans=[];
function playDialog(lines,cb){
  if(!lines||!lines.length){cb&&cb();return}
  running=false; if(sim) updPlay(); dq=lines.slice(); dcb=cb||null; dTotal=dq.length;
  $('#dlg').classList.remove('hidden'); nextLine();
}
function doneTyping(){typer=null; typeSpans.forEach(s=>s.style.visibility=''); $('#dMore').classList.remove('hidden')}
function nextLine(){
  if(typer){clearInterval(typer);doneTyping();return}
  if(!dq.length){$('#dlg').classList.add('hidden'); const c=dcb; dcb=null; c&&c(); return}
  const [who,text]=dq.shift(), c=CAST[who];
  $('#dName').textContent=c.name; $('#dMore').classList.add('hidden');
  const quoted=(who==='sys')?text:`* “${text}”`;
  const box=$('#dText'); box.innerHTML=quoted; typeSpans=[];
  const walk=node=>{for(const ch of [...node.childNodes]){
    if(ch.nodeType===3){const frag=document.createDocumentFragment();for(const k of ch.textContent){const s=document.createElement('span');s.textContent=k;s.style.visibility='hidden';typeSpans.push(s);frag.appendChild(s)}ch.replaceWith(frag)}
    else walk(ch)}};
  walk(box);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) doneTyping();
  else{let i=0; typer=setInterval(()=>{for(let k=0;k<2&&i<typeSpans.length;k++) typeSpans[i++].style.visibility=''; if(i>=typeSpans.length){clearInterval(typer);doneTyping()}},22)}
  $('#dCount').textContent=`${dTotal-dq.length}/${dTotal}`;
}
$('#msg').addEventListener('click',nextLine);

/* ---------- THÔNG BÁO ---------- */
function toast(text,kind=''){
  const t=document.createElement('div'); t.className='win toast '+kind; t.textContent=text; $('#toasts').appendChild(t);
  setTimeout(()=>t.remove(),kind==='bad'?4500:3200);
  while($('#toasts').children.length>3) $('#toasts').firstChild.remove();
}

/* ---------- KẾT THÚC ---------- */
function finish(){
  running=false; ended=true; updPlay();
  const s=sim.summary(); const pass=s.err<=LV.goalErr && s.p99<=LV.goalP99;
  let stars=0; if(pass){stars=1; if(s.err<=LV.goalErr/2) stars++; if(s.cost<=LV.star3) stars++}
  if(pass){save.done[LV.id]=true; save.stars[LV.id]=Math.max(save.stars[LV.id]||0,stars); persist()}
  playDialog(pass?LV.win:LV.lose,()=>showResult(pass,stars,s));
}
function showResult(pass,stars,s){
  const nextL=LEVELS[LEVELS.indexOf(LV)+1];
  const pc=v=>(v*100).toFixed(2)+'%';
  const ok=b=>b?'<span class="good">ĐẠT</span>':'<span class="crit">TRƯỢT</span>';
  $('#rbox').innerHTML=`
    <h2>${pass?'Hệ thống sống sót!':'Hệ thống đã gục...'}</h2>
    <div class="rstars">${[0,1,2].map(i=>starHTML(i<stars,3)).join('')}<span style="margin-left:8px">${pass?`Nhận được ${stars} sao.`:'Không nhận được sao nào.'}</span></div>
    <div class="line"><span class="dim">Tỷ lệ lỗi ≤ ${pc(LV.goalErr)}</span><span>${pc(s.err)} ${ok(s.err<=LV.goalErr)}</span></div>
    <div class="line"><span class="dim">p99 ≤ ${LV.goalP99}ms</span><span>${Math.round(s.p99)}ms ${ok(s.p99<=LV.goalP99)}</span></div>
    <div class="line"><span class="dim">p50</span><span>${Math.round(s.p50)}ms</span></div>
    <div class="line"><span class="dim">Vàng đã tiêu (3 sao nếu ≤ ${LV.star3}G)</span><span class="y">${s.cost}G</span></div>
    <div class="line"><span class="dim">Request thành công</span><span>${Math.round(s.served).toLocaleString('vi')}</span></div>
    ${s.topReason&&s.failed>0?`<div class="why">Đòn đau nhất: ${s.topReason} (${(s.topShare*100).toFixed(1)}% tổng request).</div>`:''}
    <div class="why">Sao 1: qua màn · Sao 2: lỗi ≤ ${pc(LV.goalErr/2)} · Sao 3: tiêu ≤ ${LV.star3}G</div>
    <div class="ract">
      ${pass&&nextL?`<button class="cmd main on" id="rNext">${nextL.sandbox?'Mở Sandbox':'Chương tiếp'}</button>`:''}
      <button class="cmd ${pass&&nextL?'':'on'}" id="rAgain">Chơi lại</button>
      <button class="cmd" id="rMenu">Về nhật ký</button>
    </div>`;
  $('#rAgain').onclick=()=>{$('#result').classList.add('hidden');resetLevel()};
  $('#rMenu').onclick=()=>$('#bMenu').click();
  if($('#rNext')) $('#rNext').onclick=()=>{$('#result').classList.add('hidden');startLevel(nextL)};
  $('#result').classList.remove('hidden');
}

/* ---------- HUD ---------- */
const cls=(v,goal)=>v<=goal?'':v<=goal*2?'hurt':'crit';
function updateUI(force){
  const now=performance.now(); if(!force&&now-lastUI<200) return; lastUI=now;
  const w=sim.windowStats(3), s=sim.summary(), started=sim.t>0;
  $('#sTime').textContent=LV.duration?`${Math.floor(sim.t)}/${LV.duration}s`:`${Math.floor(sim.t)}s`;
  $('#sRps').textContent=`${Math.round(sim.inRate)}/s`;
  $('#sErr').textContent=(w.err*100).toFixed(1)+'%'; $('#stErr').className='stat big '+(started?cls(w.err,LV.goalErr):'');
  $('#sP99').textContent=Math.round(w.p99)+'ms'; $('#stP99').className='stat '+(started?cls(w.p99,LV.goalP99):'');
  $('#sCost').textContent=LV.budget===Infinity?`${s.cost}G`:`${LV.budget-s.cost}G`;
  $('#prog i').style.width=LV.duration?Math.min(100,sim.t/LV.duration*100)+'%':'0';
  const gEl=$('#goals');
  if(LV.sandbox && gEl.querySelector('#sandboxCtl')){
    $('#gErr').textContent=(s.err*100).toFixed(2)+'%'; $('#gP99').textContent=Math.round(s.p99)+'ms';
  } else {
    let g=`<span class="ttl">NHIỆM VỤ</span>
      <div class="goal"><span>Lỗi ≤ ${LV.goalErr*100}%</span><span id="gErr" class="${started?cls(s.err,LV.goalErr):''}">${(s.err*100).toFixed(2)}%</span></div>
      <div class="goal"><span>p99 ≤ ${LV.goalP99}ms</span><span id="gP99" class="${started?cls(s.p99,LV.goalP99):''}">${Math.round(s.p99)}ms</span></div>`;
    if(LV.budget!==Infinity) g+=`<div class="goal"><span>Vàng còn</span><span class="y">${LV.budget-s.cost}G</span></div>`;
    if(LV.duration) g+=`<div class="goal"><span>Trụ ${LV.duration} giây</span><span>${Math.floor(sim.t)}s</span></div>`;
    if(s.lost>0) g+=`<div class="goal crit"><span>Đơn bị mất</span><span>${Math.round(s.lost)}</span></div>`;
    if(LV.sandbox) g+=`<div id="sandboxCtl"><label for="sbRi">Tải vào: <span id="sbR">${SANDBOX.rate}</span> req/s</label><input id="sbRi" type="range" min="0" max="4000" step="50" value="${SANDBOX.rate}" oninput="SANDBOX.rate=+this.value;$('#sbR').textContent=this.value">
      <label for="sbWi">Tỷ lệ ghi: <span id="sbW">${Math.round(SANDBOX.write*100)}</span>%</label><input id="sbWi" type="range" min="0" max="90" value="${Math.round(SANDBOX.write*100)}" oninput="SANDBOX.write=this.value/100;$('#sbW').textContent=this.value"></div>`;
    gEl.innerHTML=g;
  }
  refreshTray(); liveInsp(); drawChart();
}
function drawChart(){
  const ch=$('#chart'), c=ch.getContext('2d'), W=ch.width, H=ch.height; c.clearRect(0,0,W,H);
  const bs=sim.win.slice(-60); if(bs.length<2) return;
  const maxIn=Math.max(100,...bs.map(b=>b.inW))*1.1, pmax=Math.max(LV.goalP99*2,300);
  const plot=(vals,max,col)=>{c.fillStyle=col; let py=null;
    vals.forEach((v,i)=>{const x=i*2, y=Math.round(H-2-(Math.min(v,max)/max)*(H-4));
      c.fillRect(x,y,2,2); if(py!==null){const a=Math.min(py,y),b=Math.max(py,y);c.fillRect(x,a,1,b-a+1)} py=y});};
  plot(bs.map(b=>pct(b.h,0.99)),pmax,C.gold);
  plot(bs.map(b=>b.inW),maxIn,C.white);
  plot(bs.map(b=>{const t=b.ok+b.fail;return t?b.fail/t:0}),1,C.crit);
}

/* ---------- VẼ BẢN ĐỒ ---------- */
const snap=v=>Math.round(v);
function winBox(x,y,w,h,border){
  ctx.fillStyle='#000'; ctx.fillRect(x+3,y,w-6,h); ctx.fillRect(x,y+3,w,h-6); ctx.fillRect(x+1,y+1,w-2,h-2);
  const i=4,t=3; ctx.fillStyle=border;
  ctx.fillRect(x+i+3,y+i,w-2*i-6,t); ctx.fillRect(x+i+3,y+h-i-t,w-2*i-6,t);
  ctx.fillRect(x+i,y+i+3,t,h-2*i-6); ctx.fillRect(x+w-i-t,y+i+3,t,h-2*i-6);
  ctx.fillRect(x+i+1,y+i+1,t,t); ctx.fillRect(x+w-i-t-1,y+i+1,t,t); ctx.fillRect(x+i+1,y+h-i-t-1,t,t); ctx.fillRect(x+w-i-t-1,y+h-i-t-1,t,t);
}
function txt(s,x,y,col,font){ctx.font=font||FONT;ctx.fillStyle=col;ctx.fillText(s,x,y);ctx.fillText(s,x+1,y)}
function drawRoad(pts,sel){
  const path=()=>{ctx.beginPath();ctx.moveTo(snap(pts[0][0]),snap(pts[0][1]));for(let i=1;i<pts.length;i++)ctx.lineTo(snap(pts[i][0]),snap(pts[i][1]))};
  ctx.lineJoin='miter'; ctx.lineCap='square';
  path(); ctx.strokeStyle=sel?C.roadSel:C.roadEdge; ctx.lineWidth=12; ctx.stroke();
  path(); ctx.strokeStyle=C.road; ctx.lineWidth=7; ctx.stroke();
}
function drawNode(n){
  const d=DEF[n.type], x=snap(n.x-NW/2), y=snap(n.y-NH/2), down=n.down, booting=sim.t<n.bootUntil, hp=hpOf(n);
  const tone=down?C.crit:booting?C.good:n.type==='users'?C.white:hp>50?C.white:hp>20?C.hurt:C.crit;
  winBox(x,y,NW,NH,n===sel?C.gold:tone===C.white?C.white:tone);
  ctx.textBaseline='alphabetic'; ctx.textAlign='left';
  drawSprite(ctx,down?'skull':n.type,x+12,y+13,2,{X:tone,O:down?C.crit:C.good});
  txt(d.name,x+38,y+27,tone,FONT_N);
  ctx.font=FONT_N; if(38+ctx.measureText(d.name).width+28<NW) txt(`${n.id}`,x+NW-20,y+27,C.dim,FONT_S);
  let sub;
  if(n.type==='users') sub=`${Math.round(sim.inRate)} req/s`;
  else if(down) sub='ĐÃ GỤC · bấm hồi sinh';
  else if(booting) sub='đang hồi sinh...';
  else if(n.type==='queue') sub=`HP ${hp}  chờ ${Math.round(n.backlog)}`;
  else if(n.type==='cache') sub=`HP ${hp}  hit ${Math.round(n.hitRate*100)}%`;
  else sub=`HP ${hp}  chờ ${n.queue.length}`;
  txt(sub,x+14,y+48,tone,FONT_S);
  if(n.flash>0.1&&!down&&Math.floor(blinkT*12)%2===0){winBox(x,y,NW,NH,C.crit);drawSprite(ctx,n.type,x+12,y+13,2,{X:C.crit,O:C.crit});txt(d.name,x+38,y+27,C.crit,FONT_N);txt(sub,x+14,y+48,C.crit,FONT_S)}
  // mũi tên nối đường
  if(n.type!=='db'&&n.type!=='replica'){
    const hot=hover===n||(drag&&drag.kind==='link'&&drag.from===n);
    drawSprite(ctx,'cur',x+NW+1,snap(n.y)-9,2,{X:hot?C.gold:C.white});
  }
  if(n===sel) drawSprite(ctx,'cur',x-16,snap(n.y)-9,2,{X:Math.floor(blinkT*2)%2?C.gold:'rgba(0,0,0,0)'});
}
function draw(){
  ctx.clearRect(0,0,CW,CH); ctx.save(); ctx.translate(snap(view.ox),snap(view.oy)); ctx.scale(view.s,view.s);
  for(const e of sim.edges) drawRoad(route(e),e===selEdge);
  if(drag&&drag.kind==='link'){ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(drag.from.x+NW/2+12,drag.from.y);ctx.lineTo(drag.x,drag.y);ctx.strokeStyle=C.gold;ctx.lineWidth=5;ctx.stroke();ctx.setLineDash([])}
  for(const p of particles){const q=pAt(p.pts,p.t); const s=p.bg?3:5; ctx.fillStyle='#000'; ctx.fillRect(snap(q.x)-s/2-1,snap(q.y)-s/2-1,s+2,s+2); ctx.fillStyle=p.col; ctx.fillRect(snap(q.x)-s/2,snap(q.y)-s/2,s,s)}
  for(const n of sim.nodes) drawNode(n);
  for(const s of sparks){const r=snap(3+s.t*12); ctx.fillStyle=s.t<0.5?C.white:C.crit;
    ctx.fillRect(s.x-r,s.y-1,3,3);ctx.fillRect(s.x+r,s.y-1,3,3);ctx.fillRect(s.x-1,s.y-r,3,3);ctx.fillRect(s.x-1,s.y+r,3,3)}
  if(drag&&drag.kind==='new'&&drag.inside){const x=snap(drag.x-NW/2),y=snap(drag.y-NH/2);ctx.globalAlpha=.75;winBox(x,y,NW,NH,C.gold);drawSprite(ctx,drag.type,x+12,y+13,2,{X:C.gold,O:C.good});txt(DEF[drag.type].name,x+38,y+27,C.gold);ctx.globalAlpha=1}
  if(sim.edges.length===0&&sim.t===0){ctx.textAlign='center';const m='Kéo từ mũi tên ▸ cạnh "Người dùng" sang Server để làm đường';ctx.font=FONT;const w=ctx.measureText(m).width+40;winBox(440-w/2,120,w,44,C.white);txt(m,440,149,C.white);ctx.textAlign='left'}
  ctx.restore();
}

/* ---------- LOOP ---------- */
let last=performance.now();
function loop(now){
  const rdt=Math.min(0.1,(now-last)/1000); last=now; blinkT+=rdt;
  if(LV&&sim){
    if(running&&!ended){
      acc+=rdt*speed; let k=0;
      while(acc>=TICK&&k<40){sim.step(TICK);acc-=TICK;k++}
      for(const m of sim.msgs) toast(m.text,m.kind); sim.msgs=[];
      for(const ph of (LV.phases||[])) if(sim.t>=ph.t&&!phaseFired.has(ph)){phaseFired.add(ph);toast(ph.text)}
      if(LV.duration&&sim.t>=LV.duration) finish();
    }
    for(const ev of sim.events){
      if(ev.k==='flow'&&particles.length<600){const e=sim.edges.find(x=>x.a===ev.a&&x.b===ev.b); if(e) particles.push({e,pts:route(e),t:0,col:ev.bg?C.bg:ev.write?C.write:C.read,bg:ev.bg})}
      else if(ev.k==='fail'&&sparks.length<24) sparks.push({x:snap(ev.n.x+(Math.random()-0.5)*NW*0.8),y:snap(ev.n.y+(Math.random()-0.5)*NH*0.7),t:0});
    }
    sim.events=[];
    const pv=rdt*Math.min(speed,2)*2.4;
    for(const p of particles) p.t+=pv;
    particles=particles.filter(p=>p.t<1&&sim.edges.includes(p.e));
    for(const s of sparks) s.t+=rdt*2.5; sparks=sparks.filter(s=>s.t<1);
    draw(); updateUI();
  }
  requestAnimationFrame(loop);
}
document.fonts.ready.then(()=>{renderMenu(); requestAnimationFrame(loop)});
