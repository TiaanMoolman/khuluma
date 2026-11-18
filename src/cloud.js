// ---------- accounts & sync (Supabase) ----------
// Therapists sign up, add children and invite parents. A parent signs in once on the child's iPad;
// the board then keeps working offline and syncs when there is a connection.
(function(){
const A=window.__khulumaApp; if(!A) return;
const $=s=>document.querySelector(s), esc=A.esc, toast=A.toast;
const CFG=window.KHULUMA_CONFIG||{};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}, del(k){try{localStorage.removeItem(k);}catch(e){}}};
const configured=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);
const enabled=configured&&!A.inClaudeFrame;
const SITE=CFG.siteUrl||(location.origin+location.pathname);
const DEVICE_KEYS=['voice','rate'];          // these stay with the device (voices differ per iPad or Mac)
const PROFESSIONS=['Physiotherapist','Occupational therapist','Speech-language therapist','Audiologist','Teacher or educator','Other'];

let renaming='', sb=null, session=null, profile=null, kids=[], ready=false, online=navigator.onLine;
let childId=LS.get('khuluma.cloud.child',''), localOnly=LS.get('khuluma.cloud.local',false);
let st=loadSt(childId), pushT=0, pushing=false, gen=0, lastPull=0, syncMsg='', openTeam='', lastInvite=null;

function loadSt(id){ return Object.assign({version:-1,dirty:{},up:{}},id?LS.get('khuluma.cloud.s.'+id,{}):{}); }
function saveSt(){ if(childId) LS.set('khuluma.cloud.s.'+childId,st); }
const kid=id=>kids.find(k=>k.id===(id||childId));
const myRole=()=>(kid()||{}).role||'';
const isTher=()=>['lead','therapist'].includes(myRole());
const childDevice=()=>myRole()==='parent'||LS.get('khuluma.cloud.childDevice',false);
function roleNote(){ const n=document.getElementById('roleNote'); if(!n) return; const k=kid();
  n.hidden=!(k&&k.role==='parent'); if(!n.hidden) n.innerHTML=`You are the <b>parent</b> on ${esc(k.name)}’s board, so only personal words, Insights and Account are shown. The therapist sets up the rest.${profile&&profile.role==='therapist'?' To see all settings, open a board where you are the therapist (Account › Your children › Open on this device).':''}`; }
function setSync(t){ syncMsg=t; const d=$('#syncDot'); if(d) d.textContent=t; }

// ---------- public hooks used by the board ----------
window.khulumaCloud={ changed(k){
  if(k==='account-tab'){ renderAccount(); return; }
  if(k==='settings-open'){ roleNote(); return; }
  if(!sb||!session||!childId) return;
  if(k==='board'||k==='log'){ st.dirty[k]=true; gen++; saveSt(); clearTimeout(pushT); pushT=setTimeout(push,2500); }
} };

// ---------- start ----------
const inviteParam=new URLSearchParams(location.search).get('invite');
if(inviteParam){ LS.set('khuluma.cloud.invite',inviteParam); try{ const u=new URL(location.href); u.searchParams.delete('invite'); history.replaceState(null,'',u.pathname+u.search+u.hash); }catch(e){} }
if(enabled) start();

function loadLib(){ return new Promise((res,rej)=>{ if(window.supabase) return res();
  const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.js';
  s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }

async function start(){
  try{ await loadLib(); }catch(e){ setSync('Offline: changes stay on this device'); return; }   // offline: the board still works
  sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'khuluma.auth'}});
  sb.auth.onAuthStateChange((ev,s)=>{ session=s;
    if(ev==='PASSWORD_RECOVERY') showAuth('recover');
    if(ev==='SIGNED_OUT'){ const was=!!profile; profile=null; kids=[]; A.setRole(''); renderAccount();
      if(was&&$('#auth').hidden){ toast('This device was signed out. Sign in again to keep syncing.'); showAuth('welcome'); } } });
  const {data}=await sb.auth.getSession(); session=data.session; ready=true;
  window.addEventListener('online',()=>{ online=true; push().then(()=>pull()); });
  window.addEventListener('offline',()=>{ online=false; setSync('Offline: changes are kept and sync later'); });
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&Date.now()-lastPull>30000) pull(); });
  setInterval(()=>{ if(!document.hidden){ pull(); refreshAccess(); } },120000);
  await afterSignIn();
}

// ---------- device limit: one login works on at most 2 devices (rules in supabase/devices.sql) ----------
function deviceKey(){ let k=LS.get('khuluma.cloud.dk',''); if(!k){ k=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)); LS.set('khuluma.cloud.dk',k); } return k; }
function deviceName(){ const u=navigator.userAgent||''; const ipad=/iPad/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1);
  const kind=ipad?'iPad':/iPhone/.test(u)?'iPhone':/Android/.test(u)?(/Mobile/.test(u)?'Android phone':'Android tablet'):/Macintosh/.test(u)?'Mac':/Windows/.test(u)?'Windows computer':/CrOS/.test(u)?'Chromebook':'Computer';
  const br=/Edg\//.test(u)?'Edge':/Chrome\//.test(u)&&!/Edg/.test(u)?'Chrome':/Firefox\//.test(u)?'Firefox':/Safari\//.test(u)?'Safari':'browser';
  return kind+' · '+br; }
async function registerDevice(){
  if(!sb||!session) return true;
  const r=await sb.rpc('register_device',{k:deviceKey(),n:deviceName()});
  if(r.error) return true;                         // offline, or device limits not switched on yet: never lock a child out
  if(r.data&&r.data.ok===false){ showAuth('devices',r.data); return false; }
  return true; }
async function myDevices(){ const r=await sb.rpc('my_devices'); return r.error?null:r.data; }
const ago=d=>{ const m=Math.round((Date.now()-new Date(d))/60000); return m<2?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' days ago'; };

async function afterSignIn(){
  const inv=LS.get('khuluma.cloud.invite','');
  if(inv){ showAuth('invite'); return; }
  if(!session){ A.setRole(''); if(!localOnly&&!childId) showAuth('welcome'); renderAccount(); return; }
  if(!(await registerDevice())) return;
  await loadMe(); if(PAY) await payReturn();
  if(childId&&!kid()){ if(kids.length||online){ toast('This device no longer has access to that child’s board.'); setChild(''); } }
  if(!childId){
    if(kids.length===1) await openChild(kids[0].id,{replace:true});
    else if(kids.length>1) showAuth('pick');
    else if(profile&&profile.role==='parent'){ showAuth('addChild'); return; }
    else { hideAuth(); A.openSettings('account'); }
  } else { A.setRole(uiRole()); hideAuth(); await pull(); applyAccess(); }
  renderAccount();
}

let acct=LS.get('khuluma.cloud.acct',null);       // plans, prices, trial length (from billing.sql)
async function loadMe(){
  if(!session) return;
  const uid=session.user.id;
  const a=await sb.rpc('my_account');
  if(!a.error&&a.data){ acct=a.data; LS.set('khuluma.cloud.acct',acct); profile=Object.assign({},a.data.profile||{});
    kids=(a.data.children||[]).map(c=>({id:c.id,role:c.role,name:c.name,has_therapist:c.has_therapist,licence:c.licence||{state:'none'}})); }
  else {                                            // billing.sql not run yet: older data shape, no subscriptions
    acct=null; const p=await sb.from('profiles').select('*').eq('id',uid).maybeSingle(); if(p.data) profile=p.data;
    const m=await sb.from('child_members').select('child_id,role,children(display_name)').eq('user_id',uid);
    if(!m.error) kids=(m.data||[]).map(r=>({id:r.child_id,role:r.role,name:(r.children||{}).display_name||'Child',has_therapist:true,licence:{state:'active'}})).sort((a,b)=>a.name.localeCompare(b.name)); }
  LS.set('khuluma.cloud.kids',kids);
}
if(!kids.length) kids=LS.get('khuluma.cloud.kids',[]);   // offline: remember whose board this is
// a parent sees only personal words when a therapist set up the board; a parent without a therapist sets up everything
const uiRole=()=>{ const k=kid(); return !k||isTher()||!k.has_therapist?'':'parent'; };
if(childId&&kid()) A.setRole(uiRole());

