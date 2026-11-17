/* ===================================================================
   CHẾ ĐỘ CÔNG TY — chơi mở, ngày nối ngày
   Lõi (company core) không đụng DOM để test được bằng Node.
   =================================================================== */
const ROLES=[{id:'dev',name:'Dev',xp:0},{id:'senior',name:'Senior Dev',xp:150},{id:'lead',name:'Tech Lead',xp:420},{id:'cto',name:'CTO',xp:900}];
const STAFF_ROLES={dev:{name:'Dev',pts:1,base:3},qa:{name:'QA',pts:0.45,base:2.5},devops:{name:'DevOps',pts:0.35,base:3.5}};
const FIRST=['Minh','Hà','Tuấn','Linh Chi','Quang','Trang','Đức','Ngọc','Phong','Thảo','Khoa','Vy','Hưng','Mai','Nam','Yến','Long','Hiền'];
const LAST=['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Ngô'];
const CLIENTS=[
  {name:'Nhà sách Phố Huế',kind:'web bán sách',traffic:120,write:0.08,pts:12,pay:5,bonus:25,sla:0.03,tier:0},
  {name:'Tiệm bánh mì Cô Ba',kind:'app đặt hàng',traffic:90,write:0.3,pts:10,pay:4,bonus:20,sla:0.03,tier:0},
  {name:'Sân bóng Cỏ Xanh',kind:'app đặt sân',traffic:150,write:0.25,pts:14,pay:6,bonus:30,sla:0.03,tier:0},
  {name:'Chuỗi trà sữa Mây',kind:'đặt món online',traffic:350,write:0.35,pts:22,pay:10,bonus:50,sla:0.025,tier:1},
  {name:'Rạp phim Sao Đêm',kind:'bán vé xem phim',traffic:420,write:0.3,pts:26,pay:12,bonus:60,sla:0.025,tier:1},
  {name:'Shop thời trang Lụa',kind:'thương mại điện tử',traffic:380,write:0.15,pts:24,pay:11,bonus:55,sla:0.025,tier:1},
  {name:'Trường THPT Ngọc Hà',kind:'tra cứu điểm thi',traffic:700,write:0.03,pts:18,pay:9,bonus:70,sla:0.02,tier:1},
  {name:'Báo điện tử Phố Cổ',kind:'báo điện tử',traffic:1100,write:0.04,pts:34,pay:20,bonus:110,sla:0.02,tier:2},
  {name:'Ví điện tử Xu',kind:'thanh toán',traffic:800,write:0.45,pts:45,pay:28,bonus:160,sla:0.01,tier:2},
  {name:'Sàn vé Lễ hội Gió',kind:'vé lễ hội âm nhạc',traffic:1300,write:0.35,pts:40,pay:26,bonus:150,sla:0.02,tier:2},
];
const DESK_SLOTS=[{c:2,r:10},{c:6,r:12},{c:6,r:16},{c:10,r:9},{c:10,r:16},{c:6,r:8}];
const OFFICE_TIERS=[{name:'Một phòng nhỏ',desks:3,rent:4,cost:0},{name:'Thuê thêm nửa tầng',desks:6,rent:9,cost:200}];
const UPKEEP_RATE=0.015;

let CO=null;
function coRand(){CO.seed=(CO.seed*1103515245+12345)&0x7fffffff;return CO.seed/0x7fffffff}
function coPick(a){return a[Math.floor(coRand()*a.length)]}
function roleOf(xp){let r=ROLES[0];for(const x of ROLES) if(xp>=x.xp) r=x;return r}
function roleIdx(xp){return ROLES.indexOf(roleOf(xp))}

