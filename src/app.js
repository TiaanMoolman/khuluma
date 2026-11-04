// ===== Khuluma board =====
const $=s=>document.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const UI={speak:['Speak','Praat'],del:['Delete','Vee uit'],clear:['Clear','Maak skoon'],share:['Copy','Kopieer'],language:['Language','Taal'],
  rest:['Rest my eyes','Rus my oë'],resume:['Start again','Begin weer'],attn:['Come here','Kom hier'],goback:['Back','Terug'],
  core:['Core words','Kernwoorde'],quick:['QuickFires','Vinnig'],topics:['Topics','Onderwerpe'],keyboard:['Keyboard','Sleutelbord'],
  pain:['Where it hurts','Waar dit seer is'],scenes:['Scenes','Tonele'],personal:['Personal','Persoonlik'],hold:['Hold for settings','Hou vir instellings'],
  library:['Library','Biblioteek'],back:['My back','My rug'],pick:['Look at where it hurts','Kyk waar dit seer is'],space:['space','spasie'],addword:['Add word','Voeg by']};
const ATTN=['Come here, please.','Kom asseblief hier.'];
const SAMPLE=['Hello. I want water, please.','Hallo. Ek wil asseblief water hê.'];

// visual scenes: x%, y%, emoji, English, Afrikaans, class
const SC=(id,e,n,rows)=>({id,e,n,hot:P(rows).map(r=>({x:+r[0],y:+r[1],e:r[2],w:[r[3],r[4]],c:r[5]}))});
const SCENES=[
 SC('kitchen','🍳',['Kitchen','Kombuis'],`
16|28|😋|I’m hungry|Ek is honger|d
40|26|🥤|I’m thirsty|Ek is dors|d
64|26|🧊|fridge|yskas|n
86|30|🍎|apple|appel|n
16|72|🍞|bread|brood|n
40|72|🥛|milk|melk|n
64|72|💧|water|water|n
86|74|🍚|pap|pap|n`),
 SC('bath','🛁',['Bath time','Badtyd'],`
18|28|🛁|bath|bad|n
42|26|🫧|bubbles|borrels|n
66|28|🦆|duck|eendjie|n
86|46|🏁|All done|Klaar|d
18|72|🧼|soap|seep|n
42|74|🥵|Too hot|Te warm|d
66|74|🥶|Too cold|Te koud|d`),
 SC('bed','🌙',['Bedtime','Slaaptyd'],`
18|28|🛏️|bed|bed|n
42|26|📖|Read me a story|Lees vir my ’n storie|v
66|28|🧸|teddy|teddie|n
86|46|😴|I’m sleepy|Ek is vaak|d
18|72|💡|Light off|Lig af|v
42|74|🎵|Sing to me|Sing vir my|v
66|74|🤗|Hold me|Hou my vas|v`),
 SC('park','🛝',['Park','Park'],`
16|26|🛝|slide|glyband|n
40|24|⚽|ball|bal|n
64|26|🌳|tree|boom|n
86|22|☀️|sun|son|n
16|74|🐕|dog|hond|n
40|74|🧒|friend|vriend|p
64|74|🤲|Push me|Stoot my|v
86|72|☝️|My turn|My beurt|s`)];

// body map
const PARTS={head:['Head','Kop'],chest:['Chest','Bors'],tummy:['Tummy','Maag'],back:['Back','Rug'],arm:['Arm','Arm'],hand:['Hand','Hand'],
  leg:['Leg','Been'],foot:['Foot','Voet'],body:['Body','Lyf']};
const SIDES={left:['left','linker'],right:['right','regter']};
const REG_DETAIL=[['head',null,[35,2,30,16]],['chest',null,[30,21,40,15]],['tummy',null,[30,36,40,15]],
  ['arm',1,[4,22,25,26]],['arm',2,[71,22,25,26]],['hand',1,[2,48.5,30,10]],['hand',2,[68,48.5,30,10]],
  ['leg',1,[30,52,20,34]],['leg',2,[50,52,20,34]],['foot',1,[20,86.5,30,11]],['foot',2,[50,86.5,30,11]]];
const REG_SIMPLE=[['head',null,[28,1,44,19]],['body',null,[28,21,44,31]],['arm',1,[1,21,27,40]],['arm',2,[72,21,27,40]],
  ['leg',1,[18,53,32,46]],['leg',2,[50,53,32,46]]];
const LEVELS=[
 {lbl:['No pain','Geen pyn'],say:['No pain.','Geen pyn nie.'],col:'--s0'},
 {lbl:['A little','Bietjie'],say:['It hurts a little.','Dit maak ’n bietjie seer.'],col:'--s1'},
 {lbl:['Some','Taamlik'],say:['It hurts.','Dit maak seer.'],col:'--s2'},
 {lbl:['A lot','Baie'],say:['It hurts a lot.','Dit maak baie seer.'],col:'--s3'},
 {lbl:['Worst pain','Ergste pyn'],say:['It is the worst pain.','Dis die ergste pyn.'],col:'--s4'},
 {lbl:['Tight / cramp','Styf / kramp'],say:['It feels tight.','Dit trek styf.'],col:'--fk-d',tight:true}];

// ---------- state & storage ----------
const GRID_IDS=GRIDS.map(g=>g[0]);
// any grid from 1 × 1 to 10 columns × 6 rows can be chosen; the presets are just shortcuts
const validGrid=g=>{ const m=/^(\d+)x(\d+)$/.exec(g||''); return !!m&&+m[1]>=1&&+m[1]<=10&&+m[2]>=1&&+m[2]<=6; };
const DEF={mode:'ipad',dwell:1200,scan:1500,guard:700,grid:'8x6',lang:'en',lang2:'',showL2:false,labels:true,speakEach:true,hc:false,voice:'',rate:0.9,
  psize:'220',restBtn:true,skipWeak:false,partner:false,simpleBody:false,mirror:true,grammar:true,hs:'124',layout:'core',
  cvi:false,cviGrid:'2x1',cviColour:'#ffd400',sil:false,motion:'gentle',spotMs:3500,field:'centre',lookSpeak:false,suggest:true,tileSize:100,tileStyle:'classic',wordSize:100,bubble:false,bOut:8,bGap:5,bLight:false,bHide:false,cviFont:'nunito',cviText:110};
const CVI_FONTS={nunito:'"Nunito",system-ui,sans-serif',varela:'"Varela Round",system-ui,sans-serif',andika:'"Andika",system-ui,sans-serif',atkinson:'"Atkinson Hyperlegible",system-ui,sans-serif'};
// Word bubbling: copies of the word stacked in rings. The gap ring (background colour) sits on top of the outline ring (highlight colour).
function bubbleShadow(gap,out,col,bg){
  const rings=(from,to,c)=>{ const parts=[]; for(let r=to;r>=from;r-=1.5){ const n=Math.max(8,Math.ceil(2*Math.PI*r/2)); for(let i=0;i<n;i++){ const a=2*Math.PI*i/n; parts.push(`${(Math.cos(a)*r).toFixed(1)}px ${(Math.sin(a)*r).toFixed(1)}px 0 ${c}`); } } return parts; };
  return [...(gap>0?rings(1,gap,bg):[]),...rings(Math.max(1,gap),gap+out,col)].join(',');
}
function applyCviText(el){ el.style.setProperty('--cvi-font',CVI_FONTS[settings.cviFont]||CVI_FONTS.nunito); el.style.setProperty('--cvi-scale',settings.cviText/100);
  el.classList.toggle('bubble',!!settings.bubble); el.classList.toggle('bubble-light',!!settings.bLight); el.classList.toggle('bubble-hide',!!(settings.bubble&&settings.bHide));
  if(settings.bubble){ el.style.setProperty('--bubble',bubbleShadow(settings.bGap,settings.bOut,settings.cviColour,settings.bLight?'#fff':'#000')); el.style.setProperty('--bpad',(settings.bGap+settings.bOut)+'px'); } }
