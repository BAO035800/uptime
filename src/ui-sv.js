const $=s=>document.querySelector(s);
const T=16, MW=42, MH=22, WPX=MW*T, HPX=MH*T;
const OFFICE={c0:1,c1:14}, ROOM={c0:16,c1:40,r0:2,r1:20}, DOOR=[10,11], PART=15;
const P={ochre:'#d9a441',ochreDk:'#a8772a',ochreSh:'#8a5a1e',teal:'#3f7f6a',tealDk:'#2b5a4b',brick:'#b5523b',
  tileBase:'#cfc6b4',tileLine:'#b9b09d',conc:'#7b7f84',concSeam:'#6c7075',cable:'#16161a',cableSel:'#ffb547',
  paper:'#f1e3c2',ink:'#3b2a1a',good:'#6fd04a',warn:'#ffb21e',bad:'#ff4a3a',lamp:'#ffb547',read:'#fff4c2',write:'#ff8a3d',job:'#c8a2ff'};

/* ================== PIXEL ART HELPERS ================== */
function R(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
function circ(g,cx,cy,r,c){g.fillStyle=c;for(let y=-r;y<=r;y++){const w=Math.round(Math.sqrt(r*r-y*y));g.fillRect(Math.round(cx-w),Math.round(cy+y),w*2,1)}}
function sprite(g,rows,x,y,pal,flip){for(let j=0;j<rows.length;j++){const row=rows[j];for(let i=0;i<row.length;i++){const ch=row[flip?row.length-1-i:i];if(ch==='.'||!pal[ch])continue;g.fillStyle=pal[ch];g.fillRect(x+i,y+j,1,1)}}}

/* ---- nhân vật 12x18: H tóc, S da, E mắt, T áo, A tay, P quần, B giày, L tóc dài ---- */
const BODY_DOWN=["....HHHH....","...HHHHHH...","..HHHHHHHH..","..HSSSSSSH..","..LSESSESL..","..LSSSSSSL..","..LSSRRSSL..","...LSSSSL...","..TTTTTTTT..",".TTTTTTTTTT.",".ATTTTTTTTA.",".ATTTTTTTTA.","..TTTTTTTT..","..PPPPPPPP..","..PPP..PPP..","..PPP..PPP..","..BBB..BBB.."];
const BODY_UP  =["....HHHH....","...HHHHHH...","..HHHHHHHH..","..HHHHHHHH..","..LHHHHHHL..","..LHHHHHHL..","..LHHHHHHL..","...LSSSSL...","..TTTTTTTT..",".TTTTTTTTTT.",".ATTTTTTTTA.",".ATTTTTTTTA.","..TTTTTTTT..","..PPPPPPPP..","..PPP..PPP..","..PPP..PPP..","..BBB..BBB.."];
const BODY_SIDE=["....HHHH....","...HHHHHH...","..HHHHHHHH..","..HHHSSSSS..","..LHHSSESS..","..LHHSSSSS..","..LHSSSSRS..","...LSSSS....","...TTTTTT...","...TTTTTTT..","...TATTTTT..","...TATTTTT..","...TTTTTT...","...PPPPPP...","...PPPPPP...","...PP..PP...","...BB..BB..."];
function legs(rows,frame){ if(!frame) return rows; const r=rows.slice();
  for(const j of [15,16]){ r[j]=[...r[j]].map((ch,i)=>(frame===1?i>=6:i<6)?'.':ch).join('') }
  return r;}
const CHARS={
  you: {H:'#2b2420',L:null,S:'#f1c7a0',E:'#1a1410',R:'#c97a62',T:'#3f7f6a',A:'#f1c7a0',P:'#3a3f58',B:'#1d1d22'},
  linh:{H:'#3b2318',L:'#3b2318',S:'#f3cba8',E:'#1a1410',R:'#c0392b',T:'#d9a441',A:'#f3cba8',P:'#2f2f3a',B:'#7a2a20'},
  bao: {H:'#1a1a1a',L:null,S:'#e2b48c',E:'#1a1410',R:'#3a2a20',T:'#8a4a3a',A:'#e2b48c',P:'#4a4f5c',B:'#1d1d22'},
};
function drawChar(g,who,x,y,dir,frame){
  const pal=CHARS[who];
  let rows=dir==='up'?BODY_UP:dir==='down'?BODY_DOWN:BODY_SIDE;
  rows=legs(rows,frame);
  R(g,x+2,y+15,8,3,'rgba(0,0,0,.22)');
  sprite(g,rows,x,y-(frame?1:0),pal,dir==='left');
}

/* ---- đồ vật trong văn phòng ---- */
function drawTile(g,c,r){
  const x=c*T,y=r*T;
  if(c>=ROOM.c0){ R(g,x,y,T,T,P.conc); R(g,x,y,T,1,P.concSeam); R(g,x,y,1,T,P.concSeam); if((c*7+r*13)%5===0) R(g,x+5+(c%3)*3,y+6+(r%4),1,1,'#8a8e93'); return; }
  // gạch bông
  R(g,x,y,T,T,P.tileBase); R(g,x,y,T,1,P.tileLine); R(g,x,y,1,T,P.tileLine);
  for(const [qx,qy] of [[1,1],[T-1,1],[1,T-1],[T-1,T-1]]) circ(g,x+qx,y+qy,3,P.brick);
  for(let k=0;k<4;k++){R(g,x+8-k,y+4+k,k*2+1,1,P.teal);R(g,x+8-k,y+12-k,k*2+1,1,P.teal)}
  R(g,x+7,y+7,2,2,P.tileBase);
}
function skyCol(min){ // màu trời theo giờ
  if(min<16*60) return ['#8cc4e8','#b8dcf0']; if(min<18*60) return ['#e89a5a','#f4c27a']; if(min<19*60) return ['#7a5a8a','#d07a5a']; return ['#1d2040','#2e3060'];
}
function drawWindow(g,c,min){
  const x=c*T,y=2; const [a,b]=skyCol(min);
  R(g,x-2,y,T*2+4,24,P.tealDk); R(g,x,y+2,T*2,20,a); R(g,x,y+12,T*2,10,b);
  // nhà phố + dây điện
  R(g,x+1,y+12,7,10,'#4a3a4a');R(g,x+9,y+9,8,13,'#3a3040');R(g,x+19,y+13,6,9,'#4a3a4a');R(g,x+26,y+10,6,12,'#3a3040');
  if(min>=18*60) for(const [wx,wy] of [[3,15],[11,12],[13,16],[21,16],[28,13]]) R(g,x+wx,y+wy,1,1,P.lamp);
  g.fillStyle='#111'; for(let i=0;i<T*2;i++){g.fillRect(x+i,y+6+Math.round(Math.sin(i/6)*1.5),1,1);g.fillRect(x+i,y+9+Math.round(Math.cos(i/5)),1,1)}
  R(g,x+T-1,y+2,2,20,P.tealDk); // song cửa
  R(g,x-6,y+1,5,22,P.teal); R(g,x+T*2+1,y+1,5,22,P.teal); // cánh chớp
  for(let k=0;k<5;k++){R(g,x-6,y+3+k*4,5,1,P.tealDk);R(g,x+T*2+1,y+3+k*4,5,1,P.tealDk)}
}
function drawWalls(g,min){
  R(g,0,0,WPX,2*T,P.ochre); R(g,0,2*T-4,WPX,4,P.ochreDk); R(g,0,0,WPX,3,P.ochreSh);
  for(const c of [3,10,19,27,35]) drawWindow(g,c,min);
  // bảng trắng
  R(g,5*T+4,4,T*3,20,'#fafaf5');R(g,5*T+3,3,T*3+2,1,'#999');R(g,5*T+3,24,T*3+2,1,'#999');
  g.fillStyle='#3a6ab0'; [[10,8],[22,8],[34,8]].forEach(([a,b])=>g.fillRect(5*T+a,4+b,8,5)); g.fillStyle='#c0392b'; g.fillRect(5*T+18,4+10,4,1); g.fillRect(5*T+30,4+10,4,1);
  // vách ngăn + cửa
  for(let r=0;r<MH;r++){ if(DOOR.includes(r)) continue; R(g,PART*T,r*T,T,T,P.ochreDk); R(g,PART*T+3,r*T,T-6,T,P.ochre); }
  R(g,PART*T,DOOR[0]*T-2,T,2,P.ochreSh); R(g,PART*T,(DOOR[1]+1)*T,T,2,P.ochreSh);
  // tường biên
  for(let r=2;r<MH;r++){R(g,0,r*T,T,T,P.ochreDk);R(g,(MW-1)*T,r*T,T,T,P.ochreDk)}
  R(g,0,(MH-1)*T,WPX,T,P.ochreDk); R(g,0,(MH-1)*T,WPX,3,P.ochreSh);
  // biển phòng máy
  R(g,ROOM.c0*T+6,6,44,12,P.ink); g.fillStyle=P.lamp; g.font='8px VT323'; g.fillText('PHÒNG MÁY',ROOM.c0*T+9,15);
  // máng cáp
  R(g,ROOM.c0*T,2*T-1,(ROOM.c1-ROOM.c0+1)*T,3,'#55585d');
}
function drawObj(g,o,t){
  const x=o.c*T,y=o.r*T;
  switch(o.kind){
    case 'desk':
      R(g,x+1,y+12,o.w*T-2,4,'#5a3a24'); R(g,x,y+2,o.w*T,11,'#8a5a3a'); R(g,x,y+2,o.w*T,2,'#a8754e');
      R(g,x+8,y-6,14,10,'#1b1d22'); R(g,x+9,y-5,12,7,o.lit?'#7fd0ff':'#2a3a4a');
      if(o.lit){for(let k=0;k<3;k++) R(g,x+10,y-4+k*2,4+((k*5+Math.floor(t*2))%7),1,'#1b4a6a')}
      R(g,x+14,y+4,2,3,'#1b1d22'); R(g,x+3,y+7,6,3,'#e8e2d4'); if(o.cup) R(g,x+o.w*T-6,y+5,3,4,'#f4f0e6');
      if(o.note){R(g,x+o.w*T-10,y+4,7,7,'#f4e06a');R(g,x+o.w*T-9,y+6,5,1,'#8a6a1a');R(g,x+o.w*T-9,y+8,4,1,'#8a6a1a')}
      break;
    case 'coffee':
      R(g,x+2,y-6,12,20,'#b8bcc2'); R(g,x+2,y-6,12,2,'#d8dce2'); R(g,x+4,y-2,8,6,'#2a2c30'); R(g,x+10,y-4,2,1,o.ready?P.good:P.bad);
      R(g,x+6,y+6,4,4,'#f4f0e6'); R(g,x+7,y+7,2,2,'#5a3a1a');
      if(o.ready&&Math.floor(t*3)%2){R(g,x+7,y+2,1,2,'rgba(255,255,255,.6)')}
      break;
    case 'shelf': R(g,x,y-6,o.w*T,20,'#6a4a32'); R(g,x,y-6,o.w*T,2,'#8a6448'); for(let k=0;k<2;k++){R(g,x+1,y-2+k*8,o.w*T-2,1,'#4a3222'); for(let b=0;b<9;b++) R(g,x+2+b*5,y-1+k*8- (b%3),3,6+(b%3),['#3f7f6a','#b5523b','#d9a441','#2f5f8a'][(b+k)%4])} break;
    case 'plant': R(g,x+4,y+8,8,7,P.brick); R(g,x+4,y+8,8,1,'#d06a50'); circ(g,x+8,y+3,6,'#3f8a3a'); circ(g,x+5,y+1,3,'#5aaa4a'); circ(g,x+11,y+4,3,'#2f6a2a'); break;
    case 'sofa': R(g,x,y+2,o.w*T,13,P.teal); R(g,x,y+2,o.w*T,4,P.tealDk); R(g,x,y+2,3,13,P.tealDk); R(g,x+o.w*T-3,y+2,3,13,P.tealDk); break;
    case 'oncall':
      R(g,x+1,y+12,o.w*T-2,4,'#3a2a20'); R(g,x,y+2,o.w*T,11,'#6a4a32'); R(g,x,y+2,o.w*T,2,'#8a6448');
      R(g,x+4,y-2,13,8,'#2a2c30'); R(g,x+5,y-1,11,5,o.active?'#ff6a4a':'#7fd0ff'); R(g,x+3,y+6,15,2,'#3a3c40');
      R(g,x+21,y+4,6,4,'#c0392b'); R(g,x+22,y+3,4,1,'#c0392b');
      R(g,x+6,y-12,20,8,P.ink); g.fillStyle=P.lamp; g.font='8px VT323'; g.fillText('TRỰC',x+9,y-5);
      break;
  }
}

/* ---- máy trong phòng máy (32x32) ---- */
function drawMachine(g,n,t){
  const x=(n.c)*T, y=(n.r)*T, down=n.down, util=n.util;
  R(g,x+2,y+28,28,4,'rgba(0,0,0,.28)');
  const led=down?P.bad:(sim&&sim.t<n.bootUntil)?P.warn:n.type==='users'?P.good:util<0.7?P.good:util<0.95?P.warn:P.bad;
  const blink=Math.floor(t*6+n.id)%2;
  switch(n.type){
    case 'users':
      R(g,x+3,y+2,26,28,'#5b5f66'); R(g,x+5,y+4,22,24,'#2a2c32'); circ(g,x+16,y+15,8,'#3f7fbf'); R(g,x+11,y+11,5,4,'#4f9a4a'); R(g,x+17,y+16,6,4,'#4f9a4a'); R(g,x+13,y+19,3,2,'#4f9a4a');
      R(g,x+8,y+15,16,1,'rgba(255,255,255,.3)'); R(g,x+16,y+7,1,16,'rgba(255,255,255,.3)'); break;
    case 'server':
      R(g,x+7,y+1,18,29,'#1f2227'); R(g,x+7,y+1,18,2,'#3a3f46');
      for(let k=0;k<4;k++){R(g,x+9,y+5+k*6,14,5,'#2b2f36');R(g,x+10,y+7+k*6,6,1,'#15171a');R(g,x+20,y+6+k*6,2,2,(k===0||blink)?led:'#333')} break;
    case 'lb':
      R(g,x+2,y+12,28,16,'#2f5f8a'); R(g,x+2,y+12,28,3,'#4a86b8'); R(g,x+2,y+25,28,3,'#244a6c');
      for(let k=0;k<7;k++){R(g,x+5+k*3+ (k>3?1:0),y+18,2,3,'#0e1a26'); if((k+Math.floor(t*8))%3===0) R(g,x+5+k*3+(k>3?1:0),y+16,2,1,P.good)} break;
    case 'cache':
      R(g,x+4,y+6,24,22,P.brick); R(g,x+4,y+6,24,3,'#d06a50');
      for(let k=0;k<4;k++){R(g,x+7+k*5,y+11,3,13,'#2f7a3a');R(g,x+7+k*5,y+12,3,1,'#e0c060')}
      R(g,x+22,y+2,4,4,P.lamp); break;
    case 'db': case 'replica':{
      const bc=n.type==='db'?['#c8ccd2','#9aa0a8','#7c828a']:['#d8b07a','#b08a5a','#8a6a40'];
      const w=n.type==='db'?20:14, ox=x+(32-w)/2;
      R(g,ox,y+6,w,22,bc[1]); R(g,ox+2,y+4,w-4,4,bc[0]); R(g,ox,y+6,w,2,bc[0]); R(g,ox+2,y+28,w-4,2,bc[2]);
      R(g,ox,y+13,w,2,bc[2]); R(g,ox,y+20,w,2,bc[2]); if(n.type==='replica'){R(g,ox-4,y+16,4,12,bc[2]);R(g,ox+w,y+16,4,12,bc[2])}
      break;}
    case 'queue': // tủ thư màu bưu điện
      R(g,x+5,y+3,22,26,'#e0b030'); R(g,x+5,y+3,22,3,'#f0cc60'); R(g,x+5,y+14,22,4,'#2f5f8a');
      for(let k=0;k<3;k++) R(g,x+8+k*6,y+8,4,1,'#5a4410'); for(let k=0;k<3;k++) R(g,x+8+k*6,y+22,4,1,'#5a4410');
      const f=Math.min(1,n.backlog/DEF.queue.backlogMax); R(g,x+28,y+29-Math.round(f*24),2,Math.round(f*24),P.write); break;
  }
  if(down){R(g,x+2,y+1,28,29,'rgba(30,30,36,.55)')}
  R(g,x+27,y+2,3,3,led); R(g,x+26,y+1,5,5,led+'44');
  // thanh tải (hàng chờ)
  if(n.type!=='users'&&!down){const cap=DEF[n.type].cap*0.8, f=n.type==='queue'?n.backlog/DEF.queue.backlogMax:Math.min(1,n.qW/cap);
    R(g,x+4,y+31,24,2,'#2a2c30'); if(f>0.01) R(g,x+4,y+31,Math.max(1,Math.round(24*f)),2,f<0.5?P.good:f<0.85?P.warn:P.bad)}
}

/* ---- icon cho thanh đồ ---- */
const ICONS={
  hand:["..XX.XX.XX..","..XX.XX.XX..","..XX.XX.XX..",".XXX.XX.XX..",".XXXXXXXXX..",".XXXXXXXXX..",".XXXXXXXXXX.","..XXXXXXXXX.","..XXXXXXXX..","...XXXXXX...","...XXXXXX..."],
  cable:["XX..........","XX..........",".X..........",".XX.........","..XX........","...XXX......",".....XXX....",".......XXX..",".........XX.","..........XX","..........XX"],
  plier:["X........X..","XX......XX..",".XX....XX...","..XX..XX....","...XXXX.....","....XX......","...XXXX.....","..XX..XX....",".XX....XX...","XX......XX..","X........X.."],
};
function slotIcon(kind){
  const c=document.createElement('canvas'); c.width=32;c.height=32; const g=c.getContext('2d');
  if(ICONS[kind]){ g.save(); g.scale(2,2); sprite(g,ICONS[kind],2,2,{X:kind==='plier'?'#b5523b':kind==='cable'?'#16161a':'#f1c7a0'}); g.restore(); }
  else { const fake={id:0,type:kind,c:0,r:0,util:0.2,qW:0,backlog:0,down:false,bootUntil:0}; drawMachine(g,fake,0); }
  return c;
}
const STAR=(on)=>{const c=document.createElement('canvas');c.width=9;c.height=9;sprite(c.getContext('2d'),["....X....","....X....","...XXX...","XXXXXXXXX",".XXXXXXX.","..XXXXX..","..XX.XX..",".XX...XX.","X.......X"],0,0,{X:on?'#e8a020':'#b9a88a'});return `<img src="${c.toDataURL()}" alt="">`};

/* ================== STATE ================== */
let save={stars:{},done:{}};
try{save=JSON.parse(localStorage.getItem('uptime-save'))||save}catch(e){}
function persist(){try{localStorage.setItem('uptime-save',JSON.stringify(save))}catch(e){}}

let LV=null, sim=null, mode='title', ended=false, speed=1, acc=0, paused=false;
let player=null, npcs=[], objs=[], clockMin=8*60, energy=100, coffeeCd=0;
let tool='hand', cableFrom=null, hoverTile=null, hoverNode=null, hoverEdge=null, mouse={x:0,y:0,in:false};
let particles=[], smoke=[], phaseFired=new Set(), tAll=0, quests=[];
const SLOTS=[['hand','Tay','Đi tới, nói chuyện, sửa máy, pha cà phê'],['server'],['lb'],['cache'],['replica'],['queue'],['cable','Cáp mạng','Bấm máy nguồn rồi bấm máy đích để nối'],['plier','Kìm','Bấm vào dây để cắt, bấm vào máy để gỡ (hoàn tiền)']];

/* ================== TITLE ================== */
function drawStreet(){
  const c=$('#street'), W=Math.ceil(innerWidth/3), H=Math.ceil(innerHeight/3); c.width=W; c.height=H; const g=c.getContext('2d');
  for(let y=0;y<H;y++){const k=y/H; g.fillStyle=`rgb(${Math.round(40+k*150)},${Math.round(36+k*60)},${Math.round(80-k*10)})`; g.fillRect(0,y,W,1)}
  const base=Math.round(H*0.78); const cols=['#d9a441','#c97a8a','#3f7f6a','#8fb0c8','#e0c070','#b5523b','#a8b878'];
  let x=0,i=0; while(x<W){const w=22+((i*37)%18), h=60+((i*53)%60); const col=cols[i%cols.length];
    R(g,x,base-h,w,h,col); R(g,x,base-h,w,3,'rgba(0,0,0,.25)');
    for(let fy=base-h+8;fy<base-14;fy+=14){R(g,x+4,fy,w-8,8,'#2a2438'); if((fy+i)%3) R(g,x+5,fy+1,3,6,P.lamp); R(g,x+3,fy+9,w-6,1,'#3a2a20')}
    R(g,x+3,base-14,w-6,4,['#c0392b','#2f5f8a','#e0b030'][i%3]); x+=w+1; i++;}
  R(g,0,base,W,H-base,'#2a2b30'); R(g,0,base,W,2,'#55585d'); for(let k=0;k<W;k+=12) R(g,k,base+Math.round((H-base)/2),6,1,'#e0c060');
  g.fillStyle='#0d0d10'; for(let p=10;p<W;p+=70){R(g,p,base-90,2,90,'#1a1a1e'); for(let w=0;w<6;w++){let yy=base-86+w*3; for(let k=0;k<70;k++){g.fillRect(p+k,yy+Math.round(Math.sin((k+w*9)/9)*3+k*0.05*(w%2?1:-1)),1,1)}}}
  for(let m=0;m<6;m++){const mx=(m*97+30)%W; R(g,mx,base+6+(m%2)*8,10,3,'#111');R(g,mx+1,base+9+(m%2)*8,2,2,'#333');R(g,mx+7,base+9+(m%2)*8,2,2,'#333');R(g,mx+3,base+2+(m%2)*8,3,4,'#3a3a4a'); R(g,mx-2,base+7+(m%2)*8,1,1,P.lamp)}
}
function renderTitle(){
  mode='title'; drawStreet();
  const box=$('#days'); box.innerHTML='';
  LEVELS.forEach((L,i)=>{
    const unlocked=i===0||save.done[LEVELS[i-1].id]||(L.sandbox&&save.done[5]); const st=save.stars[L.id]||0;
    const b=document.createElement('button'); b.className='day'; b.disabled=!unlocked;
    b.innerHTML=`<span class="dn"><span>${L.sandbox?'Ngày tự do':'Ngày '+L.id}</span>${L.sandbox?'':`<span class="stars">${[0,1,2].map(k=>STAR(k<st)).join('')}</span>`}</span>
      <span class="tt">${unlocked?L.title:'???'}</span><span class="ds">${unlocked?L.blurb:'Xong ngày trước mới mở.'}</span>`;
    b.onclick=()=>{if(unlocked) startDay(L)}; box.appendChild(b);
  });
  const coOpen=!!save.done[5]||!!save.skipStory; let has=false; try{has=!!localStorage.getItem('uptime-company')}catch(e){}
  const cb=document.createElement('button'); cb.className='day company'; cb.disabled=!coOpen; cb.style.gridColumn='1 / -1';
  cb.innerHTML=`<span class="dn"><span>Chơi mở</span><span>${has?'có bản lưu':''}</span></span><span class="tt">${coOpen?'Công ty VéXịn':'???'}</span>
    <span class="ds">${coOpen?'Nhận dự án, tuyển người, deploy, trực đêm. Từ Dev lên CTO, công ty lớn dần qua từng ngày.':'Xong 5 ngày đầu để mở, hoặc bỏ qua cốt truyện bên dưới.'}</span>`;
  cb.onclick=()=>{if(coOpen) startCompany(false)}; box.appendChild(cb);
  if(!coOpen){const sk=document.createElement('button'); sk.className='btn sm'; sk.style.gridColumn='1 / -1'; sk.style.justifySelf='start'; sk.textContent='Bỏ qua cốt truyện, mở chế độ công ty';
    sk.onclick=()=>{save.skipStory=true;persist();renderTitle()}; box.appendChild(sk)}
}
window.addEventListener('resize',()=>{if(mode==='title') drawStreet(); else fit()});

/* ================== WORLD SETUP ================== */
function inRoom(c,r){return c>=ROOM.c0&&c<=ROOM.c1&&r>=ROOM.r0&&r<=ROOM.r1}
function staticSolid(c,r){
  if(c<0||r<0||c>=MW||r>=MH) return true;
  if(r<2||r===MH-1||c===0||c===MW-1) return true;
  if(c===PART && !DOOR.includes(r)) return true;
  return false;
}
function nodeAtTile(c,r){for(const n of sim.nodes) if(c>=n.c&&c<=n.c+1&&r>=n.r&&r<=n.r+1) return n; return null}
function objAtTile(c,r){for(const o of objs) if(c>=o.c&&c<o.c+o.w&&r>=o.r&&r<o.r+o.h) return o; return null}
function npcAtTile(c,r){return npcs.find(n=>!n.walking&&n.c===c&&n.r===r)||null}
function blocked(c,r){return staticSolid(c,r)||!!objAtTile(c,r)||!!nodeAtTile(c,r)||!!npcAtTile(c,r)}
function placeFree(c,r){for(const [dc,dr] of [[0,0],[1,0],[0,1],[1,1]]){const cc=c+dc,rr=r+dr; if(!inRoom(cc,rr)||blocked(cc,rr)) return false; if(player&&Math.floor(player.x/T)===cc&&Math.floor((player.y-2)/T)===rr) return false} return true}
function addMachine(type,c,r,locked){
  const n=sim.addNode(type,(c+1)*T,(r+1)*T,locked); n.c=c; n.r=r; return n;
}
function startDay(L){
  LV=L; $('#title').classList.add('hidden'); $('#game').classList.remove('hidden');
  resetDay(); fit();
  playDialog(L.intro,()=>{ if(!L.sandbox) toast('Đi quanh văn phòng, chuẩn bị hệ thống rồi ra bàn trực khi sẵn sàng.','info') });
}
function resetDay(){
  if(LV&&LV.company) return companyResetDay();
  sim=new Sim(LV); mode='day'; ended=false; acc=0; paused=false; particles=[]; smoke=[]; phaseFired=new Set();
  clockMin=8*60; energy=100; coffeeCd=0; tool='hand'; cableFrom=null;
  objs=[
    {kind:'desk',c:8,r:6,w:2,h:1,lit:true,cup:true},{kind:'shelf',c:2,r:2,w:3,h:1},
    {kind:'desk',c:2,r:10,w:2,h:1,lit:LV.id!==5,note:LV.id===5,name:LV.id===5?'Bàn anh Bảo (trống)':'Bàn anh Bảo',act:o=>LV.id===5?playDialog([['msg','"Anh để lại bàn này cho em. Nhớ: luôn dư ra một con. Có gì cứ gọi anh." Mẩu giấy vàng dán trên màn hình.']]):null},
    {kind:'desk',c:2,r:15,w:2,h:1,lit:true,cup:true,name:'Bàn của bạn',act:()=>playDialog([['you','Màn hình đang mở dashboard VéXịn. Mình nên vào phòng máy xem hệ thống.']])},
    {kind:'coffee',c:12,r:2,w:1,h:1,ready:true,name:'Máy pha cà phê',act:o=>drinkCoffee(o)},
    {kind:'plant',c:13,r:2,w:1,h:1},{kind:'plant',c:1,r:19,w:1,h:1},{kind:'plant',c:40,r:2,w:1,h:1},
    {kind:'sofa',c:6,r:19,w:3,h:1,name:'Ghế sofa',act:()=>playDialog([['you','Chưa phải lúc ngả lưng. Hệ thống còn đang chờ.']])},
    {kind:'oncall',c:13,r:13,w:2,h:1,name:'Bàn trực',act:()=>startShift()},
  ];
  npcs=[{who:'linh',c:10,r:6,dir:'left'}]; if(LV.id!==5) npcs.push({who:'bao',c:4,r:10,dir:'left'});
  // đặt máy theo preset
  const ns=LV.preset.nodes.map(([t,x,y,lk])=>{
    let c=Math.max(17,Math.min(38,17+Math.round((x-40)/860*21))), r=Math.max(3,Math.min(18,3+Math.round((y-60)/400*14)));
    let tries=0; while(!placeFree(c,r)&&tries++<40){r++; if(r>18){r=3;c++}}
    return addMachine(t,c,r,lk);
  });
  for(const [a,b] of LV.preset.edges) sim.connect(ns[a],ns[b]);
  player={x:7*T+8,y:16*T+14,dir:'up',frame:0,walkT:0,path:[],then:null};
  quests=[{id:'build',text:'Chuẩn bị hệ thống trong phòng máy'},{id:'shift',text:'Ra bàn trực (cạnh cửa phòng máy) để vào ca'},{id:'survive',text:LV.duration?`Trụ qua ca trực, lỗi ≤ ${LV.goalErr*100}%, p99 ≤ ${LV.goalP99}ms`:'Thử nghiệm thoải mái'}];
  if(LV.id!==5&&!LV.sandbox) quests.splice(1,0,{id:'ask',text:'Bí thì hỏi anh Bảo (bàn thứ hai)',optional:true});
  buildHotbar(); updateHUD(true);
}

/* ================== CANVAS / CAMERA ================== */
const cv=$('#cv'), ctx=cv.getContext('2d');
const wc=document.createElement('canvas'); wc.width=WPX; wc.height=HPX; const wg=wc.getContext('2d');
let Z=2, cam={x:0,y:0}, CW=0, CH=0, DPR=1;
function fit(){
  CW=innerWidth; CH=innerHeight; DPR=window.devicePixelRatio||1; cv.width=CW*DPR; cv.height=CH*DPR;
  Z=Math.max(2,Math.min(4,Math.floor(Math.min(CW/WPX,(CH-30)/HPX)*DPR)/DPR));
  if(Z*WPX>CW||Z*HPX>CH) Z=CW<600?2:Math.max(2,Z);
}
function updateCam(){
  const vw=CW/Z, vh=CH/Z;
  cam.x = WPX<=vw ? -(vw-WPX)/2 : Math.max(0,Math.min(WPX-vw,player.x-vw/2));
  cam.y = HPX<=vh ? -(vh-HPX)/2 : Math.max(0,Math.min(HPX-vh,player.y-vh/2));
}
const toScreen=(x,y)=>({x:(x-cam.x)*Z,y:(y-cam.y)*Z});
const toWorld=(sx,sy)=>({x:sx/Z+cam.x,y:sy/Z+cam.y});

/* ================== CABLES ================== */
function cablePts(e){
  const a={x:e.a.c*T+30,y:e.a.r*T+6}, b={x:e.b.c*T+2,y:e.b.r*T+6};
  const d=Math.hypot(b.x-a.x,b.y-a.y), sag=Math.min(26,8+d*0.12);
  return {a,b,m:{x:(a.x+b.x)/2,y:(a.y+b.y)/2+sag}};
}
function qAt(p,t){const u=1-t;return{x:u*u*p.a.x+2*u*t*p.m.x+t*t*p.b.x,y:u*u*p.a.y+2*u*t*p.m.y+t*t*p.b.y}}
function edgeNear(w){for(const e of sim.edges){const p=cablePts(e);for(let i=0;i<=20;i++){const q=qAt(p,i/20);if(Math.hypot(q.x-w.x,q.y-w.y)<5)return e}}return null}

/* ================== MOVEMENT ================== */
function bfs(sc,sr,goalFn){
  const key=(c,r)=>r*MW+c, prev=new Int32Array(MW*MH).fill(-2); const q=[[sc,sr]]; prev[key(sc,sr)]=-1;
  while(q.length){const [c,r]=q.shift(); if(goalFn(c,r)){const path=[];let k=key(c,r);while(k!==-1){path.push([k%MW,Math.floor(k/MW)]);k=prev[k]}return path.reverse()}
    for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr; if(nc<0||nr<0||nc>=MW||nr>=MH) continue; const k=key(nc,nr); if(prev[k]!==-2||blocked(nc,nr)) continue; prev[k]=key(c,r); q.push([nc,nr])}}
  return null;
}
function ptile(){return [Math.floor(player.x/T),Math.floor((player.y-4)/T)]}
function walkTo(goalFn,then){
  const [c,r]=ptile(); const path=bfs(c,r,goalFn);
  if(!path){toast('Không có lối đi tới đó.','bad');return}
  player.path=path.slice(1).map(([c,r])=>({x:c*T+8,y:r*T+12})); player.then=then||null;
  if(!player.path.length&&then){player.then=null;then()}
}
function reach(c0,r0,w,h){ // khoảng cách player tới hình chữ nhật (ô)
  const px=player.x/T, py=(player.y-4)/T; const dx=Math.max(c0-px,0,px-(c0+w)), dy=Math.max(r0-py,0,py-(r0+h)); return Math.hypot(dx,dy);
}
function adjGoal(c0,r0,w,h){return (c,r)=>c>=c0-1&&c<=c0+w&&r>=r0-1&&r<=r0+h&&!(c>=c0&&c<c0+w&&r>=r0&&r<r0+h)}
const keys={};
function stepPlayer(dt){
  const spd=(energy<15?42:72)*dt; let dx=0,dy=0;
  if(keys.ArrowLeft||keys.a) dx-=1; if(keys.ArrowRight||keys.d) dx+=1; if(keys.ArrowUp||keys.w) dy-=1; if(keys.ArrowDown||keys.s) dy+=1;
  if(dx||dy){player.path=[];player.then=null}
  else if(player.path.length){const tgt=player.path[0]; const vx=tgt.x-player.x, vy=tgt.y-player.y, d=Math.hypot(vx,vy);
    if(d<=spd){player.x=tgt.x;player.y=tgt.y;player.path.shift(); if(!player.path.length&&player.then){const f=player.then;player.then=null;f()}}
    else {dx=vx/d;dy=vy/d}}
  if(dx||dy){
    const l=Math.hypot(dx,dy); dx=dx/l*spd; dy=dy/l*spd;
    const free=(x,y)=>{for(const [ox,oy] of [[-4,-3],[4,-3],[-4,0],[4,0]]){if(blocked(Math.floor((x+ox)/T),Math.floor((y+oy)/T))) return false} return true};
    if(free(player.x+dx,player.y)) player.x+=dx; if(free(player.x,player.y+dy)) player.y+=dy;
    player.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    player.walkT+=dt; player.frame=1+Math.floor(player.walkT*8)%2;
  } else player.frame=0;
}

