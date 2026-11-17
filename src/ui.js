const $=s=>document.querySelector(s);
const NW=132, NH=62, PORT=7;
const C={board:'#174a35',silk:'#eef2e2',silkDim:'#bfe0c8',cu:'#a8692f',cuDark:'#7a4b22',cuHi:'#ffd27a',chip:'#141613',chipHi:'#2a2e28',
  mark:'#c3c8bd',markDim:'#8d9387',pin:'#b9bdb3',pad:'#d4ad52',ok:'#56f06a',warn:'#ffb21e',bad:'#ff3b2f',off:'#3c2a26',
  read:'#ffe08a',write:'#ff7a3d',bg:'#c8a2ff',ink:'#1b2610',inkMid:'#3b4720',lcd:'#b9c97c'};
const FS='700 17px Handjet', FSD='700 14px Handjet', FR='18px VT323';

/* ---------- PIXEL SPRITES (vẽ tay, mỗi ký tự = 1 pixel) ---------- */
const SPR={
  users:["..XX...XX.",".XXXX.XXXX",".XXXX.XXXX","..XX...XX.","..........",".XXXX.XXXX","XXXXXXXXXX","XXXXXXXXXX","XXXXXXXXXX"],
  lb:["......XXX","X.....XXX","XX...XX..","XXXXXX...","XXXXXX...","XX...XX..","X.....XXX","......XXX"],
  server:["XXXXXXXXX","X.......X","X.XX..O.X","XXXXXXXXX","X.......X","X.XX..O.X","XXXXXXXXX","X.......X","X.XX..O.X","XXXXXXXXX"],
  cache:["....XXXX","...XXXX.","..XXXX..",".XXXXXXX","XXXXXXX.","...XXX..","..XXX...",".XX.....","X......."],
  db:[".XXXXXXX.","X.......X","XXXXXXXXX","X.......X","XXXXXXXXX","X.......X","XXXXXXXXX","X.......X",".XXXXXXX."],
  replica:["XX.XX.XX.","XX.XX.XX.","XX.XX.XX.","X..X..X..","XX.XX.XX.","XX.XX.XX.","XX.XX.XX.","XXXXXXXXX","XXXXXXXXX"],
  queue:["XXXXXXXXX","XX.....XX","X.X...X.X","X..XXX..X","XXXXXXXXX",".........","XXX.XX.X.","XXX.XX.X."],
  skull:[".XXXXXXX.","XXXXXXXXX","X..XXX..X","X..XXX..X","XXXX.XXXX",".XXXXXXX.","..X.X.X.."],
  linh:["...DDDDDD...","..DDDDDDDD..",".DDD....DDD.",".DD......DD.",".DD.D..D.DD.",".DD......DD.",".DD..DD..DD.",".DDD....DDD.",".DD.DDDD.DD.","...MMMMMM...","..MMMDDMMM..",".MMMMDDMMMM."],
  bao:["............","...DDDDDD...","..DDDDDDDD..","..D......D..","..D.D..D.D..","..D......D..","..DDD..DDD..","..DDDDDDDD..","...DD..DD...","....DDDD....","..MMMMMMMM..",".MMMMMMMMMM."],
  you:["............","...DDDDDD...","..DDDDDDDD..","..D......D..","..DDD..DDD..","..DMD..DMD..","..D......D..","..D..DD..D..","...D....D...","....DDDD....",".DDDMMMMDDD.","DDDMMMMMMDDD"],
  sys:["............",".DDDDDDDDDD.",".D........D.",".D.D.DD...D.",".D........D.",".D.DDD.D..D.",".D........D.",".DDDDDDDDDD.","....DDDD....","...DDDDDD...","............","............"],
  msg:["............",".DDDDDDDDDD.","D..........D","D.DD.DD.DD.D","D..........D",".DDDDDDDDDD.","..DD........","..D.........","............","............","............","............"],
};
function drawSprite(g,name,x,y,s,col){
  const rows=SPR[name];
  for(let j=0;j<rows.length;j++) for(let i=0;i<rows[j].length;i++){
    const ch=rows[j][i]; if(ch==='.') continue;
    g.fillStyle=col[ch]||col.X; g.fillRect(Math.round(x+i*s),Math.round(y+j*s),s,s);
  }
}
function spriteCanvas(name,s,col,el){
  const rows=SPR[name], w=Math.max(...rows.map(r=>r.length)), h=rows.length;
  const c=el||document.createElement('canvas'); c.className='spr'; c.width=w*s; c.height=h*s;
  const g=c.getContext('2d'); g.clearRect(0,0,c.width,c.height); drawSprite(g,name,0,0,s,col); return c;
}