const CVI_COLOURS=[['#ff2a2a','Red'],['#ffd400','Yellow'],['#ff8c00','Orange'],['#39e75f','Green'],['#2f8cff','Blue'],['#ff4fd8','Pink'],['#ffffff','White']];
const ls={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const firstRun=!ls.get('khuluma.v1',null);
let settings=Object.assign({},DEF,ls.get('khuluma.v1',{}));
if(firstRun) Object.assign(settings,{layout:'core',grid:'8x6'});
if(settings.layout==='standard') settings.layout='core';
if(!LANGS[settings.lang]) settings.lang='en';
if(settings.lang2&&(!LANGS[settings.lang2]||settings.lang2===settings.lang)) settings.lang2='';
if(!validGrid(settings.grid)) settings.grid=settings.layout==='gaze'?'3x3':'8x6';
let custom=ls.get('khuluma.custom',[]).map((c,i)=>({id:c.id||('c'+i+Date.now().toString(36)),label:c.label||c.w||'',e:c.e||'💛',img:c.img||'',audio:'',audioL:c.audioL||{},group:c.group||'family'}));
let ov=ls.get('khuluma.ov',{});
// Recordings and renamed labels belong to one language. Older versions mixed them, so the first time this
// version runs (and when an older backup is restored) every recording is cleared and labels are split per language.
const normW=s=>String(s||'').toLowerCase().replace(/[’'`.,!?¿¡]/g,'').replace(/\s+/g,' ').trim();
const REC_V=2;
function cleanLegacy(wipe){
  Object.keys(ov).forEach(k=>{ const o=ov[k], b=ITEMS[k];
    if(wipe){ delete o.audioL; } delete o.audio;
    if(o.label!=null){ const l=String(o.label).trim();
      // a label that is simply the other language's word was a mix-up; drop it
      const isOtherWord=b&&LC.some(lg=>normW(b.w[LI[lg]])===normW(l));
      if(l&&!isOtherWord) o.labelL=Object.assign({},...LC.map(lg=>({[lg]:l})),o.labelL||{});
      delete o.label; }
    if(o.labelL) Object.keys(o.labelL).forEach(lg=>{ if(!o.labelL[lg]||!LANGS[lg]) delete o.labelL[lg]; });
    if(o.labelL&&!Object.keys(o.labelL).length) delete o.labelL;
    if(o.audioL) Object.keys(o.audioL).forEach(lg=>{ if(!o.audioL[lg]||!LANGS[lg]) delete o.audioL[lg]; });
    if(o.audioL&&!Object.keys(o.audioL).length) delete o.audioL;
    if(!Object.keys(o).length) delete ov[k]; });
  custom.forEach(c=>{ delete c.audio; c.audio=''; if(wipe||!c.audioL) c.audioL={}; });
}
let recReset=false;
if(ls.get('khuluma.recv',0)<REC_V){ cleanLegacy(true); recReset=Object.keys(localStorage).some(k=>k.startsWith('khuluma.'))&&!firstRun; ls.set('khuluma.recv',REC_V); ls.set('khuluma.custom',custom); ls.set('khuluma.ov',ov); }
else cleanLegacy(false);
let scenesC=ls.get('khuluma.scenes',[]);
const LOGDEF=()=>({next:{},sel:{},spoken:0,selections:0,undo:0,pain:[],zones:Array.from({length:9},()=>({n:0,sum:0})),days:{},recent:[],since:Date.now()});
let log=Object.assign(LOGDEF(),ls.get('khuluma.log',{}));
if(!Array.isArray(log.zones)||log.zones.length!==9) log.zones=LOGDEF().zones;
if(!Array.isArray(log.recent)) log.recent=[];
if(!log.next||typeof log.next!=='object') log.next={};
const cloudChanged=k=>{ try{ window.khulumaCloud&&window.khulumaCloud.changed(k); }catch(e){} };
function save(quiet){ls.set('khuluma.v1',settings);ls.set('khuluma.custom',custom);ls.set('khuluma.ov',ov);ls.set('khuluma.scenes',scenesC); if(!quiet) cloudChanged('board');}
let logTimer=0; function saveLog(){clearTimeout(logTimer);logTimer=setTimeout(()=>{ ls.set('khuluma.log',log); cloudChanged('log'); },400);}

const gaze=()=>settings.layout==='gaze'||settings.cvi;
let view=gaze()?'home':'core', hist=[], page=0, pages=1, msg=[], lastPType='mouse', editing=false, paused=false, painPart=null, lastAdd=0, typed='';

// IndexedDB for photos and recordings
const mem=new Map();
const idb={db:null,
  open(){return new Promise(res=>{try{const r=indexedDB.open('khuluma',1);r.onupgradeneeded=()=>r.result.createObjectStore('media');r.onsuccess=()=>{this.db=r.result;res();};r.onerror=()=>res();}catch(e){res();}});},
  tx(mode,fn){return new Promise(res=>{if(!this.db)return res(undefined);try{const t=this.db.transaction('media',mode);const q=fn(t.objectStore('media'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>res(undefined);}catch(e){res(undefined);}});},
  async put(k,v){mem.set(k,v); if(this.db){ await this.tx('readwrite',st=>st.put(v,k)); return; }
    try{ localStorage.setItem('khuluma.m.'+k, await blobToDataURL(v)); }catch(e){} },
  async get(k){ if(mem.has(k)) return mem.get(k); let v;
    if(this.db) v=await this.tx('readonly',st=>st.get(k));
    if(!v){ try{ const d=localStorage.getItem('khuluma.m.'+k); if(d) v=dataURLToBlob(d); }catch(e){} }
    if(v) mem.set(k,v); return v; },
  async del(k){ mem.delete(k); bufs.delete(k); if(this.db) await this.tx('readwrite',st=>st.delete(k)); try{ localStorage.removeItem('khuluma.m.'+k); }catch(e){} },
  where(){ return this.db?'db':(()=>{ try{ localStorage.setItem('khuluma.t','1'); localStorage.removeItem('khuluma.t'); return 'ls'; }catch(e){ return 'none'; } })(); }};
const bufs=new Map();   // decoded recordings, ready to play
const urls=new Map();
async function mediaURL(k){ if(!k) return ''; if(urls.has(k)) return urls.get(k); const b=await idb.get(k); if(!b) return '';
  const isAudio=k.startsWith('aud-')||(b.type||'').startsWith('audio');
  const u=isAudio?await new Promise(res=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>res(''); r.readAsDataURL(b);}):URL.createObjectURL(b);
  if(u) urls.set(k,u); return u; }
function dropURL(k){ if(urls.has(k)){ const u=urls.get(k); if(u.startsWith('blob:')) try{URL.revokeObjectURL(u);}catch(e){} urls.delete(k);} }
function usedMedia(){ const used=new Set(); Object.values(ov).forEach(o=>{o.img&&used.add(o.img);Object.values(o.audioL||{}).forEach(a=>a&&used.add(a));}); custom.forEach(c=>{c.img&&used.add(c.img);Object.values(c.audioL||{}).forEach(a=>a&&used.add(a));}); scenesC.forEach(s=>{s.img&&used.add(s.img);}); return used; }
async function preloadMedia(){ await Promise.all([...usedMedia()].map(mediaURL)); }
async function gcMedia(){ const used=usedMedia(); [...urls.keys()].forEach(k=>{ if(!used.has(k)){ idb.del(k); dropURL(k);} }); }
async function purgeMedia(){ const used=usedMedia(); const keys=new Set();
  if(idb.db){ const all=await idb.tx('readonly',st=>st.getAllKeys()); (all||[]).forEach(k=>keys.add(String(k))); }
  try{ Object.keys(localStorage).forEach(k=>{ if(k.startsWith('khuluma.m.')) keys.add(k.slice(10)); }); }catch(e){}
  for(const k of keys){ if(k.startsWith('aud-')&&!used.has(k)){ await idb.del(k); dropURL(k); } } }
const uid=p=>p+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

// ---------- items ----------
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function baseItem(key){
  if(ITEMS[key]) return ITEMS[key];
  const parts=key.split(':'), c=parts[0];
  if(c==='mine'){ const x=custom.find(z=>z.id===parts[1]); return x&&{key,e:x.e||'💛',w:[x.label,x.label],c:x.group==='family'||x.group==='friends'?'p':'n',img:x.img,audio:'',custom:true}; }
  if(c==='scn'){ const sid=parts[1], i=+parts[2]; const b=SCENES.find(s=>s.id===sid);
    if(b){ const h=b.hot[i]; return h&&{key,e:h.e,w:h.w,c:h.c}; }
    const s=scenesC.find(z=>z.id===sid); const h=s&&s.hot[i]; return h&&{key,e:'📍',w:[h.label,h.label],c:'n',custom:true}; }
  return null;
}
function ownItem(key,lang=settings.lang){ const b=baseItem(key); if(!b) return null;
  if(key.startsWith('mine:')){ const x=custom.find(z=>'mine:'+z.id===key); return Object.assign({},b,{audio:(x&&x.audioL||{})[lang]||'',lang}); }
  const o=ov[key]; if(!o||b.custom) return Object.assign({},b,{lang});
  return Object.assign({},b,{label:(o.labelL||{})[lang]||'',e:o.e||b.e,img:o.img||'',audio:(o.audioL||{})[lang]||'',hidden:!!o.hidden,lang}); }
// The same words appear in several places (QuickFires, scenes, topics). A recording made on one
// button is used by every button that says exactly the same words in the same language.
let recByWord=null;
function buildRecMap(){ recByWord=new Map();
  const put=(lang,w,a)=>{ const n=normW(w); if(n&&!recByWord.has(lang+'|'+n)) recByWord.set(lang+'|'+n,a); };
  Object.entries(ov).forEach(([k,o])=>{ const b=baseItem(k); if(!b) return;
    Object.entries(o.audioL||{}).forEach(([lang,a])=>{ if(a) put(lang,(o.labelL||{})[lang]||b.w[LI[lang]??0],a); }); });
  custom.forEach(c=>Object.entries(c.audioL||{}).forEach(([lang,a])=>{ if(a) put(lang,c.label,a); })); }
function sharedRec(w,lang=settings.lang){ if(!recByWord) buildRecMap(); return recByWord.get(lang+'|'+normW(w))||''; }
function getItem(key,lang=settings.lang){ const it=ownItem(key,lang); if(!it||it.audio) return it; const a=sharedRec(wordOf(it,lang),lang); return a?Object.assign({},it,{audio:a}):it; }
// message items are looked up again in the language now in use, so a word never keeps another language's recording or label
function fresh(it,lang=settings.lang){ if(!it) return it;
  if(it.key&&it.key.startsWith('typed:')) return Object.assign({},it,{audio:sharedRec(it.label,lang),lang});
  if(it.key&&it.key!=='pain'&&baseItem(it.key)) return getItem(it.key,lang)||it;
  return Object.assign({},it,{audio:'',lang}); }
function refreshMsg(){ msg=msg.map(it=>fresh(it)); }
const L=(l=settings.lang)=>LI[l]??0;
const word=(it,l=settings.lang)=>wordOf(it,l);
const ui=(k,l)=>UI[k][L(l)];
const dims=()=>(settings.cvi?settings.cviGrid:settings.grid).split('x').map(Number);
const sentence=(list=msg)=>compose(list,settings.lang,settings.grammar);
const listOf=id=>LISTS[id]||TOPICS[id];

// ---------- rendering ----------
const app=$('#app'), grid=$('#grid'), msgEl=$('#msg'), painEl=$('#pain'), sceneEl=$('#scene'), kbdEl=$('#kbd');
function picHTML(it){ const u=it.img&&urls.get(it.img); return u?`<img src="${u}" alt="">`:`<span class="sym" aria-hidden="true">${esc(it.e)}</span>`; }
function tileHTML(it,extra='',act='tile'){
  const l2=settings.showL2&&settings.lang2&&!it.label&&!it.custom?`<small>${esc(it.w[L(settings.lang2)])}</small>`:'';
  const vo=it.audio&&urls.get(it.audio)?'<span class="vo" aria-hidden="true">🎙️</span>':'';
  return `<button class="tile dwell fk-${it.c} ${extra}" data-act="${act}" data-id="${esc(it.key)}">${vo}<span class="pic">${picHTML(it)}</span><span class="lbl">${esc(word(it))}${l2}</span></button>`;
}
const folderHTML=(id,e,n,count,img)=>`<button class="tile dwell folder" data-act="go" data-id="${esc(id)}">${count!=null?`<span class="cnt">${count}</span>`:''}<span class="pic">${img?`<img src="${img}" alt="">`:`<span class="sym" aria-hidden="true">${e}</span>`}</span><span class="lbl">${esc(n)}</span></button>`;
const noteHTML=(e,t)=>`<div class="tile note"><span class="sym" aria-hidden="true">${e}</span><span class="lbl">${t}</span></div>`;
function zoneOf(x,y){ return Math.min(2,Math.max(0,Math.floor(x/innerWidth*3)))+3*Math.min(2,Math.max(0,Math.floor(y/innerHeight*3))); }
function zoneStats(){ return log.zones.map(z=>z.n>=2?z.sum/z.n:null); }
function weakZones(){ const av=zoneStats(), have=av.filter(v=>v!=null); if(have.length<5) return av.map(()=>false);
  const s=[...have].sort((a,b)=>a-b), med=s[Math.floor(s.length/2)]; return av.map(v=>v!=null&&v>1.6*med); }
function cellMask(c,r){
  const mask=Array(c*r).fill(true); if(!settings.skipWeak||editing) return mask;
  const weak=weakZones(); if(!weak.some(Boolean)) return mask;
  const rect=grid.getBoundingClientRect(); if(!rect.width) return mask;
  for(let i=0;i<c*r;i++){ const col=i%c,row=Math.floor(i/c); if(weak[zoneOf(rect.left+(col+.5)*rect.width/c, rect.top+(row+.5)*rect.height/r)]) mask[i]=false; }
  return mask.filter(Boolean).length>=3?mask:Array(c*r).fill(true);
}
function sizeGrid(c,r){ grid.style.setProperty('--c',c); grid.style.setProperty('--r',r);
  const ts=Math.max(50,Math.min(100,+settings.tileSize||100))/100, box=grid.parentElement&&grid.parentElement.getBoundingClientRect();
  if(ts>=1||!box||!box.width){ grid.style.removeProperty('gap'); return; }
  const base=settings.cvi?28:gaze()?18:8, cell=Math.min(box.width/c,box.height/r);
  grid.style.gap=Math.round(base+cell*(1-ts))+'px'; }
function layCells(cells){
  const [c,r]=dims(); sizeGrid(c,r);
  const mask=cellMask(c,r), usable=[]; mask.forEach((m,i)=>m&&usable.push(i));
  const per=Math.max(1,usable.length);
  pages=Math.max(1,Math.ceil(cells.length/per)); if(page>=pages) page=pages-1; if(page<0) page=0;
  const out=Array(c*r).fill('<div class="tile empty" aria-hidden="true"></div>');
  mask.forEach((m,i)=>{ if(!m) out[i]='<div class="tile weak" aria-hidden="true"></div>'; });
  cells.slice(page*per,page*per+per).forEach((h,u)=>{ out[usable[u]]=h; });
  grid.innerHTML=out.join('');
  $('#pager').hidden=pages<2;
  $('#dots').innerHTML=Array.from({length:pages},(_,i)=>`<i class="${i===page?'on':''}"></i>`).join('');
}
const visibleItems=keys=>keys.map(getItem).filter(it=>it&&(editing||!it.hidden));
const HOME=[['core','⭐'],['quick','⚡'],['pain','🩹'],['list:feel','😊'],['list:body','♿'],['list:food','🍎'],['list:drinks','🥤'],['list:toys','🧸'],
  ['personal','💛'],['scenes','🖼️'],['library','📚'],['keyboard','⌨️']];
function viewTitle(v){ if(v.startsWith('list:')) return listOf(v.slice(5)).n[L()]; return UI[v]?ui(v):v; }
function libraryFolders(){
  return [folderHTML('personal','💛',ui('personal'),custom.length),
    ...LIST_ORDER.filter(id=>id!=='personal').map(id=>folderHTML('list:'+id,LISTS[id].e,LISTS[id].n[L()],LISTS[id].items.length)),
    ...TOPIC_ORDER.map(id=>folderHTML('list:'+id,TOPICS[id].e,TOPICS[id].n[L()],TOPICS[id].items.length))];
}
function renderBoard(){
  grid.hidden=true; painEl.hidden=true; sceneEl.hidden=true; kbdEl.hidden=true; $('#pager').hidden=true;
  const v=view;
  if(v==='pain'){ painEl.hidden=false; renderPain(); return; }
  if(v.startsWith('scene:')){ sceneEl.hidden=false; renderScene(v.slice(6)); return; }
  if(v==='keyboard'){ kbdEl.hidden=false; renderKeyboard(); return; }
  grid.hidden=false;
  if(v==='core'){
    const [c,r]=dims(); sizeGrid(c,r);
    grid.innerHTML=coreLayout(c,r).map(k=>{ const it=getItem(k); return it&&(!it.hidden||editing)?tileHTML(it):'<div class="tile empty" aria-hidden="true"></div>'; }).join('');
    pages=1; return;
  }
  if(v==='home') return layCells(HOME.map(([id,e])=>folderHTML(id,e,viewTitle(id))));
  if(v==='library'||v==='topics') return layCells(libraryFolders());
  if(v==='quick') return layCells(visibleItems(QUICKFIRES).map(it=>tileHTML(it)));
  if(v==='scenes'){
    const all=[...SCENES.map(s=>({id:s.id,e:s.e,n:s.n[L()]})),...scenesC.map(s=>({id:s.id,e:'📷',n:s.title,img:s.img}))];
    return layCells(all.map(s=>folderHTML('scene:'+s.id,s.e,s.n,null,s.img&&urls.get(s.img))));
  }
  if(v==='personal') return layCells(PERSONAL.map(([g,e,n])=>folderHTML('pgroup:'+g,e,n[L()],custom.filter(c=>c.group===g).length)));
  if(v.startsWith('pgroup:')){
    const g=v.slice(7), items=visibleItems(custom.filter(c=>c.group===g).map(c=>'mine:'+c.id));
    if(!items.length){ const n=PERSONAL.find(p=>p[0]===g); return layCells([noteHTML(n?n[1]:'💛','Add words here: hold the gear › Photos, voices &amp; scenes › Add a personal word')]); }
    return layCells(items.map(it=>tileHTML(it)));
  }
  if(v.startsWith('list:')){ const l=listOf(v.slice(5)); return layCells(l?visibleItems(l.items).map(it=>tileHTML(it)):[]); }
}
function renderNav(){
  const nav=[['back','↩︎','goback'],['core','⭐','core'],['library','📚','library'],['quick','⚡','quick'],['keyboard','⌨️','keyboard'],['pain','🩹','pain'],['scenes','🖼️','scenes']];
  const sec=section();
  let h=nav.map(([id,e,k])=>`<button class="nv dwell" data-act="${id==='back'?'back':'go'}" data-id="${id}" aria-current="${id===sec}"><span class="i" aria-hidden="true">${e}</span><span>${esc(ui(k))}</span></button>`).join('');
  if(settings.restBtn&&(settings.mode==='dwell'||settings.mode==='ipad')) h+=`<button id="restNav" class="nv util dwell" data-act="pause" aria-pressed="${paused}"><span class="i" aria-hidden="true">${paused?'▶️':'😌'}</span><span>${esc(paused?ui('resume'):ui('rest'))}</span></button>`;
  h+=`<button class="nv hold" id="gearNav" aria-label="Carer settings, press and hold"><span class="i" aria-hidden="true">⚙︎</span><span>${esc(ui('hold'))}</span></button>`;
  $('#nav').innerHTML=h; hold($('#gearNav'),1500,openSettings);
  $('#gearNav').addEventListener('click',()=>toast('Press and hold for 1.5 seconds to open carer settings'));
}
// which navigation button lights up for the open page
function section(){ const v=view; if(v.startsWith('scene:')) return 'scenes';
  if(v.startsWith('pgroup:')||v.startsWith('list:')||v==='personal'||v==='topics') return 'library'; return v; }
function renderYesNo(){
  $('#yesno').innerHTML=['core:yes','core:no'].map(k=>{const it=getItem(k); return `<button class="yn dwell fk-${it.c}" data-act="tile" data-id="${k}" aria-label="${esc(word(it))}"><span class="sym" aria-hidden="true">${esc(it.e)}</span><span class="lbl">${esc(word(it))}</span></button>`;}).join('');
}
function chipHTML(it){
  const u=it.img&&urls.get(it.img);
  return `<span class="chip fk-${it.c}">${u?`<img src="${u}" alt="">`:`<span class="e" aria-hidden="true">${esc(it.e)}</span>`}<span class="w">${esc(word(it))}</span></span>`;
}
// ---------- Next row: grammar-aware suggestions plus the child's own learned word pairs ----------
const NEXT_LISTS={want:['drinks','food','toys'],need:['drinks','food','body'],like:['food','toys','animals'],get:['drinks','food','toys'],have:['food','toys'],
  eat:['food'],drink:['drinks'],play:['toys','sport'],go:['places'],feel:['feel'],look:['animals','media'],see:['animals','people'],watch:['media'],
  read:['school'],wash:['bodyparts'],brush:['bodyparts'],help:['people'],make:['food'],put:['clothes'],open:['home'],close:['home']};
function suggestions(){
  const last=msg[msg.length-1], out=[], seen=new Set(last?[last.key]:[]);
  const add=k=>{ if(out.length>=6||seen.has(k)) return; const it=getItem(k); if(!it||it.hidden) return; seen.add(k); out.push(it); };
  Object.entries(log.next[last?last.key:'^']||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).forEach(([k])=>add(k));
  const g=last&&last.g;
  if(!last) ['core:i','core:want','core:more','core:help','core:stop','quick:im-hungry'].forEach(add);
  else if(g&&g.t==='S') ['core:want','core:like','core:go','core:need','core:feel','core:can','core:eat','core:play'].forEach(add);
  else if(g&&g.t==='NEG') ['core:want','core:like','core:can','core:go','core:need'].forEach(add);
  else if(g&&g.t==='V'){
    if(g.v==='can') ['core:go','core:play','core:eat','core:drink','core:help','core:see'].forEach(add);
    const pool=(NEXT_LISTS[g.v]||[]).flatMap(id=>(listOf(id)||{items:[]}).items);
    pool.map((k,i)=>({k,s:(log.sel[k]||0)*100-i})).sort((a,b)=>b.s-a.s).forEach(o=>add(o.k));
    if(['want','need','like'].includes(g.v)) ['core:eat','core:drink','core:play','core:go'].forEach(add);
  }
  else if(last.c==='q') ['core:you','core:i','core:is','core:want','core:go','core:it'].forEach(add);
  else ['core:please','core:more','core:and','core:not','core:finished','time:now'].forEach(add);
  ['core:more','core:please','core:finished','core:i','core:want','core:help'].forEach(add);
  return out;
}
function renderNext(){
  const nx=$('#next'); nx.hidden=!settings.suggest||settings.cvi||view==='keyboard'; if(nx.hidden) return;
  const s=suggestions();
  nx.querySelector('.nrow').innerHTML=Array.from({length:6},(_,i)=>{ const it=s[i]; if(!it) return '<div class="nx blank" aria-hidden="true"></div>';
    const u=it.img&&urls.get(it.img);
    return `<button class="nx dwell fk-${it.c}" data-act="tile" data-id="${esc(it.key)}"><span class="e" aria-hidden="true">${u?`<img src="${u}" alt="" style="width:1.6em;height:1.6em;object-fit:cover;border-radius:50%">`:esc(it.e)}</span><span class="w">${esc(word(it))}</span></button>`; }).join('');
}
function learnPair(prev,it){ const a=prev?prev.key:'^', b=it.key; if(!b||b==='pain'||b.startsWith('typed:')||(a!=='^'&&(a==='pain'||a.startsWith('typed:')))) return;
  const m=log.next[a]=log.next[a]||{}; m[b]=(m[b]||0)+1;
  const ks=Object.keys(log.next); if(ks.length>400) delete log.next[ks[0]]; }
function renderMsg(){
  const s=sentence(), joined=capF(msg.map((it,i)=>plainW(it,settings.lang,i>0)).join(' '));
  msgEl.innerHTML=msg.length?`<span class="chips">${msg.map(chipHTML).join('')}</span>${s!==joined?`<span class="says">${settings.lang==='af'?'Sê':'Says'}: <b>${esc(s)}</b></span>`:''}`:'<span class="ph">Choose pictures to build a message</span>';
  const ch=msgEl.querySelector('.chips'); if(ch) ch.scrollLeft=ch.scrollWidth;
  const p=$('#partner'); p.hidden=!settings.partner;
  if(settings.partner) p.innerHTML=msg.length?esc(s):'<span class="ph">The message will appear here for you</span>';
  renderNext();
}
function renderUI(){
  $$('[data-ui]').forEach(el=>el.textContent=ui(el.dataset.ui));
  document.documentElement.lang=LANGS[settings.lang].bcp;
  $('#langBtn').hidden=!settings.lang2;
  if(settings.lang2) $('#langCodes').textContent=`${LANGS[settings.lang].code} ⇄ ${LANGS[settings.lang2].code}`;
  app.classList.toggle('gaze',gaze());
  app.classList.toggle('cvi',!!settings.cvi); app.classList.toggle('ts-classic',settings.tileStyle==='classic'&&!settings.cvi); app.style.setProperty('--word-scale',(settings.wordSize||100)/100); document.body.classList.toggle('cvi-on',!!settings.cvi);
  app.classList.toggle('sil',!!settings.sil); ['gentle','spotlight'].forEach(m=>app.classList.toggle('motion-'+m,settings.cvi&&settings.motion===m));
  ['left','right','lower','centre'].forEach(f=>app.classList.toggle('field-'+f,settings.cvi&&settings.field===f));
  app.style.setProperty('--cvi',settings.cviColour); applyCviText(app); app.classList.toggle('nolabels',!settings.labels); app.classList.toggle('hc',settings.hc); app.classList.toggle('editing',editing);
  const restOn=settings.restBtn&&(settings.mode==='dwell'||settings.mode==='ipad');
  const rt=$('#restTop'); rt.classList.toggle('on',restOn); rt.setAttribute('aria-pressed',String(paused));
  rt.querySelector('.restLbl').textContent=paused?ui('resume'):ui('rest'); rt.querySelector('.i').textContent=paused?'▶️':'😌';
  $('#backTop').classList.toggle('on',gaze()&&view!=='home');
  document.body.classList.toggle('paused',paused); $('#restNote').hidden=!paused;
}
function renderAll(){ renderUI(); renderNav(); renderBoard(); renderYesNo(); renderMsg(); startSpot(); }

// ---------- navigation ----------
function go(v){ if(!v||v===view) return; hist.push(view); if(hist.length>30) hist.shift(); view=v; page=0; painPart=null; typed=''; afterNav(); }
function back(){ view=hist.length?hist.pop():(gaze()?'home':'core'); page=0; painPart=null; afterNav(); }
function afterNav(){ renderBoard(); renderNav(); renderUI(); renderNext(); startSpot(); }

// ---------- keyboard with word prediction ----------
const KROWS=['qwertyuiop','asdfghjkl\'','zxcvbnmêëô'];
function predictions(){
  const t=typed.toLowerCase(); if(!t) return [];
  const seen=new Set(), out=[], li=L();
  const pool=[...Object.keys(ITEMS),...custom.map(c=>'mine:'+c.id)];
  for(const k of pool){ const it=getItem(k); if(!it||it.hidden) continue; const w=word(it).toLowerCase();
    if(!(w.startsWith(t)||w.split(/\s+/).some(p=>p.startsWith(t)))||seen.has(w)) continue;
    seen.add(w); out.push({k,it,score:(k.startsWith('core:')?0:1)*100+w.length+(w.startsWith(t)?0:50)}); }
  return out.sort((a,b)=>a.score-b.score).slice(0,5).map(o=>o.it);
}
function renderKeyboard(){
  const preds=predictions();
  const predHTML=Array.from({length:5},(_,i)=>preds[i]?tileHTML(preds[i],'pred','pred'):'<div class="tile empty" aria-hidden="true"></div>').join('');
  const row=keys=>`<div class="krow" style="grid-template-columns:repeat(${keys.length},minmax(0,1fr))">${[...keys].map(ch=>`<button class="key dwell" data-act="key" data-id="${esc(ch)}">${esc(ch)}</button>`).join('')}</div>`;
  kbdEl.innerHTML=`<div class="kpred"><div class="typed" aria-live="polite">${esc(typed)}<span class="cur"></span></div>${predHTML}</div>
    ${KROWS.map(row).join('')}
    <div class="krow" style="grid-template-columns:1fr 4fr 1.4fr 1.6fr">
      <button class="key dwell wide" data-act="key" data-id="?">?</button>
      <button class="key dwell wide" data-act="kspace">${esc(ui('space'))}</button>
      <button class="key dwell wide" data-act="kback" data-repeat="1">⌫</button>
      <button class="key dwell wide go" data-act="kadd">${esc(ui('addword'))} ➕</button>
    </div>`;
}
function commitTyped(){ const w=typed.trim(); if(!w) return; const it={key:'typed:'+w.toLowerCase(),e:'⌨️',w:[w,w],c:'n',custom:true,label:w,audio:sharedRec(w)};
  msg.push(it); lastAdd=Date.now(); typed=''; renderMsg(); if(settings.speakEach) sayItems([it]); }

// ---------- scenes ----------
function renderScene(id){
  const b=SCENES.find(s=>s.id===id), c=scenesC.find(s=>s.id===id);
  if(!b&&!c){ back(); return; }
  const hs=+settings.hs; let inner='', cls='', style='';
  if(b){ cls='sc-'+b.id; inner=b.hot.map((h,i)=>{ const it=getItem(`scn:${b.id}:${i}`); const u=it.img&&urls.get(it.img);
      return `<button class="hot dwell fk-${it.c}" data-act="tile" data-id="scn:${b.id}:${i}" style="left:${h.x}%;top:${h.y}%"><span class="sym" aria-hidden="true">${u?`<img src="${u}" alt="" style="width:${hs*.6}px;height:${hs*.6}px;object-fit:cover;border-radius:50%">`:esc(it.e)}</span><span class="lbl">${esc(word(it))}</span></button>`; }).join(''); }
  else { cls='photo'; const u=urls.get(c.img)||'';
    inner=`<img class="bgimg" src="${u}" alt="">`+c.hot.map((h,i)=>`<button class="hot dwell" data-act="tile" data-id="scn:${c.id}:${i}" style="left:${h.x}%;top:${h.y}%"><span class="lbl">${esc(h.label)}</span></button>`).join(''); }
  sceneEl.innerHTML=`<div class="sbox ${cls}" style="${style};--hs:${hs}px">${inner}</div>`;
  if(c){ const box=sceneEl.firstElementChild; const W=sceneEl.clientWidth, H=sceneEl.clientHeight, ar=(c.w||4)/(c.h||3);
    if(W/H>ar){ box.style.height=H+'px'; box.style.width=(H*ar)+'px'; } else { box.style.width=W+'px'; box.style.height=(W/ar)+'px'; } }
}

// ---------- body map ----------
function face(level){
  const mouths=['M30 62 Q50 78 70 62','M32 64 Q50 72 68 64','M32 66 L68 66','M32 70 Q50 60 68 70','M30 74 Q50 56 70 74'];
  const brow=level>=3?'<path d="M28 38 L42 32 M72 38 L58 32" stroke="#14202c" stroke-width="4" stroke-linecap="round"/>':'';
  const tear=level===4?'<path d="M70 48 q4 8 0 12 q-4 -4 0 -12z" fill="#3d84d1"/>':'';
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="var(${LEVELS[level].col})"/><circle cx="36" cy="44" r="5" fill="#14202c"/><circle cx="64" cy="44" r="5" fill="#14202c"/>${brow}${tear}<path d="${mouths[level]}" stroke="#14202c" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
}
const tightIcon=()=>`<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="var(--fk-d)"/><path d="M22 50 L34 38 L46 62 L58 38 L70 62 L80 50" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
function sideOf(n){ if(!n) return null; return ((n===1)===settings.mirror)?'left':'right'; }
function partName(p,l=settings.lang){ const i=L(l), name=PARTS[p.part][i]; if(!p.side) return name; const s=SIDES[p.side][i];
  return i===0?capF(s)+' '+name.toLowerCase():capF(s)+name.toLowerCase(); }
function renderPain(){
  const regs=settings.simpleBody?REG_SIMPLE:REG_DETAIL, sel=painPart?painPart.id:'';
  const parts=regs.map(([part,n,b])=>{const id=part+(n||''); const p={part,side:sideOf(n)};
    return `<button class="part dwell ${id===sel?'sel':''}" data-act="part" data-id="${id}" data-part="${part}" data-side="${p.side||''}" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"><span>${esc(partName(p))}</span></button>`;}).join('');
  painEl.innerHTML=`
   <div class="figwrap">
     <div class="fig">
       <svg viewBox="0 0 200 400" aria-hidden="true">
         <circle class="b" cx="100" cy="40" r="30"/><rect class="b" x="88" y="66" width="24" height="22" rx="6"/>
         <rect class="b" x="60" y="84" width="80" height="128" rx="24"/>
         <rect class="b" x="26" y="92" width="28" height="104" rx="14"/><rect class="b" x="146" y="92" width="28" height="104" rx="14"/>
         <circle class="b" cx="40" cy="212" r="16"/><circle class="b" cx="160" cy="212" r="16"/>
         <rect class="b" x="64" y="206" width="33" height="142" rx="15"/><rect class="b" x="103" y="206" width="33" height="142" rx="15"/>
         <ellipse class="b" cx="74" cy="362" rx="26" ry="13"/><ellipse class="b" cx="126" cy="362" rx="26" ry="13"/>
       </svg>
       ${parts}
     </div>
     <div class="sidecol">
       <button class="tile dwell fk-n" data-act="part" data-id="back" data-part="back" data-side="" style="${sel==='back'?'box-shadow:inset 0 0 0 4px var(--fk-x)':''}"><span class="sym" aria-hidden="true">🧍</span><span class="lbl">${esc(ui('back'))}</span></button>
       <div class="sideflag">${settings.mirror?'Mirror view':'Facing view'}</div>
     </div>
   </div>
   <div class="lvlpanel">
     <div class="lvlhead"><span aria-hidden="true">${painPart?'👉':'👀'}</span><span>${esc(painPart?partName(painPart):ui('pick'))}</span></div>
     <div class="lvls ${painPart?'':'off'}">${LEVELS.map((lv,i)=>`<button class="lvl ${painPart?'dwell':''}" ${painPart?'':'disabled'} data-act="level" data-id="${i}" style="--lv:var(${lv.col})">${lv.tight?tightIcon():face(i)}<span class="lbl">${esc(lv.lbl[L()])}</span></button>`).join('')}</div>
   </div>`;
}
function painItem(p,lv){ return {key:'pain',e:LEVELS[lv].tight?'⚡':'🩹',w:LC.map((l,i)=>partName(p,l)+'. '+LEVELS[lv].say[i]),c:lv===0?'s':'x'}; }

// ---------- speech ----------
let voices=[];
function loadVoices(){ try{voices=speechSynthesis.getVoices();}catch(e){voices=[];} fillVoiceSelect(); }
const langVoices=code=>voices.filter(v=>v.lang.replace('_','-').toLowerCase().startsWith(code));
function pickVoice(){
  if(settings.voice){ const v=voices.find(v=>v.voiceURI===settings.voice); if(v&&v.lang.toLowerCase().startsWith(settings.lang)) return v; }
  const lv=langVoices(settings.lang); if(lv.length) return lv.find(v=>/ZA/i.test(v.lang))||lv[0];
  const en=langVoices('en'); return en.find(v=>/ZA/i.test(v.lang))||en.find(v=>/GB/i.test(v.lang))||en[0]||null;
}
// Some voices read a lone capital "I" as "capital I". Say the word "eye" instead (same sound) when "I" is spoken on its own.
function speakable(text){ const t=String(text); if(settings.lang!=='en') return t; return /^\s*I\s*[.!?]?\s*$/.test(t)?'eye':t.replace(/(^|[\s.,!?])I(?=[.,!?]?\s*$)/,'$1eye'); }
function utter(text){ const u=new SpeechSynthesisUtterance(speakable(text)); const v=pickVoice(); if(v){u.voice=v;u.lang=v.lang;} else u.lang=LANGS[settings.lang].bcp; u.rate=settings.rate; return u; }
let curAudio=null, speakTok=0;
function stopAll(){ speakTok++; try{speechSynthesis.cancel();}catch(e){} if(curAudio){ try{curAudio.pause();}catch(e){} curAudio=null; } if(curSrc){ try{curSrc.stop();}catch(e){} curSrc=null; } }
let curSrc=null;
function audioCtx(){ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume(); return actx; }
document.addEventListener('pointerdown',()=>{ try{ audioCtx(); }catch(e){} },{capture:true,passive:true});
async function bufferFor(k){ if(bufs.has(k)) return bufs.get(k); const b=await idb.get(k); if(!b) return null;
  const ab=await b.arrayBuffer(); const buf=await new Promise((res,rej)=>{ try{ const p=audioCtx().decodeAudioData(ab,res,rej); if(p&&p.catch) p.catch(rej); }catch(e){ rej(e); } });
  bufs.set(k,buf); return buf; }
function playBuffer(buf){ return new Promise(res=>{ try{ const ctx=audioCtx(); const src=ctx.createBufferSource(); src.buffer=buf; src.connect(ctx.destination);
  src.onended=()=>res(true); curSrc=src; src.start(); setTimeout(()=>res(true),(buf.duration+1)*1000); }catch(e){ res(false); } }); }
// 'ok' | 'missing' (file not stored on this device) | 'failed' (stored but would not play)
async function playKey(k){ if(!k) return 'missing'; let has=false;
  try{ const buf=await bufferFor(k); if(buf){ has=true; if(await playBuffer(buf)) return 'ok'; } }catch(e){ has=has||!!(await idb.get(k)); }
  const u=urls.get(k)||await mediaURL(k); if(!u) return has?'failed':'missing';
  return (await playURL(u))?'ok':'failed'; }
function tts(text){ if(!text||!('speechSynthesis' in window)) return; try{ speechSynthesis.speak(utter(text)); }catch(e){} }
function ttsWait(text){ return new Promise(res=>{ if(!('speechSynthesis' in window)) return res(); let done=false; const fin=()=>{if(!done){done=true;res();}};
  try{ const u=utter(text); u.onend=fin; u.onerror=fin; speechSynthesis.speak(u);}catch(e){fin();} setTimeout(fin,900+text.length*110); }); }
// resolves true when the recording played, false when the browser refused it
function playURL(u){ return new Promise(res=>{ let done=false; const fin=ok=>{ if(!done){ done=true; res(ok); } };
  try{ curAudio=new Audio(u); curAudio.onended=()=>fin(true); curAudio.onerror=()=>fin(false); curAudio.play().catch(()=>fin(false)); setTimeout(()=>fin(true),20000);}catch(e){fin(false);} }); }
let warnedAudio=false;
async function playItemAudio(it){ if(!it.audio) return false; const r=await playKey(it.audio); if(r==='ok') return true;
  if(!warnedAudio){ warnedAudio=true; toast(r==='missing'?'The recording for “'+word(it)+'” is not saved on this device. Add it again (hold the gear › Photos, voices & scenes).':'The recording for “'+word(it)+'” could not play. Try an .m4a or .mp3 file.'); }
  return false; }
function sayItems(list,whole){
  stopAll(); if(!list.length) return; const tok=speakTok; list=list.map(it=>fresh(it));
  const hasAudio=list.some(it=>it.audio);
  if(!hasAudio){ tts(whole?sentence(list):list.map(it=>plainW(it,settings.lang,false)).join(' ')); return; }
  (async()=>{ for(const it of list){ if(tok!==speakTok) return; if(!(await playItemAudio(it))) await ttsWait(plainW(it,settings.lang,false)); } })();
}
const sayText=t=>{ stopAll(); tts(t); };
if('speechSynthesis' in window){ loadVoices(); try{speechSynthesis.addEventListener('voiceschanged',loadVoices);}catch(e){} }
let actx=null;
function tone(freqs,gain=.18,step=.13){ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); const t0=actx.currentTime;
  freqs.forEach((f,i)=>{ const o=actx.createOscillator(),g=actx.createGain(); o.type='sine'; o.frequency.value=f; const s=t0+i*step;
    g.gain.setValueAtTime(0.0001,s); g.gain.exponentialRampToValueAtTime(gain,s+.02); g.gain.exponentialRampToValueAtTime(.0001,s+step*2.2); o.connect(g).connect(actx.destination); o.start(s); o.stop(s+step*2.4); }); }catch(e){} }

// ---------- logging ----------
function today(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function logSel(key){ log.selections++; log.sel[key]=(log.sel[key]||0)+1; const t=today(); log.days[t]=(log.days[t]||0)+1; saveLog(); }

// ---------- activation ----------
let last={key:'',t:0};
const PRACTICE_ACTS=new Set(['target','explore','choose']);
function flash(el){ el.classList.remove('fired'); void el.offsetWidth; el.classList.add('fired'); }
function activate(el){
  if(!el||!el.isConnected) return;
  const act=el.dataset.act, id=el.dataset.id||'', now=performance.now(), key=act+':'+id;
  if(paused&&act!=='pause') return;
  if(!el.dataset.repeat && settings.guard>0 && last.key===key && now-last.t<settings.guard) return;
  last={key,t:now};
  if(act!=='go') flash(el);
  switch(act){
    case 'tile':{ const it=getItem(id); if(!it) break; learnPair(msg[msg.length-1],it); msg.push(it); lastAdd=Date.now(); logSel(id); if(settings.speakEach) sayItems([it]); renderMsg(); break; }
    case 'pred':{ const it=getItem(id); if(!it) break; learnPair(msg[msg.length-1],it); msg.push(it); lastAdd=Date.now(); logSel(id); typed=''; if(settings.speakEach) sayItems([it]); renderMsg(); renderKeyboard(); break; }
    case 'key': typed+=id; renderKeyboard(); break;
    case 'kback': typed=typed.slice(0,-1); renderKeyboard(); break;
    case 'kspace': case 'kadd': commitTyped(); renderKeyboard(); break;
    case 'attn': sayText(ATTN[L()]); tone([660,880,1100,880,1100],.4,.16); document.body.classList.remove('attn'); void document.body.offsetWidth; document.body.classList.add('attn'); setTimeout(()=>document.body.classList.remove('attn'),1700); logSel('attn'); break;
    case 'pause': paused=!paused; renderUI(); renderNav(); startDwell(null); break;
    case 'go': go(id); break;
    case 'back': back(); break;
    case 'speak': if(typed) commitTyped(); if(msg.length){ sayItems(msg,true); log.spoken++; log.recent.unshift({t:Date.now(),s:sentence()}); log.recent=log.recent.slice(0,40); saveLog(); } break;
    case 'del': if(view==='keyboard'&&typed){ typed=typed.slice(0,-1); renderKeyboard(); break; } msg.pop(); if(Date.now()-lastAdd<3000){ log.undo++; saveLog(); lastAdd=0; } renderMsg(); break;
    case 'clear': msg=[]; typed=''; renderMsg(); if(view==='keyboard') renderKeyboard(); break;
    case 'share':{ const s=sentence(); if(!s) break; (navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>toast('Message copied'),()=>toast(s)); break; }
    case 'lang': if(settings.lang2){ const a=settings.lang; settings.lang=settings.lang2; settings.lang2=a; settings.voice=''; save(); refreshMsg(); renderAll(); sayText(LANGS[settings.lang].name); } break;
    case 'prev': case 'next': page=(page+(act==='next'?1:-1)+pages)%pages; renderBoard(); startSpot(); break;
    case 'part':{ painPart={id,part:el.dataset.part,side:el.dataset.side||null}; sayText(partName(painPart)); renderPain(); break; }
    case 'level':{ if(!painPart) break; const lv=+id, it=painItem(painPart,lv); msg.push(it); renderMsg(); sayText(word(it));
      log.pain.unshift({t:Date.now(),part:painPart.part,side:painPart.side,level:lv}); log.pain=log.pain.slice(0,200); log.selections++; saveLog();
      painPart=null; setTimeout(()=>{ if(view==='pain') renderPain(); if(settings.mode==='scan') startScan(); },500); return; }
    case 'target': hitTarget(); return;
    case 'explore': exploreHit(el); return;
    case 'choose': chooseHit(el); return;
  }
  if(settings.mode==='scan') setTimeout(startScan,30);
}
const settingsOpen=()=>!$('#settings').hidden||!$('#editor').hidden||!$('#sceneEd').hidden;
const practiceOpen=()=>!$('#practice').hidden;
const overlayOpen=()=>settingsOpen()||practiceOpen()||!$('#auth').hidden;

document.addEventListener('pointerdown',e=>{
  lastPType=e.pointerType||'mouse';
  if(settings.mode==='scan' && !overlayOpen() && !editing && !e.target.closest('#gear2,#gearNav,#editbar')){ e.preventDefault(); switchSelect(); }
},true);
document.addEventListener('click',e=>{
  const el=e.target.closest('.dwell'); if(!el||el.disabled) return;
  const act=el.dataset.act;
  if(editing){ if(act==='tile'&&!el.dataset.id.startsWith('scn:')) openEditor(el.dataset.id); else if(['go','back','prev','next'].includes(act)) activate(el); return; }
  const prac=PRACTICE_ACTS.has(act);
  if(settings.mode==='scan' && !prac) return;
  if(settings.mode==='dwell' && lastPType!=='touch') return;
  activate(el);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && practiceOpen()){ closePractice(); return; }
  if(settingsOpen()||editing) return;
  if(settings.mode==='scan' && !practiceOpen() && (e.key===' '||e.key==='Enter')){ e.preventDefault(); if(!e.repeat) switchSelect(); return; }
  if(view==='keyboard' && settings.mode!=='scan' && !practiceOpen()){
    if(e.key.length===1&&!e.metaKey&&!e.ctrlKey){ e.preventDefault(); if(e.key===' ') commitTyped(); else typed+=e.key.toLowerCase(); renderKeyboard(); }
    else if(e.key==='Backspace'){ e.preventDefault(); typed=typed.slice(0,-1); renderKeyboard(); }
    else if(e.key==='Enter'){ e.preventDefault(); activate($('.ctl.speak')); }
  }
});

// ---------- app dwell ----------
const D={el:null,start:0,raf:0,fired:false};
function startDwell(t){
  if(D.el){ D.el.classList.remove('dwelling'); D.el.style.removeProperty('--p'); }
  cancelAnimationFrame(D.raf); D.el=t||null; D.fired=false;
  if(!D.el) return;
  D.start=performance.now(); D.el.classList.add('dwelling'); D.raf=requestAnimationFrame(tick);
}
function tick(now){
  const el=D.el; if(!el||!el.isConnected){ startDwell(null); return; }
  const p=Math.max(0,Math.min(1,(now-D.start)/settings.dwell)); el.style.setProperty('--p',p);
  if(p>=1 && !D.fired){
    D.fired=true; el.classList.remove('dwelling'); el.style.setProperty('--p',0); activate(el);
    if(el.dataset.repeat && el.isConnected){ D.start=now+400; D.fired=false; el.classList.add('dwelling'); }
    else { if(PRACTICE_ACTS.has(el.dataset.act)) D.el=null; return; }
  }
  D.raf=requestAnimationFrame(tick);
}
document.addEventListener('pointerover',e=>{
  if(settings.mode!=='dwell'||e.pointerType==='touch'||settingsOpen()||editing) return;
  let t=e.target.closest('.dwell'); if(t&&t.disabled) t=null;
  if(paused&&t&&t.dataset.act!=='pause') t=null;
  if(t!==D.el) startDwell(t);
});
document.addEventListener('pointerout',e=>{ if(!e.relatedTarget) startDwell(null); });
// say the word when the child's gaze (or pointer) lands on it
const labelOf=el=>{ const l=el&&(el.querySelector('.lbl')||el.querySelector('.w')); return l?(l.firstChild&&l.firstChild.nodeType===3?l.firstChild.textContent:l.textContent).trim():''; };
let lookEl=null, lookT=0;
function sayEl(el){ const it=el.dataset.id&&getItem(el.dataset.id);
  if(it&&it.audio){ stopAll(); playItemAudio(it).then(ok=>{ if(!ok) sayText(labelOf(el)); }); return; }
  const w=labelOf(el); if(w) sayText(w); }
document.addEventListener('pointerover',e=>{
  if(!settings.lookSpeak||e.pointerType==='touch'||overlayOpen()||editing||paused) return;
  const t=e.target.closest('.tile.dwell,.nx.dwell,.yn.dwell,.hot.dwell,.part.dwell,.lvl.dwell'); if(t===lookEl) return; lookEl=t; clearTimeout(lookT);
  if(t) lookT=setTimeout(()=>sayEl(t),260);
});
// CVI spotlight: one item at a time lights up and is said aloud
let spotTimer=0, spotIdx=-1;
function stopSpot(){ clearInterval(spotTimer); spotTimer=0; $$('.spot').forEach(el=>el.classList.remove('spot')); }
function spotStep(){
  if(overlayOpen()||editing) return;
  const els=[...$$('#grid .dwell'),...$$('#scene .dwell'),...$$('#yesno .dwell')].filter(el=>el.offsetParent!==null&&!el.disabled);
  $$('.spot').forEach(el=>el.classList.remove('spot')); if(!els.length||paused) return;
  spotIdx=(spotIdx+1)%els.length; const el=els[spotIdx]; el.classList.add('spot'); sayEl(el);
}
function startSpot(){ stopSpot(); if(!(settings.cvi&&settings.motion==='spotlight')||settings.mode==='scan') return; spotIdx=-1; setTimeout(spotStep,600); spotTimer=setInterval(spotStep,settings.spotMs); }

// ---------- switch scanning ----------
const S={level:0,gi:0,ii:0,loops:0,groups:[],timer:0};
function rowsOf(els){ const rows=[]; els.forEach(el=>{ const r=el.getBoundingClientRect(); if(!r.width) return; const y=r.top+r.height/2;
  let row=rows.find(g=>Math.abs(g.y-y)<Math.max(20,r.height*.4)); if(!row){ row={y,els:[]}; rows.push(row);} row.els.push(el); });
  rows.sort((a,b)=>a.y-b.y); rows.forEach(r=>r.els.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left)); return rows.map(r=>r.els); }