/* ================== INTERACTION ================== */
function interactTarget(){ // thứ gần nhất trong tầm tay
  let best=null,bd=1.4;
  for(const n of npcs){if(n.walking) continue; const d=reach(n.c,n.r,1,1); if(d<bd){bd=d;best={k:'npc',v:n}}}
  for(const o of objs) if(o.act){const d=reach(o.c,o.r,o.w,o.h); if(d<bd){bd=d;best={k:'obj',v:o}}}
  for(const n of sim.nodes){const d=reach(n.c,n.r,2,2); if(d<bd){bd=d;best={k:'node',v:n}}}
  return best;
}
function doInteract(tg){
  if(!tg) return;
  if(tg.k==='npc') talk(tg.v.who);
  else if(tg.k==='obj') tg.v.act(tg.v);
  else if(tg.k==='node'){const n=tg.v; if(n.down) repair(n); else showNodeInfo(n)}
}
function talk(who){
  if(LV.company){ const n=npcs.find(n=>n.who===who); if(n&&n.staff) return staffTalk(n); if(who==='linh') return companyLinhTalk(); }
  if(who==='bao'){ markQuest('ask'); playDialog(LV.hint); return }
  if(who==='linh'){
    const lines= mode==='run'?[['linh','Chị đang nhìn dashboard đây. Cố lên em, đêm nay mà sập là chị không biết ăn nói sao với khách đâu!']]
      : mode==='end'?[['linh','Vất vả rồi em. Về nghỉ đi, mai còn việc.']]
      : [['linh',LV.blurb+' Em chuẩn bị xong thì ra bàn trực nhé.']];
    playDialog(lines);
  }
}
function drinkCoffee(o){
  if(coffeeCd>0){toast(`Máy đang pha, đợi ${Math.ceil(coffeeCd)} giây.`,'info');return}
  energy=Math.min(100,energy+50); coffeeCd=15; toast('Cà phê phin đậm đặc. Năng lượng +50.','info');
}
function repair(n){
  if(energy<15){toast('Mệt quá, không đủ sức sửa. Đi uống cà phê đã!','bad');return}
  energy-=15; n.down=false; n.downUntil=0; n.bootUntil=sim.t+3; toast(`Đang khởi động lại ${DEF[n.type].name} ${n.id}... 3 giây`,'info');
}
function startShift(){
  if(mode==='run'){toast('Đang trong ca trực rồi.','info');return}
  if(mode==='end') return;
  if(LV.company){ companyStartShift(); return }
  markQuest('build'); markQuest('shift');
  mode='run'; clockMin=19*60; toast('19:00. Ca trực bắt đầu. Traffic đang tới!','info');
  for(const o of objs) if(o.kind==='oncall') o.active=true;
}
function markQuest(id){const q=quests.find(q=>q.id===id); if(q) q.done=true}
function showNodeInfo(n){toast(`${DEF[n.type].name} ${n.id}: ${nodeStatus(n)}`,'info')}
function nodeStatus(n){ if(n.type==='users') return `${Math.round(sim.inRate)} req/s đang vào`; if(n.down) return 'ĐÃ SẬP, cần sửa'; if(sim.t<n.bootUntil) return 'đang khởi động';
  return `tải ${Math.round(n.util*100)}%, hàng chờ ${n.queue.length}`+(n.type==='cache'?`, hit ${Math.round(n.hitRate*100)}%`:'')+(n.type==='queue'?`, ${Math.round(n.backlog)} đơn chờ`:'')}