/* ---------- SAVE ---------- */
let save={stars:{},done:{}};
try{save=JSON.parse(localStorage.getItem('uptime-save'))||save}catch(e){}
function persist(){try{localStorage.setItem('uptime-save',JSON.stringify(save))}catch(e){}}

let LV=null, sim=null, running=false, ended=false, speed=1, acc=0, sel=null, selEdge=null;
let particles=[], sparks=[], drag=null, hover=null, lastUI=0, phaseFired=new Set();

/* ---------- MENU ---------- */
function renderMenu(){
  const box=$('#sockets'); box.innerHTML='';
  LEVELS.forEach((L,i)=>{
    const unlocked = i===0 || save.done[LEVELS[i-1].id] || (L.sandbox && save.done[5]);
    const st=save.stars[L.id]||0;
    const b=document.createElement('button');
    b.className='socket'+(unlocked?'':' empty')+(L.sandbox?' sand':''); b.disabled=!unlocked;
    b.setAttribute('aria-label',`${L.chapter}: ${L.title}${unlocked?'':' (chưa mở)'}`);
    const leds=L.sandbox?'':`<span class="stars">${[0,1,2].map(k=>`<span class="led ${k<st?'ok':''}"></span>`).join('')}</span>`;
    b.innerHTML=`<div class="des"><span>U${L.id} · ${L.chapter}</span>${leds}</div>
      <div class="pkg"><span class="dot"></span><div class="tt">${L.title}</div><div class="ds">${unlocked?L.blurb:'Chưa mở. Hoàn thành chương trước để gắn chip này.'}</div></div>`;
    b.onclick=()=>{if(unlocked) startLevel(L)};
    box.appendChild(b);
  });
  requestAnimationFrame(drawMenuTraces);
}
function drawMenuTraces(){
  const svg=$('#menuTraces'), menu=$('#menu'); const mr=menu.getBoundingClientRect();
  svg.setAttribute('width',menu.scrollWidth); svg.setAttribute('height',menu.scrollHeight);
  const socks=[...document.querySelectorAll('.socket .pkg')];
  let html='';
  for(let i=0;i<socks.length-1;i++){
    const a=socks[i].getBoundingClientRect(), b=socks[i+1].getBoundingClientRect();
    const ax=a.right-mr.left+menu.scrollLeft, ay=a.top+a.height/2-mr.top+menu.scrollTop;
    const bx=b.left-mr.left+menu.scrollLeft, by=b.top+b.height/2-mr.top+menu.scrollTop;
    let pts;
    if(Math.abs(ay-by)<4) pts=[[ax,ay],[bx,by]];
    else { const mx=a.right-mr.left+18, dy=b.top-mr.top+menu.scrollTop-28; // xuống hàng: đi vòng
      pts=[[a.left+a.width/2-mr.left,a.bottom-mr.top+menu.scrollTop+8],[a.left+a.width/2-mr.left,dy],[b.left+b.width/2-mr.left,dy],[b.left+b.width/2-mr.left,b.top-mr.top+menu.scrollTop-8]]; }
    const lit=save.done[LEVELS[i].id];
    html+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${lit?C.cuHi:C.cuDark}" stroke-width="5" stroke-linejoin="miter"/>`;
    for(const p of [pts[0],pts[pts.length-1]]) html+=`<rect x="${p[0]-5}" y="${p[1]-5}" width="10" height="10" fill="${C.pad}"/>`;
  }
  svg.innerHTML=html;
}
window.addEventListener('resize',()=>{ if(!$('#menu').classList.contains('hidden')) drawMenuTraces() });

/* ---------- LEVEL ---------- */
function startLevel(L){
  LV=L; $('#menu').classList.add('hidden'); $('#game').classList.remove('hidden');
  buildTray(); resetLevel(); resize();
  playDialog(L.intro);
}
function resetLevel(){
  sim=new Sim(LV); running=false; ended=false; acc=0; sel=null; selEdge=null; particles=[]; sparks=[]; phaseFired=new Set();
  const ns=LV.preset.nodes.map(([t,x,y,lk])=>sim.addNode(t,x,y,lk));
  for(const [a,b] of LV.preset.edges) sim.connect(ns[a],ns[b]);
  $('#lvChap').textContent=LV.chapter; $('#lvTitle').textContent=LV.title;
  updPlay(); updateUI(true); renderInsp();
}
function updPlay(){const b=$('#bPlay'); b.textContent=running?'Tạm dừng':(sim&&sim.t>0?'Tiếp tục':'Chạy'); b.classList.toggle('go',!running); b.classList.toggle('stop',running)}