// ---------- subscriptions and therapist sessions ----------
// ---------- card payments (Paystack, through the Supabase function "paystack") ----------
const PAY=CFG.pay==='paystack';
async function payCall(action,body){ const r=await fetch(CFG.supabaseUrl+'/functions/v1/paystack',{method:'POST',headers:{'Content-Type':'application/json',apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+(session&&session.access_token||'')},body:JSON.stringify(Object.assign({action},body||{}))});
  const j=await r.json().catch(()=>({error:'No answer from the payment service'})); if(!r.ok||j.error) throw new Error(j.error||'Payment service error'); return j; }
async function goPay(cid,plan,mode){ try{ toast('Opening the secure Paystack payment page…'); const r=await payCall('start',{child_id:cid,plan_id:plan,mode}); location.href=r.url; }
  catch(e){ toast(e.message); } }
async function payReturn(){ const u=new URL(location.href), ref=u.searchParams.get('reference')||u.searchParams.get('trxref'); if(!u.searchParams.get('paid')||!ref) return;
  ['paid','reference','trxref'].forEach(k=>u.searchParams.delete(k)); history.replaceState(null,'',u.pathname+u.search+u.hash);
  try{ const r=await payCall('verify',{reference:ref}); toast(r.status==='success'?'Payment received. Thank you!':'The payment was not completed.'); }catch(e){ toast(e.message); }
  await loadMe(); applyAccess(); }
const R$=c=>'R'+(c/100).toLocaleString('en-ZA',{minimumFractionDigits:0,maximumFractionDigits:2});
const fmtD=d=>d?new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}):'';
const daysTo=d=>Math.max(0,Math.ceil((new Date(d)-Date.now())/86400000));
let sessT=0, sessEnd=0;
const SESSION_MIN=60;
function applyAccess(){
  clearInterval(sessT); A.setBanner('');
  const k=kid(); if(!k||!acct){ A.setLock(false); return; }
  if(isTher()){                                   // therapists use a child's board in sessions only
    A.setLock(false);
    const key='khuluma.cloud.sess.'+k.id; sessEnd=LS.get(key,0);
    if(!sessEnd||sessEnd<Date.now()-6*3600000){ sessEnd=Date.now()+SESSION_MIN*60000; LS.set(key,sessEnd); }
    const tick=()=>{ const left=Math.ceil((sessEnd-Date.now())/60000);
      if(left<=0){ clearInterval(sessT); A.setLock(true);
        A.setBanner(`Therapist session with ${esc(k.name)} has ended <button id="pbNew">Start a new session</button>`);
        $('#pbNew').onclick=()=>{ LS.set(key,Date.now()+SESSION_MIN*60000); applyAccess(); }; return; }
      A.setBanner(`Therapist session · ${esc(k.name)} · ${left} min left`); };
    tick(); sessT=setInterval(tick,30000); return; }
  const l=k.licence||{state:'none'};
  if(l.state==='trial'&&PAY&&!l.card){ A.setLock(false); const d=daysTo(l.ends);
    A.setBanner(`Free trial: ${d} day${d===1?'':'s'} left. Add your card so ${esc(k.name)}’s board keeps working <button id="pbSub">Add card</button>`);
    $('#pbSub').onclick=()=>goPay(k.id,l.plan||'family_month','trial'); return; }
  if(l.state==='trial'){ A.setLock(false); const d=daysTo(l.ends);
    A.setBanner(`Free trial: ${d} day${d===1?'':'s'} left, then ${esc(pName(l.plan||'family_month'))} <button id="pbSub">Change plan</button>`); $('#pbSub').onclick=()=>showAuth('subscribe'); return; }
  if(l.state==='active'||l.state==='lifetime'){ A.setLock(false); return; }
  if(l.state==='grace'){ A.setLock(false);
    A.setBanner(`${esc(k.name)}’s subscription has ended <button id="pbSub">Renew</button>`); $('#planBar').classList.add('warn'); $('#pbSub').onclick=()=>showAuth('subscribe'); return; }
  A.setLock(true); $('#planBar').classList.add('warn');
  A.setBanner(`${l.state==='none'?'Start a free trial or choose a plan':'The subscription has ended'} to open ${esc(k.name)}’s full board <button id="pbSub">${l.state==='none'?'Start':'Renew'}</button>`);
  $('#pbSub').onclick=()=>showAuth('subscribe');
}
async function refreshAccess(){ if(!sb||!session||!online) return applyAccess(); await loadMe(); applyAccess(); }

function setChild(id){ childId=id||''; if(childId) LS.set('khuluma.cloud.child',childId); else LS.del('khuluma.cloud.child'); st=loadSt(childId); }

async function openChild(id,{replace=false,copyLocal=false}={}){
  if(childId&&childId!==id) await push();
  setChild(id); A.setRole(uiRole());
  if(copyLocal){ st.dirty={board:true}; st.version=-1; saveSt(); await push(); }
  await pull(true);
  hideAuth(); renderAccount(); applyAccess();
  const kk=kid(); if(kk&&acct&&kk.role==='parent'&&(kk.licence||{}).state==='none'){ showAuth('subscribe'); return; }
  const k=kid(); if(k&&!replace) toast('Showing '+k.name+'’s board');
}

// ---------- sync ----------
function mediaKeys(d){ const s=new Set();
  Object.values(d.ov||{}).forEach(o=>{ o.img&&s.add(o.img); Object.values(o.audioL||{}).forEach(a=>a&&s.add(a)); });
  (d.custom||[]).forEach(c=>{ c.img&&s.add(c.img); Object.values(c.audioL||{}).forEach(a=>a&&s.add(a)); });
  (d.scenes||[]).forEach(x=>{ x.img&&s.add(x.img); }); return [...s]; }

async function uploadMedia(){
  for(const k of A.usedMedia()){ if(st.up[k]) continue; const blob=await A.idb.get(k); if(!blob) continue;
    const r=await sb.storage.from('media').upload(childId+'/'+k,blob,{upsert:true,contentType:blob.type||(k.startsWith('aud-')?'audio/mp4':'image/jpeg')});
    if(r.error&&!/exists|Duplicate/i.test(r.error.message||'')) throw r.error; st.up[k]=1; saveSt(); } }

async function downloadMedia(d){
  for(const k of mediaKeys(d)){ if(await A.idb.get(k)) { st.up[k]=1; continue; }
    const r=await sb.storage.from('media').download(childId+'/'+k); if(r.data){ await A.idb.put(k,r.data); st.up[k]=1; } }
  saveSt(); }

async function push(){
  if(!sb||!session||!childId||pushing||!online) return;
  const want=st.dirty||{}; if(!want.board&&!want.log) return;
  pushing=true; const g=gen; setSync('Saving…');
  try{
    const d=A.getData(), patch={};
    if(want.board){ patch.custom=d.custom; if(isTher()){ const s=Object.assign({},d.settings); DEVICE_KEYS.forEach(k=>delete s[k]); patch.settings=s; patch.ov=d.ov; patch.scenes=d.scenes; } }
    if(want.log&&childDevice()) patch.log=d.log;
    await uploadMedia();
    if(Object.keys(patch).length){
      const r=await sb.from('boards').update(patch).eq('child_id',childId).select('version').maybeSingle();
      if(r.error) throw r.error; if(!r.data) throw new Error('no access');
      st.version=r.data.version; }
    if(g===gen) st.dirty={}; saveSt(); setSync('Saved '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));
  }catch(e){ setSync(online?'Could not save online yet: '+(e.message||e):'Offline: changes are kept and sync later'); }
  finally{ pushing=false; if(g!==gen){ clearTimeout(pushT); pushT=setTimeout(push,1500); } }
}

async function pull(force){
  if(!sb||!session||!childId||!online) return; lastPull=Date.now();
  if(st.dirty&&(st.dirty.board||st.dirty.log)) await push();
  const r=await sb.from('boards').select('*').eq('child_id',childId).maybeSingle();
  if(r.error){ setSync('Could not reach the server'); return; }
  if(!r.data){ await loadMe(); if(!kid()){ toast('This device no longer has access to that child’s board.'); setChild(''); A.setRole(''); renderAccount(); } return; }
  const b=r.data; if(!force&&b.version<=st.version) { setSync(syncMsg||'Up to date'); return; }
  if(st.dirty&&st.dirty.board&&!force) return;            // local changes still on their way up
  await downloadMedia(b);
  const cur=A.getData(), s=Object.assign({},b.settings||{}); DEVICE_KEYS.forEach(k=>{ if(cur.settings[k]!=null) s[k]=cur.settings[k]; });
  await A.setData({settings:s,custom:b.custom||[],ov:b.ov||{},scenes:b.scenes||[],log:b.log||{}},childDevice()&&st.version>=0);
  st.version=b.version; st.dirty={}; saveSt(); setSync('Up to date');
}

