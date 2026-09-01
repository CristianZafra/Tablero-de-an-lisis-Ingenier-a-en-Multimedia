// IBC
const IBC_ORDER=["1 SMMLV","Entre 1 y 1,5 SMMLV","Entre 1,5 y 2,5 SMMLV","Entre 2,5 y 4 SMMLV","Entre 4 y 6 SMMLV","Entre 6 y 9 SMMLV","Más de 9 SMMLV"];
function ibcRowsSelected(){
  const y=selected("ibcYear"); return y==="ALL"?IBC:IBC.filter(r=>String(r["Año de seguimiento"])===y);
}
function renderIBC(){
  const y=selected("ibcYear"), rows=ibcRowsSelected();
  const total=sum(rows,"Total");
  const high=sum(rows.filter(r=>["Entre 2,5 y 4 SMMLV","Entre 4 y 6 SMMLV","Entre 6 y 9 SMMLV","Más de 9 SMMLV"].includes(r["Rango SMMLV"])),"Total");
  const above4=sum(rows.filter(r=>["Entre 4 y 6 SMMLV","Entre 6 y 9 SMMLV","Más de 9 SMMLV"].includes(r["Rango SMMLV"])),"Total");
  const ranges=groupSum(rows,"Rango SMMLV","Total").sort((a,b)=>b.value-a.value);
  document.getElementById("iTotal").textContent=fmt(total);
  document.getElementById("iTotalSub").textContent=y==="ALL"?"Acumulado 2016–2023":"Año "+y;
  document.getElementById("iHigh").textContent=total?pct(high/total):"—";
  document.getElementById("iAbove4").textContent=total?pct(above4/total):"—";
  document.getElementById("iMode").textContent=ranges[0]?.name||"—";

  const selectedRows=y==="ALL" ? IBC.filter(r=>Number(r["Año de seguimiento"])===Math.max(...IBC.map(x=>Number(x["Año de seguimiento"])))) : rows;
  const labelYear=y==="ALL" ? Math.max(...IBC.map(x=>Number(x["Año de seguimiento"]))) : y;
  const yearTotal=sum(selectedRows,"Total");
  const g=IBC_ORDER.map(b=>({name:b,value:sum(selectedRows.filter(r=>r["Rango SMMLV"]===b),"Total")}));
  const gRev=[...g].reverse();
  const pctVals=gRev.map(d=>yearTotal?(d.value/yearTotal*100):0);
  Plotly.react("ibcStructChart",[{
    x:pctVals,y:gRev.map(d=>d.name),type:"bar",orientation:"h",
    text:pctVals.map(v=>v.toFixed(1).replace(".",",")+"%"),textposition:"outside",cliponaxis:false,
    marker:{color:[C.purple,"#F28E7A","#A8A8A8","#59BCEB","#F0B44D","#30A18B","#0B63C9"]},
    hovertemplate:"%{y}<br>%{x:.1f}% del total del año<extra></extra>"
  }],{...baseLayout,margin:{l:165,r:55,t:26,b:45},title:{text:"Año "+labelYear,font:{size:12}},xaxis:{...baseLayout.xaxis,title:"Participación porcentual",range:[0,100],ticksuffix:"%",tickformat:".0f"},yaxis:{...baseLayout.yaxis,title:""}},plotCfg);

  const linkYears=LABOR_LINK.map(d=>d.year), iesRates=LABOR_LINK.map(d=>d.umng);
  Plotly.react("laborLinkChart",[{
    x:linkYears.map(Number),y:iesRates.map(Number),type:"scatter",mode:"lines+markers+text",
    name:"1117-UNIVERSIDAD MILITAR-NUEVA GRANADA (Bogotá, D.C.)",
    line:{color:"#1E6687",width:4,dash:"solid"},marker:{size:8,color:"#1E6687"},
    text:iesRates.map(v=>Number(v).toFixed(2).replace(".",",")+"%"),textposition:"top center",textfont:{size:10,color:"#334155"},cliponaxis:false,
    hovertemplate:"UMNG<br>Año de vinculación: %{x}<br>Tasa de cotizantes: %{y:.2f}%<extra></extra>"
  }],{...baseLayout,margin:{l:82,r:28,t:42,b:72},xaxis:{...baseLayout.xaxis,title:{text:"Año de vinculación",standoff:14},type:"linear",tickmode:"array",tickvals:linkYears.map(Number),ticktext:linkYears.map(String),range:[2008,2023],dtick:1,fixedrange:true},yaxis:{...baseLayout.yaxis,type:"linear",title:{text:"Tasa de cotizantes",standoff:12},range:[0,100],autorange:false,tickmode:"array",tickvals:[0,10,20,30,40,50,60,70,80,90,100],ticktext:["0%","10%","20%","30%","40%","50%","60%","70%","80%","90%","100%"],fixedrange:true},showlegend:false},plotCfg);
}
function renderTable(id,rows,cols,formatter=(k,v)=>v){
  const table=document.getElementById(id);
  table.innerHTML="<thead><tr>"+cols.map(c=>`<th>${c[1]}</th>`).join("")+"</tr></thead><tbody>"+rows.map(r=>"<tr>"+cols.map(c=>`<td>${formatter(c[0],r[c[0]])??""}</td>`).join("")+"</tr>").join("")+"</tbody>";
}
function renderData(){
  const rows=filterSNIES();
  const q=(document.getElementById("tableSearch").value||"").toLowerCase().trim();
  const visible=q?rows.filter(r=>Object.values(r).some(v=>String(v??"").toLowerCase().includes(q))):rows;
  document.getElementById("dataCount").textContent=`${fmt(visible.length)} registros visibles con los filtros actuales.`;
  const cols=[["PERIODO","Periodo"],["Rol","Rol"],["INSTITUCION","Institución"],["CODIGO_SNIES","SNIES"],["SECTOR_IES","Sector"],["MODALIDAD","Modalidad"],["DEPARTAMENTO_OFERTA","Departamento"],["MUNICIPIO_OFERTA","Municipio"],["INSCRITOS","Inscritos"],["ADMITIDOS","Admitidos"],["MATRICULADOS","Matriculados"],["PRIMER_CURSO","Primer curso"],["GRADUADOS","Graduados"]];
  renderTable("sniesTable",visible,cols,(k,v)=>["INSCRITOS","ADMITIDOS","MATRICULADOS","PRIMER_CURSO","GRADUADOS"].includes(k)?fmt(v):v);
}
function exportCSV(){
  const rows=filterSNIES(); if(!rows.length)return;
  const cols=["PERIODO","Rol","INSTITUCION","CODIGO_SNIES","SECTOR_IES","MODALIDAD","DEPARTAMENTO_OFERTA","MUNICIPIO_OFERTA","INSCRITOS","ADMITIDOS","MATRICULADOS","PRIMER_CURSO","GRADUADOS"];
  const esc=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const csv="\uFEFF"+[cols.join(";"),...rows.map(r=>cols.map(c=>esc(r[c])).join(";"))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="SNIES_Ingenieria_Multimedia_filtrado.csv";a.click();URL.revokeObjectURL(url);
}
function updateAll(){renderChips();renderOverview();renderBenchmark();renderIBC();renderData();}
function bind(){
  ["fYear","fSemester","fScope","fSector","fModality","fDept","fInstitution"].forEach(id=>document.getElementById(id).addEventListener("change",updateAll));
  document.getElementById("trendMetric").addEventListener("change",renderTrend);
  document.getElementById("includeInactive").addEventListener("change",renderBenchmark);
  document.getElementById("ibcYear").addEventListener("change",renderIBC);
  document.getElementById("tableSearch").addEventListener("input",renderData);
  document.getElementById("exportCsv").addEventListener("click",exportCSV);
  document.getElementById("clearFilters").addEventListener("click",()=>{["fYear","fSemester","fSector","fModality","fDept","fInstitution"].forEach(id=>document.getElementById(id).value="ALL");document.getElementById("fScope").value="ALL";updateAll();});
  document.querySelectorAll(".nav button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById("page-"+btn.dataset.page).classList.add("active");setTimeout(()=>window.dispatchEvent(new Event("resize")),50);}));
}
async function initSiteData(){
  const sniesParts=await Promise.all([1,2,3,4,5,6,7,8,9,10].map(i=>fetch(`data/snies-${String(i).padStart(2,"0")}.json`).then(r=>r.json())));
  SNIES=sniesParts.flat();
  [PROGRAMS,IBC,LABOR_LINK]=await Promise.all([fetch("data/programs.json").then(r=>r.json()),fetch("data/ibc.json").then(r=>r.json()),fetch("data/labor.json").then(r=>r.json())]);
  populateFilters();bind();updateAll();
}
initSiteData().catch(err=>{console.error(err);document.body.insertAdjacentHTML("beforeend",`<div style="position:fixed;bottom:12px;right:12px;background:#fff3cd;border:1px solid #ffe69c;padding:10px;border-radius:8px;z-index:9999;font:12px Segoe UI">No fue posible cargar los datos del tablero.</div>`);});
