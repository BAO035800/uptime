/* ===================== CÔNG TY: nối vào thế giới game ===================== */
let pcTab='projects', workedTick=0, eodDone=false, todayDeploys=[];
function startCompany(fresh){
  if(fresh||!coLoad()) newCompany();
  $('#title').classList.add('hidden'); $('#game').classList.remove('hidden');
  beginCompanyDay(); fit();
  if(CO.day===1&&!CO.introDone){CO.introDone=true; coSave();
    playDialog([
      ['linh','Mùa flash sale qua rồi. VéXịn giờ không chỉ bán vé nữa: chị nhận làm phần mềm cho các cửa hàng, rạp phim, trường học quanh đây.'],
      ['linh','Em là dev đầu tiên, nên tạm thời em vừa code vừa trực. Lời mời hợp đồng chị để trong <b>máy tính ở bàn em</b>.'],
      ['sys','Mỗi ngày: nhận dự án và code ở <b>máy tính</b> (bàn của bạn, hoặc phím <b>Tab</b>). 18:00 hệ thống tự deploy. Tối vào ca trực giữ hệ thống sống cho mọi khách hàng.'],
      ['sys','Làm tốt sẽ lên <b>Senior</b>, <b>Tech Lead</b> (được tuyển người) rồi <b>CTO</b> (nhận khách lớn, thuê thêm mặt bằng). Hết tiền là công ty đóng cửa.'],
    ]);
  }
}
function beginCompanyDay(){
  startCompanyDay(); eodDone=false; todayDeploys=[];
  LV={company:true,id:0,chapter:'Công ty',title:'Công ty VéXịn',blurb:'',duration:60,budget:Infinity,star3:0,goalErr:0.03,goalP99:450,palette:['server','lb','cache','replica','queue'],
    rate:()=>0,write:()=>0.1,preset:{nodes:[],edges:[]},intro:[],win:[],lose:[],hint:[]};
  resetDay();
}
function companyResetDay(){
  sim=new Sim(LV); mode='day'; ended=false; acc=0; paused=false; particles=[]; smoke=[]; phaseFired=new Set();
  clockMin=8*60; energy=CO.energy??100; coffeeCd=0; tool='hand'; cableFrom=null;
  objs=[
    {kind:'desk',c:8,r:6,w:2,h:1,lit:true,cup:true},{kind:'shelf',c:2,r:2,w:3,h:1},
    {kind:'desk',c:2,r:15,w:2,h:1,lit:true,cup:true,name:'Máy tính của bạn',act:()=>openPC()},
    {kind:'coffee',c:12,r:2,w:1,h:1,ready:true,name:'Máy pha cà phê',act:o=>drinkCoffee(o)},
    {kind:'plant',c:13,r:2,w:1,h:1},{kind:'plant',c:1,r:19,w:1,h:1},{kind:'plant',c:40,r:2,w:1,h:1},
    {kind:'sofa',c:6,r:19,w:3,h:1,name:'Ghế sofa',act:()=>playDialog([['you','Ngả lưng 5 phút... thôi, còn việc.']])},
    {kind:'oncall',c:13,r:13,w:2,h:1,name:'Bàn trực',act:()=>startShift()},
  ];
  const nDesk=OFFICE_TIERS[CO.office].desks;
  for(let i=0;i<nDesk;i++){const d=DESK_SLOTS[i]; objs.push({kind:'desk',c:d.c,r:d.r,w:2,h:1,lit:!!CO.staff[i],cup:!!CO.staff[i],name:CO.staff[i]?`Bàn của ${CO.staff[i].name}`:'Bàn trống'})}
  npcs=[{who:'linh',c:10,r:6,dir:'left'}];
  CO.staff.forEach((s,i)=>{const d=DESK_SLOTS[i]; const who='s'+s.id; CHARS[who]=s.pal; CAST[who]={name:`${s.name} · ${STAFF_ROLES[s.role].name}`};
    npcs.push({who,staff:s,c:d.c+2,r:d.r,home:{c:d.c+2,r:d.r},dir:'left',wanderT:10+Math.random()*30})});
  const ns=CO.layout.nodes.map(([t,c,r])=>addMachine(t,c,r,false));
  for(const [a,b] of CO.layout.edges) if(ns[a]&&ns[b]) sim.connect(ns[a],ns[b]);
  player={x:4*T+8,y:18*T+14,dir:'up',frame:0,walkT:0,path:[],then:null};
  buildHotbar(); updateHUD(true);
}
function saveLayout(){
  if(!LV||!LV.company) return;
  const idx=new Map(sim.nodes.map((n,i)=>[n,i]));
  CO.layout={nodes:sim.nodes.map(n=>[n.type,n.c,n.r]),edges:sim.edges.map(e=>[idx.get(e.a),idx.get(e.b)])}; coSave();
}
/* ---- nhân viên đi lại ---- */
function companyTick(dt){
  if(mode!=='day') return;
  if(clockMin<18*60){ staffWork(dt) }
  else if(!eodDone){ eodDone=true; todayDeploys=endOfWorkday(); coSave();
    if(todayDeploys.length) toast(`18:00 deploy: ${todayDeploys.map(d=>d.c.name).join(', ')}. Tối nay sẽ biết có bug không...`,'info'); else toast('18:00. Hôm nay chưa có gì để deploy.','');
    for(const c of CO.clients) if(c.status==='live'&&todayDeploys.some(d=>d.c===c&&d.first)) toast(`${c.name} chính thức chạy trên hệ thống từ tối nay!`,'info');
  }
  for(const n of npcs){ if(!n.staff) continue;
    if(n.path&&n.path.length){const tg=n.path[0]; const vx=tg.x-n.px, vy=tg.y-n.py, d=Math.hypot(vx,vy), sp=50*dt;
      if(d<=sp){n.px=tg.x;n.py=tg.y;n.path.shift(); if(!n.path.length){ if(n.goingHome){n.goingHome=false;n.walking=false;n.c=n.home.c;n.r=n.home.r;n.dir='left';delete n.px;delete n.py;n.staff.away=false}
          else {n.pause=3+Math.random()*3; n.dir='up'} }}
      else {n.px+=vx/d*sp;n.py+=vy/d*sp;n.dir=Math.abs(vx)>Math.abs(vy)?(vx<0?'left':'right'):(vy<0?'up':'down');n.walkT=(n.walkT||0)+dt;n.frame=1+Math.floor(n.walkT*8)%2}
      continue; }
    if(n.pause>0){n.pause-=dt; n.frame=0; if(n.pause<=0){ n.staff.morale=Math.min(100,n.staff.morale+1); goNpc(n,n.home.c,n.home.r,true)} continue}
    n.wanderT-=dt; if(n.wanderT<=0&&clockMin<18*60){ n.wanderT=25+Math.random()*40; goNpc(n,12,3,false) }
  }
}
function goNpc(n,c,r,home){
  const sc=n.px!==undefined?Math.floor(n.px/T):n.c, sr=n.py!==undefined?Math.floor((n.py-4)/T):n.r;
  const save=npcs; npcs=npcs.filter(x=>x!==n);
  const path=bfs(sc,sr,(cc,rr)=>cc===c&&rr===r); npcs=save;
  if(!path){return}
  if(n.px===undefined){n.px=n.c*T+8;n.py=n.r*T+12}
  n.walking=true; n.staff.away=!home; n.goingHome=home; n.path=path.slice(1).map(([c,r])=>({x:c*T+8,y:r*T+12}));
  if(!n.path.length){ if(home){n.walking=false;n.goingHome=false;delete n.px;delete n.py;n.staff.away=false} }
}
function staffTalk(n){
  const s=n.staff, t=workTarget(s);
  const mood=s.morale>70?'Hôm nay ổn anh/chị ạ!':s.morale>40?'Hơi đuối nhưng vẫn chiến được.':'Dạo này mệt quá, chắc phải nghỉ ngơi...';
  playDialog([[n.who,`${mood} Em đang làm ${t?`<b>${t.name}</b>`:'việc lặt vặt vì chưa có dự án'}. Kỹ năng ${'★'.repeat(s.skill)}, tinh thần ${Math.round(s.morale)}/100.`]]);
}
function companyLinhTalk(){
  const live=CO.clients.filter(c=>c.status==='live').length, build=CO.clients.filter(c=>c.status==='build').length;
  const lines=mode==='run'?[['linh','Khách nào cũng đang nhìn mình đấy. Giữ vững nhé em!']]
   :[['linh',`Hôm nay mình có ${live} khách đang chạy, ${build} dự án đang làm, quỹ còn ${Math.round(CO.cash)} triệu. ${CO.offers.length?`Có ${CO.offers.length} lời mời mới trong máy tính đấy.`:'Chị đang đi chào hàng thêm.'}`]];
  if(CO.cash<60&&mode!=='run') lines.push(['linh','Nói thật, tiền sắp cạn rồi. Mình cần thêm khách hoặc cắt bớt chi phí.']);
  playDialog(lines);
}
function companyCode(){
  if(energy<25){toast('Mệt quá, uống cà phê đã rồi code tiếp.','bad');return}
  if(clockMin>=18*60){toast('Đã qua 18:00, hệ thống đã deploy. Mai code tiếp.','');return}
  const r=playerCode(); if(!r){toast('Chưa có dự án nào để code. Nhận hợp đồng trước đã.','');return}
  energy-=25; clockMin=Math.min(18*60-1,clockMin+60); toast(`Bạn code 1 tiếng cho ${r.c.name}: +${r.pts.toFixed(1)} điểm.`,'info'); renderPC(); coSave();
}
/* ---- ca trực đêm ---- */
function companyStartShift(){
  if(mode!=='day') return false;
  if(!eodDone){ eodDone=true; todayDeploys=endOfWorkday() }
  saveLayout();
  const nl=nightLevel(todayDeploys); const keep=sim; LV=nl; keep.level=nl; sim=keep; sim.t=0;
  mode='run'; clockMin=19*60; for(const o of objs) if(o.kind==='oncall') o.active=true;
  toast('19:00. Ca trực bắt đầu.','info'); return true;
}
function devopsTick(){
  if(!LV.devops) return;
  for(const n of sim.nodes){ if(n.down){ if(n.downAt===undefined) n.downAt=sim.t; if(sim.t-n.downAt>12/LV.devops){n.down=false;n.downUntil=0;n.bootUntil=sim.t+3;delete n.downAt; const d=CO.staff.find(s=>s.role==='devops'); toast(`${d?d.name:'DevOps'} đã khởi động lại ${DEF[n.type].name} ${n.id}.`,'info')} } else delete n.downAt }
}
function companyFinish(){
  mode='end'; ended=true; for(const o of objs) if(o.kind==='oncall') o.active=false;
  const s=sim.summary(); const pass=s.err<=LV.goalErr&&s.p99<=LV.goalP99;
  const before=roleOf(CO.xp); CO.energy=100;
  const res=settleDay(s,pass); const after=roleOf(CO.xp); coSave();
  const lines=[]; if(pass) lines.push(['linh','Đêm nay ổn rồi. Khách không than gì cả. Về nghỉ đi em!']); else lines.push(['linh','Tối nay khách gọi cho chị liên tục... Mai mình phải làm tốt hơn.']);
  if(after!==before) lines.push(['sys',`Thăng chức! Bạn giờ là <b>${after.name}</b>.${after.id==='lead'?' Đã có thể tuyển người trong máy tính.':after.id==='cto'?' Đã có thể nhận khách lớn và thuê thêm mặt bằng.':''}`]);
  playDialog(lines,()=>showCompanyResult(res,after));
}
function showCompanyResult(r,role){
  const f=v=>(v>=0?'+':'')+(+v).toFixed(1)+'tr';
  const broke=CO.cash<-50;
  $('#rbox').innerHTML=`<h2>${broke?'Công ty phá sản':`Hết ngày ${r.day}`}</h2>
    <div class="dim">${role.name} · Uy tín ${Math.round(r.rep)}/100 · Ca trực ${r.pass?'<span class="good">giữ được SLA</span>':'<span class="bad">vỡ SLA</span>'}</div>
    <div class="line"><span>Lỗi / p99 đêm nay</span><span>${(r.summary.err*100).toFixed(2)}% · ${Math.round(r.summary.p99)}ms</span></div>
    <div class="line"><span>Phí dịch vụ từ khách</span><span class="good">${f(r.income)}</span></div>
    ${r.bonus?`<div class="line"><span>Tiền bàn giao dự án</span><span class="good">${f(r.bonus)}</span></div>`:''}
    ${r.penalty?`<div class="line"><span>Đền bù vi phạm SLA cho khách</span><span class="bad">${f(-r.penalty)}</span></div>`:''}
    <div class="line"><span>Lương nhân viên</span><span class="bad">${f(-r.salaries)}</span></div>
    <div class="line"><span>Thuê văn phòng</span><span class="bad">${f(-r.rent)}</span></div>
    <div class="line"><span>Điện + bảo trì máy</span><span class="bad">${f(-r.upkeep)}</span></div>
    ${r.spent?`<div class="line"><span>Mua máy hôm nay</span><span class="bad">${f(-r.spent)}</span></div>`:''}
    <div class="line"><span><b style="font-weight:400">Lãi/lỗ trong ngày</b></span><span class="${r.net>=0?'good':'bad'}">${f(r.net)}</span></div>
    <div class="line"><span>Quỹ công ty</span><span>${Math.round(r.cash)}tr</span></div>
    ${r.notes.length?`<div class="why">${r.notes.join('<br>')}</div>`:''}
    <div class="ract">${broke?`<button class="btn go" id="rNew">Mở công ty mới</button>`:`<button class="btn go" id="rNext">Đi ngủ, sang ngày ${CO.day}</button>`}<button class="btn" id="rMenu">Về lịch</button></div>`;
  if(broke){$('#rNew').onclick=()=>{$('#result').classList.add('hidden');localStorage.removeItem('uptime-company');startCompany(true)}}
  else $('#rNext').onclick=()=>{$('#result').classList.add('hidden');beginCompanyDay();toast(`Ngày ${CO.day}. ${CO.offers.length} lời mời hợp đồng đang chờ trong máy tính.`,'info')};
  $('#rMenu').onclick=()=>$('#bMenu').click();
  $('#result').classList.remove('hidden');
}
/* ---- máy tính ---- */
function openPC(tab){ if(tab) pcTab=tab; $('#pc').classList.remove('hidden'); renderPC() }
function closePC(){ $('#pc').classList.add('hidden') }
function bar(v,max,cls){const p=Math.max(0,Math.min(100,v/max*100));return `<span class="pbar"><i class="${cls||''}" style="width:${p}%"></i></span>`}
function renderPC(){
  if($('#pc').classList.contains('hidden')) return;
  const ri=roleIdx(CO.xp), role=ROLES[ri], next=ROLES[ri+1];
  document.querySelectorAll('#pc .tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===pcTab));
  $('#pcHead').innerHTML=`<span>${role.name}${next?` · ${Math.round(CO.xp)}/${next.xp} XP tới ${next.name}`:' · cấp cao nhất'}</span><span>Quỹ <b>${Math.round(CO.cash)}tr</b> · Uy tín ${Math.round(CO.rep)}</span>`;
  const B=$('#pcBody'); let h='';
  if(pcTab==='projects'){
    const act=CO.clients;
    h+=`<h4>Đang làm và đang chạy</h4>`;
    if(!act.length) h+=`<p class="dim">Chưa có khách nào. Nhận một lời mời bên dưới.</p>`;
    for(const c of act){
      h+=`<div class="card"><div class="ch"><b>${c.name}</b><span class="dim">${c.kind}</span></div>`;
      if(c.status==='build') h+=`<div class="cr">Đang làm ${bar(c.done,c.pts)} ${c.done.toFixed(1)}/${c.pts} điểm · hạn ngày ${c.deadline}${c.deadline-CO.day<=1?' <span class="bad">(gấp)</span>':''}</div>`;
      else h+=`<div class="cr">Đang chạy · ${c.traffic} req/s · ${Math.round(c.write*100)}% ghi · trả ${c.pay}tr/ngày${c.pending>0?` · <span class="warn">yêu cầu mới còn ${c.pending.toFixed(1)} điểm</span>`:''}</div>`;
      h+=`<div class="cr dim">Hài lòng ${bar(c.sat,100,c.sat<40?'bad':c.sat<60?'warn':'')} ${Math.round(c.sat)} · SLA lỗi ≤ ${c.sla*100}%</div></div>`;
    }
    h+=`<div class="row2"><button class="btn go" onclick="companyCode()" ${clockMin>=18*60||mode!=='day'?'disabled':''}>Tự code 1 tiếng (−25 năng lượng)</button><span class="dim">Lỗi deploy hiện tại: ${Math.round(bugChance()*100)}%</span></div>`;
    h+=`<h4>Lời mời hợp đồng</h4>`;
    if(!CO.offers.length) h+=`<p class="dim">Chưa có lời mời. Uy tín cao và chức vụ cao sẽ có khách lớn hơn.</p>`;
    for(const o of CO.offers) h+=`<div class="card"><div class="ch"><b>${o.name}</b><span class="dim">${o.kind}</span></div>
      <div class="cr">${o.pts} điểm việc · làm trong ${o.days} ngày · bàn giao +${o.bonus}tr · sau đó ${o.pay}tr/ngày</div>
      <div class="cr dim">Traffic ~${o.traffic} req/s, ${Math.round(o.write*100)}% ghi · SLA lỗi ≤ ${o.sla*100}% · hết hạn sau ngày ${o.expires}</div>
      <button class="btn sm go" onclick="pcAct(acceptOffer(${o.id}),'Đã ký hợp đồng với ${o.name}!')">Nhận dự án</button></div>`;
  }
  if(pcTab==='team'){
    h+=`<h4>Nhân sự (${CO.staff.length}/${OFFICE_TIERS[CO.office].desks} bàn)</h4>`;
    if(!CO.staff.length) h+=`<p class="dim">Chỉ có bạn và chị Linh. ${ri<2?'Lên Tech Lead để được tuyển người.':'Sang tab Tuyển dụng để thêm người.'}</p>`;
    for(const s of CO.staff){
      const opts=['<option value="auto">Tự chọn việc gấp nhất</option>'].concat(CO.clients.map(c=>`<option value="${c.id}" ${s.assign===c.id?'selected':''}>${c.name}</option>`)).join('');
      h+=`<div class="card"><div class="ch"><b>${s.name}</b><span>${STAFF_ROLES[s.role].name} ${'★'.repeat(s.skill)}</span></div>
        <div class="cr">Tinh thần ${bar(s.morale,100,s.morale<35?'bad':s.morale<60?'warn':'')} ${Math.round(s.morale)} · lương ${s.salary}tr/ngày</div>
        <div class="cr"><label>Giao việc: <select onchange="setAssign(${s.id},this.value)">${opts}</select></label> <button class="btn sm" onclick="if(confirmFire(${s.id}))0">Cho nghỉ</button></div></div>`;
    }
    h+=`<p class="dim">Dev làm ra điểm việc. QA giảm tỉ lệ bug khi deploy. DevOps tự khởi động lại máy sập trong ca trực.</p>`;
  }
  if(pcTab==='hire'){
    h+=`<h4>Ứng viên (làm mới mỗi 2 ngày)</h4>`;
    if(ri<2) h+=`<p class="warn">Cần chức Tech Lead để tuyển. Hiện bạn là ${role.name}.</p>`;
    for(const c of CO.candidates) h+=`<div class="card"><div class="ch"><b>${c.name}</b><span>${STAFF_ROLES[c.role].name} ${'★'.repeat(c.skill)}</span></div>
      <div class="cr">Lương đề nghị ${c.salary}tr/ngày</div><button class="btn sm go" ${ri<2?'disabled':''} onclick="pcAct(hire(${c.id}),'Chào mừng ${c.name} gia nhập VéXịn! Sáng mai sẽ có mặt ở bàn.')">Tuyển</button></div>`;
  }
  if(pcTab==='office'){
    const t=OFFICE_TIERS[CO.office], nt=OFFICE_TIERS[CO.office+1];
    const up=+(CO.layout.nodes.reduce((a,[ty])=>a+DEF[ty].cost,0)*UPKEEP_RATE).toFixed(1);
    h+=`<h4>Văn phòng</h4><div class="card"><div class="ch"><b>${t.name}</b><span>${t.desks} bàn · thuê ${t.rent}tr/ngày</span></div>
      ${nt?`<div class="cr">Nâng lên: ${nt.name} (${nt.desks} bàn, ${nt.rent}tr/ngày), cọc ${nt.cost}tr</div><button class="btn sm go" ${ri<3?'disabled':''} onclick="pcAct(upgradeOffice(),'Đã thuê thêm mặt bằng! Bàn mới có từ sáng mai.')">Thuê thêm</button>${ri<3?' <span class="dim">Cần chức CTO</span>':''}`:'<div class="cr dim">Đã ở mức cao nhất.</div>'}</div>
      <h4>Phòng máy</h4><div class="card"><div class="cr">${CO.layout.nodes.length} máy · điện và bảo trì ${up}tr/ngày (${UPKEEP_RATE*100}% giá máy mỗi ngày)</div>
      <div class="cr dim">Mua máy bằng thanh đồ, đặt trong phòng máy. Gỡ máy bằng Kìm được hoàn 50% giá.</div></div>`;
  }
  if(pcTab==='money'){
    const live=CO.clients.filter(c=>c.status==='live');
    const inc=live.reduce((a,c)=>a+(c.sat>=60?c.pay:c.sat>=40?c.pay*0.5:0),0), sal=CO.staff.reduce((a,s)=>a+s.salary,0), rent=OFFICE_TIERS[CO.office].rent;
    const up=CO.layout.nodes.reduce((a,[ty])=>a+DEF[ty].cost,0)*UPKEEP_RATE;
    h+=`<h4>Dự kiến mỗi ngày</h4><div class="card">
      <div class="cr2"><span>Phí dịch vụ (${live.length} khách)</span><span class="good">+${inc.toFixed(1)}tr</span></div>
      <div class="cr2"><span>Lương (${CO.staff.length} người)</span><span class="bad">−${sal.toFixed(1)}tr</span></div>
      <div class="cr2"><span>Thuê văn phòng</span><span class="bad">−${rent}tr</span></div>
      <div class="cr2"><span>Điện + bảo trì máy</span><span class="bad">−${up.toFixed(1)}tr</span></div>
      <div class="cr2"><span>Dòng tiền</span><span class="${inc-sal-rent-up>=0?'good':'bad'}">${(inc-sal-rent-up>=0?'+':'')}${(inc-sal-rent-up).toFixed(1)}tr/ngày</span></div></div>
      ${CO.last?`<h4>Hôm qua</h4><div class="card"><div class="cr2"><span>Lãi/lỗ</span><span class="${CO.last.net>=0?'good':'bad'}">${CO.last.net}tr</span></div></div>`:''}
      <p class="dim">Khách hài lòng dưới 60 chỉ trả một nửa, dưới 40 không trả. Vỡ SLA phải đền 50% phí ngày cho mọi khách. Quỹ dưới −50tr là phá sản.</p>`;
  }
  B.innerHTML=h;
}
function pcAct(err,ok){ if(err) toast(err,'bad'); else {toast(ok,'info'); coSave()} renderPC(); updateHUD(true) }
function setAssign(id,v){const s=CO.staff.find(s=>s.id===id); if(s){s.assign=v==='auto'?'auto':+v; coSave()}}
let fireArm=null;
function confirmFire(id){ if(fireArm!==id){fireArm=id;toast('Bấm "Cho nghỉ" lần nữa để xác nhận.','bad');return false}
  fireArm=null; const s=CO.staff.find(x=>x.id===id); fire(id); npcs=npcs.filter(n=>!n.staff||n.staff.id!==id); toast(`${s?s.name:'Nhân viên'} đã nghỉ việc.`,''); coSave(); renderPC(); return true }
