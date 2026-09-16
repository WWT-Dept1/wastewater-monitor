const cfg=window.APP_CONFIG,$=id=>document.getElementById(id);
const headers={apikey:cfg.SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"};
let latestData=[],hourlyData=[];
const fmt=d=>new Date(d).toLocaleString("th-TH",{dateStyle:"short",timeStyle:"medium"});
setInterval(()=>{$("clock").textContent=new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})},1000);

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab,.panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")});

async function api(path,opts={}){const r=await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`,{...opts,headers:{...headers,...(opts.headers||{})}});if(!r.ok)throw new Error(`HTTP ${r.status}: ${await r.text()}`);return r.status===204?null:r.json()}
async function load(){
 try{
  const since=new Date(Date.now()-24*3600e3).toISOString();
  latestData=await api(`flow_readings?device_id=eq.${encodeURIComponent(cfg.DEVICE_ID)}&created_at=gte.${encodeURIComponent(since)}&select=created_at,flow_m3h,input_voltage&order=created_at.asc&limit=2000`);
  if(!latestData.length){setState("NO DATA",true);return}
  const latest=latestData.at(-1),v=+latest.flow_m3h,age=Date.now()-new Date(latest.created_at);
  $("flow").textContent=v.toFixed(1);$("updated").textContent="อัปเดต "+fmt(latest.created_at);
  const stale=age>180000, abnormal=v<cfg.NORMAL_MIN||v>cfg.NORMAL_MAX;
  setState(stale?"DATA STALE":abnormal?"ABNORMAL FLOW":"NORMAL FLOW",stale||abnormal);
  const vals=latestData.map(x=>+x.flow_m3h),avg=vals.reduce((a,b)=>a+b,0)/vals.length,peak=Math.max(...vals);
  $("avg").textContent=avg.toFixed(1);$("peak").textContent=peak.toFixed(1);$("recordCount").textContent=`${vals.length} records`;
  const hours=(Date.now()-new Date(latestData[0].created_at))/3600e3; $("today").textContent=(avg*Math.min(24,Math.max(hours,1/60))).toFixed(1);
  const cap=Math.max(0,Math.min(100,v/cfg.FLOW_MAX*100));$("capacity").textContent=cap.toFixed(1)+"%";$("ring").style.setProperty("--p",cap);
  detectAnomalies(latestData,stale);makeHourly(latestData);draw(latestData);await loadReview();
 }catch(e){setState("OFFLINE",true);$("updated").textContent=e.message;$("anomaly").textContent="เชื่อมต่อฐานข้อมูลไม่สำเร็จ"}
}
function setState(text,bad){$("flowPill").textContent="● "+text;$("flowPill").className=bad?"pill bad":"pill"}
function detectAnomalies(data,stale){
 const alerts=[],v=+data.at(-1).flow_m3h;
 if(stale)alerts.push(["bad","ข้อมูลหยุดส่ง","ไม่มีข้อมูลใหม่เกิน 3 นาที"]);
 if(v<cfg.NORMAL_MIN)alerts.push(["warn","Flow ต่ำกว่าช่วงเฝ้าระวัง",`${v.toFixed(1)} m³/h < ${cfg.NORMAL_MIN}`]);
 if(v>cfg.NORMAL_MAX)alerts.push(["bad","Flow สูงกว่าช่วงเฝ้าระวัง",`${v.toFixed(1)} m³/h > ${cfg.NORMAL_MAX}`]);
 if(data.length>1){const a=+data.at(-2).flow_m3h,d=Math.abs(v-a);if(d>=15)alerts.push(["warn","Flow เปลี่ยนฉับพลัน",`เปลี่ยน ${d.toFixed(1)} m³/h จากข้อมูลก่อนหน้า`])}
 $("healthTitle").textContent=alerts.length?"Attention required":"Healthy load";$("healthText").textContent=alerts.length?"พบเงื่อนไขที่ควรตรวจสอบ":"ระบบอยู่ในช่วง Flow ที่กำหนด";
 $("anomaly").className="alert "+(alerts[0]?.[0]||"");$("anomaly").textContent=alerts.length?alerts[0][1]+" — "+alerts[0][2]:"● ไม่พบความผิดปกติ";
 $("alertList").innerHTML=alerts.length?alerts.map(a=>`<div class="alert ${a[0]}"><b>${a[1]}</b><br><span class="muted">${a[2]}</span></div>`).join(""):'<div class="alert"><b class="good">● ปกติ</b><br><span class="muted">ไม่พบเงื่อนไขผิดปกติจากข้อมูลล่าสุด</span></div>';
}
function makeHourly(data){
 const m={};data.forEach(x=>{const d=new Date(x.created_at),k=new Date(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours()).toISOString();(m[k]??=[]).push(+x.flow_m3h)});
 hourlyData=Object.entries(m).map(([h,v])=>({h,avg:v.reduce((a,b)=>a+b,0)/v.length,min:Math.min(...v),max:Math.max(...v),n:v.length})).reverse();
 $("hourRows").innerHTML=hourlyData.map(x=>`<tr><td>${new Date(x.h).toLocaleString("th-TH",{dateStyle:"short",hour:"2-digit",minute:"2-digit"})}</td><td><b>${x.avg.toFixed(1)}</b> m³/h</td><td>${x.min.toFixed(1)}</td><td>${x.max.toFixed(1)}</td><td>${x.n}</td><td><span class="badge">${x.avg>=cfg.NORMAL_MIN&&x.avg<=cfg.NORMAL_MAX?"ปกติ":"ตรวจสอบ"}</span></td></tr>`).join("");
}
async function loadReview(){
 try{const d=await api(`flow_reviews?device_id=eq.${encodeURIComponent(cfg.DEVICE_ID)}&order=created_at.desc&limit=1&select=*`);if(!d.length)return;const r=d[0];$("operator").value=r.operator_name||"";$("assistant").value=r.assistant_name||"";$("head").value=r.head_name||"";$("note").value=r.note||"";$("reviewStatus").textContent=({verified:"ทวนสอบแล้ว",checked:"ผู้ช่วยตรวจสอบแล้ว",approved:"อนุมัติแล้ว"})[r.status]||r.status}catch(e){}
}
async function saveReview(status){
 const body={device_id:cfg.DEVICE_ID,status,operator_name:$("operator").value.trim()||null,assistant_name:$("assistant").value.trim()||null,head_name:$("head").value.trim()||null,note:$("note").value.trim()||null};
 if(status==="verified"&&!body.operator_name)return $("reviewMsg").textContent="กรุณาใส่ชื่อพนักงานทวนสอบ";
 if(status==="checked"&&!body.assistant_name)return $("reviewMsg").textContent="กรุณาใส่ชื่อผู้ช่วยตรวจสอบ";
 if(status==="approved"&&!body.head_name)return $("reviewMsg").textContent="กรุณาใส่ชื่อหัวหน้าแผนก";
 try{await api("flow_reviews",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(body)});$("reviewMsg").textContent="บันทึกสำเร็จ "+new Date().toLocaleString("th-TH");await loadReview()}catch(e){$("reviewMsg").textContent="บันทึกไม่ได้: "+e.message}
}
function exportCSV(){const rows=[["hour","avg_m3h","min_m3h","max_m3h","samples"],...hourlyData.map(x=>[new Date(x.h).toISOString(),x.avg.toFixed(2),x.min.toFixed(2),x.max.toFixed(2),x.n])];const blob=new Blob(["\ufeff"+rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="hourly-flow.csv";a.click()}
function draw(data){const c=$("chart"),x=c.getContext("2d"),w=c.width,h=c.height,p=34;x.clearRect(0,0,w,h);x.strokeStyle="#e2e7ea";x.beginPath();x.moveTo(p,10);x.lineTo(p,h-p);x.lineTo(w-10,h-p);x.stroke();if(data.length<2)return;x.strokeStyle="#16b985";x.lineWidth=4;x.beginPath();data.forEach((r,i)=>{const px=p+i*(w-p-10)/(data.length-1),py=h-p-(+r.flow_m3h/cfg.FLOW_MAX)*(h-p-20);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}
load();setInterval(load,10000);