function scanGroups(){
  const g=[];
  if(view==='pain'){ if(painPart) g.push(...rowsOf($$('#pain .lvls .dwell'))); g.push(...rowsOf($$('#pain .figwrap .dwell'))); }
  else if(!sceneEl.hidden) g.push(...rowsOf($$('#scene .dwell')));
  else if(!kbdEl.hidden) g.push(...rowsOf($$('#kbd .dwell')));
  else g.push(...rowsOf($$('#grid .dwell')));
  if(!$('#pager').hidden) g.push($$('#pager .dwell'));
  if(!$('#next').hidden) g.push($$('#next .dwell'));
  if(gaze()) g.push($$('#yesno .dwell'));
  g.push($$('#msgbar .dwell').filter(el=>el.offsetParent!==null));
  if(!gaze()) g.push($$('#nav .dwell'));
  return g.filter(x=>x.length);
}
function clearScan(){ $$('.scan-grp,.scan-hi').forEach(el=>el.classList.remove('scan-grp','scan-hi')); }
function paintScan(){
  clearScan(); const g=S.groups[S.gi]; if(!g) return;
  if(S.level===0) g.forEach(el=>el.classList.add('scan-grp')); else g[S.ii].classList.add('scan-hi');
}
function stepScan(){
  if(overlayOpen()||editing) return;
  if(S.level===0) S.gi=(S.gi+1)%S.groups.length;
  else { S.ii++; if(S.ii>=S.groups[S.gi].length){ S.ii=0; if(++S.loops>=2) S.level=0; } }
  paintScan();
}
function restartTimer(){ clearInterval(S.timer); S.timer=setInterval(stepScan,settings.scan); }
function startScan(){ if(settings.mode!=='scan'||editing) return; S.groups=scanGroups(); S.level=0; S.gi=0; S.ii=0; S.loops=0; paintScan(); restartTimer(); }
function stopScan(){ clearInterval(S.timer); clearScan(); }
function switchSelect(){
  const g=S.groups[S.gi]; if(!g) return startScan();
  if(S.level===0){ if(g.length===1){ activate(g[0]); return; } S.level=1; S.ii=0; S.loops=0; paintScan(); restartTimer(); }
  else activate(g[S.ii]);
}
function applyMode(){
  if(settings.mode!=='dwell'&&settings.mode!=='ipad') paused=false;
  document.body.className='mode-'+settings.mode+(paused?' paused':'');
  startDwell(null); renderUI(); renderNav();
  if(settings.mode==='scan') startScan(); else stopScan();
  startSpot();
}