function newCompany(){
  CO={v:1,seed:20261117,day:1,cash:260,rep:30,xp:60,office:0,staff:[],clients:[],offers:[],candidates:[],nid:1,log:[],last:null,
    layout:{nodes:[['users',18,9],['lb',23,9],['server',26,4],['server',26,8],['server',26,12],['server',26,16],['cache',31,6],['queue',31,13],['db',36,9]],
            edges:[[0,1],[1,2],[1,3],[1,4],[1,5],[2,6],[3,6],[4,6],[5,6],[2,7],[3,7],[4,7],[5,7],[6,8],[7,8]]},
    baseTraffic:220, energy:100};
  refreshOffers(); refreshOffers(); refreshCandidates();
  return CO;
}
function makeStaff(role){
  const skill=1+Math.floor(coRand()*coRand()*5);
  const s={id:CO.nid++,name:coPick(LAST)+' '+coPick(FIRST),role,skill,salary:+(STAFF_ROLES[role].base*(0.6+skill*0.3)).toFixed(1),morale:70,assign:'auto',
    pal:{H:coPick(['#2b2420','#3b2318','#1a1a1a','#5a3a24','#7a4a2a']),L:coRand()<0.4?'#2b2420':null,S:coPick(['#f1c7a0','#e2b48c','#f3cba8','#d8a47c']),E:'#1a1410',R:'#c97a62',
      T:coPick(['#3f7f6a','#b5523b','#2f5f8a','#d9a441','#6a4a8a','#5a8a3a','#c97a8a']),A:null,P:coPick(['#3a3f58','#2f2f3a','#4a4f5c','#5a4a3a']),B:'#1d1d22'}};
  s.pal.A=s.pal.S; return s;
}
function refreshCandidates(){CO.candidates=[];for(let i=0;i<3;i++) CO.candidates.push(makeStaff(coPick(['dev','dev','dev','qa','devops'])))}
function refreshOffers(){
  const ri=roleIdx(CO.xp); const maxTier=ri>=3&&CO.rep>=40?2:(CO.rep>=55||ri>=2)&&CO.rep>=20?1:0;
  while(CO.offers.length<3){
    const pool=CLIENTS.filter(c=>c.tier<=maxTier&&!CO.clients.some(x=>x.name===c.name)&&!CO.offers.some(x=>x.name===c.name));
    if(!pool.length) break;
    const t=coPick(pool), vary=0.85+coRand()*0.3;
    CO.offers.push({id:CO.nid++,name:t.name,kind:t.kind,traffic:Math.round(t.traffic*vary),write:t.write,pts:Math.round(t.pts*vary),pay:Math.round(t.pay*vary),bonus:Math.round(t.bonus*vary*0.6),sla:t.sla,
      days:3+Math.ceil(t.pts/8)+Math.floor(coRand()*2),tier:t.tier,expires:CO.day+2});
  }
}
function acceptOffer(id){
  const o=CO.offers.find(o=>o.id===id); if(!o) return 'Lời mời không còn.';
  if(CO.clients.filter(c=>c.status==='build').length>=3) return 'Đang làm 3 dự án dở, nhận thêm sẽ không kịp.';
  CO.offers=CO.offers.filter(x=>x!==o);
  CO.clients.push({...o,status:'build',done:0,deadline:CO.day+o.days,sat:70,pending:0,pendingAge:0});
  return null;
}
function hire(id){
  const ri=roleIdx(CO.xp); if(ri<2) return 'Phải lên Tech Lead mới được tuyển người.';
  if(CO.staff.length>=OFFICE_TIERS[CO.office].desks) return 'Hết bàn trống. Nâng cấp văn phòng để có thêm chỗ.';
  const c=CO.candidates.find(c=>c.id===id); if(!c) return 'Ứng viên đã đi rồi.';
  CO.candidates=CO.candidates.filter(x=>x!==c); CO.staff.push(c); return null;
}
function fire(id){CO.staff=CO.staff.filter(s=>s.id!==id)}
function upgradeOffice(){
  if(CO.office>=OFFICE_TIERS.length-1) return 'Văn phòng đã ở mức cao nhất.';
  if(roleIdx(CO.xp)<3) return 'Chỉ CTO mới quyết thuê thêm mặt bằng.';
  const t=OFFICE_TIERS[CO.office+1]; if(CO.cash<t.cost) return `Cần ${t.cost}tr để thuê thêm.`;
  CO.cash-=t.cost; CO.office++; return null;
}
/* việc trong ngày: điểm công việc mỗi giây thực (lúc giờ làm) */
function workTarget(s){
  const open=CO.clients.filter(c=>(c.status==='build'&&c.done<c.pts)||(c.status==='live'&&c.pending>0));
  if(s&&s.assign!=='auto'){const c=CO.clients.find(c=>c.id===s.assign); if(c&&open.includes(c)) return c}
  open.sort((a,b)=>(a.status==='build'?a.deadline:CO.day+1+a.pendingAge*-0.1)-(b.status==='build'?b.deadline:CO.day+1+b.pendingAge*-0.1));
  return open[0]||null;
}
function addWork(c,pts){
  if(!c) return; if(c.status==='build') c.done=Math.min(c.pts,c.done+pts); else c.pending=Math.max(0,c.pending-pts);
}
function staffWork(dt){ // dt: giây thực trong giờ làm
  for(const s of CO.staff){ if(s.away) continue;
    const pts=STAFF_ROLES[s.role].pts*(0.6+s.skill*0.35)*(0.5+s.morale/140)*0.045*dt; addWork(workTarget(s),pts); }
}
function playerCode(){
  const ri=roleIdx(CO.xp); const c=workTarget(null); if(!c) return null;
  const pts=4+ri*1.5; addWork(c,pts); CO.xp+=4; return {c,pts};
}
/* deploy cuối giờ làm: tính xác suất bug */
function bugChance(){
  const qa=CO.staff.filter(s=>s.role==='qa'); const devs=CO.staff.filter(s=>s.role==='dev');
  const avg=devs.length?devs.reduce((a,s)=>a+s.skill,0)/devs.length:2.5;
  return Math.max(0.06,0.38-qa.length*0.1-qa.reduce((a,s)=>a+s.skill,0)*0.02-(avg-2)*0.04);
}
function endOfWorkday(){ // gọi lúc 18:00, trả về danh sách deploy + bug
  const deploys=[];
  for(const c of CO.clients){
    if(c.status==='build'&&c.done>=c.pts){c.status='live';c.sat=Math.min(100,c.sat+10);deploys.push({c,first:true});CO.xp+=25;CO.cash+=c.bonus;CO.today.bonus+=c.bonus}
    else if(c.status==='live'&&c.pending===0&&c.hadPending){c.hadPending=false;c.sat=Math.min(100,c.sat+6);deploys.push({c,first:false});CO.xp+=8}
  }
  const p=bugChance(); for(const d of deploys) d.bug=coRand()<p;
  return deploys;
}
/* traffic đêm nay */
function nightLevel(deploys){
  const live=CO.clients.filter(c=>c.status==='live');
  const base=CO.baseTraffic*(0.8+CO.rep/150);
  const peak=base+live.reduce((a,c)=>a+c.traffic,0);
  const wr=(base*0.15+live.reduce((a,c)=>a+c.traffic*c.write,0))/peak;
  const spikeC=live.length?coPick(live):null, spikeAt=15+Math.floor(coRand()*25), spikeMul=1.5+coRand()*0.8;
  const sla=live.length?Math.min(...live.map(c=>c.sla)):0.03;
  const events=[]; const phases=[{t:3,text:`Ca trực bắt đầu: ${live.length} khách đang chạy, đỉnh dự kiến ~${Math.round(peak)} req/s.`}];
  if(spikeC) phases.push({t:spikeAt,text:`${spikeC.name} đang chạy khuyến mãi, traffic của họ tăng vọt!`});
  deploys.filter(d=>d.bug).forEach((d,i)=>{const at=8+i*9+Math.floor(coRand()*10);
    events.push({t:at,run(s){const v=busiest(s,'server')||busiest(s,'db'); if(v){v.down=true;v.downUntil=s.t+35; s.msgs.push({text:`Bản deploy cho ${d.c.name} có bug: ${DEF[v.type].name} ${v.id} crash liên tục! Chạy tới sửa.`,kind:'bad'})}}})});
  // phần cứng già: hỏng ngẫu nhiên
  if(coRand()<0.35){const at=20+Math.floor(coRand()*30); events.push({t:at,run(s){const v=busiest(s,coPick(['server','server','cache','replica'])); if(v){v.down=true;v.downUntil=s.t+30; s.msgs.push({text:`${DEF[v.type].name} ${v.id} hỏng nguồn đột ngột!`,kind:'bad'})}}})}
  // DevOps tự sửa máy
  const ops=CO.staff.filter(s=>s.role==='devops');
  if(ops.length) events.push({t:0,every:true,run(){}});
  return {company:true,id:0,chapter:'Công ty',title:'Công ty VéXịn',blurb:'',duration:60,budget:Infinity,star3:0,goalErr:sla,goalP99:450,
    palette:['server','lb','cache','replica','queue'],
    rate:t=>{let r=peak*(t<8?0.45:t<20?0.45+0.55*(t-8)/12:1); if(spikeC&&t>=spikeAt&&t<spikeAt+12) r+=spikeC.traffic*(spikeMul-1); return r},
    write:()=>wr, events, phases, preset:{nodes:[],edges:[]}, intro:[], win:[], lose:[],
    hint:[['linh','Chị không rành kỹ thuật, nhưng hôm qua khách than chậm. Em xem phòng máy có chỗ nào đỏ thì thêm máy nhé.']], devops:ops.length};
}
/* tổng kết cuối ngày */
function settleDay(summary,pass){
  const t=CO.today, live=CO.clients.filter(c=>c.status==='live');
  const income=live.reduce((a,c)=>a+(c.sat>=60?c.pay:c.sat>=40?c.pay*0.5:0),0);
  const penalty=pass?0:+live.reduce((a,c)=>a+c.pay*0.5,0).toFixed(1);
  const salaries=CO.staff.reduce((a,s)=>a+s.salary,0);
  const rent=OFFICE_TIERS[CO.office].rent;
  const upkeep=+(CO.layout.nodes.reduce((a,[ty])=>a+DEF[ty].cost,0)*UPKEEP_RATE).toFixed(1);
  const net=+(income+t.bonus-salaries-rent-upkeep-t.spent-penalty).toFixed(1);
  CO.cash=+(CO.cash+income-salaries-rent-upkeep-penalty).toFixed(1);
  const notes=[];
  if(pass){CO.rep=Math.min(100,CO.rep+3);CO.xp+=30;for(const c of live) c.sat=Math.min(100,c.sat+4);for(const s of CO.staff) s.morale=Math.min(100,s.morale+4)}
  else {CO.rep=Math.max(0,CO.rep-6);CO.xp+=8;for(const c of live) c.sat-=14;for(const s of CO.staff) s.morale-=6}
  for(const s of CO.staff) s.morale=Math.max(0,s.morale-2);
  // deadline
  for(const c of CO.clients.filter(c=>c.status==='build')){ if(CO.day>=c.deadline){ c.sat-=20; CO.rep=Math.max(0,CO.rep-3); c.deadline=CO.day+2; notes.push(`${c.name}: trễ hạn bàn giao, khách rất không vui (gia hạn thêm 2 ngày).`) } }
  // yêu cầu tính năng mới từ khách đang chạy
  for(const c of live){ if(c.pending>0){c.pendingAge++; if(c.pendingAge>3) c.sat-=4} else if(coRand()<0.3){c.pending=4+Math.floor(coRand()*8);c.pendingAge=0;c.hadPending=true;notes.push(`${c.name} gửi yêu cầu tính năng mới (${c.pending} điểm).`)} }
  // khách bỏ đi
  for(const c of [...CO.clients]) if(c.sat<25){CO.clients=CO.clients.filter(x=>x!==c);CO.rep=Math.max(0,CO.rep-5);notes.push(`${c.name} đã hủy hợp đồng và chuyển sang bên khác.`)}
  // nhân viên nghỉ
  for(const s of [...CO.staff]) if(s.morale<20){CO.staff=CO.staff.filter(x=>x!==s);notes.push(`${s.name} (${STAFF_ROLES[s.role].name}) đã nộp đơn nghỉ việc vì quá mệt.`)}
  const before=roleOf(CO.xp-0);
  CO.offers=CO.offers.filter(o=>o.expires>CO.day);
  CO.day++; refreshOffers(); if(CO.day%2===0) refreshCandidates();
  const res={day:CO.day-1,pass,penalty,income:+income.toFixed(1),bonus:t.bonus,salaries:+salaries.toFixed(1),rent,upkeep,spent:t.spent,net,cash:CO.cash,rep:CO.rep,notes,summary};
  CO.last=res; CO.today=null;
  return res;
}
function startCompanyDay(){CO.today={bonus:0,spent:0,deploys:null}; CO.energy=100}
function coSave(){try{localStorage.setItem('uptime-company',JSON.stringify(CO))}catch(e){}}
function coLoad(){try{const s=JSON.parse(localStorage.getItem('uptime-company'));if(s&&s.v===1){CO=s;return true}}catch(e){}return false}