// ---------- sign-in screens ----------
function planLine(){ const ps=(acct&&acct.plans)||[{name:'Monthly',price_cents:14900,period:'month'},{name:'Yearly',price_cents:149000,period:'year'},{name:'Lifetime',price_cents:399900,period:'lifetime'}];
  return ps.map(p=>R$(p.price_cents)+(p.period==='month'?' a month':p.period==='year'?' a year':' once-off for life')).join(', or '); }
const DEF_PLANS=[{id:'family_month',name:'Monthly',price_cents:14900,period:'month'},{id:'family_year',name:'Yearly (2 months free)',price_cents:149000,period:'year'},{id:'family_life',name:'Lifetime (once-off)',price_cents:399900,period:'lifetime'}];
const plansNow=()=>(acct&&acct.plans&&acct.plans.length?acct.plans:DEF_PLANS);
const perTxt=p=>p.period==='month'?'per month':p.period==='year'?'per year':'once-off';
const pName=id=>{ const p=plansNow().find(x=>x.id===id)||plansNow()[0]; return p.name.replace(/\s*\(.*\)/,'')+' '+R$(p.price_cents); };
function planCards(sel){ const m=plansNow().find(x=>x.period==='month');
  const save=p=>!m||p.period==='month'?'':p.period==='year'?`<span class="pill">Save ${R$(m.price_cents*12-p.price_cents)}</span>`:'<span class="pill">Pay once, use for life</span>';
  return `<div class="plans">${plansNow().map(p=>`<button class="plan" data-plan="${p.id}" aria-pressed="${p.id===sel}"><span>${esc(p.name)}</span><b>${R$(p.price_cents)}</b><span class="note-text" style="margin:0">${perTxt(p)}</span>${save(p)}</button>`).join('')}</div>`; }
function showAuth(screen,opts){ $('#auth').hidden=false; renderAuth(screen,opts||{}); }
function hideAuth(){ $('#auth').hidden=true; }
const brand=`<div class="brand"><span class="bubble-logo">K</span><b>Khuluma</b></div>`;
const friendly=m=>{ m=String(m&&m.message||m||'');
  if(/Invalid login/i.test(m)) return 'That email or password is not right.';
  if(/not confirmed/i.test(m)) return 'Confirm your email first: open the link we emailed you, then sign in.';
  if(/already registered|already exists/i.test(m)) return 'There is already an account with this email. Sign in instead.';
  if(/Password should be/i.test(m)) return 'Use a password of at least 8 characters.';
  if(/Failed to fetch|NetworkError/i.test(m)) return 'No internet connection. Try again when you are online.';
  return m; };
const fld=(id,label,type='text',extra='')=>`<div class="fld"><label for="${id}">${label}</label><input id="${id}" type="${type}" ${extra}></div>`;
const val=id=>($('#'+id)||{}).value?.trim()||'';
function busy(btn,on,txt){ if(!btn) return; btn.disabled=on; if(on){ btn.dataset.t=btn.textContent; btn.textContent=txt||'Please wait…'; } else if(btn.dataset.t) btn.textContent=btn.dataset.t; }

