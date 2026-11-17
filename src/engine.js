
const TICK = 0.05, TIMEOUT = 1.5;
const DEF = {
  users:   {name:'Người dùng',    icon:'👥', cost:0,  cap:0,    lat:0,     desc:'Nguồn traffic. Request sinh ngẫu nhiên theo phân phối Poisson.'},
  lb:      {name:'Load Balancer', icon:'🔀', cost:30, cap:6000, lat:0.002, desc:'Chia đều request cho các Server phía sau (round-robin), tự bỏ qua server chết.'},
  server:  {name:'App Server',    icon:'🖥️', cost:60, cap:300,  lat:0.020, desc:'Xử lý logic. Chịu ~300 req/s. Đọc → Cache/DB, ghi → Queue/DB.'},
  cache:   {name:'Cache',         icon:'⚡', cost:50, cap:5000, lat:0.002, size:150, desc:'Giữ 150 key nóng nhất trong RAM (LRU). Hit thì trả ngay, miss mới xuống DB.'},
  db:      {name:'Database',      icon:'🗄️', cost:80, cap:800,  lat:0.012, desc:'Chịu ~800 đơn vị tải/s. Một lệnh GHI tốn gấp 3 lần một lệnh ĐỌC.'},
  replica: {name:'Read Replica',  icon:'📚', cost:70, cap:800,  lat:0.012, desc:'Bản sao chỉ-đọc của DB. Chia tải đọc, không nhận ghi.'},
  queue:   {name:'Queue',         icon:'📬', cost:40, cap:6000, lat:0.002, backlogMax:40000, desc:'Nhận lệnh ghi và trả lời "đang xử lý" ngay. Đẩy dần xuống DB khi DB rảnh.'},
};
const ALLOWED = {
  users:['lb','server'], lb:['server'], server:['cache','db','replica','queue'],
  cache:['db','replica'], queue:['db'], db:[], replica:[]
};

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const NKEYS = 1000;
const ZCDF = (()=>{let s=0;const a=[];for(let i=1;i<=NKEYS;i++){s+=1/i;a.push(s)}return a.map(v=>v/s)})();
function zipf(r){const x=r();let lo=0,hi=NKEYS-1;while(lo<hi){const m=(lo+hi)>>1;if(ZCDF[m]<x)lo=m+1;else hi=m}return lo}
function poisson(l,r){
  if(l<=0) return 0;
  if(l<30){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=r()}while(p>L);return k-1}
  const u=r()||1e-9, v=r();
  return Math.max(0,Math.round(l+Math.sqrt(l)*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)));
}
const HB = 10, HN = 301; // histogram: bucket 10ms, tới 3s
function pct(h,p){let tot=0;for(const v of h)tot+=v;if(!tot)return 0;const th=tot*p;let acc=0;for(let i=0;i<h.length;i++){acc+=h[i];if(acc>=th)return i*HB+HB/2}return HN*HB}

