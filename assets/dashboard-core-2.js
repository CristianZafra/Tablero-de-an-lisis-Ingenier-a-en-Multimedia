function renderTrend(){
  const metric = selected("trendMetric");
  const rows = filterSNIES();
  const periods = uniq(rows.map(r => r.PERIODO)).sort((a,b) => Number(String(a).replace("-","")) - Number(String(b).replace("-","")));
  const labelMap = {
    "MATRICULADOS":"Matriculados",
    "INSCRITOS":"Inscritos",
    "ADMITIDOS":"Admitidos",
    "PRIMER_CURSO":"Primer curso",
    "GRADUADOS":"Graduados"
  };
  const total = periods.map(p => sum(rows.filter(r => r.PERIODO === p), metric));
  const umng = periods.map(p => sum(rows.filter(r => r.PERIODO === p && Number(r.ES_UMNG) === 1), metric));
  const ymax = Math.max(10, ...total, ...umng) * 1.15;

  const traces = [{
    x: periods,
    y: total,
    type: "scatter",
    mode: "lines+markers",
    name: "Total visible",
    line: {color: C.navy, width: 3},
    marker: {size: 7, color: C.navy},
    hovertemplate: "Periodo: %{x}<br>" + labelMap[metric] + ": %{y:,}<extra></extra>"
  }];

  if (selected("fScope") === "ALL") {
    traces.push({
      x: periods,
      y: umng,
      type: "scatter",
      mode: "lines+markers",
      name: "UMNG",
      line: {color: C.red, width: 2.5},
      marker: {size: 6, color: C.red},
      hovertemplate: "Periodo: %{x}<br>UMNG: %{y:,}<extra></extra>"
    });
  }

  Plotly.react("trendChart", traces, {
    ...baseLayout,
    margin:{l:60,r:18,t:18,b:55},
    xaxis:{
      ...baseLayout.xaxis,
      title:"Periodo",
      type:"category",
      categoryorder:"array",
      categoryarray:periods,
      tickangle:-35,
      fixedrange:true
    },
    yaxis:{
      ...baseLayout.yaxis,
      title:labelMap[metric],
      range:[0, ymax],
      tickformat:",d",
      fixedrange:true
    },
    legend:{orientation:"h",y:1.12,x:0}
  }, plotCfg);

  const el = document.getElementById("trendChart");
  el.removeAllListeners?.("plotly_click");
  el.on("plotly_click", ev => {
    const p = ev.points?.[0]?.x;
    if(!p) return;
    const parts = String(p).split("-");
    if(parts.length === 2){
      document.getElementById("fYear").value = parts[0];
      document.getElementById("fSemester").value = parts[1];
      updateAll();
    }
  });
}

function renderInstitution(){
  const rows=latestRows(filterSNIES());
  let g=groupSum(rows,"INSTITUCION","MATRICULADOS").sort((a,b)=>a.value-b.value);
  const x=g.map(d=>d.value), y=g.map(d=>shortName(d.name)), full=g.map(d=>d.name);
  Plotly.react("institutionChart",[{
    x,y,type:"bar",orientation:"h",customdata:full,
    marker:{color:full.map(n=>n.includes("MILITAR")?C.red:C.navy)},
    hovertemplate:"%{customdata}<br>Matriculados: %{x:,}<extra></extra>"
  }],{...baseLayout,margin:{l:165,r:20,t:18,b:45},xaxis:{...baseLayout.xaxis,title:"Matriculados"},yaxis:{automargin:true}},plotCfg);
  const el=document.getElementById("institutionChart");
  el.removeAllListeners?.("plotly_click");
  el.on("plotly_click",ev=>{
    const n=ev.points?.[0]?.customdata;if(!n)return;
    const sel=document.getElementById("fInstitution");
    if([...sel.options].some(o=>o.value===n)){sel.value=n;updateAll();}
  });
}
function pieChart(id,key,titleClickFilter){
  const rows=latestRows(filterSNIES()), g=groupSum(rows,key,"MATRICULADOS").sort((a,b)=>b.value-a.value);
  Plotly.react(id,[{labels:g.map(d=>d.name),values:g.map(d=>d.value),type:"pie",hole:.58,
    marker:{colors:PALETTE.slice(0,g.length)},textinfo:"percent",hovertemplate:"%{label}<br>%{value:,} matriculados<br>%{percent}<extra></extra>"
  }],{...baseLayout,margin:{l:12,r:12,t:10,b:20},showlegend:true,legend:{orientation:"h",y:-.08,x:.5,xanchor:"center",font:{size:10}}},plotCfg);
  const el=document.getElementById(id);el.removeAllListeners?.("plotly_click");
  el.on("plotly_click",ev=>{
    const label=ev.points?.[0]?.label;if(!label)return;
    const sel=document.getElementById(titleClickFilter);
    if([...sel.options].some(o=>o.value===label)){sel.value=label;updateAll();}
  });
}
function renderFunnel(){
  const rows=latestRows(filterSNIES());
  const x=[sum(rows,"INSCRITOS"),sum(rows,"ADMITIDOS"),sum(rows,"PRIMER_CURSO")];
  Plotly.react("funnelChart",[{type:"funnel",y:["Inscritos","Admitidos","Primer curso"],x,
    marker:{color:[C.navy,C.red,C.green]},textinfo:"value+percent initial",
    hovertemplate:"%{y}: %{x:,}<extra></extra>"
  }],{...baseLayout,margin:{l:105,r:20,t:10,b:25}},plotCfg);
}

