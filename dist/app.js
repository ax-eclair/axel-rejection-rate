'use strict';
let DATA,scope='verified',mode='daily',selectedDay=null,chartDays=[];
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel=(d,short=false)=>d?new Date(d+'T12:00:00Z').toLocaleDateString('fr-FR',short?{day:'numeric',month:'short',timeZone:'Europe/Berlin'}:{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'}):'Non retrouvée';
const percent=(n,d)=>d?(100*n/d).toLocaleString('fr-FR',{maximumFractionDigits:1})+' %':'—';
const groups=[
 ['reject0','Rejet direct · 0 entretien','#e98679'],['reject1','Rejet après 1 entretien','#d9695d'],['reject2','Rejet après 2 entretiens','#ad514b'],['reject3','Rejet après 3 entretiens','#873c3e'],['reject4','Rejet après 4 entretiens','#632d38'],
 ['offer','Offre obtenue','#548466'],['active','Entretiens en cours','#6091d6'],['pending','Sans décision retrouvée','#aeb6c8'],['withdrawn','Retrait volontaire','#b8a17a'],['expired','Expiration de plateforme','#d0c7b5'],['closed','Annonce fermée','#dfd8c9'],['unverified','Envoi à vérifier · Drive seul','#d5dbcd']];
const group=a=>a.status==='rejected'?'reject'+Math.min(4,a.completed??0):a.status;
const groupInfo=k=>groups.find(x=>x[0]===k)||[k,k,'#999'];
const currentApps=()=>DATA.applications.filter(a=>scope==='all'||a.verified);
function badge(a){return `<span class="badge ${esc(a.status)}">${esc(groupInfo(group(a))[1])}</span>`;}
function filteredApps(){const q=$('#search').value.toLocaleLowerCase(),s=$('#status-filter').value;return currentApps().filter(a=>(s==='all'||group(a)===s||a.status===s)&&(a.company+' '+a.role).toLocaleLowerCase().includes(q));}
function render(){
 const a=currentApps(),r=a.filter(x=>x.status==='rejected').length,n=a.reduce((s,x)=>s+x.unlocked,0),interviewed=a.filter(x=>x.unlocked>0).length;
 $('#total').textContent=a.length;$('#total-note').textContent=scope==='verified'?'Avec une preuve dans Gmail':'Envois confirmés + dossiers à vérifier';
 $('#rejections').textContent=r;$('#rate-note').textContent=`${percent(r,a.length)} des ${scope==='verified'?'candidatures confirmées':'dossiers recensés'}`;
 $('#unlocks').textContent=n;$('#interview-note').textContent=`Dans ${interviewed} processus de recrutement`;
 $('#offers').textContent=a.filter(x=>x.status==='offer').length;
 $('#scope-note').textContent=scope==='verified'?'20 dossiers Drive seuls sont exclus de ce total.':'20 dossiers sans preuve d’envoi retrouvée sont inclus ici.';
 renderDonut();renderChart();renderTable();
}
function renderDonut(){
 const a=currentApps(),total=a.length,radius=91,c=2*Math.PI*radius;let offset=0;
 $('#donut-total').textContent=total;
 let svg=`<circle cx="120" cy="120" r="${radius}" fill="none" stroke="#f0f2eb" stroke-width="26"/>`;
 $('#legend').innerHTML=groups.filter(g=>g[0]!=='unverified'||scope==='all').map(([id,label,color])=>{
  const n=a.filter(x=>group(x)===id).length,length=total?n/total*c:0;
  if(n){svg+=`<circle cx="120" cy="120" r="${radius}" fill="none" stroke="${color}" stroke-width="26" stroke-dasharray="${Math.max(0,length-2)} ${c}" stroke-dashoffset="${-offset}" data-group="${id}" tabindex="0" role="button" aria-label="${esc(label)} : ${n}"><title>${esc(label)} : ${n} (${percent(n,total)})</title></circle>`;offset+=length;}
  return `<button data-group="${id}" class="${n?'':'dim'}"><i class="dot" style="background:${color}"></i><span>${esc(label)}</span><strong>${n}</strong><small>${percent(n,total)}</small></button>`;
 }).join('');$('#donut').innerHTML=svg;
 $$('[data-group]').forEach(el=>{el.addEventListener('click',()=>selectGroup(el.dataset.group));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectGroup(el.dataset.group);}});});
}
function selectGroup(g){$('#status-filter').value=g;renderTable();$('#applications').scrollIntoView({behavior:'smooth'});}
const allEvents=()=>currentApps().flatMap(a=>a.events.map(e=>({...e,application:a.id,company:a.company})));
function renderChart(){
 let start=$('#start').value,end=$('#end').value;
 if(!start||!end||start>end){$('#date-error').textContent='Choisis une date de début antérieure ou égale à la date de fin.';return;}
 $('#date-error').textContent='';
 const events=allEvents().filter(e=>e.date>=start&&e.date<=end&&['rejection','interview','offer'].includes(e.type));
 chartDays=[];let d=new Date(start+'T12:00:00Z');while(d.toISOString().slice(0,10)<=end){const day=d.toISOString().slice(0,10);chartDays.push({date:day,events:events.filter(e=>e.date===day)});d.setUTCDate(d.getUTCDate()+1);if(chartDays.length>400)break;}
 let cr=0,ci=0;chartDays.forEach(d=>{d.r=d.events.filter(e=>e.type==='rejection').length;d.i=d.events.filter(e=>e.type==='interview').length;cr+=d.r;ci+=d.i;d.yr=mode==='daily'?d.r:cr;d.yi=mode==='daily'?d.i:ci;});
 const W=760,H=270,L=33,R=12,T=15,B=35,cw=W-L-R,ch=H-T-B,max=Math.max(2,...chartDays.map(d=>Math.max(d.yr,d.yi))),step=Math.max(1,Math.ceil(max/4)),top=Math.ceil(max/step)*step;
 const x=i=>L+cw*(chartDays.length===1?.5:i/(chartDays.length-1)),y=v=>T+ch-v/top*ch;
 let svg='<title>'+esc(mode==='daily'?'Rejets et invitations reçus par jour':'Cumul des rejets et invitations sur la période')+'</title>';
 for(let v=0;v<=top;v+=step)svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#edf0e9" ${v?'stroke-dasharray="3 5"':''}/><text x="${L-12}" y="${y(v)+4}" text-anchor="end" fill="#9ca593" font-size="10">${v}</text>`;
 const labelIndices=[...new Set(Array.from({length:Math.min(7,chartDays.length)},(_,i)=>Math.round(i*(chartDays.length-1)/(Math.min(7,chartDays.length)-1||1))))];
 labelIndices.forEach(i=>{svg+=`<text x="${x(i)}" y="${H-10}" text-anchor="${i===0?'start':i===chartDays.length-1?'end':'middle'}" fill="#9ca593" font-size="10">${dateLabel(chartDays[i].date,true)}</text>`;});
 for(const [key,col] of [['yr','#df665b'],['yi','#487fd4']]){
  const path=chartDays.map((d,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(d[key]).toFixed(2)).join(' ');
  if(mode==='cumulative')svg+=`<path d="${path} L ${x(chartDays.length-1)},${y(0)} L ${x(0)},${y(0)} Z" fill="${col}" opacity=".045"/>`;
  svg+=`<path d="${path}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  chartDays.forEach((d,i)=>{if(d[key]>0&&(mode==='daily'||d.events.some(e=>e.type===(key==='yr'?'rejection':'interview'))))svg+=`<circle cx="${x(i)}" cy="${y(d[key])}" r="3" fill="white" stroke="${col}" stroke-width="1.7"><title>${dateLabel(d.date)} · ${key==='yr'?'Rejets':'Entretiens'} : ${d[key]}</title></circle>`;});
 }
 if(!selectedDay||!chartDays.some(d=>d.date===selectedDay))selectedDay=[...chartDays].reverse().find(d=>d.events.length)?.date||end;
 const sel=chartDays.findIndex(d=>d.date===selectedDay);
 svg+=`<line id="cursor" x1="${x(sel)}" x2="${x(sel)}" y1="${T}" y2="${y(0)}" stroke="#a8b3a0" stroke-dasharray="3 4"/>`;
 chartDays.forEach((d,i)=>{const w=chartDays.length===1?cw:cw/(chartDays.length-1);svg+=`<rect x="${Math.max(L,x(i)-w/2)}" y="${T}" width="${Math.min(w,W-R-Math.max(L,x(i)-w/2))}" height="${ch}" fill="transparent" data-day="${d.date}"><title>${dateLabel(d.date)} : ${d.r} rejet(s), ${d.i} nouvel/nouveaux entretien(s)</title></rect>`;});
 $('#line-chart').innerHTML=svg;
 $$('[data-day]').forEach(el=>{const pick=()=>{selectedDay=el.dataset.day;const i=chartDays.findIndex(d=>d.date===selectedDay);$('#cursor').setAttribute('x1',x(i));$('#cursor').setAttribute('x2',x(i));renderDay();};el.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')pick();});el.addEventListener('click',pick);});
 $('#chart-summary').textContent=`${cr} rejets · ${ci} étapes débloquées · ${chartDays.length} jours`;
 renderDay();
}
function renderDay(){
 const index=chartDays.findIndex(d=>d.date===selectedDay),d=chartDays[index];if(!d)return;
 $('#selected-date').textContent=dateLabel(d.date);$('#previous').disabled=index===0;$('#next').disabled=index===chartDays.length-1;
 $('#day-events').innerHTML=d.events.length?d.events.map(e=>`<div class="day-event"><i class="dot" style="background:${e.type==='rejection'?'#df665b':e.type==='offer'?'#548466':'#487fd4'}"></i><span>${esc(e.company)}<small>${esc(e.label)}</small></span><a href="${esc(e.source)}" target="_blank" rel="noopener noreferrer" aria-label="Lire la source pour ${esc(e.company)}">↗</a></div>`).join(''):'<div class="no-events">Aucun rejet ni nouvel entretien reçu ce jour-là.</div>';
}
function renderTable(){
 const list=filteredApps();$('#table-count').textContent=`${list.length} candidature${list.length>1?'s':''} · Ouvre une ligne pour retrouver son parcours et ses sources.`;
 $('#empty').hidden=!!list.length;$('#rows').innerHTML=list.map(a=>`<tr><td><strong>${esc(a.company)}</strong><small>${esc(a.role)}</small></td><td>${a.applicationDate?dateLabel(a.applicationDate,true):'—'}<small>${a.applicationDate?esc(a.dateBasis):'Date non retrouvée'}</small></td><td>${badge(a)}</td><td>${a.completed??'—'}${a.unlocked?`<small>${a.unlocked} étape${a.unlocked>1?'s':''} débloquée${a.unlocked>1?'s':''}</small>`:''}</td><td>${a.verified?'<span class="source-chip">Gmail</span>':''}${a.folders.length?'<span class="source-chip">Drive</span>':''}</td><td><button data-id="${esc(a.id)}" aria-label="Voir les détails de ${esc(a.company)}">↗</button></td></tr>`).join('');
 $$('[data-id]').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.id)));
}
function openDetail(id){
 const a=DATA.applications.find(x=>x.id===id);if(!a)return;
 $('#detail-content').innerHTML=`<div class="eyebrow">LE PARCOURS</div><h2>${esc(a.company)}</h2><p>${esc(a.role)}</p>${badge(a)}<div class="detail-stats"><div><strong>${a.completed??'—'}</strong>entretiens effectués</div><div><strong>${a.unlocked}</strong>étapes débloquées</div><div><strong>${a.sources.length}</strong>sources</div></div>${a.notes.map(n=>`<p>${esc(n)}</p>`).join('')}<h3>Chronologie vérifiée</h3>${a.applicationDate?'':`<p>Date d’envoi non retrouvée.${a.knownBy?' Candidature attestée au plus tard le '+dateLabel(a.knownBy)+'.':''}</p>`}${a.events.map(e=>`<div class="detail-event"><time>${dateLabel(e.date)}</time>${esc(e.label)}<a href="${esc(e.source)}" target="_blank" rel="noopener noreferrer">Source ↗</a></div>`).join('')||'<p>Aucun événement daté vérifié.</p>'}<h3>Sources consultées</h3>${[...a.sources].sort((x,y)=>(y.date||'').localeCompare(x.date||'')).map(s=>`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(s.title)}</span><span>${esc(s.type)}${s.date?' · '+dateLabel(s.date,true):''} ↗</span></a>`).join('')}`;
 $('#detail').showModal();
}
function exportCSV(){
 const headers=['Entreprise','Poste','Situation','Date envoi ou réception','Preuve date','Entretiens effectués','Étapes débloquées','Envoi confirmé','Notes','Sources'];
 const cells=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const rows=filteredApps().map(a=>[a.company,a.role,groupInfo(group(a))[1],a.applicationDate,a.dateBasis,a.completed,a.unlocked,a.verified?'Oui':'Non',a.notes.join(' | '),a.sources.map(s=>s.url).join(' | ')]);
 const csv='\ufeff'+[headers,...rows].map(r=>r.map(cells).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const el=document.createElement('a');el.href=url;el.download='axel-candidatures-2026-10-16.csv';el.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#toast').textContent=`${rows.length} candidatures exportées (filtres actuels).`;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',3500);
}
async function init(){
 try{const response=await fetch('data.json');if(!response.ok)throw Error('Données indisponibles');DATA=await response.json();
 $('#verified-count').textContent=DATA.applications.filter(a=>a.verified).length;$('#all-count').textContent=DATA.applications.length;
 groups.forEach(([id,label])=>{const o=document.createElement('option');o.value=id;o.textContent=label;$('#status-filter').append(o);});
 const first=DATA.applications.flatMap(a=>a.events).filter(e=>e.type==='rejection').map(e=>e.date).sort()[0];$('#start').value=first;$('#end').value=DATA.meta.asOf;for(const el of [$('#start'),$('#end')]){el.min='2026-01-01';el.max=DATA.meta.asOf;el.addEventListener('change',renderChart);}
 $('#reset-dates').addEventListener('click',()=>{$('#start').value=first;$('#end').value=DATA.meta.asOf;renderChart();});
 $$('[data-scope]').forEach(b=>b.addEventListener('click',()=>{scope=b.dataset.scope;$$('[data-scope]').forEach(x=>x.classList.toggle('selected',x===b));if(scope==='verified'&&$('#status-filter').value==='unverified')$('#status-filter').value='all';render();}));
 $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;$$('[data-mode]').forEach(x=>x.classList.toggle('selected',x===b));renderChart();}));
 for(const [id,delta] of [['previous',-1],['next',1]])$('#'+id).addEventListener('click',()=>{const i=chartDays.findIndex(d=>d.date===selectedDay)+delta;if(chartDays[i]){selectedDay=chartDays[i].date;renderChart();}});
 $('#search').addEventListener('input',renderTable);$('#status-filter').addEventListener('change',renderTable);$('#clear-filters').addEventListener('click',()=>{$('#search').value='';$('#status-filter').value='all';renderTable();});
 $('#export').addEventListener('click',exportCSV);$('#close-detail').addEventListener('click',()=>$('#detail').close());$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')&&(e.offsetX<0||e.offsetX>e.target.clientWidth||e.offsetY<0||e.offsetY>e.target.clientHeight))e.target.close();});
 $$('[data-company]').forEach(b=>b.addEventListener('click',()=>openDetail(DATA.applications.find(a=>a.company===b.dataset.company).id)));
 $('#coverage').textContent=`${DATA.meta.driveFolders} dossiers de candidature dans Mail et Online, ramenés à ${DATA.meta.uniqueDriveApplications} candidatures distinctes sur Drive (${DATA.meta.driveDuplicatesRemoved} doublons fusionnés). ${DATA.meta.gmailRead} mails lus en détail pour reconstruire les parcours. Les emails ajoutent les candidatures absentes de Drive.`;
 $('#method-list').innerHTML=DATA.meta.methodology.map(t=>`<li>${esc(t)}</li>`).join('')+'<li>Taux de rejet = candidatures rejetées ÷ candidatures du périmètre sélectionné. Les candidatures sans réponse restent au dénominateur. Le camembert représente les situations actuelles, pas seulement les processus terminés.</li>';
 render();
 }catch(e){$('#scope-note').textContent='Impossible de charger les données. Recharge la page.';console.error(e);}
}
init();