/* ---- chuột / chạm ---- */
cv.addEventListener('pointermove',e=>{mouse={x:e.clientX,y:e.clientY,in:true}; updateHover()});
cv.addEventListener('pointerleave',()=>{mouse.in=false; $('#tip').classList.add('hidden')});
function updateHover(){
  if(!sim) return; const w=toWorld(mouse.x,mouse.y); const c=Math.floor(w.x/T), r=Math.floor(w.y/T);
  hoverTile={c,r,w}; hoverNode=nodeAtTile(c,r); hoverEdge=(!hoverNode&&(tool==='plier'||tool==='hand'))?edgeNear(w):null;
  const tip=$('#tip');
  const o=objAtTile(c,r), np=npcAtTile(c,r)||npcAtTile(c,r+1);
  let html='';
  if(hoverNode) html=`<b>${DEF[hoverNode.type].name} ${hoverNode.id}</b>${nodeStatus(hoverNode)}<br><span class="dim">${DEF[hoverNode.type].desc}</span>`;
  else if(np) html=`<b>${CAST[np.who].name}</b><span class="dim">Bấm để nói chuyện</span>`;
  else if(o&&o.name) html=`<b>${o.name}</b><span class="dim">Bấm để dùng</span>`;
  else if(hoverEdge) html=`<b>Cáp mạng</b>${DEF[hoverEdge.a.type].name} ${hoverEdge.a.id} → ${DEF[hoverEdge.b.type].name} ${hoverEdge.b.id}${tool==='plier'?'<br>Bấm để cắt':''}`;
  if(html&&mouse.in){tip.innerHTML=html; tip.classList.remove('hidden'); tip.style.left=Math.min(mouse.x+16,CW-280)+'px'; tip.style.top=Math.min(mouse.y+16,CH-120)+'px'} else tip.classList.add('hidden');
}
cv.addEventListener('pointerdown',e=>{
  if(!sim||mode==='end') return; mouse={x:e.clientX,y:e.clientY,in:e.pointerType==='mouse'}; updateHover();
  const {c,r,w}=hoverTile;
  if(DEF[tool]){ // đặt máy
    const pc=c-0, pr=r-0;
    if(!placeFree(pc,pr)){toast(inRoom(pc,pr)?'Chỗ này vướng rồi, chọn ô trống 2x2.':'Máy chỉ lắp được trong phòng máy.','bad');return}
    const d=DEF[tool]; if(LV.company&&CO.cash<d.cost){toast(`Quỹ chỉ còn ${Math.round(CO.cash)}tr, không đủ mua ${d.name} (${d.cost}tr).`,'bad');return}
    if(sim.spent()+d.cost>LV.budget){toast(`Không đủ ngân sách: còn ${LV.budget-sim.spent()}tr, cần ${d.cost}tr.`,'bad');return}
    const place=()=>{ if(!placeFree(pc,pr)) return; if(mode==='run'){ if(energy<5){toast('Hết sức rồi, uống cà phê đã.','bad');return} energy-=5 }
      addMachine(tool,pc,pr,false); if(LV.company){CO.cash-=d.cost;CO.today.spent+=d.cost;saveLayout();toast(`Đã mua và lắp ${d.name} (−${d.cost}tr).`,'info')} else toast(`Đã lắp ${d.name}.`,'info')};
    if(mode==='run'&&reach(pc,pr,2,2)>3) walkTo(adjGoal(pc,pr,2,2),place); else place();
    return;
  }
  if(tool==='cable'){
    if(!hoverNode){cableFrom=null;return}
    if(!cableFrom){ if(hoverNode.type==='db'||hoverNode.type==='replica'){toast(`${DEF[hoverNode.type].name} là điểm cuối, hãy bấm máy nguồn trước.`,'info');return} cableFrom=hoverNode; return}
    const err=sim.connect(cableFrom,hoverNode); if(!err) saveLayout(); if(err) toast(err,'info'); else toast(`Đã nối ${DEF[cableFrom.type].name} → ${DEF[hoverNode.type].name}.`,'info'); cableFrom=null; return;
  }
  if(tool==='plier'){
    if(hoverNode){ if(hoverNode.locked){toast('Máy này cố định, không gỡ được.','info');return} sim.removeNode(hoverNode); if(LV.company){const rf=Math.round(DEF[hoverNode.type].cost/2);CO.cash+=rf;saveLayout();toast(`Đã gỡ và bán lại, thu ${rf}tr.`,'info')} else toast(`Đã gỡ, hoàn ${DEF[hoverNode.type].cost}tr.`,'info'); return}
    if(hoverEdge){sim.edges=sim.edges.filter(x=>x!==hoverEdge); saveLayout(); toast('Đã cắt dây.','info')} return;
  }
  // tay: đi tới / tương tác
  const np=npcAtTile(c,r)||npcAtTile(c,r+1), o=objAtTile(c,r);
  let tg=null, rect=null;
  if(np){tg={k:'npc',v:np};rect=[np.c,np.r,1,1]}
  else if(o&&o.act){tg={k:'obj',v:o};rect=[o.c,o.r,o.w,o.h]}
  else if(hoverNode){tg={k:'node',v:hoverNode};rect=[hoverNode.c,hoverNode.r,2,2]}
  if(tg){ if(reach(...rect)<1.4) doInteract(tg); else walkTo(adjGoal(...rect),()=>doInteract(tg)); return }
  if(!blocked(c,r)) walkTo((cc,rr)=>cc===c&&rr===r);
});
window.addEventListener('keydown',e=>{
  if(!$('#dlg').classList.contains('hidden')){ if(['Enter',' ','e','E'].includes(e.key)){e.preventDefault();nextLine()} return }
  if(mode==='title'||!sim) return;
  if(!$('#pc').classList.contains('hidden')){ if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();closePC()} return }
  if(e.key==='Tab'&&LV.company){e.preventDefault();openPC();return}
  const k=e.key.length===1?e.key.toLowerCase():e.key; keys[k]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if(k==='e') doInteract(interactTarget());
  if(/^[1-8]$/.test(k)) selectSlot(+k-1);
  if(k==='Escape'){cableFrom=null; selectSlot(0)}
  if(k===' '&&mode==='run') togglePause();
});
window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key; keys[k]=false});

