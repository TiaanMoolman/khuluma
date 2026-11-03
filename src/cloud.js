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

let sb=null, session=null, profile=null, kids=[], ready=false, online=navigator.onLine;
let childId=LS.get('khuluma.cloud.child',''), localOnly=LS.get('khuluma.cloud.local',false);
let st=loadSt(childId), pushT=0, pushing=false, gen=0, lastPull=0, syncMsg='', openTeam='', lastInvite=null;

function loadSt(id){ return Object.assign({version:-1,dirty:{},up:{}},id?LS.get('khuluma.cloud.s.'+id,{}):{}); }
function saveSt(){ if(childId) LS.set('khuluma.cloud.s.'+childId,st); }
const kid=id=>kids.find(k=>k.id===(id||childId));
const myRole=()=>(kid()||{}).role||'';
const isTher=()=>['lead','therapist'].includes(myRole());
const childDevice=()=>myRole()==='parent'||LS.get('khuluma.cloud.childDevice',false);
function setSync(t){ syncMsg=t; const d=$('#syncDot'); if(d) d.textContent=t; }

// ---------- public hooks used by the board ----------
window.khulumaCloud={ changed(k){
  if(k==='account-tab'){ renderAccount(); return; }
  if(!sb||!session||!childId) return;
  if(k==='board'||k==='log'){ st.dirty[k]=true; gen++; saveSt(); clearTimeout(pushT); pushT=setTimeout(push,2500); }
} };

// ---------- start ----------
const inviteParam=new URLSearchParams(location.search).get('invite');
if(inviteParam){ LS.set('khuluma.cloud.invite',inviteParam); try{ const u=new URL(location.href); u.searchParams.delete('invite'); history.replaceState(null,'',u.pathname+u.search+u.hash); }catch(e){} }
if(enabled) start();

function loadLib(){ return new Promise((res,rej)=>{ if(window.supabase) return res();
  const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }

async function start(){
  try{ await loadLib(); }catch(e){ setSync('Offline: changes stay on this device'); return; }   // offline: the board still works
  sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'khuluma.auth'}});
  sb.auth.onAuthStateChange((ev,s)=>{ session=s;
    if(ev==='PASSWORD_RECOVERY') showAuth('recover');
    if(ev==='SIGNED_OUT'){ profile=null; kids=[]; A.setRole(''); renderAccount(); } });
  const {data}=await sb.auth.getSession(); session=data.session; ready=true;
  window.addEventListener('online',()=>{ online=true; push().then(()=>pull()); });
  window.addEventListener('offline',()=>{ online=false; setSync('Offline: changes are kept and sync later'); });
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&Date.now()-lastPull>30000) pull(); });
  setInterval(()=>{ if(!document.hidden) pull(); },120000);
  await afterSignIn();
}

async function afterSignIn(){
  const inv=LS.get('khuluma.cloud.invite','');
  if(inv){ showAuth('invite'); return; }
  if(!session){ A.setRole(''); if(!localOnly&&!childId) showAuth('welcome'); renderAccount(); return; }
  await loadMe();
  if(childId&&!kid()){ if(kids.length||online){ toast('This device no longer has access to that child’s board.'); setChild(''); } }
  if(!childId){
    if(kids.length===1) await openChild(kids[0].id,{replace:true});
    else if(kids.length>1) showAuth('pick');
    else { hideAuth(); A.openSettings('account'); }
  } else { A.setRole(isTher()?'':'parent'); hideAuth(); await pull(); }
  renderAccount();
}

async function loadMe(){
  if(!session) return;
  const uid=session.user.id;
  const p=await sb.from('profiles').select('*').eq('id',uid).maybeSingle(); if(p.data) profile=p.data;
  const m=await sb.from('child_members').select('child_id,role,children(display_name)').eq('user_id',uid);
  if(!m.error) kids=(m.data||[]).map(r=>({id:r.child_id,role:r.role,name:(r.children||{}).display_name||'Child'})).sort((a,b)=>a.name.localeCompare(b.name));
  LS.set('khuluma.cloud.kids',kids);
}
if(!kids.length) kids=LS.get('khuluma.cloud.kids',[]);   // offline: remember whose board this is
if(childId&&kid()&&kid().role==='parent') A.setRole('parent');   // a parent's device stays limited even offline