async function renderAuth(screen,o={}){
  const body=$('#authBody'); const err='<p class="err" id="aErr" role="alert"></p>';
  const setErr=m=>{ $('#aErr').textContent=friendly(m); };
  if(screen==='welcome'){
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Sign in</h1>
      <p class="note-text" style="margin:0">Therapists and parents sign in here. Parents: open the invite link your child’s therapist sent you.</p>
      ${fld('aEmail','Email','email','autocomplete="email" inputmode="email"')}${fld('aPass','Password','password','autocomplete="current-password"')}
      ${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">Sign in</button><button class="linkbtn" id="aForgot">Forgot password?</button></div></div>
      <div class="card"><h2>New to Khuluma?</h2>
        <div class="btns"><button class="btn primary" id="aParent">I’m a parent: start a free trial</button><button class="btn" id="aNew">I’m a therapist</button></div>
        <p class="note-text" style="margin:10px 0 0">Has your child’s therapist sent you an invite? Open the link in the invite instead.</p></div>`;
    $('#aGo').onclick=async e=>{ busy(e.target,true); const r=await sb.auth.signInWithPassword({email:val('aEmail'),password:$('#aPass').value}); busy(e.target,false);
      if(r.error) return setErr(r.error); session=r.data.session; localOnly=false; LS.del('khuluma.cloud.local'); await afterSignIn(); };
    $('#aPass').onkeydown=e=>{ if(e.key==='Enter') $('#aGo').click(); };
    $('#aForgot').onclick=async()=>{ const em=val('aEmail'); if(!em) return setErr('Type your email first.');
      const r=await sb.auth.resetPasswordForEmail(em,{redirectTo:SITE}); if(r.error) return setErr(r.error); setErr(''); $('#aErr').textContent='We emailed you a link to choose a new password.'; };
    $('#aNew').onclick=()=>renderAuth('signup');
    $('#aParent').onclick=()=>renderAuth('signupParent');
  }
  if(screen==='signup'){
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Create a therapist account</h1>
      ${fld('aName','Your full name','text','autocomplete="name"')}
      <div class="fld"><label for="aProf">Profession</label><select id="aProf">${PROFESSIONS.map(p=>`<option>${p}</option>`).join('')}</select></div>
      ${fld('aHp','HPCSA registration number','text','placeholder="e.g. PT0000000" autocapitalize="characters"')}
      <p class="note-text" style="margin:6px 0 0">We check your number on the HPCSA register before your account is activated, usually within one working day.</p>
      ${fld('aEmail','Email','email','autocomplete="email" inputmode="email"')}${fld('aPass','Password (at least 8 characters)','password','autocomplete="new-password"')}
      ${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">Create account</button><button class="linkbtn" id="aBack">Back to sign in</button></div></div>`;
    $('#aBack').onclick=()=>renderAuth('welcome');
    $('#aGo').onclick=async e=>{ if(!val('aName')) return setErr('Type your name.'); if(!/^[A-Za-z]{2,4}\s?\d{4,8}$/.test(val('aHp'))) return setErr('Type your HPCSA registration number, for example PT0109797.'); if($('#aPass').value.length<8) return setErr('Use a password of at least 8 characters.');
      busy(e.target,true); const r=await sb.auth.signUp({email:val('aEmail'),password:$('#aPass').value,options:{emailRedirectTo:SITE,data:{full_name:val('aName'),role:'therapist',profession:$('#aProf').value,hpcsa:val('aHp')}}}); busy(e.target,false);
      if(r.error) return setErr(r.error);
      if(r.data.session){ session=r.data.session; LS.del('khuluma.cloud.local'); await afterSignIn(); }
      else renderAuth('checkEmail',{email:val('aEmail')}); };
  }
  if(screen==='signupParent'){
    const days=(acct&&acct.trial_days)||7;
    const sel=o.plan||LS.get('khuluma.cloud.plan','family_month');
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Start your ${days}-day free trial</h1>
      <p class="note-text" style="margin:0">Choose your plan. The first ${days} days are free; your plan starts after that. You can change or cancel before the trial ends.</p>
      ${planCards(sel)}
      <p class="note-text" style="margin:10px 0 0"><b>${days} days free, then ${esc(pName(sel))}${(plansNow().find(x=>x.id===sel)||{}).period==='lifetime'?' once-off':(plansNow().find(x=>x.id===sel)||{}).period==='year'?' a year':' a month'}.</b></p>
      ${fld('aName','Your full name','text','autocomplete="name"')}${fld('aEmail','Email','email','autocomplete="email" inputmode="email"')}${fld('aPass','Password (at least 8 characters)','password','autocomplete="new-password"')}
      ${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">Create account</button><button class="linkbtn" id="aBack">Back</button></div></div>`;
    LS.set('khuluma.cloud.plan',sel);
    body.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>{ const keep={n:val('aName'),e:val('aEmail'),p:$('#aPass').value}; renderAuth('signupParent',{plan:b.dataset.plan}).then(()=>{ $('#aName').value=keep.n; $('#aEmail').value=keep.e; $('#aPass').value=keep.p; }); });
    $('#aBack').onclick=()=>renderAuth('welcome');
    $('#aGo').onclick=async e=>{ if(!val('aName')) return setErr('Type your name.'); if($('#aPass').value.length<8) return setErr('Use a password of at least 8 characters.');
      busy(e.target,true); const r=await sb.auth.signUp({email:val('aEmail'),password:$('#aPass').value,options:{emailRedirectTo:SITE,data:{full_name:val('aName'),role:'parent'}}}); busy(e.target,false);
      if(r.error) return setErr(r.error); LS.set('khuluma.cloud.newParent',true);
      if(r.data.session){ session=r.data.session; await afterSignIn(); } else renderAuth('checkEmail',{email:val('aEmail')}); };
  }
  if(screen==='addChild'){
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Who will use Khuluma?</h1>
      <p class="note-text" style="margin:0">Use your child’s first name or nickname only.</p>
      ${fld('aKid','Child’s first name or nickname','text','maxlength="60"')}
      <label class="chk"><input type="checkbox" id="aConsent"><span>I am this child’s parent or legal guardian. I agree that Khuluma may store the board, photos, recordings and how the board is used, to support my child’s communication.</span></label>
      ${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">Continue</button></div></div>`;
    $('#aGo').onclick=async e=>{ const n=val('aKid'); if(!n) return setErr('Type your child’s name.'); if(!$('#aConsent').checked) return setErr('Please tick the consent box first.');
      busy(e.target,true); const r=await sb.from('children').insert({display_name:n}).select('id').single(); busy(e.target,false);
      if(r.error) return setErr(r.error); LS.del('khuluma.cloud.newParent'); LS.set('khuluma.cloud.childDevice',true);
      const plan=LS.get('khuluma.cloud.plan','family_month'), life=(plansNow().find(p=>p.id===plan)||{}).period==='lifetime';
      if(life&&PAY){ await loadMe(); await openChild(r.data.id,{replace:true,copyLocal:true}); return goPay(r.data.id,plan,'now'); }
      const tr=await sb.rpc('start_trial',{cid:r.data.id,plan:life?'family_month':plan});
      await loadMe(); await openChild(r.data.id,{replace:true,copyLocal:true});
      if(!tr.error){ if(PAY) return showAuth('card',{cid:r.data.id,plan}); toast('Your '+((acct&&acct.trial_days)||7)+'-day free trial has started.'); } };
  }
  if(screen==='subscribe'){
    await loadMe(); const k=kid(); if(!k||!acct){ hideAuth(); return; }
    const l=k.licence||{state:'none'}, canTrial=l.state==='none'&&!(acct.profile||{}).trial_used, days=acct.trial_days||7;
    const sel=o.plan||l.plan||LS.get('khuluma.cloud.plan','family_month');
    const per=p=>p.period==='month'?'per month':p.period==='year'?'per year':'once-off';
    const save=p=>{ const m=(acct.plans||[]).find(x=>x.period==='month'); if(!m||p.period==='month') return '';
      return p.period==='year'?`<span class="pill">Save ${R$(m.price_cents*12-p.price_cents)}</span>`:'<span class="pill">Pay once, use for life</span>'; };
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">${esc(k.name)}’s Khuluma</h1>
      <p class="note-text" style="margin:0">${l.state==='trial'?`Free trial until ${fmtD(l.ends)}.`:l.state==='active'?`Paid until ${fmtD(l.ends)}.`:l.state==='lifetime'?'Lifetime plan: nothing more to pay.':l.state==='grace'?'The subscription has ended. Renew within a few days to keep the full board.':l.state==='expired'?'The subscription has ended. Only the emergency words are open until it is renewed.':'Choose how to start.'}</p>
      ${planCards(sel)}
      ${err}<div class="btns" style="margin-top:12px">${canTrial?`<button class="btn primary" id="aTrial">Start ${days}-day free trial, then ${esc(pName(sel))}</button><button class="btn" id="aPay">Pay now instead</button>`:
        l.state==='trial'&&l.renews?`<button class="btn" id="aPay">Pay now instead</button>`:
        l.state==='trial'?`<button class="btn primary" id="aKeep">${PAY?'Add card for '+esc(pName(sel)):'Keep '+esc(pName(sel))+' after the trial'}</button><button class="btn" id="aPay">Pay now</button>`:`<button class="btn primary" id="aPay">Continue with ${esc(pName(sel))}</button>`}<button class="linkbtn" id="aLater">Not now</button></div></div>`;
    body.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>renderAuth('subscribe',{plan:b.dataset.plan}));
    $('#aLater').onclick=()=>{ hideAuth(); applyAccess(); };
    if($('#aKeep')) $('#aKeep').onclick=async e=>{ busy(e.target,true); const r=await sb.rpc('choose_plan',{cid:k.id,plan:sel}); busy(e.target,false);
      if(r.error) return setErr(r.error); if(PAY) return goPay(k.id,sel,'trial'); await refreshAccess(); hideAuth(); toast('Plan saved: '+pName(sel)+' after the trial'); };
    if($('#aTrial')) $('#aTrial').onclick=async e=>{ busy(e.target,true); const r=await sb.rpc('start_trial',{cid:k.id,plan:sel}); busy(e.target,false);
      if(r.error) return setErr(r.error); await refreshAccess(); hideAuth(); toast('Your free trial has started. Enjoy!'); };
    $('#aPay').onclick=()=>renderAuth('pay',{plan:sel});
  }
  if(screen==='card'){
    const k=kid(o.cid)||kid(), p=plansNow().find(x=>x.id===o.plan)||plansNow()[0], l=(k&&k.licence)||{};
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Your free trial has started</h1>
      <p class="note-text" style="margin:0">Add your card so ${esc(k?k.name:'your child')}’s board keeps working after the trial. Paystack checks the card with R1, which is refunded straight away.</p>
      <div class="invite-link" style="user-select:text"><b>Today:</b> R0<br><b>${fmtD(l.ends)||'After 7 days'}:</b> ${R$(p.price_cents)}, then ${p.period==='year'?'every year':'every month'}<br>Cancel any time in Account.</div>
      ${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aCard">Add card securely with Paystack</button><button class="linkbtn" id="aLater">Later</button></div></div>`;
    $('#aCard').onclick=()=>goPay(k.id,p.id,'trial'); $('#aLater').onclick=()=>{ hideAuth(); applyAccess(); };
  }
  if(screen==='pay'){
    if(PAY){ const kk=kid(); if(kk) return goPay(kk.id,o.plan,'now'); }
    const k=kid(), p=(acct.plans||[]).find(x=>x.id===o.plan); if(!k||!p){ hideAuth(); return; }
    const ref=('KH-'+k.name.replace(/[^A-Za-z]/g,'').slice(0,8)+'-'+k.id.slice(0,4)).toUpperCase();
    if(CFG.payUrl){ location.href=CFG.payUrl+'?child='+encodeURIComponent(k.id)+'&plan='+encodeURIComponent(p.id); return; }
    const req=await sb.rpc('request_plan',{cid:k.id,plan:p.id,ref});
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">${esc(p.name)}: ${R$(p.price_cents)}</h1>
      <p class="note-text" style="margin:0">Card payments are coming soon. For now, please pay by EFT:</p>
      <div class="invite-link" style="user-select:text">${esc(acct.eft||'').replace(/\n/g,'<br>')}<br><br><b>Amount:</b> ${R$(p.price_cents)}<br><b>Reference:</b> ${esc(ref)}</div>
      <p class="note-text">${req.error?'':'We have your request. '}As soon as the payment reflects, ${esc(k.name)}’s plan is switched on, usually within one working day.${(k.licence||{}).state==='none'&&!(acct.profile||{}).trial_used?' You can start the free trial in the meantime.':''}</p>
      <div class="btns"><button class="btn primary" id="aDone">Done</button><button class="linkbtn" id="aBack">Choose another plan</button></div></div>`;
    $('#aDone').onclick=()=>{ hideAuth(); applyAccess(); }; $('#aBack').onclick=()=>renderAuth('subscribe',{plan:p.id});
  }
  if(screen==='checkEmail'){
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 8px">Check your email</h1>
      <p class="note-text" style="margin:0">We sent a confirmation link to <b>${esc(o.email||'your email')}</b>. Open it on this device to finish. You can then sign in.</p>
      <div class="btns" style="margin-top:12px"><button class="btn" id="aBack">Back to sign in</button></div></div>`;
    $('#aBack').onclick=()=>renderAuth(LS.get('khuluma.cloud.invite','')?'invite':'welcome');
  }
  if(screen==='recover'){
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Choose a new password</h1>${fld('aPass','New password (at least 8 characters)','password','autocomplete="new-password"')}${err}
      <div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">Save password</button></div></div>`;
    $('#aGo').onclick=async e=>{ busy(e.target,true); const r=await sb.auth.updateUser({password:$('#aPass').value}); busy(e.target,false); if(r.error) return setErr(r.error); toast('Password changed'); await afterSignIn(); };
  }
  if(screen==='pick'){
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Whose board is this device for?</h1>
      <div class="slist">${kids.map(k=>`<div class="kid"><span class="who"><b>${esc(k.name)}</b><span class="note-text" style="margin:0">${roleName(k.role)}</span></span><button class="btn primary" data-open="${k.id}">Open</button></div>`).join('')}</div></div>`;
    body.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openChild(b.dataset.open));
  }
  if(screen==='devices'){
    const d=o||{devices:[]}, max=d.max||2;
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 6px">This login is already used on ${max} devices</h1>
      <p class="note-text" style="margin:0">Each Khuluma login works on up to ${max} devices. To use it here, sign out one of the other devices. You can swap devices ${d.swaps_left??0} more time${d.swaps_left===1?'':'s'} in the next 30 days.</p>
      <div class="slist">${(d.devices||[]).map(x=>`<div class="kid"><span class="who"><b>${esc(x.name)}</b><span class="note-text" style="margin:0">Last used ${ago(x.last_seen)}</span></span><button class="btn" data-rmdev="${x.id}" ${d.swaps_left?'':'disabled'}>Sign it out</button></div>`).join('')}</div>
      ${err}<div class="btns" style="margin-top:12px"><button class="linkbtn" id="aHereOut">Sign out here instead</button></div>
      <p class="note-text">Each family gets its own parent login from the child’s therapist, so a login does not need to be shared.</p></div>`;
    body.querySelectorAll('[data-rmdev]').forEach(b=>b.onclick=async()=>{ if(b.dataset.sure!=='1'){ b.dataset.sure='1'; b.textContent='Tap again to sign it out'; return; }
      busy(b,true); const r=await sb.rpc('remove_device',{d:b.dataset.rmdev}); busy(b,false); if(r.error) return setErr(r.error);
      toast('That device was signed out'); await afterSignIn(); });
    $('#aHereOut').onclick=async()=>{ await sb.auth.signOut(); session=null; renderAuth('welcome'); };
  }
  if(screen==='invite'){
    const tok=LS.get('khuluma.cloud.invite','');
    body.innerHTML=`${brand}<div class="card"><p class="note-text">Opening your invite…</p></div>`;
    const r=await sb.rpc('peek_invite',{t:tok}); const iv=r.data;
    const drop=()=>{ LS.del('khuluma.cloud.invite'); afterSignIn(); };
    if(r.error||!iv){ body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 8px">This invite link is not valid</h1><p class="note-text" style="margin:0">Ask the therapist to send you a new link.</p><div class="btns" style="margin-top:12px"><button class="btn" id="aOk">Continue</button></div></div>`; $('#aOk').onclick=drop; return; }
    if(!iv.valid){ body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 8px">This invite has been used or has expired</h1><p class="note-text" style="margin:0">If you already accepted it, just sign in. Otherwise ask ${esc(iv.from)} for a new link.</p><div class="btns" style="margin-top:12px"><button class="btn" id="aOk">Continue</button></div></div>`; $('#aOk').onclick=drop; return; }
    const parent=iv.role==='parent';
    const consent=parent?`<label class="chk"><input type="checkbox" id="aConsent"><span>I am ${esc(iv.child)}’s parent or legal guardian. I agree that Khuluma may store ${esc(iv.child)}’s board, photos, recordings and how the board is used, so that the therapy team can set it up and follow progress. I can ask the therapist to remove this at any time.</span></label>`:'';
    const head=`<h1 style="font-size:1.4rem;margin:0 0 6px">${esc(iv.from)} invited you to ${esc(iv.child)}’s Khuluma board</h1>
      <p class="note-text" style="margin:0">You are joining as ${parent?'a parent':'a therapist on the team'}. ${parent?'Sign in on '+esc(iv.child)+'’s iPad: you only need to do this once. Your therapist’s setup replaces the board on this device. Then choose a plan: the first 7 days are free. Plans: '+planLine()+'.':''}</p>`;
    const accept=async btn=>{ if(parent&&!$('#aConsent').checked) return setErr('Please tick the consent box first.');
      busy(btn,true); if(!(await registerDevice())){ busy(btn,false); return; }
      const a=await sb.rpc('accept_invite',{t:tok,consent:parent}); busy(btn,false); if(a.error) return setErr(a.error);
      LS.del('khuluma.cloud.invite'); LS.del('khuluma.cloud.local'); localOnly=false; await loadMe(); if(parent) LS.set('khuluma.cloud.childDevice',true);
      await openChild(a.data,{replace:true}); toast('Welcome. This is now '+iv.child+'’s board.'); };
    if(session){
      const me=(session.user.email||'').toLowerCase();
      if(me!==String(iv.email).toLowerCase()){ body.innerHTML=`${brand}<div class="card">${head}<p class="note-text">This invite was sent to <b>${esc(iv.email)}</b>, but you are signed in as <b>${esc(me)}</b>.</p>${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aOut">Sign out and use ${esc(iv.email)}</button></div></div>`;
        $('#aOut').onclick=async()=>{ await sb.auth.signOut(); session=null; renderAuth('invite'); }; return; }
      body.innerHTML=`${brand}<div class="card">${head}${consent}${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">Accept and open the board</button></div></div>`;
      $('#aGo').onclick=e=>accept(e.target); return; }
    const mode=o.mode||'new';
    body.innerHTML=`${brand}<div class="card">${head}
      <div class="seg" style="margin-top:14px"><button aria-pressed="${mode==='new'}" id="aSegNew">I’m new</button><button aria-pressed="${mode==='old'}" id="aSegOld">I have an account</button></div>
      ${mode==='new'?fld('aName','Your full name','text','autocomplete="name"'):''}
      ${fld('aEmail','Email','email',`autocomplete="email" value="${esc(iv.email)}"`)}${fld('aPass',mode==='new'?'Choose a password (at least 8 characters)':'Password','password',`autocomplete="${mode==='new'?'new':'current'}-password"`)}
      ${mode==='new'&&!parent?`<div class="fld"><label for="aProf">Profession</label><select id="aProf">${PROFESSIONS.map(p=>`<option>${p}</option>`).join('')}</select></div>${fld('aHp','HPCSA number (optional)')}`:''}
      ${consent}${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">${mode==='new'?'Create account and open the board':'Sign in and open the board'}</button></div></div>`;
    $('#aSegNew').onclick=()=>renderAuth('invite',{mode:'new'}); $('#aSegOld').onclick=()=>renderAuth('invite',{mode:'old'});
    $('#aGo').onclick=async e=>{ if(parent&&!$('#aConsent').checked) return setErr('Please tick the consent box first.');
      busy(e.target,true); let r;
      if(mode==='new'){ if(!val('aName')){ busy(e.target,false); return setErr('Type your name.'); }
        r=await sb.auth.signUp({email:val('aEmail'),password:$('#aPass').value,options:{emailRedirectTo:SITE,data:{full_name:val('aName'),role:parent?'parent':'therapist',profession:parent?'':($('#aProf')||{}).value,hpcsa:parent?'':val('aHp')}}}); }
      else r=await sb.auth.signInWithPassword({email:val('aEmail'),password:$('#aPass').value});
      busy(e.target,false); if(r.error) return setErr(r.error);
      if(!r.data.session) return renderAuth('checkEmail',{email:val('aEmail')});
      session=r.data.session; await accept(e.target); };
  }
}

// ---------- Account tab ----------
const roleName=r=>({lead:'Lead therapist',therapist:'Therapist',parent:'Parent'}[r]||r);
function licLabel(l){ l=l||{state:'none'}; return {trial:'Free trial until '+fmtD(l.ends),active:'Paid until '+fmtD(l.ends),lifetime:'Lifetime plan',
  grace:'Subscription ended: renew now',expired:'Subscription ended',none:'Waiting for the parent to subscribe'}[l.state]||''; }
async function renderAccount(){
  roleNote(); const el=$('#acct'); if(!el) return;
  if(!configured){ el.innerHTML=`<div class="card"><h2>Accounts</h2><p class="note-text" style="margin:0">Therapist and parent logins are not switched on yet for this copy of Khuluma. The board works on this device without an account.</p></div>`; return; }
  if(!enabled){ el.innerHTML=`<div class="card"><h2>Accounts</h2><p class="note-text" style="margin:0">Logins work on the Khuluma website, not inside the Claude app. Open <b>${esc(SITE)}</b> in Safari or Chrome to sign in.</p></div>`; return; }
  if(!ready){ el.innerHTML=`<div class="card"><h2>Accounts</h2><p class="note-text" style="margin:0">${esc(syncMsg||'Connecting…')}</p></div>`; return; }
  if(!session){ el.innerHTML=`<div class="card"><h2>Accounts</h2><p class="note-text" style="margin:0 0 12px">This device is not signed in. The board is saved on this device only.</p><button class="btn primary" id="acIn">Sign in or create a therapist account</button></div>`;
    $('#acIn').onclick=()=>{ $('#settings').hidden=true; showAuth('welcome'); }; return; }
  const k=kid(), ther=profile&&profile.role==='therapist';
  let h=`<div class="card"><h2>Signed in</h2><div class="kid"><span class="who"><b>${esc(profile?.full_name||session.user.email)}</b><span class="note-text" style="margin:0">${esc(session.user.email)} · ${ther?esc(profile.profession||'Therapist'):'Parent'}</span></span>
    <span class="acts"><button class="btn" id="acName">Change my name</button><button class="btn" id="acOut">Sign out</button></span></div>
    <div id="acNameBox" hidden><div class="fld"><label for="acNameIn">Your full name (shown to the team and on invites)</label><input id="acNameIn" maxlength="80" value="${esc(profile?.full_name||'')}"></div><div class="btns" style="margin-top:8px"><button class="btn primary" id="acNameSave">Save name</button></div></div>
    <p class="note-text" id="acOutNote" hidden></p></div>
    <div class="card"><h2>This device</h2>${k?`<div class="kid on"><span class="who"><b>${esc(k.name)}’s board</b><span class="note-text" style="margin:0">You are ${roleName(k.role).toLowerCase()} · <span id="syncDot">${esc(syncMsg||'')}</span></span></span><span class="acts"><button class="btn" id="acSync">Sync now</button></span></div>`:
      `<p class="note-text" style="margin:0">No child’s board is open on this device yet.${ther?' Add a child below, or open one of yours.':''}</p>`}
    ${k&&isTher()?`<label class="chk"><input type="checkbox" id="acDev" ${LS.get('khuluma.cloud.childDevice',false)?'checked':''}><span>This is ${esc(k.name)}’s own device (it records how the board is used for Insights)</span></label>`:''}</div>`;
  if(ther&&acct&&profile&&!profile.approved){
    h+=`<div class="card"><h2>Waiting for approval</h2><p class="note-text" style="margin:0">${profile.rejected?'We could not confirm your HPCSA registration. Please contact Khuluma support.':`Thank you! We are checking your HPCSA registration${profile.hpcsa?' ('+esc(profile.hpcsa)+')':''}. You can add children and accept team invites as soon as your account is approved, usually within one working day.`}</p></div>`;
  }
  if(ther&&(!acct||profile.approved)){
    h+=`<div class="card"><h2>Your children</h2><div class="slist" style="margin-top:0">${kids.length?kids.map(c=>`<div class="kid ${c.id===childId?'on':''}"><span class="who"><b>${esc(c.name)}</b><span class="note-text" style="margin:0">${roleName(c.role)}${acct?' · '+esc(licLabel(c.licence)):''}</span></span>
        <span class="acts">${c.id===childId?'':`<button class="btn" data-open="${c.id}">Open on this device</button>`}<button class="btn" data-ren="${c.id}">Rename</button>${c.role==='lead'?`<button class="btn" data-del="${c.id}">Delete</button>`:''}<button class="btn" data-team="${c.id}">${openTeam===c.id?'Close team':'Team & invites'}</button></span></div>${renaming===c.id?`<div class="fld"><label for="acRen">New name for ${esc(c.name)}</label><input id="acRen" maxlength="60" value="${esc(c.name)}"></div><div class="btns" style="margin-top:8px"><button class="btn primary" id="acRenSave">Save name</button><button class="btn" id="acRenCancel">Cancel</button></div>`:''}`).join(''):'<div class="empty-state" style="display:block">No children yet.</div>'}</div>
      ${kid(openTeam)?`<h2 style="margin-top:18px">${esc(kid(openTeam).name)}’s team</h2><div id="teamBox"></div>`:''}
      <h2 style="margin-top:18px">Add a child</h2>
      <p class="note-text" style="margin:0 0 4px">Use a first name or nickname only. You become the lead therapist and can invite the parents and other therapists.${acct?' The child’s family then starts a free trial or chooses a plan to use the board at home.':''}</p>
      <div class="fld"><label for="acKid">Child’s first name or nickname</label><input id="acKid" maxlength="60"></div>
      <label class="chk"><input type="checkbox" id="acCopy" checked><span>Start from the board that is on this device now</span></label>
      <p class="err" id="acErr"></p><div class="btns"><button class="btn primary" id="acAdd">Add child</button></div></div>`;
  } else if(!ther&&acct){
    h+=`<div class="card"><h2>${kids.length>1?'Your children':'Subscription'}</h2><div class="slist" style="margin-top:0">${kids.map(c=>`<div class="kid ${c.id===childId?'on':''}"><span class="who"><b>${esc(c.name)}</b><span class="note-text" style="margin:0">${esc(licLabel(c.licence))}</span></span>
      <span class="acts">${c.id===childId?`<button class="btn primary" id="acPlan">${['active','lifetime'].includes((c.licence||{}).state)?'View plan':'Choose a plan'}</button>`:`<button class="btn" data-open="${c.id}">Open on this device</button>`}</span></div>`).join('')}</div>
      <div class="btns" style="margin-top:10px"><button class="btn" id="acAnother">Add another child</button>${k&&k.role==='parent'&&(k.licence||{}).renews?'<button class="btn" id="acCancel">Cancel subscription</button>':''}</div>
      ${k&&k.role==='parent'&&(k.licence||{}).renews?'<p class="note-text" style="margin:8px 0 0">Your card is charged automatically. If you cancel, the board stays open until the end of the period you paid for.</p>':''}</div>`;
  } else if(kids.length>1){
    h+=`<div class="card"><h2>Your children</h2><div class="slist" style="margin-top:0">${kids.map(c=>`<div class="kid ${c.id===childId?'on':''}"><span class="who"><b>${esc(c.name)}</b></span>${c.id===childId?'':`<button class="btn" data-open="${c.id}">Open on this device</button>`}</div>`).join('')}</div></div>`;
  }
  h+=`<div class="card"><h2>Your devices</h2><div id="devBox"><p class="note-text">Loading…</p></div></div>`;
  if(k&&!ther) h+=`<div class="card"><h2>${esc(k.name)}’s team</h2><div id="teamBox"></div><p class="note-text">${k.has_therapist?'The therapist sets up the board. You can add personal words, photos and recordings in Photos, voices &amp; scenes.':'You can set up the whole board yourself, or invite your child’s therapist to help: they then set up the board.'}</p></div>`;
  if(profile&&profile.is_admin) h+=`<div class="card"><h2>Admin</h2><div id="admBox"><p class="note-text">Loading…</p></div></div>`;
  el.innerHTML=h;
  if($('#acPlan')) $('#acPlan').onclick=()=>{ $('#settings').hidden=true; showAuth('subscribe'); };
  if($('#acCancel')) $('#acCancel').onclick=async e=>{ const b=e.target; if(b.dataset.sure!=='1'){ b.dataset.sure='1'; b.textContent='Tap again to cancel'; return; }
    try{ await payCall('cancel',{child_id:kid().id}); toast('Subscription cancelled. No more payments will be taken.'); }catch(x){ toast(x.message); } await loadMe(); renderAccount(); applyAccess(); };
  if($('#acAnother')) $('#acAnother').onclick=()=>{ $('#settings').hidden=true; showAuth('addChild'); };
  if($('#admBox')) renderAdmin();
  $('#acName').onclick=()=>{ $('#acNameBox').hidden=!$('#acNameBox').hidden; };
  $('#acNameSave').onclick=async e=>{ const n=val('acNameIn'); if(!n) return; busy(e.target,true); let r=await sb.rpc('set_my_name',{n}); if(r.error&&/function/i.test(r.error.message||'')) r=await sb.from('profiles').update({full_name:n}).eq('id',session.user.id); busy(e.target,false);
    if(r.error) return toast(friendly(r.error)); profile=Object.assign({},profile,{full_name:n}); toast('Name saved'); renderAccount(); };
  el.querySelectorAll('[data-ren]').forEach(b=>b.onclick=()=>{ renaming=renaming===b.dataset.ren?'':b.dataset.ren; renderAccount(); });
  if($('#acRenCancel')) $('#acRenCancel').onclick=()=>{ renaming=''; renderAccount(); };
  if($('#acRenSave')) $('#acRenSave').onclick=async e=>{ const n=val('acRen'); if(!n) return; busy(e.target,true);
    const r=await sb.from('children').update({display_name:n}).eq('id',renaming).select('id'); busy(e.target,false);
    if(r.error||!(r.data||[]).length) return toast(r.error?friendly(r.error):'Only the child’s therapist can rename the child.');
    renaming=''; await loadMe(); renderAccount(); toast('Name changed to '+n); };
  $('#acOut').onclick=e=>{ const n=$('#acOutNote'); if(!n.hidden){ return; } n.hidden=false;
    n.innerHTML=`Sign out of this device? <button class="btn" id="acOutKeep">Sign out, keep the board here</button> <button class="btn" id="acOutWipe">Sign out and remove the board</button>`;
    $('#acOutKeep').onclick=()=>signOut(false); $('#acOutWipe').onclick=()=>signOut(true); };
  if($('#acSync')) $('#acSync').onclick=async()=>{ await push(); await pull(true); renderAccount(); };
  if($('#acDev')) $('#acDev').onchange=e=>LS.set('khuluma.cloud.childDevice',e.target.checked);
  el.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openChild(b.dataset.open));
  el.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>{ openTeam=openTeam===b.dataset.team?'':b.dataset.team; lastInvite=null; renderAccount(); });
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{ const c=kid(b.dataset.del);
    if(b.dataset.sure!=='1'){ b.dataset.sure='1'; b.textContent='Tap again: delete '+c.name+' for everyone'; return; }
    const r=await sb.from('children').delete().eq('id',c.id).select('id'); if(r.error||!(r.data||[]).length) return toast(r.error?friendly(r.error):'Only the lead therapist can delete this child.');
    sb.storage.from('media').list(c.id).then(l=>{ const f=(l.data||[]).map(x=>c.id+'/'+x.name); if(f.length) sb.storage.from('media').remove(f); });
    LS.del('khuluma.cloud.s.'+c.id); if(c.id===childId){ setChild(''); A.setRole(''); } await loadMe(); renderAccount(); toast(c.name+' deleted'); });
  if($('#acAdd')) $('#acAdd').onclick=async e=>{ const n=val('acKid'); if(!n){ $('#acErr').textContent='Type the child’s name.'; return; }
    busy(e.target,true); const r=await sb.from('children').insert({display_name:n}).select('id').single(); busy(e.target,false);
    if(r.error){ $('#acErr').textContent=friendly(r.error); return; }
    await loadMe(); const copy=$('#acCopy').checked; if(!copy) await A.setData({settings:{}});
    await openChild(r.data.id,{copyLocal:copy}); openTeam=r.data.id; renderAccount(); toast(n+' added. Invite the parents next.'); };
  if(ther&&openTeam) renderTeam(openTeam); else if(k&&!ther) renderTeam(k.id);
  renderDevices();
}

async function renderAdmin(){
  const box=$('#admBox'); if(!box) return; const r=await sb.rpc('admin_overview');
  if(r.error){ box.innerHTML=`<p class="err">${esc(friendly(r.error))}</p>`; return; }
  const d=r.data, plans=(acct&&acct.plans)||[];
  const planSel=id=>`<select data-psel="${id}">${plans.map(p=>`<option value="${p.id}">${esc(p.name)} ${R$(p.price_cents)}</option>`).join('')}</select>`;
  box.innerHTML=`<h2 style="margin-top:0">Therapists to approve (${d.pending.length})</h2>
    ${d.pending.length?`<div class="admwrap"><table class="adm"><tr><th>Name</th><th>HPCSA</th><th>Email</th><th></th></tr>${d.pending.map(p=>`<tr><td>${esc(p.name)}<br><span class="note-text">${esc(p.profession||'')}</span></td><td><b>${esc(p.hpcsa||'none given')}</b><br><a href="https://hpcsaonline.custhelp.com/app/iregister" target="_blank" rel="noopener">Check on iRegister</a></td><td>${esc(p.email)}</td>
      <td><button class="btn primary" data-appr="${p.id}">Approve</button> <button class="btn" data-rej="${p.id}">Reject</button></td></tr>`).join('')}</table></div>`:'<p class="note-text">Nobody is waiting.</p>'}
    ${(d.requests||[]).length?`<h2>Payment requests (${d.requests.length})</h2><div class="admwrap"><table class="adm"><tr><th>Child</th><th>Plan</th><th>Reference</th><th>Asked</th><th></th></tr>${d.requests.map(q=>`<tr><td>${esc(q.child)}<br><span class="note-text">${esc(q.email||'')}</span></td><td>${esc(q.plan_name)}<br>${R$(q.price_cents)}</td><td>${esc(q.reference||'')}</td><td>${fmtD(q.created_at)}</td>
      <td><button class="btn primary" data-paid="${q.child_id}" data-plan="${q.plan_id}" data-ref="${esc(q.reference||'')}">Mark paid</button></td></tr>`).join('')}</table></div>`:''}
    <h2>Children and plans (${d.children.length})</h2>
    <div class="admwrap"><table class="adm"><tr><th>Child</th><th>Family / therapist</th><th>Plan</th><th>Record a payment</th></tr>${d.children.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.parents||'no parent yet')}<br><span class="note-text">${esc(c.therapist||'no therapist')}</span></td><td>${esc(licLabel(c.licence))}</td>
      <td>${planSel(c.id)} <input data-ref="${c.id}" placeholder="reference" style="width:110px;font:inherit;padding:6px;border-radius:8px;border:1px solid var(--line)"> <button class="btn" data-rec="${c.id}">Save</button>${['active','lifetime','trial'].includes(c.licence.state)?` <button class="btn" data-cancel="${c.id}">Cancel plan</button>`:''}</td></tr>`).join('')}</table></div>`;
  const done=m=>{ toast(m); renderAdmin(); };
  box.querySelectorAll('[data-appr]').forEach(b=>b.onclick=async()=>{ const x=await sb.rpc('admin_review_therapist',{uid:b.dataset.appr,approve:true}); x.error?toast(friendly(x.error)):done('Therapist approved'); });
  box.querySelectorAll('[data-rej]').forEach(b=>b.onclick=async()=>{ if(b.dataset.sure!=='1'){ b.dataset.sure='1'; b.textContent='Tap again to reject'; return; } const x=await sb.rpc('admin_review_therapist',{uid:b.dataset.rej,approve:false}); x.error?toast(friendly(x.error)):done('Therapist rejected'); });
  box.querySelectorAll('[data-paid]').forEach(b=>b.onclick=async()=>{ const x=await sb.rpc('admin_record_payment',{cid:b.dataset.paid,plan:b.dataset.plan,method:'EFT',ref:b.dataset.ref}); x.error?toast(friendly(x.error)):done('Payment recorded: plan switched on'); });
  box.querySelectorAll('[data-rec]').forEach(b=>b.onclick=async()=>{ const id=b.dataset.rec, plan=box.querySelector(`[data-psel="${id}"]`).value, ref=box.querySelector(`[data-ref="${id}"]`).value;
    if(b.dataset.sure!=='1'){ b.dataset.sure='1'; b.textContent='Tap again to confirm'; return; }
    const x=await sb.rpc('admin_record_payment',{cid:id,plan,method:'EFT',ref}); x.error?toast(friendly(x.error)):done('Payment recorded'); });
  box.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=async()=>{ if(b.dataset.sure!=='1'){ b.dataset.sure='1'; b.textContent='Tap again to cancel'; return; } const x=await sb.rpc('admin_cancel',{cid:b.dataset.cancel}); x.error?toast(friendly(x.error)):done('Plan cancelled'); });
}
async function renderDevices(){
  const box=$('#devBox'); if(!box) return; const d=await myDevices();
  if(!d){ box.innerHTML='<p class="note-text" style="margin:0">Device limits are not switched on yet.</p>'; return; }
  box.innerHTML=`<p class="note-text" style="margin:0 0 8px">This login is signed in on ${d.devices.length} of ${d.max} devices. Swaps left this month: ${d.swaps_left}.</p>
    <div class="slist" style="margin-top:0">${d.devices.map(x=>`<div class="kid ${x.this?'on':''}"><span class="who"><b>${esc(x.name)}${x.this?' (this device)':''}</b><span class="note-text" style="margin:0">Last used ${ago(x.last_seen)}</span></span>${x.this?'':`<button class="btn" data-rmdev="${x.id}" ${d.swaps_left?'':'disabled'}>Sign it out</button>`}</div>`).join('')}</div>`;
  box.querySelectorAll('[data-rmdev]').forEach(b=>b.onclick=async()=>{ if(b.dataset.sure!=='1'){ b.dataset.sure='1'; b.textContent='Tap again to sign it out'; return; }
    const r=await sb.rpc('remove_device',{d:b.dataset.rmdev}); if(r.error) toast(friendly(r.error)); else toast('That device was signed out'); renderDevices(); });
}
async function renderTeam(cid){
  const box=$('#teamBox'); if(!box) return; box.innerHTML='<p class="note-text">Loading…</p>';
  const c=kid(cid), lead=c&&c.role==='lead', ther=c&&(['lead','therapist'].includes(c.role)||(c.role==='parent'&&!c.has_therapist)), me=session.user.id;
  const t=await sb.rpc('child_team',{cid});
  if(t.error){ box.innerHTML=`<p class="err">Could not load the team: ${esc(friendly(t.error))}</p>`; return; }
  let h=`<div class="slist">${(t.data||[]).map(p=>`<div><span><b>${esc(p.full_name)}</b> <span class="pill">${roleName(p.role)}</span>${p.profession?` <span class="note-text" style="margin:0">${esc(p.profession)}</span>`:''}</span>
     <span>${lead&&p.user_id!==me&&p.role==='therapist'?`<button class="btn" data-lead="${p.user_id}">Make lead</button> `:''}${lead&&p.user_id!==me?`<button class="btn" data-rm="${p.user_id}">Remove</button>`:''}</span></div>`).join('')}</div>`;
  if(ther){
    const inv=await sb.from('invites').select('token,email,role,expires_at,accepted_at').eq('child_id',cid).is('accepted_at',null).order('created_at',{ascending:false});
    const pending=(inv.data||[]).filter(i=>new Date(i.expires_at)>new Date());
    h+=`<div class="card" style="margin-top:12px;background:var(--bg)"><h2>Invite someone to ${esc(c.name)}’s board</h2>
      <div class="row" style="border:0;grid-template-columns:minmax(0,1fr) auto auto;padding:0"><input id="ivEmail" type="email" placeholder="their email address" style="font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);min-width:0">
      <select id="ivRole" style="width:auto">${c.role==='parent'?'<option value="therapist">Therapist</option><option value="parent">Parent</option>':'<option value="parent">Parent</option><option value="therapist">Therapist</option>'}</select><button class="btn primary" id="ivGo">Create invite</button></div>
      <p class="err" id="ivErr"></p>${lastInvite&&lastInvite.cid===cid?inviteBox(lastInvite):''}
      ${pending.length?`<h2 style="margin-top:12px">Waiting to be accepted</h2><div class="slist" style="margin-top:0">${pending.map(i=>`<div><span>${esc(i.email)} <span class="pill">${roleName(i.role)}</span></span><span><button class="btn" data-link="${i.token}" data-em="${esc(i.email)}" data-ro="${i.role}">Show link</button> <button class="btn" data-cancel="${i.token}">Cancel</button></span></div>`).join('')}</div>`:''}</div>`;
  }
  box.innerHTML=h;
  box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{ if(b.dataset.sure!=='1'){ b.dataset.sure='1'; b.textContent='Tap again to remove'; return; }
    const r=await sb.from('child_members').delete().eq('child_id',cid).eq('user_id',b.dataset.rm); if(r.error) toast(friendly(r.error)); renderTeam(cid); });
  box.querySelectorAll('[data-lead]').forEach(b=>b.onclick=async()=>{ const r=await sb.rpc('make_lead',{cid,uid:b.dataset.lead}); if(r.error) toast(friendly(r.error)); await loadMe(); renderAccount(); });
  box.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=async()=>{ await sb.from('invites').delete().eq('token',b.dataset.cancel); renderTeam(cid); });
  box.querySelectorAll('[data-link]').forEach(b=>b.onclick=()=>{ lastInvite={cid,token:b.dataset.link,email:b.dataset.em,role:b.dataset.ro,child:c.name}; renderTeam(cid); });
  if($('#ivGo')) $('#ivGo').onclick=async e=>{ const em=val('ivEmail').toLowerCase(); if(!/^\S+@\S+\.\S+$/.test(em)){ $('#ivErr').textContent='Type a valid email address.'; return; }
    busy(e.target,true); const r=await sb.from('invites').insert({child_id:cid,email:em,role:$('#ivRole').value}).select('token,role,email').single(); busy(e.target,false);
    if(r.error){ $('#ivErr').textContent=friendly(r.error); return; } lastInvite={cid,token:r.data.token,email:em,role:r.data.role,child:c.name}; renderTeam(cid); };
  const cp=$('#ivCopy'); if(cp) cp.onclick=()=>{ const t=$('#ivLink').textContent; (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Link copied'),()=>{ const s=getSelection(), r=document.createRange(); r.selectNodeContents($('#ivLink')); s.removeAllRanges(); s.addRange(r); toast('Press copy to copy the link'); }); };
}
function inviteBox(iv){
  const link=SITE+(SITE.includes('?')?'&':'?')+'invite='+iv.token;
  const msg=`Hi! I've set up ${iv.child}'s Khuluma communication board. ${iv.role==='parent'?`Please open this link on ${iv.child}'s iPad and sign up with ${iv.email}:`:`Join ${iv.child}'s therapy team on Khuluma (sign up with ${iv.email}):`} ${link}`;
  return `<div style="margin-top:10px"><p class="note-text" style="margin:0">Send this link to <b>${esc(iv.email)}</b>. It works once and expires in 14 days.</p>
    <div class="invite-link" id="ivLink">${esc(link)}</div>
    <div class="btns" style="margin-top:8px"><button class="btn" id="ivCopy">Copy link</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">Send on WhatsApp</a><a class="btn" href="mailto:${encodeURIComponent(iv.email)}?subject=${encodeURIComponent(iv.child+'’s Khuluma board')}&body=${encodeURIComponent(msg)}">Send by email</a></div></div>`;
}

async function signOut(wipe){
  await push();
  try{ const d=await myDevices(); const me=d&&d.devices.find(x=>x.this); if(me) await sb.rpc('remove_device',{d:me.id}); }catch(e){}
  profile=null; await sb.auth.signOut(); session=null;
  const was=childId; setChild(''); kids=[]; LS.del('khuluma.cloud.kids'); LS.del('khuluma.cloud.childDevice'); A.setRole('');
  if(wipe){ if(was) LS.del('khuluma.cloud.s.'+was); await A.setData({settings:{}}); }
  $('#settings').hidden=true; showAuth('welcome');
}
})();