/* ================== HOTBAR / HUD ================== */
function buildHotbar(){
  const hb=$('#hotbar'); hb.innerHTML='';
  SLOTS.forEach(([kind,nm,ds],i)=>{
    const isM=!!DEF[kind], ok=!isM||LV.palette.includes(kind);
    const b=document.createElement('button'); b.className='slot'+(tool===kind?' on':''); b.disabled=!ok; b.dataset.kind=kind;
    b.title=isM?`${DEF[kind].name} · ${DEF[kind].cost}tr\n${DEF[kind].desc}`:`${nm}\n${ds}`;
    b.setAttribute('aria-label',isM?DEF[kind].name:nm);
    b.appendChild(slotIcon(kind)); b.insertAdjacentHTML('beforeend',`<span class="k">${i+1}</span>${isM?`<span class="p">${DEF[kind].cost}</span>`:''}`);
    b.onclick=()=>selectSlot(i); hb.appendChild(b);
  });
}
function selectSlot(i){const [kind]=SLOTS[i]; if(DEF[kind]&&!LV.palette.includes(kind)) return; tool=kind; cableFrom=null;
  document.querySelectorAll('.slot').forEach(s=>s.classList.toggle('on',s.dataset.kind===kind));
  const nm=DEF[kind]?DEF[kind].name:SLOTS[i][1]; toast(`Cầm: ${nm}${SLOTS[i][2]?' · '+SLOTS[i][2]:''}`,'');}
