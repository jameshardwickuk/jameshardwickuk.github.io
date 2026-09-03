const KEY="moorhead-fuel-v4";
function daysAgo(d,h=8,m=0){const x=new Date();x.setDate(x.getDate()-d);x.setHours(h,m,0,0);return x.toISOString()}
const SEED={operators:["James Hardwick","Yard fitter","Dave W"],sites:["Yard — Lower Wortley","Live job — Leeds","Live job — Wakefield","Live job — Bradford","Demolition site","Tip / recycling"],bowsers:[{id:"b-fd73",name:BOWSER_VEHICLE.name,reg:BOWSER_VEHICLE.reg,capacity:BOWSER_VEHICLE.capacity,stock:0,compartments:structuredClone(BOWSER_VEHICLE.compartments)}],assets:paperAssets(),sheets:[],fills:[],deliveries:[]};
function load(){try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r);paperAssets().forEach(p=>{if(!d.assets.some(a=>a.id===p.id||a.reg===p.reg))d.assets.push(p)});return d}}catch(e){}const d=structuredClone(SEED);d.fills=[{id:"f1",assetId:"w-MV73YPJ",litres:280,meter:184200,tankFull:true,bowserId:"b-fd73",compartmentId:"c1",site:"Yard — Lower Wortley",operator:"Yard fitter",note:"",at:daysAgo(2,7,10)},{id:"f2",assetId:"w-MV75EHR",litres:255,meter:22140,tankFull:true,bowserId:"b-fd73",compartmentId:"c3",site:"Yard — Lower Wortley",operator:"Yard fitter",note:"",at:daysAgo(0,12,45)},{id:"f3",assetId:"w-DG75ULV",litres:180,meter:67300,tankFull:true,bowserId:"b-fd73",compartmentId:"c4",site:"Tip / recycling",operator:"Yard fitter",note:"",at:daysAgo(0,13,52)}];d.deliveries=[{id:"d1",bowserId:"b-fd73",compartmentId:"c3",litres:4800,at:daysAgo(12),note:"Certas"}];d.bowsers.forEach(b=>reconcileBowser(b,d));save(d);return d;}
function save(d){localStorage.setItem(KEY,JSON.stringify(d))}
let db,view="home",sheetDate,logFilter="all",reportRange=14,form;
function boot(){try{db=load();if(!db.sheets)db.sheets=[];sheetDate=todayISO();form=blankForm();setView("home")}catch(err){const t=document.getElementById("toast");if(t){t.textContent="App error: "+err.message;t.classList.add("show")}alert("Bowser failed to start: "+err.message)}}
function blankForm(){return{assetId:"",site:db.sites[0],operator:db.operators[0],bowserId:db.bowsers[0].id,compartmentId:db.bowsers[0].compartments?.[0]?.id||"",meter:"",litres:"",tankFull:true,note:"",at:toLocalInput(new Date())}}
function toLocalInput(d){const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,16)}
function assetById(id){return db.assets.find(a=>a.id===id)}
function bowserById(id){return db.bowsers.find(b=>b.id===id)}
function bowserStock(b){if(!b)return 0;return b.compartments?b.compartments.reduce((s,c)=>s+Number(c.stock||0),0):Number(b.stock||0)}
function syncBowserTotal(b){if(b.compartments)b.stock=bowserStock(b)}
function compartmentOf(b,id){return b?.compartments?.find(c=>c.id===id)||null}
function adjustStock(b,litres,cid){if(!b)return;const c=compartmentOf(b,cid);if(c)c.stock=Math.round((Number(c.stock)+litres)*10)/10;else b.stock=Math.round((Number(b.stock)+litres)*10)/10;syncBowserTotal(b)}
function reconcileBowser(b,data){if(b.compartments?.length){b.compartments.forEach(c=>{const out=data.fills.filter(f=>f.bowserId===b.id&&f.compartmentId===c.id).reduce((s,f)=>s+Number(f.litres),0);const inn=data.deliveries.filter(d=>d.bowserId===b.id&&d.compartmentId===c.id).reduce((s,d)=>s+Number(d.litres),0);c.stock=Math.max(0,Math.round(c.capacity*0.62+inn-out));if(c.stock>c.capacity)c.stock=c.capacity});syncBowserTotal(b);return}b.stock=Math.max(0,Math.round(b.capacity*0.7))}
function daysUntil(iso){return Math.ceil((new Date(iso+"T12:00:00")-new Date())/86400000)}
function dueBadge(iso){const d=daysUntil(iso);if(d<0)return '<span class="badge hot">Overdue</span>';if(d<=90)return '<span class="badge warn">'+d+'d</span>';return '<span class="badge full">'+d+'d</span>'}
function fmt(n,d=0){if(n==null||Number.isNaN(Number(n)))return "\u2014";return Number(n).toLocaleString("en-GB",{maximumFractionDigits:d})}
function fmtWhen(iso){return new Date(iso).toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
function fmtDate(iso){return new Date(iso+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
function fillsFor(id){return db.fills.filter(f=>f.assetId===id).sort((a,b)=>new Date(a.at)-new Date(b.at))}
function lastFill(id){const l=fillsFor(id);return l[l.length-1]||null}
function inRange(iso,days){return Date.now()-new Date(iso).getTime()<=days*86400000}
function consumption(asset){const fills=fillsFor(asset.id);let litres=0,delta=0,pairs=0;for(let i=1;i<fills.length;i++){const a=fills[i-1],b=fills[i];if(!a.tankFull||!b.tankFull)continue;const dm=Number(b.meter)-Number(a.meter);if(dm<=0)continue;litres+=Number(b.litres);delta+=dm;pairs++}return(!pairs||!delta)?{rate:null}:{rate:litres/delta}}
function rateLabel(asset,rate){if(rate==null)return "No baseline";return asset.meter==="hours"?fmt(rate,1)+" L/hr":fmt(rate,1)+" L/mile"}
function hotFlag(asset,rate){if(rate==null||!asset.expected)return false;return asset.meter==="hours"?rate>asset.expected*1.25:rate>(4.54609/asset.expected)*1.25}
function toast(m){const el=document.getElementById("toast");if(!el)return;el.textContent=m;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&","<":"<",">":">",'"':""","'":"&#39;"}[c]))}
