let SNIES=[];
let PROGRAMS=[];
let LABOR_LINK=[];
let IBC=[];
const META = {"codigo_ca":10993,"centro":"Ingeniería en Multimedia","programas_relacionados":17,"ies_snies":12,"registros_snies":140,"anios":"2020, 2021, 2022, 2023, 2024","graduados_acumulados":1074};

const C = {
  red:"#D71920", redDark:"#A50F16", navy:"#003B71", navyDark:"#00284C",
  blue:"#0B5E9A", green:"#0B6B3A", gold:"#F2B632", purple:"#6C4AB6",
  teal:"#0F8B8D", gray:"#8A98A8", soft:"#E8EEF5"
};
const PALETTE=[C.navy,C.red,C.green,C.gold,C.purple,C.teal,"#7B61A8","#5A7D9A","#B56576"];
const plotCfg={displayModeBar:false,responsive:true};
const baseLayout={
  margin:{l:48,r:18,t:24,b:50},paper_bgcolor:"rgba(0,0,0,0)",plot_bgcolor:"rgba(0,0,0,0)",
  font:{family:"Segoe UI, Arial",size:11,color:"#334155"},
  xaxis:{gridcolor:"#E7EDF3",zerolinecolor:"#E7EDF3"},
  yaxis:{gridcolor:"#E7EDF3",zerolinecolor:"#E7EDF3"},
  hoverlabel:{font:{family:"Segoe UI, Arial"}}
};
function fmt(n){ return new Intl.NumberFormat("es-CO",{maximumFractionDigits:0}).format(Number(n||0)); }
function pct(n,d=1){ return (Number(n||0)*100).toFixed(d).replace(".",",")+"%"; }
function money(n){ return n==null?"Sin dato":new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(n)); }
function uniq(arr){return [...new Set(arr.filter(v=>v!==null&&v!==undefined&&v!==""))].sort((a,b)=>String(a).localeCompare(String(b),"es")); }
function norm(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim(); }
function groupSum(rows,key,metric){
  const m=new Map();
  rows.forEach(r=>m.set(r[key],(m.get(r[key])||0)+Number(r[metric]||0)));
  return [...m.entries()].map(([name,value])=>({name,value}));
}
function median(vals){
  const a=vals.filter(v=>v!==null&&v!==undefined&&!isNaN(Number(v))).map(Number).sort((x,y)=>x-y);
  if(!a.length)return null; const m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function sum(rows,key){return rows.reduce((a,r)=>a+Number(r[key]||0),0);}
function shortName(s){
  return String(s||"").replace("UNIVERSIDAD ","U. ").replace("FUNDACIÓN UNIVERSITARIA ","F.U. ").replace("FUNDACION UNIVERSITARIA ","F.U. ").replace("INSTITUCIÓN UNIVERSITARIA ","I.U. ");
}
function selected(id){return document.getElementById(id).value;}
function setOptions(id, values, allLabel="Todos"){
  const el=document.getElementById(id), old=el.value;
  el.innerHTML=`<option value="ALL">${allLabel}</option>`+values.map(v=>`<option value="${String(v).replace(/"/g,"&quot;")}">${v}</option>`).join("");
  if([...el.options].some(o=>o.value===old))el.value=old;
}
function populateFilters(){
  setOptions("fYear",uniq(SNIES.map(r=>r.ANIO)),"Todos los años");
  setOptions("fSemester",uniq(SNIES.map(r=>r.SEMESTRE)),"Ambos semestres");
  setOptions("fSector",uniq([...SNIES.map(r=>r.SECTOR_IES),...PROGRAMS.map(r=>r.SECTOR)]),"Todos los sectores");
  setOptions("fModality",uniq([...SNIES.map(r=>r.MODALIDAD),...PROGRAMS.map(r=>r.MODALIDAD)]),"Todas las modalidades");
  setOptions("fDept",uniq([...SNIES.map(r=>r.DEPARTAMENTO_OFERTA),...PROGRAMS.map(r=>r.DEPARTAMENTO_OFERTA)]),"Todos los departamentos");
  setOptions("fInstitution",uniq([...SNIES.map(r=>r.INSTITUCION),...PROGRAMS.map(r=>r.NOMBRE_INSTITUCION)]),"Todas las instituciones");
  setOptions("ibcYear",uniq(IBC.map(r=>r["Año de seguimiento"])),"Todos los años");
}
function getFilters(){
  return {year:selected("fYear"),sem:selected("fSemester"),scope:selected("fScope"),sector:selected("fSector"),
    modality:selected("fModality"),dept:selected("fDept"),institution:selected("fInstitution")};
}
function filterSNIES(ignoreYear=false){
  const f=getFilters();
  return SNIES.filter(r=>{
    if(!ignoreYear && f.year!=="ALL" && String(r.ANIO)!==f.year)return false;
    if(f.sem!=="ALL" && String(r.SEMESTRE)!==f.sem)return false;
    if(f.scope==="UMNG" && Number(r.ES_UMNG)!==1)return false;
    if(f.scope==="PAIRS" && Number(r.ES_UMNG)!==0)return false;
    if(f.sector!=="ALL" && norm(r.SECTOR_IES)!==norm(f.sector))return false;
    if(f.modality!=="ALL" && norm(r.MODALIDAD)!==norm(f.modality))return false;
    if(f.dept!=="ALL" && norm(r.DEPARTAMENTO_OFERTA)!==norm(f.dept))return false;
    if(f.institution!=="ALL" && norm(r.INSTITUCION)!==norm(f.institution))return false;
    return true;
  });
}
function latestRows(rows){
  if(!rows.length)return [];
  const max=Math.max(...rows.map(r=>Number(r.ORDEN_PERIODO)));
  return rows.filter(r=>Number(r.ORDEN_PERIODO)===max);
}
function latestPeriod(rows){
  if(!rows.length)return null;
  return latestRows(rows)[0]?.PERIODO||null;
}
function previousSameSemesterRows(latest, ignoreYearRows){
  if(!latest.length)return [];
  const y=Number(latest[0].ANIO), s=Number(latest[0].SEMESTRE);
  return ignoreYearRows.filter(r=>Number(r.ANIO)===y-1 && Number(r.SEMESTRE)===s);
}
function deltaText(curr,prev){
  if(!prev)return "Sin base comparable";
  const d=(curr-prev)/prev;
  const cls=d>0?"up":d<0?"down":"flat";
  const arrow=d>0?"▲":d<0?"▼":"•";
  return `<span class="delta ${cls}">${arrow} ${Math.abs(d*100).toFixed(1).replace(".",",")}%</span> vs. mismo semestre anterior`;
}
function renderChips(){
  const f=getFilters(), pairs=[
    ["Año",f.year],["Semestre",f.sem],["Ámbito",f.scope],["Sector",f.sector],["Modalidad",f.modality],["Departamento",f.dept],["IES",f.institution]
  ].filter(x=>x[1]!=="ALL");
  document.getElementById("chips").innerHTML=pairs.length?pairs.map(x=>`<span class="chip">${x[0]}: ${x[1]}</span>`).join(""):`<span class="chip">Sin filtros: universo comparable completo</span>`;
}
function renderKpis(){
  const rows=filterSNIES(), latest=latestRows(rows), prev=previousSameSemesterRows(latest,filterSNIES(true));
  const period=latestPeriod(rows)||"Sin datos";
  document.getElementById("periodBadge").textContent="Periodo visible: "+period;
  const defs=[["MATRICULADOS","kMat","kMatSub"],["INSCRITOS","kIns","kInsSub"],["ADMITIDOS","kAdm","kAdmSub"],["PRIMER_CURSO","kFirst","kFirstSub"],["GRADUADOS","kGrad","kGradSub"]];
  defs.forEach(([key,valId,subId])=>{
    const a=sum(latest,key), b=sum(prev,key);
    document.getElementById(valId).textContent=fmt(a);
    document.getElementById(subId).innerHTML=latest.length?`${period} · ${deltaText(a,b)}`:"No hay registros con estos filtros";
  });
  const ins=sum(latest,"INSCRITOS"), adm=sum(latest,"ADMITIDOS"), rate=ins?adm/ins:null;
  document.getElementById("kRate").textContent=rate===null?"—":pct(rate);
  document.getElementById("kRateSub").textContent="Indicador descriptivo del periodo; puede verse afectado por diferencias de cohorte/reporte.";
}
function renderInsights(){
  const rows=filterSNIES(), latest=latestRows(rows), period=latestPeriod(rows);
  if(!latest.length){document.getElementById("insights").innerHTML='<div class="insight"><strong>Sin datos</strong><span>La combinación de filtros no contiene registros.</span></div>';return;}
  const inst=groupSum(latest,"INSTITUCION","MATRICULADOS").sort((a,b)=>b.value-a.value);
  const totalMat=sum(latest,"MATRICULADOS");
  const umng=sum(latest.filter(r=>Number(r.ES_UMNG)===1),"MATRICULADOS");
  const gradsTotal=sum(filterSNIES(),"GRADUADOS");
  const first=sum(latest,"PRIMER_CURSO"), adm=sum(latest,"ADMITIDOS");
  const messages=[
    ["Liderazgo de matrícula",`${shortName(inst[0]?.name)} concentra ${pct((inst[0]?.value||0)/(totalMat||1))} de los matriculados visibles en ${period}.`],
    ["Participación UMNG",`La UMNG representa ${pct(umng/(totalMat||1))} de los matriculados del periodo visible bajo los filtros actuales.`],
    ["Ingreso a primer curso",`${fmt(first)} estudiantes aparecen en primer curso frente a ${fmt(adm)} admitidos en ${period}.`],
    ["Graduados acumulados visibles",`${fmt(gradsTotal)} graduados se registran en los periodos SNIES incluidos por los filtros actuales.`]
  ];
  document.getElementById("insights").innerHTML=messages.map(m=>`<div class="insight"><strong>${m[0]}</strong><span>${m[1]}</span></div>`).join("");
}