function fmtClock(m){m=Math.floor(m);return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
const lvl=(v,g)=>v<=g?'good':v<=g*2?'warn':'bad';
let lastHUD=0;
function updateHUD(force){
  const now=performance.now(); if(!force&&now-lastHUD<200) return; lastHUD=now;
  $('#cDay').textContent=LV.company?`Ngày ${CO.day}`:LV.sandbox?'Ngày tự do':`Ngày ${LV.id}`; $('#cPlace').textContent=LV.company?roleOf(CO.xp).name:'Cầu Giấy';
  $('#bReset').classList.toggle('hidden',!!LV.company); $('#bPC').classList.toggle('hidden',!LV.company);
  $('#cTime').textContent=fmtClock(clockMin);
  $('#cMoney').textContent=LV.company?`${Math.round(CO.cash)}tr`:LV.budget===Infinity?`${sim.spent()}tr`:`${LV.budget-sim.spent()}tr`;
  $('#bPause').textContent=paused?'Tiếp tục':'Tạm dừng';
  $('#eFill').style.height=energy+'%'; $('#eFill').style.background=energy>50?'#6fd04a':energy>20?'#e0b030':'#e04a3a';
  const L=$('#left');
  if(mode==='run'||mode==='end'){
    const w=sim.windowStats(3), s=sim.summary();
    let h=`<h3>Bảng giám sát</h3>
      <div class="row big"><span>Lỗi</span><span class="${lvl(w.err,LV.goalErr)}">${(w.err*100).toFixed(1)}%</span></div>
      <div class="row"><span>p99</span><span class="${lvl(w.p99,LV.goalP99)}">${Math.round(w.p99)}ms</span></div>
      <div class="row"><span>Traffic</span><span>${Math.round(sim.inRate)} req/s</span></div>
      <div class="row dim"><span>Cả ca: lỗi ${(s.err*100).toFixed(2)}%</span><span>p99 ${Math.round(s.p99)}ms</span></div>`;
    if(s.lost>0) h+=`<div class="row bad"><span>Đơn bị mất</span><span>${Math.round(s.lost)}</span></div>`;
    if(LV.sandbox) h+=sandboxCtl();
    if(!(LV.sandbox&&L.querySelector('#sandboxCtl'))){L.innerHTML=h+'<canvas id="chart" width="120" height="32"></canvas>'} else {L.querySelector('.big span:last-child').textContent=(w.err*100).toFixed(1)+'%'}
    drawChart();
  } else if(LV.company){
    const cl=CO.clients;
    L.innerHTML=`<h3>Công ty hôm nay</h3>${cl.length?cl.map(c=>`<div class="row" style="font-size:19px"><span>${c.name}</span><span class="${c.status==='live'?'good':c.deadline-CO.day<=1?'bad':''}">${c.status==='live'?(c.pending>0?'yêu cầu mới':'đang chạy'):Math.floor(c.done/c.pts*100)+'%'}</span></div>`).join(''):'<div class="q"><i></i><span>Mở máy tính (Tab) để nhận dự án đầu tiên</span></div>'}
      <div class="row dim" style="font-size:18px"><span>Uy tín ${Math.round(CO.rep)}</span><span>${CO.staff.length} nhân viên</span></div>
      <button class="btn" style="width:100%;margin-top:6px" onclick="openPC()">Máy tính (Tab)</button>
      <button class="btn go" style="width:100%;margin-top:6px" onclick="startShift()">Bắt đầu ca trực</button>
      <div class="keys">${clockMin<18*60?'Nhân viên làm tới 18:00 rồi tự deploy.':'Đã deploy. Ra bàn trực khi sẵn sàng.'}</div>`;
  } else {
    const qs=CW<820?quests.filter(q=>!q.done&&!q.optional).slice(0,1):quests;
    L.innerHTML=`<h3>Việc hôm nay</h3>${qs.map(q=>`<div class="q ${q.done?'done':''}"><i></i><span>${q.text}</span></div>`).join('')}
      ${LV.sandbox?sandboxCtl():''}
      <button class="btn go" style="width:100%;margin-top:8px" onclick="startShift()">Bắt đầu ca trực</button>
      <div class="keys">Hoặc đi tới bàn có biển TRỰC (mũi tên vàng) và bấm E.<br>WASD / mũi tên: đi · E: tương tác · 1–8: chọn đồ</div>`;
  }
}
function sandboxCtl(){return `<div id="sandboxCtl"><label for="sbRi">Traffic: <span id="sbR">${SANDBOX.rate}</span> req/s</label><input id="sbRi" type="range" min="0" max="4000" step="50" value="${SANDBOX.rate}" oninput="SANDBOX.rate=+this.value;$('#sbR').textContent=this.value">
  <label for="sbWi">Tỷ lệ ghi: <span id="sbW">${Math.round(SANDBOX.write*100)}</span>%</label><input id="sbWi" type="range" min="0" max="90" value="${Math.round(SANDBOX.write*100)}" oninput="SANDBOX.write=this.value/100;$('#sbW').textContent=this.value"></div>`}
function drawChart(){
  const ch=$('#chart'); if(!ch) return; const c=ch.getContext('2d'), W=ch.width, H=ch.height; c.clearRect(0,0,W,H);
  const bs=sim.win.slice(-60); if(bs.length<2) return;
  const maxIn=Math.max(100,...bs.map(b=>b.inW))*1.1;
  const plot=(vals,max,col)=>{c.fillStyle=col;let py=null;vals.forEach((v,i)=>{const x=i*2,y=Math.round(H-2-(Math.min(v,max)/max)*(H-4));c.fillRect(x,y,2,2);if(py!==null){c.fillRect(x,Math.min(py,y),1,Math.abs(py-y)+1)}py=y})};
  plot(bs.map(b=>b.inW),maxIn,'#6e5233'); plot(bs.map(b=>{const t=b.ok+b.fail;return t?b.fail/t:0}),1,'#c0392b');
}
function togglePause(){if(mode!=='run')return; paused=!paused; updateHUD(true)}
$('#bPause').onclick=togglePause;
$('#bSpeed').onclick=()=>{speed=speed===1?2:speed===2?4:1; $('#bSpeed').textContent=speed+'x'};
$('#bReset').onclick=()=>{$('#result').classList.add('hidden');resetDay()};
$('#bMenu').onclick=()=>{ if(LV&&LV.company){saveLayout();coSave()} closePC();$('#game').classList.add('hidden');$('#result').classList.add('hidden');$('#title').classList.remove('hidden');renderTitle();sim=null;LV=null};

/* ================== DIALOG ================== */
let dq=[], dcb=null, dTotal=0, typer=null, spans=[];
const PORTRAIT={sys:["............",".DDDDDDDDDD.",".D........D.",".D.D.DD...D.",".D........D.",".D.DDD.D..D.",".D........D.",".DDDDDDDDDD.","....DDDD....","...DDDDDD..."],
  msg:["....DDDD....","...D....D...","...D.DD.D...","...D....D...","...D.DD.D...","...D....D...","...D.DD.D...","...D....D...","...D....D...","....DDDD...."]};
function playDialog(lines,cb){
  if(!lines||!lines.length){cb&&cb();return}
  dq=lines.slice(); dcb=cb||null; dTotal=dq.length; $('#dlg').classList.remove('hidden'); nextLine();
}
function doneTyping(){typer=null;spans.forEach(s=>s.style.visibility='');$('#dMore').classList.remove('hidden')}
function nextLine(){
  if(typer){clearInterval(typer);doneTyping();return}
  if(!dq.length){$('#dlg').classList.add('hidden');const c=dcb;dcb=null;c&&c();return}
  const [who,text]=dq.shift(); $('#dName').textContent=CAST[who].name; $('#dMore').classList.add('hidden');
  const pc=$('#dPort'), g=pc.getContext('2d'); g.clearRect(0,0,12,17);
  if(CHARS[who]) drawChar(g,who,0,0,'down',0); else sprite(g,PORTRAIT[who]||PORTRAIT.sys,0,3,{D:'#3b2a1a'});
  const box=$('#dText'); box.innerHTML=text; spans=[];
  const walk=node=>{for(const ch of [...node.childNodes]){if(ch.nodeType===3){const f=document.createDocumentFragment();for(const k of ch.textContent){const s=document.createElement('span');s.textContent=k;s.style.visibility='hidden';spans.push(s);f.appendChild(s)}ch.replaceWith(f)}else walk(ch)}};
  walk(box);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) doneTyping();
  else {let i=0;typer=setInterval(()=>{for(let k=0;k<2&&i<spans.length;k++)spans[i++].style.visibility='';if(i>=spans.length){clearInterval(typer);doneTyping()}},20)}
  $('#dCount').textContent=`${dTotal-dq.length}/${dTotal}`;
}
$('#dbox').addEventListener('click',nextLine);