// ---------- press-and-hold ----------
function hold(btn,ms,fn){
  if(!btn||btn.dataset.hold) return; btn.dataset.hold='1';
  let t0=0,raf=0;
  const reset=()=>{cancelAnimationFrame(raf);t0=0;btn.style.setProperty('--p',0);};
  const loop=now=>{ const p=Math.min(1,(now-t0)/ms); btn.style.setProperty('--p',p); if(p>=1){reset();fn();return;} raf=requestAnimationFrame(loop); };
  btn.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); t0=performance.now(); raf=requestAnimationFrame(loop); });
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>btn.addEventListener(ev,reset));
  btn.addEventListener('contextmenu',e=>e.preventDefault());
  btn.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.shiftKey){ e.preventDefault(); fn(); } });
}
function toast(t){ const el=$('#toast'); el.textContent=t; el.classList.add('on'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('on'),2600); }
hold($('#gear2'),1500,openSettings);
$('#gear2').addEventListener('click',()=>toast('Press and hold for 1.5 seconds to open carer settings'));

// ---------- settings ----------
function showTab(name){ $$('.tab').forEach(t=>t.setAttribute('aria-selected',t.dataset.tab===name)); $$('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==name);
  if(name==='account') cloudChanged('account-tab'); if(name==='insights') renderInsights(); if(name==='training') renderZoneMap(); if(name==='board'){ renderGramDemo(); renderCoreMap(); } if(name==='personal'){ renderSceneList(); renderRecList(); } }
$$('.tab').forEach(t=>t.addEventListener('click',()=>showTab(t.dataset.tab)));
function openSettings(tab){ stopScan(); stopSpot(); startDwell(null); stopAll(); syncSettings(); $('#settings').hidden=false; cloudChanged('settings-open');
  let name=typeof tab==='string'?tab:(($$('.tab').find(t=>t.getAttribute('aria-selected')==='true')||{dataset:{tab:'access'}}).dataset.tab);
  if(role==='parent'&&($$('.tab').find(t=>t.dataset.tab===name)||{dataset:{}}).dataset.tier==='therapist') name='personal';
  showTab(name); }
function closeSettings(){ $('#settings').hidden=true; save(); renderAll(); applyMode(); }
$('#closeSettings').addEventListener('click',closeSettings);
$('#lang').innerHTML=Object.entries(LANGS).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');
$('#gridSize').innerHTML=GRIDS.map(([v,n])=>`<option value="${v}">${n}</option>`).join('')+'<option value="custom">Choose my own…</option>';
const fmt={dwell:v=>(v/1000).toFixed(1)+' s',scan:v=>(v/1000).toFixed(1)+' s',guard:v=>v?(v/1000).toFixed(1)+' s':'Off',rate:v=>Number(v).toFixed(2)+'×'};
const BOOLS=['labels','speakEach','hc','showL2','restBtn','skipWeak','simpleBody','mirror','grammar','sil','lookSpeak','suggest','bubble','bLight','bHide'];
fmt.spotMs=v=>(v/1000).toFixed(1)+' s';
function syncSettings(){
  $$('#modes .mode').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===settings.mode));
  ['dwell','scan','guard','rate'].forEach(k=>{ $('#'+k).value=settings[k]; $('#'+k+'Out').textContent=fmt[k](settings[k]); });
  $('#lang').value=settings.lang;
  $('#lang2').innerHTML='<option value="">None</option>'+Object.entries(LANGS).filter(([k])=>k!==settings.lang).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');
  $('#lang2').value=settings.lang2; $('#gridSize').value=GRID_IDS.includes(settings.grid)?settings.grid:'custom'; syncGridCustom();
  $('#tileStyle').value=settings.tileStyle; $('#wordSize').value=settings.wordSize; $('#wordSizeOut').textContent=settings.wordSize+'%'; $('#tileSize').value=settings.tileSize; $('#tileSizeOut').textContent=settings.tileSize>=100?'Fill the space':settings.tileSize+'%'; $('#layout').value=settings.layout; $('#hs').value=settings.hs;
  BOOLS.forEach(k=>$('#'+k).checked=!!settings[k]);
  $('#partnerOn').checked=settings.partner;
  $('#cvi').checked=!!settings.cvi; $('#cviGrid').value=settings.cviGrid; $('#motion').value=settings.motion; $('#field').value=settings.field;
  $('#spotMs').value=settings.spotMs; $('#spotMsOut').textContent=fmt.spotMs(settings.spotMs);
  [['bOut','px'],['bGap','px'],['cviText','%']].forEach(([k,u])=>{ $('#'+k).value=settings[k]; $('#'+k+'Out').textContent=settings[k]+(u==='%'?'%':' px'); });
  $('#cviFont').value=settings.cviFont;
  $('#swatches').innerHTML=CVI_COLOURS.map(([c,n])=>`<button class="sw" style="--c:${c}" data-col="${c}" aria-label="${n}" aria-pressed="${settings.cviColour===c}"></button>`).join('');
  renderPreview();
  const w=weakZones().filter(Boolean).length, have=zoneStats().filter(v=>v!=null).length;
  $('#skipWeakNote').textContent= have<5 ? 'Play Gaze training › Target first so the board knows which spots are hard to reach' :
    (w?`${w} hard-to-reach area${w>1?'s':''} found on the gaze map`:'The gaze map shows no hard-to-reach areas');
  fillVoiceSelect();
}
$$('#modes .mode').forEach(b=>b.addEventListener('click',()=>{ settings.mode=b.dataset.mode; syncSettings(); save(); }));
['dwell','scan','guard'].forEach(k=>$('#'+k).addEventListener('input',e=>{ settings[k]=+e.target.value; $('#'+k+'Out').textContent=fmt[k](settings[k]); save(); }));
$('#rate').addEventListener('input',e=>{ settings.rate=+e.target.value; $('#rateOut').textContent=fmt.rate(settings.rate); save(); });
$('#lang').addEventListener('change',e=>{ settings.lang=e.target.value; if(settings.lang2===settings.lang) settings.lang2=''; settings.voice=''; refreshMsg(); syncSettings(); save(); renderGramDemo(); renderCoreMap(); });
$('#lang2').addEventListener('change',e=>{ settings.lang2=e.target.value; save(); });
function syncGridCustom(){ const [c,r]=settings.grid.split('x').map(Number), cu=$('#gridSize').value==='custom';
  $('#gridCustom').hidden=!cu; $('#gCols').value=c; $('#gRows').value=r; $('#gColsOut').textContent=c; $('#gRowsOut').textContent=r;
  $('#gridTotal').textContent=c*r+' buttons per page'; }