class Sim{
  constructor(level){
    this.level=level; this.t=0; this.r=mulberry32(level.seed||7);
    this.nodes=[]; this.edges=[]; this.nid=1;
    this.okW=0; this.failW=0; this.lost=0; this.hist=new Float64Array(HN);
    this.win=[]; this.cur=this.bucket(0); this.reasons={};
    this.inRate=0; this.events=[]; this.msgs=[]; this.fired=new Set();
  }
  bucket(s){return {s,ok:0,fail:0,inW:0,h:new Float64Array(HN)}}
  addNode(type,x,y,locked){
    const n={id:this.nid++,type,x,y,locked:!!locked,queue:[],qW:0,budget:0,down:false,downUntil:0,bootUntil:0,
      util:0,rr:-1,flash:0,cache:type==='cache'?new Map():null,backlog:0,hits:0,miss:0,hitRate:0,failW:0};
    this.nodes.push(n); return n;
  }
  removeNode(n){
    for(const u of n.queue) this.fail(u,'Node bị gỡ bỏ',null);
    this.nodes=this.nodes.filter(x=>x!==n); this.edges=this.edges.filter(e=>e.a!==n&&e.b!==n);
  }
  canConnect(a,b){
    if(a===b) return 'Không thể nối một node vào chính nó';
    if(!ALLOWED[a.type].includes(b.type)){
      const ok=ALLOWED[a.type].map(t=>DEF[t].name);
      return ok.length? `${DEF[a.type].name} chỉ nối tới: ${ok.join(', ')}` : `${DEF[a.type].name} là điểm cuối, không nối đi đâu nữa`;
    }
    if(this.edges.some(e=>e.a===a&&e.b===b)) return 'Hai node này đã nối rồi';
    if(a.type==='users' && this.edges.some(e=>e.a===a)) return 'Người dùng chỉ vào qua MỘT cửa. Muốn chia cho nhiều Server thì dùng Load Balancer (xóa dây cũ trước).';
    return null;
  }
  connect(a,b){const e=this.canConnect(a,b); if(e) return e; this.edges.push({a,b}); return null}
  alive(n){return !n.down && this.t>=n.bootUntil}
  outs(n,types){const r=[];for(const e of this.edges) if(e.a===n&&(!types||types.includes(e.b.type))&&this.alive(e.b)) r.push(e.b);return r}
  pick(n,list){if(!list.length) return null; n.rr=(n.rr+1)%list.length; return list[n.rr]}
  cost(n,u){return n.type==='db'&&u.write ? u.w*3 : u.w}
  spent(){return this.nodes.reduce((s,n)=>s+DEF[n.type].cost,0)}
  fail(u,why,n){
    if(u.bg){this.lost+=u.w;return}
    this.failW+=u.w; this.cur.fail+=u.w; this.reasons[why]=(this.reasons[why]||0)+u.w;
    if(n){n.failW+=u.w; n.flash=1; this.events.push({k:'fail',n})}
  }
  done(u){
    if(u.bg) return;
    this.okW+=u.w; this.cur.ok+=u.w;
    const b=Math.min(HN-1,Math.floor(u.lat*1000/HB)); this.hist[b]+=u.w; this.cur.h[b]+=u.w;
  }
  send(from,to,u){
    if(!to){this.fail(u, from.type==='users'?'Người dùng chưa được nối tới đâu':'Không có đường đi tiếp', from); return}
    if(!this.alive(to)){this.fail(u,`${DEF[to.type].name} đang sập`,to); return}
    const c=this.cost(to,u), maxQ=DEF[to.type].cap*0.8;
    if(to.qW+c>maxQ){this.fail(u,`${DEF[to.type].name} quá tải, hàng chờ đầy`,to); return}
    u.enq=this.t; to.queue.push(u); to.qW+=c;
    if(!u.bg || this.r()<0.25) this.events.push({k:'flow',a:from,b:to,write:u.write,bg:u.bg});
  }
  handle(n,u){
    switch(n.type){
      case 'lb': return this.send(n,this.pick(n,this.outs(n,['server'])),u);
      case 'server':{
        if(u.write){
          const q=this.outs(n,['queue']); if(q.length) return this.send(n,this.pick(n,q),u);
          const d=this.outs(n,['db']); if(d.length) return this.send(n,this.pick(n,d),u);
          return this.fail(u,'Server không có đường GHI xuống Database',n);
        }
        const c=this.outs(n,['cache']); if(c.length) return this.send(n,this.pick(n,c),u);
        const r=this.outs(n,['db','replica']); if(r.length) return this.send(n,this.pick(n,r),u);
        return this.fail(u, this.edges.some(e=>e.a===n&&e.b.type==='cache')?'Cache sập mà Server không có đường dự phòng xuống Database':'Server chưa nối tới Database',n);
      }
      case 'cache':{
        if(!u.write && n.cache.has(u.key)){n.cache.delete(u.key);n.cache.set(u.key,1);n.hits+=u.w;return this.done(u)}
        n.miss+=u.w;
        if(!u.write){n.cache.set(u.key,1); if(n.cache.size>DEF.cache.size) n.cache.delete(n.cache.keys().next().value)}
        const r=u.write?this.outs(n,['db']):this.outs(n,['db','replica']);
        if(r.length) return this.send(n,this.pick(n,r),u);
        return this.fail(u,'Cache miss nhưng Cache chưa nối tới Database',n);
      }
      case 'db': return this.done(u);
      case 'replica': return u.write ? this.fail(u,'Replica chỉ đọc, không ghi được',n) : this.done(u);
      case 'queue':
        if(n.backlog+u.w>DEF.queue.backlogMax) return this.fail(u,'Queue đầy',n);
        n.backlog+=u.w; return this.done(u);
    }
  }
  step(dt){
    const L=this.level; this.t+=dt; const t=this.t;
    const sec=Math.floor(t);
    if(sec!==this.cur.s){this.win.push(this.cur); if(this.win.length>90) this.win.shift(); this.cur=this.bucket(sec)}
    if(L.events) for(const ev of L.events) if(t>=ev.t && !this.fired.has(ev)){this.fired.add(ev); ev.run(this)}
    for(const n of this.nodes) if(n.down && n.downUntil && t>=n.downUntil){n.down=false;n.downUntil=0;n.bootUntil=t+3;this.msgs.push({text:`${DEF[n.type].name} U${n.id} đã tự khởi động lại.`,kind:'info'})}

    // 1) sinh traffic
    const rate=L.rate(t,this), wr=L.write(t,this); this.inRate=rate;
    const w=Math.max(1,Math.ceil(rate/150));
    for(const src of this.nodes) if(src.type==='users'){
      const k=poisson(rate*dt/w,this.r); this.cur.inW+=k*w;
      for(let i=0;i<k;i++){
        const u={w,write:this.r()<wr,key:zipf(this.r),born:t,lat:0,enq:t,bg:false};
        this.send(src,this.pick(src,this.outs(src)),u);
      }
    }
    // 2) queue xả dần xuống DB (có backpressure)
    for(const n of this.nodes) if(n.type==='queue' && this.alive(n) && n.backlog>0){
      for(const db of this.outs(n,['db'])){
        let g=0;
        while(n.backlog>0 && db.qW<DEF.db.cap*0.06 && g++<40){
          const ww=Math.min(n.backlog,4); n.backlog-=ww;
          this.send(n,db,{w:ww,write:true,bg:true,born:t,lat:0,enq:t,key:0});
        }
      }
    }
    // 3) mỗi node xử lý hàng chờ của mình
    for(const n of this.nodes){
      if(n.type==='users') continue;
      const d=DEF[n.type]; n.flash=Math.max(0,n.flash-dt*2.5);
      if(!this.alive(n)){
        for(const u of n.queue) this.fail(u,`${d.name} đang sập`,n);
        n.queue=[]; n.qW=0; n.util=0; n.budget=0; continue;
      }
      n.budget=Math.min(n.budget+d.cap*dt,d.cap*dt);
      let used=0;
      while(n.queue.length && n.budget>0){
        const u=n.queue.shift(), c=this.cost(n,u);
        n.qW-=c; n.budget-=c; used+=c;
        if(!u.bg && t-u.born>TIMEOUT){this.fail(u,'Timeout: người dùng chờ quá 1.5s',n); continue}
        u.lat+=(t-u.enq)+d.lat; this.handle(n,u);
      }
      if(!n.queue.length) n.qW=0;
      n.util=n.util*0.85+0.15*Math.min(1.5,used/(d.cap*dt) + (n.queue.length?0.15:0));
      if(n.type==='cache'){const tot=n.hits+n.miss; if(tot>50){n.hitRate=n.hitRate*0.7+0.3*(n.hits/tot); n.hits=n.miss=0}}
    }
  }
  windowStats(secs=3){
    const bs=this.win.slice(-secs).concat([this.cur]);
    let ok=0,fail=0,inW=0;const h=new Float64Array(HN);
    for(const b of bs){ok+=b.ok;fail+=b.fail;inW+=b.inW;for(let i=0;i<HN;i++)h[i]+=b.h[i]}
    return {err: ok+fail? fail/(ok+fail):0, p99:pct(h,0.99)};
  }
  summary(){
    const tot=this.okW+this.failW;
    let top=null,tv=0; for(const k in this.reasons) if(this.reasons[k]>tv){tv=this.reasons[k];top=k}
    return {err: tot? this.failW/tot:0, p99:pct(this.hist,0.99), p50:pct(this.hist,0.5), cost:this.spent(), served:this.okW, failed:this.failW, lost:this.lost, topReason:top, topShare: tot? tv/tot:0};
  }
}