function renderDept(){
  const rows = latestRows(filterSNIES());
  const g = groupSum(rows, "DEPARTAMENTO_OFERTA", "MATRICULADOS")
    .filter(d => d.name !== null && d.name !== undefined && d.name !== "")
    .sort((a,b) => b.value - a.value);

  Plotly.react("deptChart", [{
    x: g.map(d => d.name),
    y: g.map(d => d.value),
    type: "bar",
    marker: {color: C.navy},
    hovertemplate: "%{x}<br>Matriculados: %{y:,}<extra></extra>"
  }], {
    ...baseLayout,
    margin:{l:60,r:18,t:18,b:95},
    xaxis:{
      ...baseLayout.xaxis,
      title:"Departamento",
      type:"category",
      categoryorder:"array",
      categoryarray:g.map(d => d.name),
      tickangle:-35,
      fixedrange:true
    },
    yaxis:{
      ...baseLayout.yaxis,
      title:"Matriculados",
      range:[0, Math.max(10, ...g.map(d => d.value)) * 1.15],
      tickformat:",d",
      fixedrange:true
    }
  }, plotCfg);

  const el = document.getElementById("deptChart");
  el.removeAllListeners?.("plotly_click");
  el.on("plotly_click", ev => {
    const label = ev.points?.[0]?.x;
    if(!label) return;
    const sel = document.getElementById("fDept");
    const opt = [...sel.options].find(o => norm(o.value) === norm(label));
    if(opt){ sel.value = opt.value; updateAll(); }
  });
}

function renderShare(){
  const f = getFilters();
  const rows = SNIES.filter(r => {
    if(f.year !== "ALL" && String(r.ANIO) !== String(f.year)) return false;
    if(f.sem !== "ALL" && String(r.SEMESTRE) !== String(f.sem)) return false;
    if(f.sector !== "ALL" && norm(r.SECTOR_IES) !== norm(f.sector)) return false;
    if(f.modality !== "ALL" && norm(r.MODALIDAD) !== norm(f.modality)) return false;
    if(f.dept !== "ALL" && norm(r.DEPARTAMENTO_OFERTA) !== norm(f.dept)) return false;
    return true;
  });

  const periods = uniq(rows.map(r => r.PERIODO)).sort((a,b) => Number(String(a).replace("-","")) - Number(String(b).replace("-","")));

  const shares = periods.map(p => {
    const rr = rows.filter(r => r.PERIODO === p);
    const totalMarket = Number(sum(rr, "MATRICULADOS"));
    const umngCount = Number(sum(rr.filter(r => Number(r.ES_UMNG) === 1), "MATRICULADOS"));
    return totalMarket ? Number((umngCount / totalMarket * 100).toFixed(2)) : 0;
  });

  const yMax = Math.max(40, Math.ceil(Math.max(...shares, 0) / 5) * 5);

  Plotly.react("shareChart", [{
    x: periods,
    y: shares,
    type: "scatter",
    mode: "lines+markers",
    fill: "tozeroy",
    line: {color: C.red, width: 3},
    marker: {color: C.red, size: 7},
    hovertemplate: "Periodo: %{x}<br>Participación UMNG: %{y:.2f}%<extra></extra>"
  }], {
    ...baseLayout,
    margin:{l:70,r:20,t:18,b:58},
    xaxis:{
      ...baseLayout.xaxis,
      title:"Periodo",
      type:"category",
      categoryorder:"array",
      categoryarray:periods,
      tickangle:-35,
      fixedrange:true
    },
    yaxis:{
      ...baseLayout.yaxis,
      type:"linear",
      title:"Participación UMNG (%)",
      range:[0, yMax],
      tickmode:"linear",
      tick0:0,
      dtick:5,
      tickformat:".0f",
      ticksuffix:"%",
      fixedrange:true
    }
  }, plotCfg);
}

function renderOverview(){
  renderKpis();
  renderInsights();
  renderTrend();
  renderInstitution();
  pieChart("sectorChart","SECTOR_IES","fSector");
  pieChart("modalityChart","MODALIDAD","fModality");
  renderFunnel();
  renderDept();
  renderShare();
}