/* ---------- TRAY ---------- */
function buildTray(){
  const p=$('#tray'); p.innerHTML='<span class="silk">Khay linh kiện · kéo lên bo</span>';
  for(const t of LV.palette){
    const d=DEF[t]; const c=document.createElement('div'); c.className='part'; c.dataset.t=t; c.title=d.desc;
    c.appendChild(spriteCanvas(t,3,{X:C.mark,O:C.ok}));
    c.insertAdjacentHTML('beforeend',`<div><div class="nm">${d.name}</div><div class="cs">$${d.cost}/tháng · ${t==='db'||t==='replica'?d.cap+' tải/s':t==='server'?d.cap+' req/s':'rất nhanh'}</div></div>`);
    c.addEventListener('pointerdown',e=>{e.preventDefault(); drag={kind:'new',type:t,x:-999,y:-999}; window.addEventListener('pointermove',onWinMove); window.addEventListener('pointerup',onWinUp,{once:true})});
    p.appendChild(c);
  }
  p.insertAdjacentHTML('beforeend','<span class="silk" style="margin-left:auto">Nối dây: kéo từ chân vàng bên phải chip</span>');
}
function refreshTray(){const left=LV.budget-sim.spent(); document.querySelectorAll('.part').forEach(c=>c.classList.toggle('na',DEF[c.dataset.t].cost>left))}

/* ---------- VIEW ---------- */
const cv=$('#cv'), ctx=cv.getContext('2d');
let view={s:1,ox:0,oy:0}, CW=0, CH=0;
function resize(){
  const r=$('#stage').getBoundingClientRect(); CW=r.width; CH=r.height;
  const dpr=window.devicePixelRatio||1; cv.width=CW*dpr; cv.height=CH*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.imageSmoothingEnabled=false;
  const fit=Math.min(1.3,CW/920,CH/500);
  if(CW<820 && fit<0.7){ const s=Math.min(0.8,CH/540); view={s,ox:16+20*s,oy:(CH-480*s)/2}; } // màn hẹp: phóng to, kéo nền để di chuyển
  else view={s:fit,ox:(CW-880*fit)/2,oy:(CH-480*fit)/2};
  const ch=$('#chart'); ch.width=120; ch.height=40;
}
window.addEventListener('resize',()=>{if(LV)resize()});
function toWorld(cx,cy){const r=cv.getBoundingClientRect();return{x:(cx-r.left-view.ox)/view.s,y:(cy-r.top-view.oy)/view.s}}
function inStage(cx,cy){const r=cv.getBoundingClientRect();return cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom}

