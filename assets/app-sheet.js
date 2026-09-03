function renderSheet(){
  const s=getSheet(sheetDate);
  const delivered=sheetDelivered(s);
  const setv=(id,v)=>{const n=document.getElementById(id);if(n)n.value=v};
  const sett=(id,v)=>{const n=document.getElementById(id);if(n)n.textContent=v};
  setv("sheet-date",sheetDate);setv("sheet-driver",s.driver);setv("sheet-onboard",s.onboard);setv("sheet-after",s.onboardAfter);
  sett("sheet-delivered",fmt(delivered));sett("sheet-total",fmt(Number(s.onboard||0)));
  const hint=document.getElementById("sheet-after-hint");if(hint)hint.textContent="Book ~ "+fmt(Number(s.onboard||0)-delivered)+" L";
  const wagons=db.assets.filter(a=>a.onSheet==="wagon");
  const others=db.assets.filter(a=>a.onSheet==="other"||a.onSheet==="bowser");
  const pickW=document.getElementById("sheet-pick-wagon");
  if(pickW)pickW.innerHTML=`<option value="">Select wagon\u2026</option>`+[...wagons,...others].map(a=>`<option value="${a.id}">${esc(a.reg)}</option>`).join("");
  const pickM=document.getElementById("sheet-pick-machine");
  if(pickM)pickM.innerHTML=`<option value="">Select machine\u2026</option>`+machineAssets().map(a=>`<option value="${a.id}">${esc(a.fleetNo)}</option>`).join("")+`<option value="__new">+ Add new machine</option>`;
  const sw=document.getElementById("sheet-wagons");if(sw)sw.innerHTML=wagons.map(a=>sheetWagonRow(s,a)).join("");
  const so=document.getElementById("sheet-other");if(so)so.innerHTML=others.map(a=>sheetWagonRow(s,a)).join("");
  const machines=s.lines.filter(l=>l.kind==="machine"||l.kind==="misc");
  const sm=document.getElementById("sheet-machines");
  if(sm)sm.innerHTML=machines.map(l=>`<button class="item" onclick="editSheetLine('${l.id}')"><div class="meta"><strong>${esc(l.machine)}</strong><small>${esc(l.location||"")}</small></div><strong>${fmt(l.litres)} L</strong></button>`).join("")||empty("Pick a machine from the dropdown.");
}
function sheetWagonRow(s,a){const line=lineForAsset(s,a.id);return `<button class="sheet-row ${line?"has":""}" onclick="editWagonLine('${a.id}')"><div class="reg">${esc(a.reg)}</div><div class="c">${line?.meter||"\u2014"}</div><div class="c">${line?fmt(line.litres):"\u2014"}</div><div class="loc">${esc(line?.location||"")}</div></button>`}
function setSheetMeta(field,value){const s=getSheet(sheetDate);s[field]=(field==="onboard"||field==="onboardAfter")?(value===""?"":Number(value)):value;save(db);renderSheet()}
function changeSheetDate(v){sheetDate=v||todayISO();renderSheet()}
function pickSheetMachine(id){if(!id)return;if(id==="__new")return addMachineLine();addMachineLine(id)}
function editWagonLine(assetId){
  const a=assetById(assetId);if(!a)return;
  const s=getSheet(sheetDate);const line=lineForAsset(s,a.id)||{};const bow=bowserById(s.bowserId);
  showModal(a.reg,`<div class="grid-2"><div class="field"><label>Km</label><input id="sl-km" type="number" value="${esc(line.meter??"")}"></div><div class="field"><label>Litres</label><input id="sl-l" type="number" value="${esc(line.litres??"")}"></div></div><div class="field"><label>Location</label><input id="sl-loc" value="${esc(line.location||"")}"></div><div class="field"><label>Compartment</label><select id="sl-c">${(bow?.compartments||[]).map(c=>`<option value="${c.id}" ${c.id===line.compartmentId?"selected":""}>${c.name} \u00b7 ${fmt(c.stock)} L</option>`).join("")}</select></div><button class="btn primary" style="width:100%;margin-top:12px" onclick="saveWagonLine('${a.id}')">Save</button>${line.id?`<button class="btn danger" style="width:100%;margin-top:8px" onclick="deleteSheetLine('${line.id}')">Clear</button>`:""}`);
}
function saveWagonLine(assetId){
  const litres=Number(document.getElementById("sl-l").value);if(!(litres>0))return toast("Enter litres.");
  const a=assetById(assetId);const s=getSheet(sheetDate);
  upsertSheetLine(s,lineForAsset(s,assetId),{kind:a.onSheet==="wagon"?"wagon":"other",assetId,machine:a.reg,meter:document.getElementById("sl-km").value,litres,location:document.getElementById("sl-loc").value.trim(),compartmentId:document.getElementById("sl-c")?.value||"",tankFull:true,at:sheetDate+"T12:00:00"});
  closeModal();toast(a.reg+" \u00b7 "+litres+" L");renderSheet();
}
function addMachineLine(preId){
  const s=getSheet(sheetDate);const pre=preId?assetById(preId):null;
  showModal("Machine fill",`<div class="field"><label>Machine</label><select id="sl-name"><option value="">Select\u2026</option>${machineAssets().map(p=>`<option value="${esc(p.fleetNo)}" ${pre&&pre.id===p.id?"selected":""}>${esc(p.fleetNo)}</option>`).join("")}<option value="__custom">Other\u2026</option></select></div><div class="field" id="sl-custom-wrap" style="display:none"><label>Name</label><input id="sl-custom"></div><div class="grid-2"><div class="field"><label>Hours</label><input id="sl-km" type="number"></div><div class="field"><label>Litres</label><input id="sl-l" type="number"></div></div><div class="field"><label>Location</label><input id="sl-loc"></div><div class="field"><label>Compartment</label><select id="sl-c">${(bowserById(s.bowserId)?.compartments||[]).map(c=>`<option value="${c.id}">${c.name} \u00b7 ${fmt(c.stock)} L</option>`).join("")}</select></div><button class="btn primary" style="width:100%;margin-top:12px" onclick="saveMachineLine()">Save</button>`);
  document.getElementById("sl-name").onchange=function(){document.getElementById("sl-custom-wrap").style.display=this.value==="__custom"?"block":"none"};
}
function saveMachineLine(){
  let name=document.getElementById("sl-name").value.trim();
  if(name==="__custom"||!name)name=(document.getElementById("sl-custom")?.value||"").trim();
  const litres=Number(document.getElementById("sl-l").value);
  if(!name)return toast("Pick a machine.");
  if(!(litres>0))return toast("Enter litres.");
  const s=getSheet(sheetDate);
  let asset=db.assets.find(a=>a.fleetNo.toLowerCase()===name.toLowerCase());
  if(!asset){asset={id:"p"+Date.now(),fleetNo:name,reg:name,type:"plant",category:"Plant",tank:0,meter:"hours",expected:16,unitExpect:"L/hr",onSheet:"machine"};db.assets.push(asset)}
  upsertSheetLine(s,null,{kind:"machine",assetId:asset.id,machine:name,meter:document.getElementById("sl-km").value,litres,location:document.getElementById("sl-loc").value.trim(),compartmentId:document.getElementById("sl-c")?.value||"",tankFull:true,at:sheetDate+"T12:00:00"});
  closeModal();toast(name+" \u00b7 "+litres+" L");renderSheet();
}
function editSheetLine(id){
  const line=getSheet(sheetDate).lines.find(l=>l.id===id);if(!line)return;
  if(line.kind==="wagon"||line.kind==="other")return editWagonLine(line.assetId);
  showModal(line.machine,`<div class="field"><label>Litres</label><input id="sl-l" type="number" value="${line.litres}"></div><button class="btn danger" onclick="deleteSheetLine('${id}')">Delete</button>`);
}
function upsertSheetLine(s,existing,p){
  const bow=bowserById(s.bowserId);
  if(existing){
    const delta=Number(p.litres)-Number(existing.litres||0);
    Object.assign(existing,p);
    const fill=db.fills.find(f=>f.id===existing.fillId);
    if(fill){fill.litres=p.litres;fill.meter=Number(p.meter)||0;fill.site=p.location;fill.tankFull=!!p.tankFull}
    adjustStock(bow,-delta,p.compartmentId);
  }else{
    const fill={id:"f"+Date.now(),assetId:p.assetId,litres:p.litres,meter:Number(p.meter)||0,tankFull:!!p.tankFull,bowserId:s.bowserId,compartmentId:p.compartmentId,site:p.location||"Operating site",operator:s.driver,note:"ADR sheet "+s.date,at:new Date(p.at).toISOString()};
    db.fills.push(fill);adjustStock(bow,-p.litres,p.compartmentId);
    s.lines.push({id:"l"+Date.now(),fillId:fill.id,...p});
  }
  save(db);
}
function deleteSheetLine(id){
  const s=getSheet(sheetDate);const line=s.lines.find(l=>l.id===id);if(!line||!confirm("Clear this line?"))return;
  const fill=db.fills.find(f=>f.id===line.fillId);
  if(fill){adjustStock(bowserById(s.bowserId),Number(line.litres),line.compartmentId);db.fills=db.fills.filter(f=>f.id!==fill.id)}
  s.lines=s.lines.filter(l=>l.id!==id);save(db);closeModal();renderSheet();
}
function openFillDetail(id){
  const f=db.fills.find(x=>x.id===id);if(!f)return;
  const a=assetById(f.assetId);
  showModal("Fill",`<p><strong>${esc(a?.fleetNo)}</strong> \u00b7 ${fmt(f.litres)} L</p><p class="muted">${esc(f.site)} \u00b7 ${fmtWhen(f.at)}</p><button class="btn danger" onclick="deleteFill('${f.id}')">Delete</button>`);
}
function deleteFill(id){
  const f=db.fills.find(x=>x.id===id);if(!f||!confirm("Delete?"))return;
  adjustStock(bowserById(f.bowserId),Number(f.litres),f.compartmentId);
  db.fills=db.fills.filter(x=>x.id!==id);save(db);closeModal();render();
}
function addDelivery(){
  const b=db.bowsers[0];
  showModal("Diesel in",`<div class="field"><label>Compartment</label><select id="nd-c">${(b.compartments||[]).map(c=>`<option value="${c.id}">${c.name} \u00b7 ${fmt(c.stock)} L</option>`).join("")}</select></div><div class="field"><label>Litres</label><input id="nd-l" type="number"></div><div class="field"><label>Note</label><input id="nd-n"></div><button class="btn primary" style="width:100%" onclick="commitDelivery()">Book in</button>`);
}
function commitDelivery(){
  const litres=Number(document.getElementById("nd-l").value);if(!(litres>0))return toast("Enter litres.");
  const cid=document.getElementById("nd-c")?.value||"";
  db.deliveries.push({id:"d"+Date.now(),bowserId:"b-fd73",compartmentId:cid,litres,at:new Date().toISOString(),note:document.getElementById("nd-n").value});
  adjustStock(bowserById("b-fd73"),litres,cid);save(db);closeModal();toast("Booked in");render();
}
function addAsset(){
  showModal("Add machine",`<div class="field"><label>Name</label><input id="na-fleet"></div><div class="field"><label>Type</label><select id="na-type"><option value="plant">Plant</option><option value="tipper">Wagon</option></select></div><button class="btn primary" style="width:100%" onclick="commitAsset()">Save</button>`);
}
function commitAsset(){
  const n=document.getElementById("na-fleet").value.trim();if(!n)return toast("Name required");
  const type=document.getElementById("na-type").value;
  db.assets.push({id:"a"+Date.now(),fleetNo:n,reg:n,type,category:n,tank:0,meter:type==="plant"?"hours":"miles",expected:type==="plant"?16:5.5,unitExpect:type==="plant"?"L/hr":"mpg",onSheet:type==="plant"?"machine":"wagon"});
  save(db);closeModal();toast("Added "+n);render();
}
function printSheet(){document.body.classList.add("printing-sheet");window.print();setTimeout(()=>document.body.classList.remove("printing-sheet"),400)}
function exportCsv(){const rows=[["When","Fleet","Litres","Site"],...db.fills.map(f=>[f.at,assetById(f.assetId)?.fleetNo,f.litres,f.site])];download("moorhead-fuel-log.csv",rows.map(r=>r.join(",")).join("\n"))}
function exportUsageCsv(){exportCsv()}
function exportBackup(){download("moorhead-fuel-backup.json",JSON.stringify(db,null,2))}
function importBackup(){toast("Use the folder copy to restore JSON")}
function download(name,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text]));a.download=name;a.click();toast("Exported "+name)}
function resetDemo(){if(!confirm("Reset demo data?"))return;localStorage.removeItem(KEY);db=load();form=blankForm();setView("home")}
function showModal(title,html){document.getElementById("modal-title").textContent=title;document.getElementById("modal-body").innerHTML=html;document.getElementById("modal").classList.add("open")}
function closeModal(){document.getElementById("modal").classList.remove("open")}
window.addEventListener("DOMContentLoaded",boot);
