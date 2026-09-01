// Benchmark
function filterPrograms(){
  const f=getFilters(), inc=document.getElementById("includeInactive").checked;
  return PROGRAMS.filter(r=>{
    if(!inc && String(r.ESTADO_PROGRAMA).toUpperCase()!=="ACTIVO")return false;
    if(f.scope==="UMNG" && Number(r.ES_UMNG)!==1)return false;
    if(f.scope==="PAIRS" && Number(r.ES_UMNG)!==0)return false;
    if(f.sector!=="ALL" && norm(r.SECTOR)!==norm(f.sector))return false;
    if(f.modality!=="ALL" && norm(r.MODALIDAD)!==norm(f.modality))return false;
    if(f.dept!=="ALL" && norm(r.DEPARTAMENTO_OFERTA)!==norm(f.dept))return false;
    if(f.institution!=="ALL" && norm(r.NOMBRE_INSTITUCION)!==norm(f.institution))return false;
    return true;
  });
}
function renderBenchmark(){
  const rows=filterPrograms();
  const costs=rows.map(r=>r.COSTO_MATRICULA_ESTUDIANTES_NUEVOS).filter(v=>v!=null);
  const credits=rows.map(r=>r.NUMERO_CREDITOS).filter(v=>v!=null);
  document.getElementById("bPrograms").textContent=fmt(rows.length);
  document.getElementById("bIes").textContent=fmt(uniq(rows.map(r=>r.NOMBRE_INSTITUCION)).length);
  document.getElementById("bTuition").textContent=money(median(costs));
  document.getElementById("bCredits").textContent=median(credits)==null?"—":fmt(median(credits));

  const withCost=rows.filter(r=>r.COSTO_MATRICULA_ESTUDIANTES_NUEVOS!=null).sort((a,b)=>Number(a.COSTO_MATRICULA_ESTUDIANTES_NUEVOS)-Number(b.COSTO_MATRICULA_ESTUDIANTES_NUEVOS));
  Plotly.react("tuitionChart",[{
    x:withCost.map(r=>Number(r.COSTO_MATRICULA_ESTUDIANTES_NUEVOS)),y:withCost.map(r=>`${shortName(r.NOMBRE_INSTITUCION)} · ${r.CODIGO_SNIES}`),
    type:"bar",orientation:"h",marker:{color:withCost.map(r=>Number(r.ES_UMNG)===1?C.red:C.navy)},
    customdata:withCost.map(r=>[r.NOMBRE_INSTITUCION,r.CODIGO_SNIES,r.MODALIDAD]),
    hovertemplate:"%{customdata[0]}<br>SNIES %{customdata[1]} · %{customdata[2]}<br>%{x:$,.0f}<extra></extra>"
  }],{...baseLayout,margin:{l:205,r:18,t:15,b:48},xaxis:{...baseLayout.xaxis,title:"Matrícula nuevos (COP)",tickformat:"~s"},yaxis:{automargin:true}},plotCfg);
  {
    const el=document.getElementById("tuitionChart");el.removeAllListeners?.("plotly_click");
    el.on("plotly_click",ev=>{
      const n=ev.points?.[0]?.customdata?.[0];if(!n)return;
      const sel=document.getElementById("fInstitution"),opt=[...sel.options].find(o=>norm(o.value)===norm(n));
      if(opt){sel.value=opt.value;updateAll();}
    });
  }

  const scat=rows.filter(r=>r.COSTO_MATRICULA_ESTUDIANTES_NUEVOS!=null&&r.NUMERO_CREDITOS!=null);
  Plotly.react("scatterChart",[{
    x:scat.map(r=>Number(r.NUMERO_CREDITOS)),y:scat.map(r=>Number(r.COSTO_MATRICULA_ESTUDIANTES_NUEVOS)),type:"scatter",mode:"markers",
    text:scat.map(r=>shortName(r.NOMBRE_INSTITUCION)),customdata:scat.map(r=>[r.NOMBRE_INSTITUCION,r.CODIGO_SNIES,r.MODALIDAD]),
    marker:{size:scat.map(r=>Number(r.ES_UMNG)===1?16:10),color:scat.map(r=>Number(r.ES_UMNG)===1?C.red:C.navy),opacity:.82,line:{color:"white",width:1}},
    hovertemplate:"%{customdata[0]}<br>SNIES %{customdata[1]} · %{customdata[2]}<br>Créditos: %{x}<br>Matrícula: $%{y:,.0f}<extra></extra>"
  }],{...baseLayout,margin:{l:72,r:18,t:15,b:55},xaxis:{...baseLayout.xaxis,title:"Créditos académicos"},yaxis:{...baseLayout.yaxis,title:"Matrícula (COP)",tickformat:"~s"}},plotCfg);
  {
    const el=document.getElementById("scatterChart");el.removeAllListeners?.("plotly_click");
    el.on("plotly_click",ev=>{
      const n=ev.points?.[0]?.customdata?.[0];if(!n)return;
      const sel=document.getElementById("fInstitution"),opt=[...sel.options].find(o=>norm(o.value)===norm(n));
      if(opt){sel.value=opt.value;updateAll();}
    });
  }

  const gm=rows.reduce((m,r)=>{m[r.MODALIDAD]=(m[r.MODALIDAD]||0)+1;return m;},{});
  Plotly.react("programModalityChart",[{labels:Object.keys(gm),values:Object.values(gm),type:"pie",hole:.55,marker:{colors:PALETTE},textinfo:"label+percent"}],
    {...baseLayout,margin:{l:15,r:15,t:10,b:15},showlegend:false},plotCfg);
  {
    const el=document.getElementById("programModalityChart");el.removeAllListeners?.("plotly_click");
    el.on("plotly_click",ev=>{
      const n=ev.points?.[0]?.label;if(!n)return;
      const sel=document.getElementById("fModality"),opt=[...sel.options].find(o=>norm(o.value)===norm(n));
      if(opt){sel.value=opt.value;updateAll();}
    });
  }

  const gr=rows.reduce((m,r)=>{const k=r.RECONOCIMIENTO_MINISTERIO||"SIN INFORMACIÓN";m[k]=(m[k]||0)+1;return m;},{});
  Plotly.react("recognitionChart",[{labels:Object.keys(gr),values:Object.values(gr),type:"pie",hole:.55,marker:{colors:[C.red,C.navy,C.gray,C.gold]},textinfo:"percent",
    hovertemplate:"%{label}: %{value}<extra></extra>"}],{...baseLayout,margin:{l:15,r:15,t:10,b:22},legend:{orientation:"h",y:-.05,x:.5,xanchor:"center",font:{size:9}}},plotCfg);

  const cols=[
    ["CODIGO_SNIES","SNIES"],["NOMBRE_INSTITUCION","Institución"],["NOMBRE_PROGRAMA","Programa"],["ESTADO_PROGRAMA","Estado"],
    ["SECTOR","Sector"],["MODALIDAD","Modalidad"],["NUMERO_CREDITOS","Créditos"],["NUMERO_PERIODOS_DURACION","Periodos"],
    ["COSTO_MATRICULA_ESTUDIANTES_NUEVOS","Matrícula nuevos"],["RECONOCIMIENTO_MINISTERIO","Reconocimiento"],["DEPARTAMENTO_OFERTA","Departamento"]
  ];
  renderTable("programTable",rows,cols,(k,v)=>k==="COSTO_MATRICULA_ESTUDIANTES_NUEVOS"?(v==null?"":money(v)):v);
}