$('#gridSize').addEventListener('change',e=>{ if(e.target.value!=='custom') settings.grid=e.target.value; page=0; save(); syncGridCustom(); renderCoreMap(); });
['gCols','gRows'].forEach(id=>$('#'+id).addEventListener('input',()=>{ settings.grid=$('#gCols').value+'x'+$('#gRows').value; page=0; save(); syncGridCustom(); renderCoreMap(); }));
$('#wordSize').addEventListener('input',e=>{ settings.wordSize=+e.target.value; $('#wordSizeOut').textContent=settings.wordSize+'%'; save(); });
$('#tileStyle').addEventListener('change',e=>{ settings.tileStyle=e.target.value; save(); });
$('#tileSize').addEventListener('input',e=>{ settings.tileSize=+e.target.value; $('#tileSizeOut').textContent=settings.tileSize>=100?'Fill the space':settings.tileSize+'%'; save(); });
$('#layout').addEventListener('change',e=>{ settings.layout=e.target.value; hist=[]; page=0;
  if(gaze()){ view='home'; if(['8x6','10x6','6x5'].includes(settings.grid)) settings.grid='4x4'; } else { view='core'; }
  save(); syncSettings(); renderCoreMap(); });
$('#hs').addEventListener('change',e=>{ settings.hs=e.target.value; save(); });
BOOLS.forEach(k=>$('#'+k).addEventListener('change',e=>{ settings[k]=e.target.checked; save(); if(k==='grammar') renderGramDemo(); if(['sil','bubble','bLight','bHide'].includes(k)) renderPreview(); }));
$('#partnerOn').addEventListener('change',e=>{ settings.partner=e.target.checked; save(); });
$('#cvi').addEventListener('change',e=>{ settings.cvi=e.target.checked; hist=[]; page=0; view=gaze()?'home':'core';
  if(settings.cvi){ if(settings.dwell<1800) settings.dwell=2000; settings.lookSpeak=true; } save(); syncSettings(); });