function setChild(id){ childId=id||''; if(childId) LS.set('khuluma.cloud.child',childId); else LS.del('khuluma.cloud.child'); st=loadSt(childId); }

async function openChild(id,{replace=false,copyLocal=false}={}){
  if(childId&&childId!==id) await push();
  setChild(id); A.setRole(isTher()?'':'parent');
  if(copyLocal){ st.dirty={board:true}; st.version=-1; saveSt(); await push(); }
  await pull(true);
  hideAuth(); renderAccount();
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

async function renderAuth(screen,o){
  const body=$('#authBody'); const err='<p class="err" id="aErr" role="alert"></p>';
  const setErr=m=>{ $('#aErr').textContent=friendly(m); };
  if(screen==='welcome'){
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Sign in</h1>
      <p class="note-text" style="margin:0">Therapists and parents sign in here. Parents: open the invite link your child’s therapist sent you.</p>
      ${fld('aEmail','Email','email','autocomplete="email" inputmode="email"')}${fld('aPass','Password','password','autocomplete="current-password"')}
      ${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">Sign in</button><button class="linkbtn" id="aForgot">Forgot password?</button></div></div>
      <div class="card"><h2>New therapist</h2><p class="note-text" style="margin:0 0 10px">Create an account to set up your children’s boards and invite their parents.</p><button class="btn" id="aNew">Create a therapist account</button></div>
      <button class="linkbtn" id="aLocal">Use Khuluma on this device without an account</button>`;
    $('#aGo').onclick=async e=>{ busy(e.target,true); const r=await sb.auth.signInWithPassword({email:val('aEmail'),password:$('#aPass').value}); busy(e.target,false);
      if(r.error) return setErr(r.error); session=r.data.session; localOnly=false; LS.del('khuluma.cloud.local'); await afterSignIn(); };
    $('#aPass').onkeydown=e=>{ if(e.key==='Enter') $('#aGo').click(); };
    $('#aForgot').onclick=async()=>{ const em=val('aEmail'); if(!em) return setErr('Type your email first.');
      const r=await sb.auth.resetPasswordForEmail(em,{redirectTo:SITE}); if(r.error) return setErr(r.error); setErr(''); $('#aErr').textContent='We emailed you a link to choose a new password.'; };
    $('#aNew').onclick=()=>renderAuth('signup');
    $('#aLocal').onclick=()=>{ localOnly=true; LS.set('khuluma.cloud.local',true); hideAuth(); };
  }
  if(screen==='signup'){
    body.innerHTML=`${brand}<div class="card"><h1 style="font-size:1.4rem;margin:0 0 4px">Create a therapist account</h1>
      ${fld('aName','Your full name','text','autocomplete="name"')}
      <div class="fld"><label for="aProf">Profession</label><select id="aProf">${PROFESSIONS.map(p=>`<option>${p}</option>`).join('')}</select></div>
      ${fld('aHp','HPCSA number (optional)','text','placeholder="e.g. PT0000000"')}
      ${fld('aEmail','Email','email','autocomplete="email" inputmode="email"')}${fld('aPass','Password (at least 8 characters)','password','autocomplete="new-password"')}
      ${err}<div class="btns" style="margin-top:12px"><button class="btn primary" id="aGo">Create account</button><button class="linkbtn" id="aBack">Back to sign in</button></div></div>`;
    $('#aBack').onclick=()=>renderAuth('welcome');
    $('#aGo').onclick=async e=>{ if(!val('aName')) return setErr('Type your name.'); if($('#aPass').value.length<8) return setErr('Use a password of at least 8 characters.');
      busy(e.target,true); const r=await sb.auth.signUp({email:val('aEmail'),password:$('#aPass').value,options:{emailRedirectTo:SITE,data:{full_name:val('aName'),role:'therapist',profession:$('#aProf').value,hpcsa:val('aHp')}}}); busy(e.target,false);
      if(r.error) return setErr(r.error);
      if(r.data.session){ session=r.data.session; LS.del('khuluma.cloud.local'); await afterSignIn(); }
      else renderAuth('checkEmail',{email:val('aEmail')}); };
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
      <p class="note-text" style="margin:0">You are joining as ${parent?'a parent':'a therapist on the team'}. ${parent?'Sign in on '+esc(iv.child)+'’s iPad: you only need to do this once. Your therapist’s setup replaces the board on this device.':''}</p>`;
    const accept=async btn=>{ if(parent&&!$('#aConsent').checked) return setErr('Please tick the consent box first.');
      busy(btn,true); const a=await sb.rpc('accept_invite',{t:tok,consent:parent}); busy(btn,false); if(a.error) return setErr(a.error);
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
async function renderAccount(){
  const el=$('#acct'); if(!el) return;
  if(!configured){ el.innerHTML=`<div class="card"><h2>Accounts</h2><p class="note-text" style="margin:0">Therapist and parent logins are not switched on yet for this copy of Khuluma. The board works on this device without an account.</p></div>`; return; }
  if(!enabled){ el.innerHTML=`<div class="card"><h2>Accounts</h2><p class="note-text" style="margin:0">Logins work on the Khuluma website, not inside the Claude app. Open <b>${esc(SITE)}</b> in Safari or Chrome to sign in.</p></div>`; return; }
  if(!ready){ el.innerHTML=`<div class="card"><h2>Accounts</h2><p class="note-text" style="margin:0">${esc(syncMsg||'Connecting…')}</p></div>`; return; }
  if(!session){ el.innerHTML=`<div class="card"><h2>Accounts</h2><p class="note-text" style="margin:0 0 12px">This device is not signed in. The board is saved on this device only.</p><button class="btn primary" id="acIn">Sign in or create a therapist account</button></div>`;
    $('#acIn').onclick=()=>{ $('#settings').hidden=true; showAuth('welcome'); }; return; }
  const k=kid(), ther=profile&&profile.role==='therapist';
  let h=`<div class="card"><h2>Signed in</h2><div class="kid"><span class="who"><b>${esc(profile?.full_name||session.user.email)}</b><span class="note-text" style="margin:0">${esc(session.user.email)} · ${ther?esc(profile.profession||'Therapist'):'Parent'}</span></span>
    <span class="acts"><button class="btn" id="acOut">Sign out</button></span></div>
    <p class="note-text" id="acOutNote" hidden></p></div>
    <div class="card"><h2>This device</h2>${k?`<div class="kid on"><span class="who"><b>${esc(k.name)}’s board</b><span class="note-text" style="margin:0">You are ${roleName(k.role).toLowerCase()} · <span id="syncDot">${esc(syncMsg||'')}</span></span></span><span class="acts"><button class="btn" id="acSync">Sync now</button></span></div>`:
      `<p class="note-text" style="margin:0">No child’s board is open on this device yet.${ther?' Add a child below, or open one of yours.':''}</p>`}
    ${k&&isTher()?`<label class="chk"><input type="checkbox" id="acDev" ${LS.get('khuluma.cloud.childDevice',false)?'checked':''}><span>This is ${esc(k.name)}’s own device (it records how the board is used for Insights)</span></label>`:''}</div>`;
  if(ther){
    h+=`<div class="card"><h2>Your children</h2><div class="slist" style="margin-top:0">${kids.length?kids.map(c=>`<div class="kid ${c.id===childId?'on':''}"><span class="who"><b>${esc(c.name)}</b><span class="note-text" style="margin:0">${roleName(c.role)}</span></span>
        <span class="acts">${c.id===childId?'':`<button class="btn" data-open="${c.id}">Open on this device</button>`}<button class="btn" data-team="${c.id}">${openTeam===c.id?'Close team':'Team & invites'}</button></span></div>`).join(''):'<div class="empty-state" style="display:block">No children yet.</div>'}</div>
      ${kid(openTeam)?`<h2 style="margin-top:18px">${esc(kid(openTeam).name)}’s team</h2><div id="teamBox"></div>`:''}
      <h2 style="margin-top:18px">Add a child</h2>
      <p class="note-text" style="margin:0 0 4px">Use a first name or nickname only. You become the lead therapist and can invite the parents and other therapists.</p>
      <div class="fld"><label for="acKid">Child’s first name or nickname</label><input id="acKid" maxlength="60"></div>
      <label class="chk"><input type="checkbox" id="acCopy" checked><span>Start from the board that is on this device now</span></label>
      <p class="err" id="acErr"></p><div class="btns"><button class="btn primary" id="acAdd">Add child</button></div></div>`;
  } else if(kids.length>1){
    h+=`<div class="card"><h2>Your children</h2><div class="slist" style="margin-top:0">${kids.map(c=>`<div class="kid ${c.id===childId?'on':''}"><span class="who"><b>${esc(c.name)}</b></span>${c.id===childId?'':`<button class="btn" data-open="${c.id}">Open on this device</button>`}</div>`).join('')}</div></div>`;
  }
  if(k&&!ther) h+=`<div class="card"><h2>${esc(k.name)}’s team</h2><div id="teamBox"></div><p class="note-text">The therapist sets up the board. You can add personal words, photos and recordings in Photos, voices &amp; scenes.</p></div>`;
  el.innerHTML=h;
  $('#acOut').onclick=e=>{ const n=$('#acOutNote'); if(!n.hidden){ return; } n.hidden=false;
    n.innerHTML=`Sign out of this device? <button class="btn" id="acOutKeep">Sign out, keep the board here</button> <button class="btn" id="acOutWipe">Sign out and remove the board</button>`;
    $('#acOutKeep').onclick=()=>signOut(false); $('#acOutWipe').onclick=()=>signOut(true); };
  if($('#acSync')) $('#acSync').onclick=async()=>{ await push(); await pull(true); renderAccount(); };
  if($('#acDev')) $('#acDev').onchange=e=>LS.set('khuluma.cloud.childDevice',e.target.checked);
  el.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openChild(b.dataset.open));
  el.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>{ openTeam=openTeam===b.dataset.team?'':b.dataset.team; lastInvite=null; renderAccount(); });
  if($('#acAdd')) $('#acAdd').onclick=async e=>{ const n=val('acKid'); if(!n){ $('#acErr').textContent='Type the child’s name.'; return; }
    busy(e.target,true); const r=await sb.from('children').insert({display_name:n}).select('id').single(); busy(e.target,false);
    if(r.error){ $('#acErr').textContent=friendly(r.error); return; }
    await loadMe(); const copy=$('#acCopy').checked; if(!copy) await A.setData({settings:{}});
    await openChild(r.data.id,{copyLocal:copy}); openTeam=r.data.id; renderAccount(); toast(n+' added. Invite the parents next.'); };
  if(ther&&openTeam) renderTeam(openTeam); else if(k&&!ther) renderTeam(k.id);
}

async function renderTeam(cid){
  const box=$('#teamBox'); if(!box) return; box.innerHTML='<p class="note-text">Loading…</p>';
  const c=kid(cid), lead=c&&c.role==='lead', ther=c&&['lead','therapist'].includes(c.role), me=session.user.id;
  const t=await sb.rpc('child_team',{cid});
  let h=`<div class="slist">${(t.data||[]).map(p=>`<div><span><b>${esc(p.full_name)}</b> <span class="pill">${roleName(p.role)}</span>${p.profession?` <span class="note-text" style="margin:0">${esc(p.profession)}</span>`:''}</span>
     <span>${lead&&p.user_id!==me&&p.role==='therapist'?`<button class="btn" data-lead="${p.user_id}">Make lead</button> `:''}${lead&&p.user_id!==me?`<button class="btn" data-rm="${p.user_id}">Remove</button>`:''}</span></div>`).join('')}</div>`;
  if(ther){
    const inv=await sb.from('invites').select('token,email,role,expires_at,accepted_at').eq('child_id',cid).is('accepted_at',null).order('created_at',{ascending:false});
    const pending=(inv.data||[]).filter(i=>new Date(i.expires_at)>new Date());
    h+=`<div class="card" style="margin-top:12px;background:var(--bg)"><h2>Invite someone to ${esc(c.name)}’s board</h2>
      <div class="row" style="border:0;grid-template-columns:minmax(0,1fr) auto auto;padding:0"><input id="ivEmail" type="email" placeholder="their email address" style="font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);min-width:0">
      <select id="ivRole" style="width:auto"><option value="parent">Parent</option><option value="therapist">Therapist</option></select><button class="btn primary" id="ivGo">Create invite</button></div>
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
  await push(); await sb.auth.signOut(); session=null; profile=null;
  const was=childId; setChild(''); kids=[]; LS.del('khuluma.cloud.kids'); LS.del('khuluma.cloud.childDevice'); A.setRole('');
  if(wipe){ if(was) LS.del('khuluma.cloud.s.'+was); await A.setData({settings:{}}); }
  $('#settings').hidden=true; showAuth('welcome');
}
})();
