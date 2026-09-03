function todayISO(){return new Date().toISOString().slice(0,10)}
function getSheet(date){if(!db.sheets)db.sheets=[];let s=db.sheets.find(x=>x.date===date);if(!s){s={id:"s-"+date,date,driver:db.operators[0],bowserId:"b-fd73",onboard:bowserStock(bowserById("b-fd73")),onboardAfter:"",lines:[]};db.sheets.push(s);save(db)}return s}
function sheetDelivered(s){return s.lines.reduce((n,l)=>n+Number(l.litres||0),0)}
function lineForAsset(s,id){return s.lines.find(l=>l.assetId===id)}