[['bOut','px'],['bGap','px'],['cviText','%']].forEach(([k,u])=>$('#'+k).addEventListener('input',e=>{ settings[k]=+e.target.value; $('#'+k+'Out').textContent=settings[k]+(u==='%'?'%':' px'); save(); renderPreview(); }));
$('#cviFont').addEventListener('change',e=>{ settings.cviFont=e.target.value; save(); renderPreview(); });
$('#cviGrid').addEventListener('change',e=>{ settings.cviGrid=e.target.value; page=0; save(); });
$('#motion').addEventListener('change',e=>{ settings.motion=e.target.value; save(); renderPreview(); });
$('#field').addEventListener('change',e=>{ settings.field=e.target.value; save(); });
$('#spotMs').addEventListener('input',e=>{ settings.spotMs=+e.target.value; $('#spotMsOut').textContent=fmt.spotMs(settings.spotMs); save(); });
$('#swatches').addEventListener('click',e=>{ const b=e.target.closest('[data-col]'); if(!b) return; settings.cviColour=b.dataset.col; save(); syncSettings(); });
function renderPreview(){ const p=$('#cviPreview'); if(!p) return;
  p.className='preview-wrap cvi'+(settings.sil?' sil':'')+(settings.motion==='gentle'?' motion-gentle':'');
  p.style.setProperty('--cvi',settings.cviColour); applyCviText(p);
  const a=getItem('drinks:water'), b=getItem('food:banana');
  p.innerHTML=tileHTML(a,'spot').replace(/ dwell/,'').replace(/ data-act="tile"/,'')+tileHTML(b).replace(/ dwell/,'').replace(/ data-act="tile"/,''); }
$('#voice').addEventListener('change',e=>{ settings.voice=e.target.value; save(); voiceStatus(); });
$('#testVoice').addEventListener('click',()=>sayText(SAMPLE[L()]));
function fillVoiceSelect(){
  const sel=$('#voice'); if(!sel) return;
  const code=settings.lang, match=langVoices(code), rest=voices.filter(v=>!match.includes(v));
  const opt=v=>`<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`;
  sel.innerHTML=`<option value="">Automatic (best match)</option>`+(match.length?`<optgroup label="${LANGS[code].name}">${match.map(opt).join('')}</optgroup>`:'')+(rest.length?`<optgroup label="Other voices">${rest.map(opt).join('')}</optgroup>`:'');
  sel.value=settings.voice||''; voiceStatus();
}
function voiceStatus(){
  const el=$('#voiceStatus'); if(!el) return;
  if(!('speechSynthesis' in window)){ el.textContent='This browser cannot speak aloud. Open the board in Safari on the iPad.'; return; }
  const n=LANGS[settings.lang].name;
  el.textContent= langVoices(settings.lang).length ? `${n} voice available on this device.` :
    `No ${n} computer voice on this device yet. On the iPad: Settings → Accessibility → Spoken Content → Voices → ${n}. Family recordings on each button also give a natural voice.`;
}
function renderGramDemo(){
  const k=s=>s.split(' ').map(x=>ITEMS[x]);
  const ex=['core:i core:not core:want core:eat food:bread','core:what core:you core:want','core:i core:like core:play toys:ball','core:i core:can core:not core:play','core:where core:she core:go','core:i core:need drinks:juice'];
  $('#gramDemo').innerHTML=ex.map(s=>{ const list=k(s); return `<div><span>${esc(list.map(it=>it.w[L()]).join(' + '))}</span><span>${LC.map(l=>`<b>${LANGS[l].code}</b> ${esc(compose(list,l,settings.grammar))}`).join('<br>')}</span></div>`; }).join('');
}
function renderCoreMap(){
  const [c,r]=dims(); const keys=coreLayout(c,r);
  $('#coreMap').innerHTML=`<p class="note-text" style="margin:4px 0 8px">Core words at this size:</p><div class="coremap" style="grid-template-columns:repeat(${c},minmax(54px,1fr))">${keys.map(k=>{const it=ITEMS[k]; return `<span class="fk-${it.c}">${esc(it.w[L()])}</span>`;}).join('')}</div>`;
}

// ---------- word editor ----------
let ed=null;
function startEditing(){ editing=true; $('#settings').hidden=true; $('#editbar').hidden=false; stopScan(); startDwell(null); renderAll(); }
function stopEditing(){ editing=false; $('#editbar').hidden=true; renderAll(); applyMode(); }
$('#startEdit').addEventListener('click',startEditing);
$('#editDone').addEventListener('click',stopEditing);
$('#addWord').addEventListener('click',()=>openEditor(null));
$('#edGroup').innerHTML=PERSONAL.map(([g,e,n])=>`<option value="${g}">${e} ${n[0]}</option>`).join('');
// signed-in parents may add and change personal words; the therapist sets up everything else
let role='';
function setRole(r){ role=r||''; document.documentElement.classList.toggle('role-parent',role==='parent'); }
function openEditor(key){
  if(role==='parent'&&key&&!key.startsWith('mine:')){ toast('The therapist sets up this button. You can add and change personal words.'); return; }
  if(key&&key.startsWith('typed:')) return;
  const isNew=!key, it=isNew?{key:null,e:'💛',w:['',''],c:'n',custom:true}:getItem(key); if(!it) return;
  const cw=key&&key.startsWith('mine:')?custom.find(z=>'mine:'+z.id===key):null;
  const own=isNew?it:ownItem(key);
  ed={key,isNew,custom:!!it.custom,label:it.custom?it.w[0]:((ov[key]?.labelL||{})[settings.lang]||''),lang:settings.lang,e:it.e,img:it.img||'',audio:own.audio||'',hidden:!!it.hidden,newMedia:[],base:it,group:cw?cw.group:(view.startsWith('pgroup:')?view.slice(7):'family')};
  $('#edTitle').textContent=(isNew?'Add a personal word':'Edit button')+' · '+LANGS[settings.lang].name;
  $('#edLabel').value=ed.label; $('#edLabel').placeholder=it.custom?'e.g. Bongi, Rusty the dog, Spur':word(Object.assign({},it,{label:''}));
  $('#edEmoji').value=ed.e; $('#edHide').checked=ed.hidden; $('#edGroup').value=ed.group;
  $('#edGroupWrap').hidden=!ed.custom; $('#edHideWrap').hidden=ed.custom; $('#edDelete').hidden=!ed.custom||isNew;
  $('#editor').hidden=false; edPreview();
}
function edPreview(){
  const lbl=ed.custom?(ed.label||'New word'):ed.label;
  const it=Object.assign({},ed.base,{label:lbl,e:ed.e||ed.base.e,img:ed.img,audio:ed.audio,key:'preview'});
  $('#edPreview').innerHTML=tileHTML(it).replace('class="tile dwell','class="tile').replace(/ data-act="tile"/,'').replace('<button','<div').replace(/<\/button>$/,'</div>');
  $('#edPhotoState').textContent=ed.img?'Photo added':'No photo'; const ln=LANGS[ed.lang].name, ww=(ed.custom?ed.label:(ed.label||word(Object.assign({},ed.base,{label:''}),ed.lang)))||'this word';
  $('#edAudioState').textContent=ed.audio?`${ln} recording for “${ww}”. It only plays when the board is in ${ln}.`:`No ${ln} recording for “${ww}” yet. To record the other language, switch the board language first.`;
  $('#edPhotoDel').hidden=!ed.img; $('#edAudioDel').hidden=!ed.audio; $('#edAudioPlay').hidden=!ed.audio;
}
$('#edLabel').addEventListener('input',e=>{ ed.label=e.target.value; edPreview(); });
$('#edEmoji').addEventListener('input',e=>{ ed.e=e.target.value.trim(); edPreview(); });
$('#edGroup').addEventListener('change',e=>{ ed.group=e.target.value; });
$('#edHide').addEventListener('change',e=>{ ed.hidden=e.target.checked; });
$('#edPhotoBtn').addEventListener('click',()=>$('#edPhoto').click());
$('#edAudioBtn').addEventListener('click',()=>$('#edAudio').click());
async function shrinkImage(file,max=520){
  const url=URL.createObjectURL(file);
  try{ const img=await new Promise((res,rej)=>{const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url;});
    const s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)); const c=document.createElement('canvas');
    c.width=Math.round(img.naturalWidth*s); c.height=Math.round(img.naturalHeight*s); c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    const blob=await new Promise(res=>c.toBlob(b=>res(b||file),'image/jpeg',.84));
    return {blob,w:c.width,h:c.height};
  } finally { URL.revokeObjectURL(url); }
}
$('#edPhoto').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
  try{ const {blob}=await shrinkImage(f); const k=uid('img'); await idb.put(k,blob); await mediaURL(k); ed.newMedia.push(k); ed.img=k; edPreview(); }
  catch(err){ toast('That photo could not be opened. Try a JPEG or PNG.'); } });
$('#edAudio').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
  if(f.size>8e6){ toast('That recording is too long. Keep it under about a minute.'); return; }
  const k=uid('aud'); await idb.put(k,f); await mediaURL(k); ed.newMedia.push(k); ed.audio=k; edPreview();
  if((await playKey(k))!=='ok') toast('This file could not be played here. Try an .m4a or .mp3 recording.'); });
