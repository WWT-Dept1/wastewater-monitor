const cfg=window.APP_CONFIG;
const $=id=>document.getElementById(id);
const headers={apikey:cfg.SUPABASE_ANON_KEY,Authorization:`Bearer ${cfg.SUPABASE_ANON_KEY}`};

async function load(){
  try{
    const since=new Date(Date.now()-24*3600*1000).toISOString();
    const url=`${cfg.SUPABASE_URL}/rest/v1/flow_readings?device_id=eq.${encodeURIComponent(cfg.DEVICE_ID)}&created_at=gte.${encodeURIComponent(since)}&select=created_at,flow_m3h&order=created_at.desc&limit=500`;
    const r=await fetch(url,{headers});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const data=await r.json();
    if(!data.length){$("status").textContent="NO DATA";$("status").className="bad";return;}
    const latest=data[0], age=Date.now()-new Date(latest.created_at).getTime();
    $("flow").textContent=Number(latest.flow_m3h).toFixed(1);
    $("updated").textContent="อัปเดต "+new Date(latest.created_at).toLocaleString("th-TH");
    $("status").textContent=age<180000?"ONLINE":"STALE";
    $("status").className=age<180000?"ok":"bad";
    const vals=data.map(x=>Number(x.flow_m3h));
    $("avg").textContent=(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
    $("max").textContent=Math.max(...vals).toFixed(1);
    $("count").textContent=data.length;
    $("rows").innerHTML=data.slice(0,12).map(x=>`<tr><td>${new Date(x.created_at).toLocaleString("th-TH")}</td><td>${Number(x.flow_m3h).toFixed(2)}</td></tr>`).join("");
    draw(data.slice().reverse());
  }catch(e){$("status").textContent="OFFLINE";$("status").className="bad";$("updated").textContent=e.message;}
}
function draw(data){
  const c=$("chart"),ctx=c.getContext("2d"),w=c.width,h=c.height,p=30;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle="#d8dee3";ctx.beginPath();ctx.moveTo(p,10);ctx.lineTo(p,h-p);ctx.lineTo(w-10,h-p);ctx.stroke();
  if(data.length<2)return;
  const vals=data.map(x=>Number(x.flow_m3h)),max=Math.max(72,...vals),min=0;
  ctx.strokeStyle="#287a8b";ctx.lineWidth=3;ctx.beginPath();
  data.forEach((x,i)=>{const px=p+i*(w-p-10)/(data.length-1),py=(h-p)-((Number(x.flow_m3h)-min)/(max-min))*(h-p-20);i?ctx.lineTo(px,py):ctx.moveTo(px,py)});
  ctx.stroke();
}
load(); setInterval(load,10000);
