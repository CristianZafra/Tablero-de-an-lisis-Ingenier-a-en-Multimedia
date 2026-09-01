// Compatibilidad de periodos para los JSON publicados.
// Algunos registros no incluyen ORDEN_PERIODO; se deriva desde ANIO + SEMESTRE o PERIODO.
function periodOrder(r){
  const explicit=Number(r?.ORDEN_PERIODO);
  if(Number.isFinite(explicit) && explicit>0) return explicit;
  const y=Number(r?.ANIO), s=Number(r?.SEMESTRE);
  if(Number.isFinite(y) && Number.isFinite(s)) return y*10+s;
  const parts=String(r?.PERIODO||"").split("-");
  const py=Number(parts[0]), ps=Number(parts[1]);
  return Number.isFinite(py) && Number.isFinite(ps) ? py*10+ps : NaN;
}
latestRows=function(rows){
  if(!rows?.length) return [];
  const orders=rows.map(periodOrder).filter(Number.isFinite);
  if(!orders.length) return [];
  const max=Math.max(...orders);
  return rows.filter(r=>periodOrder(r)===max);
};
latestPeriod=function(rows){
  if(!rows?.length) return null;
  return latestRows(rows)[0]?.PERIODO||null;
};