$('#edPhotoDel').addEventListener('click',()=>{ ed.img=''; edPreview(); });
$('#edAudioDel').addEventListener('click',()=>{ ed.audio=''; edPreview(); });
$('#edAudioPlay').addEventListener('click',async()=>{ stopAll(); const r=await playKey(ed.audio); if(r!=='ok') toast(r==='missing'?'This recording is not saved on this device.':'This recording could not play. Try an .m4a or .mp3 file.'); });
function closeEditor(){ if(rec) stopRec(); $('#editor').hidden=true; ed=null; }
// record straight into Khuluma (works when Khuluma runs as its own website or app; Claude's viewer blocks the microphone)
const inClaudeFrame=(()=>{ try{ return window.self!==window.top; }catch(e){ return true; } })();
let rec=null, recChunks=[], recStream=null, recTimer=0;
async function startRec(){
  if(!navigator.mediaDevices||!window.MediaRecorder){ toast('This browser cannot record. Choose a voice memo file instead.'); return; }
  try{ recStream=await navigator.mediaDevices.getUserMedia({audio:true}); }
  catch(e){ toast(inClaudeFrame?'The microphone is blocked inside Claude. Choose a voice memo file, or open Khuluma as its own website to record here.':'Allow the microphone for this site, then press Record again.'); return; }
  const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(m=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m))||'';
  rec=new MediaRecorder(recStream,mime?{mimeType:mime}:undefined); recChunks=[];
  rec.ondataavailable=e=>{ if(e.data&&e.data.size) recChunks.push(e.data); };
  rec.start(); const b=$('#edRec'); b.classList.add('on'); b.textContent='■ Stop recording';
  recTimer=setTimeout(()=>{ if(rec) finishRec(); },15000);
}
function stopRec(){ return new Promise(res=>{ clearTimeout(recTimer); if(!rec) return res(null);
  const r=rec; r.onstop=()=>{ const blob=new Blob(recChunks,{type:r.mimeType||'audio/mp4'}); try{ recStream.getTracks().forEach(x=>x.stop()); }catch(e){} res(blob); };
  rec=null; try{ r.stop(); }catch(e){ res(null); }
  const b=$('#edRec'); b.classList.remove('on'); b.textContent='🎙️ Record now'; }); }
async function finishRec(){ const blob=await stopRec(); if(!blob||!ed) return; if(blob.size<1500){ toast('That was too short. Press Record, say the word, then press Stop.'); return; }
  const k=uid('aud'); await idb.put(k,blob); await mediaURL(k); ed.newMedia.push(k); ed.audio=k; edPreview(); stopAll(); playKey(k); toast('Recorded. Press Save to keep it.'); }
$('#edRec').addEventListener('click',()=>{ if(rec) finishRec(); else startRec(); });
$('#edCancel').addEventListener('click',()=>{ ed.newMedia.forEach(k=>{ idb.del(k); dropURL(k); }); closeEditor(); });
$('#edSave').addEventListener('click',()=>{
  if(ed.custom){
    if(!ed.label.trim()){ $('#edLabel').focus(); toast('Type the word or phrase first.'); return; }
    const setA=c=>{ c.audioL=Object.assign({},c.audioL||{}); if(ed.audio) c.audioL[ed.lang]=ed.audio; else delete c.audioL[ed.lang]; c.audio=''; return c; };
    if(ed.isNew) custom.push(setA({id:uid('w'),label:ed.label.trim(),e:ed.e||'💛',img:ed.img,group:ed.group}));
    else { const c=custom.find(z=>'mine:'+z.id===ed.key); setA(Object.assign(c,{label:ed.label.trim(),e:ed.e||'💛',img:ed.img,group:ed.group})); }
  } else {
    const prev=ov[ed.key]||{}; const o={}; const ll=Object.assign({},prev.labelL||{}); if(ed.label.trim()) ll[ed.lang]=ed.label.trim(); else delete ll[ed.lang]; if(Object.keys(ll).length) o.labelL=ll; if(ed.e&&ed.e!==baseItem(ed.key).e) o.e=ed.e; if(ed.img) o.img=ed.img; if(ed.hidden) o.hidden=true;
    const al=Object.assign({},prev.audioL||{}); if(ed.audio) al[ed.lang]=ed.audio; else delete al[ed.lang]; if(Object.keys(al).length) o.audioL=al;
    if(Object.keys(o).length) ov[ed.key]=o; else delete ov[ed.key];
  }
  const wasNew=ed.isNew, g=ed.group; save(); recByWord=null; closeEditor(); gcMedia(); refreshMsg(); renderAll();
  toast(wasNew?`Added to ${PERSONAL.find(p=>p[0]===g)[2][0]}`:'Button saved');
});
$('#edDelete').addEventListener('click',()=>{ custom=custom.filter(z=>'mine:'+z.id!==ed.key); save(); recByWord=null; closeEditor(); gcMedia(); renderAll(); toast('Word deleted'); });

// ---------- scene maker ----------
let se=null;
function placeOf(k){ const c=k.split(':')[0]; if(c==='mine') return 'My words'; if(c==='scn'){ const s=SCENES.find(x=>x.id===k.split(':')[1]); return (s?s.n[0]:'Photo')+' scene'; }
  if(c==='core') return 'Core words'; if(c==='quick') return 'QuickFires'; const l=listOf(c); return l?l.n[0]:c; }
function renderRecList(){
  const el=$('#recList'); if(!el) return;
  const where=idb.where(); const recs=[...Object.entries(ov).flatMap(([k,o])=>Object.entries(o.audioL||{}).filter(([,a])=>a).map(([lang,a])=>({key:k,audio:a,lang}))),...custom.flatMap(c=>Object.entries(c.audioL||{}).filter(([,a])=>a).map(([lang,a])=>({key:'mine:'+c.id,audio:a,lang})))];
  $('#recWhere').textContent=where==='db'?'Recordings are saved in this browser on this device.':where==='ls'?'Recordings are saved in this browser’s small backup store. Keep them short (a few seconds each).':'This browser is not allowing Khuluma to save recordings, so they are lost when the page reloads. Open the board in Safari or Chrome directly, not in a private window.';
  el.innerHTML=recs.length?recs.map(r=>{ const it=getItem(r.key); const b=ownItem(r.key,r.lang); const w=b?word(b,r.lang):r.key;
    return `<div><span>🎙️ ${esc(w)} <span class="note-text" style="margin:0">· ${LANGS[r.lang].name} · ${esc(placeOf(r.key))}</span></span><span><button class="btn" data-play="${esc(r.audio)}">Play</button> <span class="note-text" data-res="${esc(r.audio)}" style="margin:0"></span></span></div>`; }).join(''):
    '<div class="empty-state" style="display:block">No buttons have a recording yet. Edit a button and choose a recording, then press Save.</div>';
}
$('#recList')&&$('#recList').addEventListener('click',async e=>{ const b=e.target.closest('[data-play]'); if(!b) return; const k=b.dataset.play; stopAll();
  const r=await playKey(k); const out=$(`[data-res="${CSS.escape(k)}"]`); if(out) out.textContent=r==='ok'?'✓ played':r==='missing'?'✗ not saved on this device':'✗ could not play this file type'; });
function renderSceneList(){
  $('#sceneList').innerHTML=scenesC.length?scenesC.map(s=>`<div><span>📷 ${esc(s.title)} · ${s.hot.length} hotspot${s.hot.length===1?'':'s'}</span><button class="btn" data-edit-scene="${esc(s.id)}">Edit</button></div>`).join(''):
    '<div class="empty-state" style="display:block">No photo scenes yet. The board already has Kitchen, Bath time, Bedtime and Park.</div>';
}
$('#sceneList').addEventListener('click',e=>{ const b=e.target.closest('[data-edit-scene]'); if(b) openSceneEd(b.dataset.editScene); });
$('#newScene').addEventListener('click',()=>openSceneEd(null));
function openSceneEd(id){
  const s=id?scenesC.find(z=>z.id===id):null;
  se=s?{id:s.id,isNew:false,title:s.title,img:s.img,w:s.w,h:s.h,hot:s.hot.map(h=>({...h})),pending:null,newMedia:[]}:{id:uid('s'),isNew:true,title:'',img:'',w:4,h:3,hot:[],pending:null,newMedia:[]};
  $('#seTitleH').textContent=s?'Edit scene':'New scene'; $('#seTitle').value=se.title; $('#seLabel').value=''; $('#seDelete').hidden=!s;
  $('#sceneEd').hidden=false; seRender();
}
function seRender(){
  const u=se.img&&urls.get(se.img);
  $('#sePhotoState').textContent=u?'Photo added':'No photo yet';
  $('#seHint').textContent=u?'Tap the photo where a hotspot should go, type what it should say, then press Add hotspot.':'Choose a photo first.';
  $('#seStage').innerHTML=u?`<img src="${u}" alt="Scene photo">`+se.hot.map(h=>`<span class="mk" style="left:${h.x}%;top:${h.y}%"><span>${esc(h.label)}</span></span>`).join('')+(se.pending?`<span class="mk pending" style="left:${se.pending.x}%;top:${se.pending.y}%"></span>`:''):'<span class="note-text">No photo</span>';
  $('#seList').innerHTML=se.hot.map((h,i)=>`<div><span>📍 ${esc(h.label)}</span><button class="btn danger" data-rmhot="${i}">Remove</button></div>`).join('');
}
$('#seStage').addEventListener('click',e=>{ const img=$('#seStage img'); if(!img) return; const r=img.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width*100, y=(e.clientY-r.top)/r.height*100; if(x<0||x>100||y<0||y>100) return;
  se.pending={x:Math.round(x*10)/10,y:Math.round(y*10)/10}; seRender(); $('#seLabel').focus(); });
$('#seAdd').addEventListener('click',()=>{ const l=$('#seLabel').value.trim();
  if(!se.img){ toast('Choose a photo first.'); return; } if(!se.pending){ toast('Tap the photo to place the hotspot.'); return; } if(!l){ $('#seLabel').focus(); toast('Type what the hotspot should say.'); return; }
  se.hot.push({x:se.pending.x,y:se.pending.y,label:l}); se.pending=null; $('#seLabel').value=''; seRender(); });
$('#seList').addEventListener('click',e=>{ const b=e.target.closest('[data-rmhot]'); if(!b) return; se.hot.splice(+b.dataset.rmhot,1); seRender(); });
$('#sePhotoBtn').addEventListener('click',()=>$('#sePhoto').click());
$('#sePhoto').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
  try{ const r=await shrinkImage(f,1400); const k=uid('scn'); await idb.put(k,r.blob); await mediaURL(k); se.newMedia.push(k); se.img=k; se.w=r.w; se.h=r.h; seRender(); }
  catch(err){ toast('That photo could not be opened. Try a JPEG or PNG.'); } });
$('#seTitle').addEventListener('input',e=>{ se.title=e.target.value; });
$('#seCancel').addEventListener('click',()=>{ se.newMedia.forEach(k=>{ if(!usedMedia().has(k)){ idb.del(k); dropURL(k);} }); $('#sceneEd').hidden=true; se=null; });
$('#seSave').addEventListener('click',()=>{
  if(!se.img){ toast('Choose a photo first.'); return; } if(!se.title.trim()){ $('#seTitle').focus(); toast('Give the scene a name.'); return; }
  if(!se.hot.length){ toast('Add at least one hotspot.'); return; }
  const rec={id:se.id,title:se.title.trim(),img:se.img,w:se.w,h:se.h,hot:se.hot};
  const i=scenesC.findIndex(z=>z.id===se.id); if(i>=0) scenesC[i]=rec; else scenesC.push(rec);
  save(); gcMedia(); $('#sceneEd').hidden=true; se=null; renderSceneList(); toast('Scene saved. Find it under Scenes on the board.');
});
$('#seDelete').addEventListener('click',()=>{ const b=$('#seDelete'); if(b.dataset.armed!=='1'){ b.dataset.armed='1'; b.textContent='Tap again to delete'; setTimeout(()=>{ b.dataset.armed=''; b.textContent='Delete this scene'; },3000); return; }
  scenesC=scenesC.filter(z=>z.id!==se.id); save(); gcMedia(); $('#sceneEd').hidden=true; se=null; renderSceneList(); toast('Scene deleted'); });