/* ---------- TRACE ROUTING (0° / 45° như đường mạch thật) ---------- */
function route(e){
  const ax=e.a.x+NW/2+PORT, ay=e.a.y, bx=e.b.x-NW/2-4, by=e.b.y;
  const dx=bx-ax, dy=by-ay, ady=Math.abs(dy);
  if(Math.abs(dy)<1) return [[ax,ay],[bx,by]];
  if(dx>ady+16){ const x1=ax+(dx-ady)/2; return [[ax,ay],[x1,ay],[x1+ady,by],[bx,by]]; }
  const mx=ax+12, ex=bx-12; // không đủ chỗ chéo: đi vuông góc
  if(ex>mx) return [[ax,ay],[mx+(ex-mx)/2,ay],[mx+(ex-mx)/2,by],[bx,by]];
  const yy=(ay+by)/2; return [[ax,ay],[mx,ay],[mx,yy],[ex,yy],[ex,by],[bx,by]];
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
function nodeAt(p){for(let i=sim.nodes.length-1;i>=0;i--){const n=sim.nodes[i];if(Math.abs(p.x-n.x)<=NW/2&&Math.abs(p.y-n.y)<=NH/2+4)return n}return null}
function portAt(p){for(const n of sim.nodes){if(n.type==='db'||n.type==='replica')continue;const px=n.x+NW/2+PORT/2+1,py=n.y;if(Math.abs(p.x-px)<=13&&Math.abs(p.y-py)<=13)return n}return null}
function edgeAt(p){for(const e of sim.edges){const pts=route(e);for(let i=1;i<pts.length;i++) if(segDist(p,pts[i-1],pts[i])<7) return e}return null}

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
  if(drag.kind==='move'){drag.n.x=Math.round(Math.max(-30,Math.min(910,p.x-drag.dx))/2)*2;drag.n.y=Math.round(Math.max(24,Math.min(468,p.y-drag.dy))/2)*2}
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
    if(sim.spent()+d.cost>LV.budget) toast(`Hết ngân sách: còn $${LV.budget-sim.spent()}, chip này cần $${d.cost}.`,'bad');
    else {const n=sim.addNode(drag.type,Math.round(Math.max(70,Math.min(830,p.x))/2)*2,Math.round(Math.max(44,Math.min(448,p.y))/2)*2); sel=n; selEdge=null; renderInsp()}
  }
  drag=null;
}
window.addEventListener('keydown',e=>{
  if(!$('#dlg').classList.contains('hidden')){ if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#dNext').click()} return }
  if(!LV||$('#game').classList.contains('hidden')) return;
  if(e.key==='Delete'||e.key==='Backspace') deleteSel();
  if(e.key===' '&&!ended){e.preventDefault();togglePlay()}
});
function deleteSel(){
  if(selEdge){sim.edges=sim.edges.filter(x=>x!==selEdge);selEdge=null;renderInsp();return}
  if(sel&&!sel.locked){sim.removeNode(sel);sel=null;renderInsp()}
}

/* ---------- INSPECTOR ---------- */
function renderInsp(){
  const el=$('#insp');
  if(selEdge){
    el.classList.remove('hidden');
    el.innerHTML=`<div class="cap">Đường mạch</div><div class="lcd"><div class="row"><span>Từ</span>${DEF[selEdge.a.type].name} U${selEdge.a.id}</div><div class="row"><span>Tới</span>${DEF[selEdge.b.type].name} U${selEdge.b.id}</div>
      <div class="acts"><button class="sw sm" onclick="deleteSel()">Cắt dây</button></div></div>`;
    return;
  }
  if(!sel||!sim.nodes.includes(sel)){el.classList.add('hidden');sel=null;return}
  el.classList.remove('hidden'); const n=sel,d=DEF[n.type];
  let rows='';
  if(n.type!=='users') rows+=`<div class="row"><span>Tải</span><span id="iU" style="color:var(--ink)"></span></div><div class="row"><span>Hàng chờ</span><span id="iQ" style="color:var(--ink)"></span></div>`;
  if(n.type==='cache') rows+=`<div class="row"><span>Cache hit</span><span id="iH" style="color:var(--ink)"></span></div>`;
  if(n.type==='queue') rows+=`<div class="row"><span>Đơn chờ</span><span id="iB" style="color:var(--ink)"></span></div>`;
  if(n.type!=='users') rows+=`<div class="row"><span>Chi phí</span>$${d.cost}/tháng</div>`;
  let acts='';
  if(n.down) acts+=`<button class="sw sm go" id="bRestart" onclick="restartSel()">Khởi động lại</button>`;
  if(!n.locked) acts+=`<button class="sw sm" onclick="deleteSel()">Gỡ chip (+$${d.cost})</button>`;
  el.innerHTML=`<div class="cap">U${n.id} · ${n.locked?'chip cố định':'chip của bạn'}</div><div class="lcd"><div class="nm">${d.name}</div>${rows}<p>${d.desc}</p>${acts?`<div class="acts">${acts}</div>`:''}</div>`;
  liveInsp();
}
function restartSel(){if(sel&&sel.down){sel.down=false;sel.downUntil=0;sel.bootUntil=sim.t+3;toast(`Đang khởi động ${DEF[sel.type].name} U${sel.id}... 3 giây`,'info');renderInsp()}}
function liveInsp(){
  if(!sel) return; const n=sel;
  const u=$('#iU'); if(u) u.textContent=n.down?'SẬP':(sim.t<n.bootUntil?'đang boot':Math.round(n.util*100)+'%');
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

/* ---------- DIALOG: chữ chạy trên LCD ---------- */
let dq=[], dcb=null, dTotal=0, typer=null, typeSpans=[];
function playDialog(lines,cb){
  if(!lines||!lines.length){cb&&cb();return}
  running=false; if(sim) updPlay(); dq=lines.slice(); dcb=cb||null; dTotal=dq.length;
  $('#dlg').classList.remove('hidden'); nextLine();
}
function nextLine(){
  if(typer){clearInterval(typer);typer=null;typeSpans.forEach(s=>s.style.visibility='');return}
  if(!dq.length){$('#dlg').classList.add('hidden'); const c=dcb; dcb=null; c&&c(); return}
  const [who,text]=dq.shift(), c=CAST[who];
  spriteCanvas(who,6,{D:C.ink,M:C.inkMid},$('#dAv'));
  $('#dName').textContent=c.name;
  const box=$('#dText'); box.innerHTML=text; typeSpans=[];
  const walk=node=>{for(const ch of [...node.childNodes]){
    if(ch.nodeType===3){const frag=document.createDocumentFragment();for(const k of ch.textContent){const s=document.createElement('span');s.textContent=k;s.style.visibility='hidden';typeSpans.push(s);frag.appendChild(s)}ch.replaceWith(frag)}
    else walk(ch)}};
  walk(box);
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){typeSpans.forEach(s=>s.style.visibility='')}
  else{let i=0; typer=setInterval(()=>{for(let k=0;k<2&&i<typeSpans.length;k++) typeSpans[i++].style.visibility=''; if(i>=typeSpans.length){clearInterval(typer);typer=null}},16)}
  $('#dCount').textContent=`${dTotal-dq.length}/${dTotal}`;
  $('#dNext').textContent=dq.length?'Tiếp':'Bắt đầu';
}
$('#dNext').onclick=nextLine;
$('#dlg').addEventListener('click',e=>{if(e.target.id==='dlg'||e.target.closest('.dscreen')) nextLine()});

/* ---------- TOAST ---------- */
function toast(text,kind=''){
  const t=document.createElement('div'); t.className='toast '+kind; t.textContent=text; $('#toasts').appendChild(t);
  setTimeout(()=>{t.style.transition='opacity .3s steps(3)';t.style.opacity=0;setTimeout(()=>t.remove(),320)},kind==='bad'?4500:3200);
  while($('#toasts').children.length>3) $('#toasts').firstChild.remove();
}

/* ---------- END ---------- */
function finish(){
  running=false; ended=true; updPlay();
  const s=sim.summary(); const pass=s.err<=LV.goalErr && s.p99<=LV.goalP99;
  let stars=0; if(pass){stars=1; if(s.err<=LV.goalErr/2) stars++; if(s.cost<=LV.star3) stars++}
  if(pass){save.done[LV.id]=true; save.stars[LV.id]=Math.max(save.stars[LV.id]||0,stars); persist()}
  playDialog(pass?LV.win:LV.lose,()=>showResult(pass,stars,s));
}
function showResult(pass,stars,s){
  const idx=LEVELS.indexOf(LV), nextL=LEVELS[idx+1];
  const pc=v=>(v*100).toFixed(2)+'%';
  const why = s.topReason && s.failed>0 ? `<div class="rwhy">Lỗi nhiều nhất: ${s.topReason} (${(s.topShare*100).toFixed(1)}% tổng request).</div>`:'';
  $('#rbox').innerHTML=`
    <div class="sub">Báo cáo kiểm thử · ${LV.chapter}</div>
    <h2>${pass?'Hệ thống sống sót':'Hệ thống sập'}</h2>
    <div class="rstars" aria-label="${stars} trên 3 sao">${[0,1,2].map(i=>`<span class="led ${i<stars?'ok':''}"></span>`).join('')}</div>
    <div class="lcd rtab">
      <div><span>Tỷ lệ lỗi (≤ ${pc(LV.goalErr)})</span>${pc(s.err)} ${s.err<=LV.goalErr?'ĐẠT':'TRƯỢT'}</div>
      <div><span>p99 (≤ ${LV.goalP99}ms)</span>${Math.round(s.p99)}ms ${s.p99<=LV.goalP99?'ĐẠT':'TRƯỢT'}</div>
      <div><span>p50</span>${Math.round(s.p50)}ms</div>
      <div><span>Chi phí (3 đèn nếu ≤ $${LV.star3})</span>$${s.cost}</div>
      <div><span>Request thành công</span>${Math.round(s.served).toLocaleString('vi')}</div>
    </div>
    ${why}
    <div class="rwhy">Đèn 1: qua màn · Đèn 2: lỗi ≤ ${pc(LV.goalErr/2)} · Đèn 3: chi phí ≤ $${LV.star3}</div>
    <div class="ract">
      ${pass&&nextL?`<button class="sw go" id="rNext">${nextL.sandbox?'Mở Sandbox':'Chương tiếp'}</button>`:''}
      <button class="sw" id="rAgain">Chơi lại</button>
      <button class="sw" id="rMenu">Menu</button>
    </div>`;
  $('#rAgain').onclick=()=>{$('#result').classList.add('hidden');resetLevel()};
  $('#rMenu').onclick=()=>$('#bMenu').click();
  if($('#rNext')) $('#rNext').onclick=()=>{$('#result').classList.add('hidden');startLevel(nextL)};
  $('#result').classList.remove('hidden');
}

/* ---------- HUD ---------- */
const lvl=(v,goal)=>v<=goal?'ok':v<=goal*2?'warn':'bad';
function updateUI(force){
  const now=performance.now(); if(!force&&now-lastUI<200) return; lastUI=now;
  const w=sim.windowStats(3), s=sim.summary(), started=sim.t>0;
  $('#sTime').textContent=LV.duration?`${Math.floor(sim.t)}/${LV.duration}s`:`${Math.floor(sim.t)}s`;
  $('#sRps').textContent=`${Math.round(sim.inRate)}/s`;
  $('#sErr').textContent=(w.err*100).toFixed(1)+'%'; $('#lErr').className='led '+(started?lvl(w.err,LV.goalErr):'');
  $('#sP99').textContent=Math.round(w.p99)+'ms'; $('#lP99').className='led '+(started?lvl(w.p99,LV.goalP99):'');
  $('#sCost').textContent=LV.budget===Infinity?`${s.cost}`:`${s.cost}/${LV.budget}`;
  $('#progress i').style.width=LV.duration?Math.min(100,sim.t/LV.duration*100)+'%':'0';
  const gEl=$('#goals');
  if(LV.sandbox && gEl.querySelector('#sandboxCtl')){
    $('#gErr').textContent=(s.err*100).toFixed(2)+'%'; $('#gP99').textContent=Math.round(s.p99)+'ms';
  } else {
    let g=`<div class="cap">Mục tiêu cả màn</div><div class="lcd">
      <div class="goal"><span class="led ${started?lvl(s.err,LV.goalErr):''}"></span><span class="gk">Lỗi ≤ ${LV.goalErr*100}%</span><span class="gv" id="gErr">${(s.err*100).toFixed(2)}%</span></div>
      <div class="goal"><span class="led ${started?lvl(s.p99,LV.goalP99):''}"></span><span class="gk">p99 ≤ ${LV.goalP99}ms</span><span class="gv" id="gP99">${Math.round(s.p99)}ms</span></div>`;
    if(LV.budget!==Infinity) g+=`<div class="goal"><span class="led ${s.cost<=LV.star3?'ok':''}"></span><span class="gk">Ngân sách còn</span><span class="gv">$${LV.budget-s.cost}</span></div>`;
    if(LV.duration) g+=`<div class="goal"><span class="led ${sim.t>=LV.duration?'ok':''}"></span><span class="gk">Trụ ${LV.duration} giây</span><span class="gv">${Math.floor(sim.t)}s</span></div>`;
    if(s.lost>0) g+=`<div class="goal"><span class="led bad"></span><span class="gk">Đơn bị mất</span><span class="gv">${Math.round(s.lost)}</span></div>`;
    if(LV.sandbox) g+=`<div id="sandboxCtl"><label for="sbRi">Tải vào: <span id="sbR">${SANDBOX.rate}</span> req/s</label><input id="sbRi" type="range" min="0" max="4000" step="50" value="${SANDBOX.rate}" oninput="SANDBOX.rate=+this.value;$('#sbR').textContent=this.value">
      <label for="sbWi">Tỷ lệ ghi: <span id="sbW">${Math.round(SANDBOX.write*100)}</span>%</label><input id="sbWi" type="range" min="0" max="90" value="${Math.round(SANDBOX.write*100)}" oninput="SANDBOX.write=this.value/100;$('#sbW').textContent=this.value"></div>`;
    gEl.innerHTML=g+'</div>';
  }
  refreshTray(); liveInsp(); drawChart();
}
function drawChart(){
  const ch=$('#chart'), c=ch.getContext('2d'), W=ch.width, H=ch.height; c.clearRect(0,0,W,H);
  const bs=sim.win.slice(-60); if(bs.length<2) return;
  const maxIn=Math.max(100,...bs.map(b=>b.inW))*1.1, pmax=Math.max(LV.goalP99*2,300);
  const plot=(vals,max,col,dash)=>{c.fillStyle=col; let py=null;
    vals.forEach((v,i)=>{const x=i*2, y=Math.round(H-2-(Math.min(v,max)/max)*(H-4));
      if(dash&&i%2) {py=y;return}
      c.fillRect(x,y,2,2); if(py!==null){const a=Math.min(py,y),b=Math.max(py,y);c.fillRect(x,a,1,b-a+1)} py=y});};
  plot(bs.map(b=>pct(b.h,0.99)),pmax,C.inkMid);
  plot(bs.map(b=>b.inW),maxIn,C.ink);
  plot(bs.map(b=>{const t=b.ok+b.fail;return t?b.fail/t:0}),1,C.ink,true);
}

/* ---------- RENDER ---------- */
const snap=v=>Math.round(v);
function ledCol(n){if(n.down) return C.bad; if(sim.t<n.bootUntil) return C.warn; if(n.type==='users') return C.ok; return n.util<0.7?C.ok:n.util<0.95?C.warn:C.bad}
function drawTrace(pts,col,w){
  ctx.beginPath(); ctx.moveTo(snap(pts[0][0]),snap(pts[0][1])); for(let i=1;i<pts.length;i++) ctx.lineTo(snap(pts[i][0]),snap(pts[i][1]));
  ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineJoin='miter'; ctx.lineCap='square'; ctx.stroke();
}
function drawChip(n){
  const d=DEF[n.type], x=snap(n.x-NW/2), y=snap(n.y-NH/2), down=n.down, booting=sim.t<n.bootUntil;
  // silkscreen designator + courtyard
  ctx.font=FSD; ctx.fillStyle=n===sel?C.silk:C.silkDim; ctx.textBaseline='alphabetic'; ctx.textAlign='left';
  ctx.fillText(`U${n.id}${n.locked?' · CỐ ĐỊNH':''}`,x,y-9);
  if(n===sel){ctx.setLineDash([4,4]);ctx.strokeStyle=C.silk;ctx.lineWidth=2;ctx.strokeRect(x-7,y-7,NW+14,NH+14);ctx.setLineDash([])}
  // pins
  ctx.fillStyle=C.pin;
  for(let px=x+8;px<x+NW-8;px+=14){ctx.fillRect(px,y-5,6,5);ctx.fillRect(px,y+NH,6,5)}
  // body
  ctx.fillStyle=down?'#262826':C.chip; ctx.fillRect(x,y,NW,NH);
  ctx.fillStyle=C.chipHi; ctx.fillRect(x,y,NW,2);
  ctx.fillStyle='#2f342e'; ctx.fillRect(x+5,y+6,5,5); // pin-1 mark
  // icon
  drawSprite(ctx,down?'skull':n.type,x+12,y+14,3,{X:down?C.bad:C.mark,O:ledCol(n)});
  // marking
  ctx.font=FS; ctx.fillStyle=down?C.markDim:C.mark; ctx.fillText(d.name,x+48,y+25);
  let sub='';
  if(n.type==='users') sub=`${Math.round(sim.inRate)} req/s`;
  else if(down) sub='SẬP · bấm để sửa';
  else if(booting) sub='đang khởi động';
  else if(n.type==='cache') sub=`hit ${Math.round(n.hitRate*100)}%`;
  else if(n.type==='queue') sub=`chờ ${Math.round(n.backlog)} đơn`;
  else sub=`tải ${Math.round(n.util*100)}%`;
  ctx.font=FR; ctx.fillStyle=down?C.bad:'#9aa093'; ctx.fillText(sub,x+48,y+44);
  // status LED (SMD)
  const lc=ledCol(n); ctx.fillStyle=lc; ctx.shadowColor=lc; ctx.shadowBlur=down||n.util>0.95?10:6;
  ctx.fillRect(x+NW-14,y+7,7,7); ctx.shadowBlur=0;
  // LED bar graph: hàng chờ
  if(n.type!=='users'&&!down){
    const f=n.type==='queue'?n.backlog/d.backlogMax:Math.min(1,n.qW/(d.cap*0.8)), segs=10, on=Math.ceil(f*segs-0.001);
    for(let i=0;i<segs;i++){ctx.fillStyle=i<on?(i<5?C.ok:i<8?C.warn:C.bad):'#232722'; ctx.fillRect(x+48+i*7,y+NH-11,5,4)}
  }
  // flash khi lỗi
  if(n.flash>0.05&&!down){ctx.strokeStyle=`rgba(255,59,47,${n.flash})`;ctx.lineWidth=3;ctx.strokeRect(x-2,y-2,NW+4,NH+4)}
  // pads
  ctx.fillStyle=C.pad; ctx.fillRect(x-4,snap(n.y)-4,4,8);
  if(n.type!=='db'&&n.type!=='replica'){
    const hot=hover===n||(drag&&drag.kind==='link'&&drag.from===n);
    ctx.fillStyle=hot?C.cuHi:C.pad; ctx.fillRect(x+NW,snap(n.y)-PORT,PORT+2,PORT*2);
    ctx.fillStyle=C.board; ctx.fillRect(x+NW+3,snap(n.y)-2,4,4);
  }
}
function draw(){
  ctx.clearRect(0,0,CW,CH); ctx.save(); ctx.translate(snap(view.ox),snap(view.oy)); ctx.scale(view.s,view.s);
  // board silkscreen frame
  ctx.strokeStyle='rgba(169,196,178,.35)'; ctx.lineWidth=2; ctx.strokeRect(-20,-4,920,496);
  ctx.font=FSD; ctx.fillStyle='rgba(169,196,178,.55)'; ctx.fillText('VÉXỊN MAINBOARD · REV 1.0',-12,484);
  // traces
  for(const e of sim.edges){const pts=route(e); drawTrace(pts,e===selEdge?C.silk:C.cu,e===selEdge?6:5); for(const i of [1,pts.length-2]) if(i>0&&i<pts.length-1){ctx.fillStyle=C.pad;ctx.fillRect(snap(pts[i][0])-4,snap(pts[i][1])-4,8,8);ctx.fillStyle=C.board;ctx.fillRect(snap(pts[i][0])-1,snap(pts[i][1])-1,2,2)}}
  if(drag&&drag.kind==='link'){ctx.setLineDash([6,6]);drawTrace([[drag.from.x+NW/2+PORT,drag.from.y],[drag.x,drag.y]],C.cuHi,4);ctx.setLineDash([])}
  // pulses
  for(const p of particles){const q=pAt(p.pts,p.t); ctx.fillStyle=p.col; const s=p.bg?3:5; ctx.fillRect(snap(q.x)-s/2,snap(q.y)-s/2,s,s)}
  for(const n of sim.nodes) drawChip(n);
  // sparks
  for(const s of sparks){const r=snap(2+s.t*10); ctx.fillStyle=s.t<0.5?C.cuHi:C.bad; ctx.globalAlpha=1-s.t;
    ctx.fillRect(s.x-r,s.y-1,2,2);ctx.fillRect(s.x+r,s.y-1,2,2);ctx.fillRect(s.x-1,s.y-r,2,2);ctx.fillRect(s.x-1,s.y+r,2,2);ctx.globalAlpha=1}
  // ghost
  if(drag&&drag.kind==='new'&&drag.inside){const x=snap(drag.x-NW/2),y=snap(drag.y-NH/2);ctx.setLineDash([4,4]);ctx.strokeStyle=C.silk;ctx.lineWidth=2;ctx.strokeRect(x,y,NW,NH);ctx.setLineDash([]);drawSprite(ctx,drag.type,x+12,y+14,3,{X:C.silk,O:C.ok});ctx.font=FS;ctx.fillStyle=C.silk;ctx.fillText(DEF[drag.type].name,x+48,y+25)}
  if(sim.edges.length===0&&sim.t===0){ctx.font='700 20px Handjet';ctx.fillStyle=C.silk;ctx.textAlign='center';ctx.fillText('KÉO TỪ CHÂN VÀNG BÊN PHẢI "NGƯỜI DÙNG" SANG SERVER ĐỂ NỐI DÂY',440,150);ctx.textAlign='left'}
  ctx.restore();
}

/* ---------- LOOP ---------- */
let last=performance.now();
function loop(now){
  const rdt=Math.min(0.1,(now-last)/1000); last=now;
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
    for(const p of particles){p.t+=pv; if(p.t<0.05) p.pts=route(p.e)}
    particles=particles.filter(p=>p.t<1&&sim.edges.includes(p.e));
    for(const s of sparks) s.t+=rdt*2.5; sparks=sparks.filter(s=>s.t<1);
    draw(); updateUI();
  }
  requestAnimationFrame(loop);
}
document.fonts.ready.then(()=>{renderMenu(); requestAnimationFrame(loop)});