/* ================== TOAST ================== */
function toast(text,kind){
  const t=document.createElement('div'); t.className='frame toast '+(kind||''); t.textContent=text; $('#toasts').appendChild(t);
  setTimeout(()=>t.remove(),kind==='bad'?4800:3000); while($('#toasts').children.length>4) $('#toasts').firstChild.remove();
}

/* ================== END OF DAY ================== */
function finish(){
  if(LV.company) return companyFinish();
  mode='end'; ended=true; markQuest('survive');
  const s=sim.summary(); const pass=s.err<=LV.goalErr&&s.p99<=LV.goalP99;
  let stars=0; if(pass){stars=1; if(s.err<=LV.goalErr/2) stars++; if(s.cost<=LV.star3) stars++}
  if(pass){save.done[LV.id]=true; save.stars[LV.id]=Math.max(save.stars[LV.id]||0,stars); persist()}
  for(const o of objs) if(o.kind==='oncall') o.active=false;
  playDialog(pass?LV.win:LV.lose,()=>showResult(pass,stars,s));
}
function showResult(pass,stars,s){
  const nextL=LEVELS[LEVELS.indexOf(LV)+1]; const pc=v=>(v*100).toFixed(2)+'%';
  const ok=b=>b?'<span class="good">đạt</span>':'<span class="bad">trượt</span>';
  $('#rbox').innerHTML=`<h2>${pass?'Hết ca. Hệ thống còn sống!':'Hết ca. Hệ thống đã sập.'}</h2>
    <div class="dim">${LV.sandbox?'Ngày tự do':'Ngày '+LV.id} · ${LV.title} · 23:00</div>
    <div class="rs">${[0,1,2].map(i=>STAR(i<stars)).join('')}<span>${pass?`Được ${stars} sao`:'Chưa có sao nào'}</span></div>
    <div class="line"><span>Tỷ lệ lỗi (≤ ${pc(LV.goalErr)})</span><span>${pc(s.err)} ${ok(s.err<=LV.goalErr)}</span></div>
    <div class="line"><span>p99 (≤ ${LV.goalP99}ms)</span><span>${Math.round(s.p99)}ms ${ok(s.p99<=LV.goalP99)}</span></div>
    <div class="line"><span>p50</span><span>${Math.round(s.p50)}ms</span></div>
    <div class="line"><span>Chi phí hạ tầng (3 sao nếu ≤ ${LV.star3}tr)</span><span>${s.cost}tr</span></div>
    <div class="line"><span>Request phục vụ</span><span>${Math.round(s.served).toLocaleString('vi')}</span></div>
    ${s.topReason&&s.failed>0?`<div class="why">Lỗi nhiều nhất: ${s.topReason} (${(s.topShare*100).toFixed(1)}% tổng request).</div>`:''}
    <div class="why">Sao 1: qua ca · Sao 2: lỗi ≤ ${pc(LV.goalErr/2)} · Sao 3: chi phí ≤ ${LV.star3}tr</div>
    <div class="ract">${pass&&nextL?`<button class="btn go" id="rNext">${nextL.sandbox?'Mở ngày tự do':'Đi ngủ, sang ngày mới'}</button>`:''}
      <button class="btn" id="rAgain">Làm lại ngày này</button><button class="btn" id="rMenu">Về lịch</button></div>`;
  $('#rAgain').onclick=()=>{$('#result').classList.add('hidden');resetDay()};
  $('#rMenu').onclick=()=>$('#bMenu').click();
  if($('#rNext')) $('#rNext').onclick=()=>{$('#result').classList.add('hidden');startDay(nextL)};
  $('#result').classList.remove('hidden');
}