// ---------- insights ----------
const fmtDate=t=>{ const d=new Date(t); return d.toLocaleDateString('en-ZA',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}); };
function keyLabel(k){ if(k==='attn') return 'Come here (attention)'; const it=getItem(k); return it?word(it,'en'):(k.startsWith('typed:')?k.slice(6):'(removed word)'); }
const painLabel=p=>partName({part:p.part,side:p.side},'en');
function renderInsights(){
  const days=Object.keys(log.days).length, tot=Object.values(log.sel).reduce((a,b)=>a+b,0), acc=tot?Math.round(log.undo/tot*100):0;
  $('#statGrid').innerHTML=[[log.selections,'selections'],[log.spoken,'messages spoken'],[days,'days used'],[log.pain.length,'pain reports'],[acc+'%','deleted within 3 s']]
    .map(([v,l])=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
  $('#accNote').textContent= acc>=20&&tot>=20 ? 'Many words are deleted straight after being chosen. Try a longer dwell time or a smaller grid.' :
    `Tracking since ${new Date(log.since).toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})}.`;
  const top=Object.entries(log.sel).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $('#topWords').innerHTML= top.length ? `<div class="bars">${top.map(([k,n])=>`<div class="bar"><span>${esc(keyLabel(k))}</span><i style="width:${Math.max(4,n/top[0][1]*100)}%"></i><em>${n}</em></div>`).join('')}</div>` :
    '<div class="empty-state">Words the child chooses will appear here, most used first.</div>';
  $('#recent').innerHTML= log.recent.length ? `<table class="diary"><tbody>${log.recent.slice(0,15).map(r=>`<tr><td style="width:120px">${fmtDate(r.t)}</td><td>${esc(r.s)}</td></tr>`).join('')}</tbody></table>` :
    '<div class="empty-state">Each message the child speaks is listed here, showing how sentence length grows over time.</div>';
  $('#diary').innerHTML= log.pain.length ? `<table class="diary"><thead><tr><th>When</th><th>Where</th><th>How much</th></tr></thead><tbody>${log.pain.slice(0,30).map(p=>
    `<tr><td>${fmtDate(p.t)}</td><td>${esc(painLabel(p))}</td><td><span class="dot" style="background:var(${LEVELS[p.level].col})"></span>${esc(LEVELS[p.level].lbl[0])}</td></tr>`).join('')}</tbody></table>` :
    '<div class="empty-state">When the child uses “Where it hurts”, each report is listed here with the date, body area and pain level.</div>';
  $('#reportText').value=reportText();
}
function reportText(){
  const words=log.recent.map(r=>r.s.split(/\s+/).length), mlu=words.length?(words.reduce((a,b)=>a+b,0)/words.length).toFixed(1):'–';
  const lines=[`Khuluma AAC report · ${new Date().toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})}`,
    `Access: ${({ipad:'Eye gaze (iPad Eye Tracking)',dwell:'Eye gaze (app dwell)',scan:'Switch scanning',touch:'Touch'})[settings.mode]}; dwell ${fmt.dwell(settings.dwell)}; layout ${settings.layout==='gaze'?'eye gaze':'core board'}; ${dims()[0]*dims()[1]} core words`,
    `Languages: ${LANGS[settings.lang].name}${settings.lang2?' + '+LANGS[settings.lang2].name:''}`,
    `Selections ${log.selections}; messages spoken ${log.spoken}; average words per message ${mlu}; days used ${Object.keys(log.days).length}; deleted within 3 s ${log.undo}`,'',
    'Most-used words:',...Object.entries(log.sel).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,n])=>`  ${keyLabel(k)}: ${n}`),'',
    'Recent messages:',...(log.recent.length?log.recent.slice(0,10).map(r=>`  ${fmtDate(r.t)} · ${r.s}`):['  none']),'',
    'Pain diary (latest 15):',...(log.pain.length?log.pain.slice(0,15).map(p=>`  ${fmtDate(p.t)} · ${painLabel(p)} · ${LEVELS[p.level].lbl[0]}`):['  none']),''];
  const av=zoneStats(); if(av.some(v=>v!=null)){ lines.push('Gaze map, average seconds to select (top row first):'); for(let r=0;r<3;r++) lines.push('  '+[0,1,2].map(c=>{const v=av[r*3+c];return v==null?' -- ':v.toFixed(1)+'s';}).join('  ')); }
  return lines.join('\n');
}
$('#copyReport').addEventListener('click',async()=>{ const t=reportText(); $('#reportText').value=t;
  try{ await navigator.clipboard.writeText(t); toast('Report copied'); }catch(e){ const ta=$('#reportText'); ta.focus(); ta.select(); toast('Select all and copy the report text'); } });
hold($('#wipeDevice'),2500,async()=>{ try{ Object.keys(localStorage).filter(k=>k.startsWith('khuluma')).forEach(k=>localStorage.removeItem(k)); }catch(e){}
  try{ idb.db&&idb.db.close(); await new Promise(r=>{ const q=indexedDB.deleteDatabase('khuluma'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }); }catch(e){}
  toast('Everything on this device was deleted'); setTimeout(()=>location.reload(),900); });
hold($('#resetLog'),1500,()=>{ const z=log.zones; log=LOGDEF(); log.zones=z; saveLog(); renderInsights(); toast('Insights cleared'); });

// ---------- downloads (backup & report) ----------
let dl=null;
try{ window.claude?.use?.('downloads').then(x=>{ dl=x; $('#dlReport').hidden=!dl; $('#dlBackup').hidden=!dl; if(!dl) $('#backupNote').textContent='Downloading a backup is not available in this view.'; }).catch(()=>{}); }catch(e){}
async function saveFile(filename,data){
  if(!dl){ if(inClaudeFrame) return; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data])); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); return; }
  try{ await dl.save({filename,data}); toast('Saved'); }catch(e){ if(e&&e.code!=='declined') toast('Could not save the file here.'); } }
if(!inClaudeFrame){ $('#dlReport').hidden=false; $('#dlBackup').hidden=false; }
$('#dlReport').addEventListener('click',()=>saveFile(`khuluma-report-${today()}.txt`,reportText()));
const blobToDataURL=b=>new Promise(res=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>res(''); r.readAsDataURL(b);});
function dataURLToBlob(d){ const [h,b64]=d.split(','); const mime=(h.match(/data:([^;]+)/)||[])[1]||'application/octet-stream'; const bin=atob(b64); const a=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) a[i]=bin.charCodeAt(i); return new Blob([a],{type:mime}); }
$('#dlBackup').addEventListener('click',async()=>{
  const media={}; for(const k of usedMedia()){ const b=await idb.get(k); if(b) media[k]=await blobToDataURL(b); }
  saveFile(`khuluma-backup-${today()}.json`,JSON.stringify({app:'khuluma',v:6,recv:REC_V,settings,custom,ov,scenes:scenesC,log,media}));
});
$('#restoreBtn').addEventListener('click',()=>$('#restoreFile').click());
$('#restoreFile').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
  try{ const d=JSON.parse(await f.text()); if(d.app!=='khuluma') throw 0;
    for(const [k,v] of Object.entries(d.media||{})){ await idb.put(k,dataURLToBlob(v)); }
    settings=Object.assign({},DEF,d.settings||{}); if(!LANGS[settings.lang]) settings.lang='en'; if(!validGrid(settings.grid)) settings.grid='8x6';
    custom=(d.custom||[]).map(c=>Object.assign({group:'family'},c)); ov=d.ov||{}; scenesC=d.scenes||[]; log=Object.assign(LOGDEF(),d.log||{});
    custom.forEach(c=>{ if(!c.audioL) c.audioL={}; }); const old=(d.recv||0)<REC_V; cleanLegacy(old); msg=[];
    save(); purgeMedia(); saveLog(); recByWord=null; await preloadMedia(); view=gaze()?'home':'core'; hist=[]; syncSettings(); renderAll(); $('#backupNote').textContent=old?'Backup restored. It was made before English and Afrikaans recordings were separated, so its recordings were left out. Record them again in each language.':'Backup restored.'; toast('Backup restored');
  }catch(err){ $('#backupNote').textContent='That file is not a Khuluma backup.'; } });

// ---------- gaze training ----------
let stage='explore', zoneQueue=[], curZone=0, shownAt=0, hits=0;
function openPractice(s){ $('#settings').hidden=true; stopScan(); startDwell(null); document.body.className='mode-'+settings.mode; $('#practice').hidden=false; $('#pSize').value=settings.psize; setStage(s||'explore'); }
function closePractice(){ $('#practice').hidden=true; $('#stage').innerHTML=''; startDwell(null); openSettings('training'); }
hold($('#pExit'),1200,closePractice);
$$('[data-practice]').forEach(b=>b.addEventListener('click',()=>openPractice(b.dataset.practice)));
$$('.ptab').forEach(b=>b.addEventListener('click',()=>setStage(b.dataset.stage)));
$('#pSize').addEventListener('change',e=>{ settings.psize=e.target.value; save(); if(stage==='target') placeTarget(); });
function setStage(s){
  stage=s; hits=0; $$('.ptab').forEach(b=>b.setAttribute('aria-selected',b.dataset.stage===s)); $('#pSize').hidden=s!=='target';
  const st=$('#stage');
  if(s==='explore'){
    const sets=[['🐘','fk-v'],['🦁','fk-n'],['🚀','fk-q'],['🌻','fk-p']];
    st.innerHTML=`<div class="explore">${sets.map(([e,c],i)=>`<button class="ex dwell ${c}" data-act="explore" data-id="${i}"><span>${e}</span></button>`).join('')}</div>`;
    $('#pStats').textContent='Look at a picture to make it move';
  } else if(s==='target'){
    st.innerHTML='<button id="target" class="dwell" data-act="target" aria-label="Target">⭐</button>';
    zoneQueue=[]; placeTarget(); $('#pStats').textContent='Hits 0';
  } else { newChoice(); $('#pStats').textContent='Pick one'; }
}
function exploreHit(el){ el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce'); const n=+el.dataset.id; tone([[523,659],[587,740],[659,784],[698,880]][n],.22,.12); hits++; $('#pStats').textContent=`${hits} looks`; }
function placeTarget(){
  const t=$('#target'); if(!t) return; const st=$('#stage').getBoundingClientRect(); const s=Math.min(+settings.psize,st.width/3-8,st.height/3-8);
  if(!zoneQueue.length) zoneQueue=[0,1,2,3,4,5,6,7,8].sort(()=>Math.random()-.5);
  const z=zoneQueue.shift(), zx=z%3, zy=Math.floor(z/3), cw=innerWidth/3, ch=innerHeight/3;
  let x=zx*cw+(cw-s)/2+(Math.random()-.5)*Math.max(0,cw-s-16)*.6;
  let y=zy*ch+(ch-s)/2+(Math.random()-.5)*Math.max(0,ch-s-16)*.6;
  y=Math.max(st.top+4,Math.min(y,innerHeight-s-4)); x=Math.max(4,Math.min(x,innerWidth-s-4));
  t.style.width=t.style.height=s+'px'; t.style.left=x+'px'; t.style.top=(y-st.top)+'px';
  t.textContent=['⭐','🎈','🐘','🦁','🌻','🚀','🦒','⚽'][Math.floor(Math.random()*8)];
  curZone=zoneOf(x+s/2,y+s/2); shownAt=performance.now();
}
function hitTarget(){
  const secs=(performance.now()-shownAt)/1000; hits++;
  if(secs<20){ const z=log.zones[curZone]; z.n++; z.sum+=secs; saveLog(); }
  $('#pStats').textContent=`Hits ${hits} · ${secs.toFixed(1)} s`;
  const t=$('#target'); t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); tone([660,990]);
  setTimeout(placeTarget,380);
}
function newChoice(){
  const pool=[...TOPICS.food.items,...TOPICS.animals.items,...TOPICS.toys.items].map(getItem).filter(it=>it&&!it.hidden);
  const a=pool[Math.floor(Math.random()*pool.length)]; let b; do{ b=pool[Math.floor(Math.random()*pool.length)]; }while(b===a&&pool.length>1);
  $('#stage').innerHTML=`<div class="choose">${[a,b].map(it=>tileHTML(it,'','choose')).join('')}</div>`;
}
function chooseHit(el){ const it=getItem(el.dataset.id); el.classList.add('chosen'); if(it) sayItems([it]); tone([523,784],.2); hits++; $('#pStats').textContent=`${hits} choices`; setTimeout(()=>{ if(stage==='choose'&&practiceOpen()) newChoice(); },1600); }
function renderZoneMap(){
  const av=zoneStats(), w=weakZones(), have=av.filter(v=>v!=null);
  if(!have.length){ $('#zoneMap').innerHTML='<div class="empty-state">Play “2 · Target” for a few minutes. Each part of the screen then shows how quickly the child reaches it.</div>'; return; }
  const s=[...have].sort((a,b)=>a-b), med=s[Math.floor(s.length/2)];
  $('#zoneMap').innerHTML=`<div class="zones">${av.map((v,i)=>{ const cls=v==null?'':(w[i]?'weak':(v>1.25*med?'mid':'good'));
    return `<div class="zone ${cls}"><b>${v==null?'–':v.toFixed(1)+' s'}</b><span>${log.zones[i].n} hits</span></div>`; }).join('')}</div>`;
}
$('#resetZones').addEventListener('click',()=>{ log.zones=LOGDEF().zones; saveLog(); renderZoneMap(); syncSettings(); });

// ---------- start ----------
async function wake(){ try{ await navigator.wakeLock?.request('screen'); }catch(e){} }
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') wake(); });
let rz=0; addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(()=>{ if(!practiceOpen()) renderBoard(); if(settings.mode==='scan'&&!overlayOpen()) startScan(); },200); });
window.__khulumaApp={
  getData:()=>({settings,custom,ov,scenes:scenesC,log}),
  async setData(d,keepLog){
    settings=Object.assign({},DEF,d.settings||{}); if(!LANGS[settings.lang]) settings.lang='en'; if(!validGrid(settings.grid)) settings.grid='8x6';
    custom=(d.custom||[]).map(c=>Object.assign({group:'family',audioL:{}},c,{audio:''})); ov=d.ov||{}; scenesC=d.scenes||[];
    if(!keepLog) log=Object.assign(LOGDEF(),d.log||{});
    cleanLegacy(false); recByWord=null; msg=[]; save(true); ls.set('khuluma.log',log);
    await preloadMedia(); view=gaze()?'home':'core'; hist=[]; syncSettings(); renderAll(); applyMode(); },
  usedMedia, idb, mediaURL, toast, setRole, openSettings, showTab, esc, renderAll, inClaudeFrame,
  freshLocal:()=>{ ls.set('khuluma.v1',DEF); }, LOGDEF };
window.__khuluma={compose,ITEMS,getItem,go:v=>{go(v);},suggestions,fresh,get msg(){return msg;},set msg(v){msg=v;},get ov(){return ov;},get custom(){return custom;},refreshMsg};
(async()=>{ renderAll(); applyMode(); wake(); await idb.open(); await preloadMedia(); renderAll(); applyMode(); purgeMedia();
  if(recReset) setTimeout(()=>toast('Recordings were cleared so English and Afrikaans stay separate. Record each word again with the board in its own language.'),800); })();