/* ================== RENDER ================== */
function render(){
  const g=wg; g.imageSmoothingEnabled=false;
  for(let r=2;r<MH-1;r++) for(let c=1;c<MW-1;c++) if(c!==PART||DOOR.includes(r)) drawTile(g,c,r);
  drawWalls(g,clockMin);
  // đồ vật + máy + người, xếp theo y
  const list=[];
  for(const o of objs) list.push({y:(o.r+o.h)*T,f:()=>drawObj(g,o,tAll)});
  for(const n of sim.nodes) list.push({y:(n.r+2)*T,f:()=>drawMachine(g,n,tAll)});
  for(const n of npcs){ if(n.px!==undefined) list.push({y:n.py,f:()=>drawChar(g,n.who,Math.round(n.px)-6,Math.round(n.py)-17,n.dir,n.frame||0)}); else list.push({y:(n.r+1)*T,f:()=>drawChar(g,n.who,n.c*T+2,n.r*T-3,n.dir==='left'?'left':n.dir,0)}) }
  list.push({y:player.y,f:()=>drawChar(g,'you',Math.round(player.x)-6,Math.round(player.y)-17,player.dir,player.frame)});
  list.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  // khói từ máy sập
  for(const s of smoke){g.globalAlpha=1-s.t; R(g,s.x,s.y,s.s,s.s,s.red?'#ff6a4a':'#9a9a9a'); g.globalAlpha=1}
  // cáp treo + xung
  for(const e of sim.edges){const p=cablePts(e); g.fillStyle=e===hoverEdge&&tool==='plier'?P.cableSel:P.cable;
    const N=Math.ceil(Math.hypot(p.b.x-p.a.x,p.b.y-p.a.y)*1.3)+4; for(let i=0;i<=N;i++){const q=qAt(p,i/N); g.fillRect(Math.round(q.x),Math.round(q.y),1,1)}
    R(g,p.a.x-1,p.a.y-1,3,3,'#55585d'); R(g,p.b.x-1,p.b.y-1,3,3,'#55585d');}
  for(const pt of particles){const q=qAt(pt.p,pt.t); R(g,q.x-1,q.y-1,pt.bg?2:3,pt.bg?2:3,pt.col)}
  if(cableFrom&&hoverTile){const a={x:cableFrom.c*T+30,y:cableFrom.r*T+6}; g.fillStyle=P.cableSel; const b=hoverTile.w; for(let i=0;i<=30;i++){g.fillRect(Math.round(a.x+(b.x-a.x)*i/30),Math.round(a.y+(b.y-a.y)*i/30),1,1)}}
  // ánh sáng theo giờ
  const night=Math.max(0,Math.min(1,(clockMin-17*60)/(120)));
  if(night>0){g.globalCompositeOperation='multiply'; g.fillStyle=`rgb(${Math.round(255-night*85)},${Math.round(255-night*80)},${Math.round(255-night*35)})`; g.fillRect(0,0,WPX,HPX); g.globalCompositeOperation='lighter';
    for(const n of sim.nodes){const led=n.down?'#ff3a2a':'#3aff6a'; g.globalAlpha=0.35*night; circ(g,n.c*T+28,n.r*T+3,4,led); g.globalAlpha=1}
    g.globalCompositeOperation='source-over';}
  // vẽ lên màn hình
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.imageSmoothingEnabled=false; ctx.fillStyle='#15161a'; ctx.fillRect(0,0,CW,CH);
  ctx.drawImage(wc,Math.round(-cam.x*Z),Math.round(-cam.y*Z),WPX*Z,HPX*Z);
  // bóng đặt máy
  if(DEF[tool]&&hoverTile&&mouse.in){const ok=placeFree(hoverTile.c,hoverTile.r); const s=toScreen(hoverTile.c*T,hoverTile.r*T); ctx.strokeStyle=ok?'#6fd04a':'#ff4a3a'; ctx.lineWidth=3; ctx.setLineDash([6,4]); ctx.strokeRect(s.x+2,s.y+2,32*Z-4,32*Z-4); ctx.setLineDash([])}
  // nhãn máy
  ctx.font='17px VT323'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  for(const n of sim.nodes){const s=toScreen(n.c*T+16,n.r*T-1); const lab=`${DEF[n.type].name} ${n.id}`;
    const st=n.type==='users'?`${Math.round(sim.inRate)}/s`:n.down?'SẬP':sim.t<n.bootUntil?'boot':`${Math.round(n.util*100)}%`;
    const col=n.type==='users'?'#f1e3c2':n.down?'#ff6a5a':n.util<0.7?'#9fe07a':n.util<0.95?'#ffc24a':'#ff6a5a';
    const tw=ctx.measureText(lab+'  '+st).width+10; ctx.fillStyle='rgba(28,24,20,.82)'; ctx.fillRect(Math.round(s.x-tw/2),Math.round(s.y-15),Math.round(tw),17);
    ctx.fillStyle='#f1e3c2'; ctx.textAlign='left'; const x0=Math.round(s.x-tw/2+5); ctx.fillText(lab,x0,Math.round(s.y-2)); ctx.fillStyle=col; ctx.fillText(st,x0+ctx.measureText(lab+'  ').width,Math.round(s.y-2)); ctx.textAlign='center';
    if(n===cableFrom||(n===hoverNode&&tool==='cable')){const a=toScreen(n.c*T,n.r*T); ctx.strokeStyle='#ffb547'; ctx.lineWidth=3; ctx.strokeRect(a.x,a.y,32*Z,32*Z)}}
  // mũi tên chỉ bàn trực khi chưa vào ca
  if(mode==='day'){const o=objs.find(o=>o.kind==='oncall'); const s=toScreen(o.c*T+16,o.r*T-14-Math.abs(Math.sin(tAll*4))*4);
    ctx.fillStyle='#ffd23a'; ctx.strokeStyle='#3b2a1a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(s.x-10,s.y-18); ctx.lineTo(s.x+10,s.y-18); ctx.lineTo(s.x,s.y-4); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.font='17px VT323'; ctx.textAlign='center'; const t='Vào ca trực'; const tw=ctx.measureText(t).width+10; ctx.fillStyle='rgba(28,24,20,.85)'; ctx.fillRect(Math.round(s.x-tw/2),Math.round(s.y-40),Math.round(tw),18); ctx.fillStyle='#ffd23a'; ctx.fillText(t,Math.round(s.x),Math.round(s.y-26));}
  // gợi ý tương tác
  const it=interactTarget();
  if(it&&$('#dlg').classList.contains('hidden')){
    const lbl=it.k==='npc'?'Nói chuyện':it.k==='obj'?(it.v.kind==='oncall'?(mode==='run'?'Đang trực':'Vào ca trực'):it.v.kind==='coffee'?'Pha cà phê':'Xem'):it.v.down?'Sửa máy':'Xem trạng thái';
    const s=toScreen(player.x,player.y-26); const txt='E  '+lbl; const tw=ctx.measureText(txt).width+12;
    ctx.fillStyle='#f1e3c2'; ctx.fillRect(Math.round(s.x-tw/2),Math.round(s.y-16),Math.round(tw),19); ctx.strokeStyle='#8a5a1e'; ctx.lineWidth=2; ctx.strokeRect(Math.round(s.x-tw/2),Math.round(s.y-16),Math.round(tw),19);
    ctx.fillStyle='#3b2a1a'; ctx.fillText(txt,Math.round(s.x),Math.round(s.y-2));
  }
}

/* ================== LOOP ================== */
let last=performance.now();
function loop(now){
  const rdt=Math.min(0.1,(now-last)/1000); last=now; tAll+=rdt;
  if(sim&&mode!=='title'){
    const talking=!$('#dlg').classList.contains('hidden')||!$('#result').classList.contains('hidden')||!$('#pc').classList.contains('hidden');
    if(!talking){ stepPlayer(rdt); coffeeCd=Math.max(0,coffeeCd-rdt); for(const o of objs) if(o.kind==='coffee') o.ready=coffeeCd<=0 }
    if(mode==='day'&&!talking){ clockMin=Math.min(18*60+50,clockMin+rdt*3.3); if(LV.company) companyTick(rdt) }
    if(mode==='run'&&!paused&&!talking&&!ended){
      acc+=rdt*speed; let k=0; while(acc>=TICK&&k<40){sim.step(TICK);acc-=TICK;k++}
      if(LV.company) devopsTick();
      clockMin=19*60+(LV.duration?Math.min(1,sim.t/LV.duration)*240:(sim.t*2)%240);
      for(const m of sim.msgs) toast(m.text,m.kind); sim.msgs=[];
      for(const ph of (LV.phases||[])) if(sim.t>=ph.t&&!phaseFired.has(ph)){phaseFired.add(ph);toast(ph.text)}
      if(LV.duration&&sim.t>=LV.duration) finish();
    }
    for(const ev of sim.events){
      if(ev.k==='flow'&&particles.length<500){const e=sim.edges.find(x=>x.a===ev.a&&x.b===ev.b); if(e) particles.push({e,p:cablePts(e),t:0,col:ev.bg?P.job:ev.write?P.write:P.read,bg:ev.bg})}
      else if(ev.k==='fail'&&smoke.length<60) smoke.push({x:ev.n.c*T+6+Math.random()*20,y:ev.n.r*T+4+Math.random()*10,s:2,t:0,red:true,vy:-14});
    }
    sim.events=[];
    for(const n of sim.nodes) if(n.down&&Math.random()<rdt*8&&smoke.length<80) smoke.push({x:n.c*T+8+Math.random()*16,y:n.r*T+6,s:2+Math.floor(Math.random()*2),t:0,red:false,vy:-10});
    for(const s of smoke){s.t+=rdt*1.2; s.y+=s.vy*rdt} smoke=smoke.filter(s=>s.t<1);
    const pv=rdt*Math.min(speed,2)*2.2; for(const p of particles) p.t+=pv; particles=particles.filter(p=>p.t<1&&sim.edges.includes(p.e));
    updateCam(); render(); updateHUD();
    if(mouse.in) updateHover();
  }
  requestAnimationFrame(loop);
}
document.fonts.ready.then(()=>{renderTitle(); fit(); requestAnimationFrame(loop)});
