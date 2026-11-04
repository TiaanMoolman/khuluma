// ===== Khuluma vocabulary: English + Afrikaans =====
// Row format: emoji | English | Afrikaans | class | grammar tag
// Classes (Fitzgerald Key): p people  v actions  d describing  n things & places  s social  q questions  x no & stop  w little words
// Grammar tags: S:person:english-subject   V:verb-key   NEG
const LANGS={en:{name:'English',bcp:'en-ZA',code:'EN'},af:{name:'Afrikaans',bcp:'af-ZA',code:'AF'}};
const LC=['en','af'], LI={en:0,af:1};
const P=s=>s.trim().split('\n').filter(l=>l.trim()).map(l=>l.split('|').map(x=>x.trim()));
const slug=s=>s.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function parseG(s){ if(!s) return null; const a=s.split(':'); if(a[0]==='S') return {t:'S',p:a[1],en:a[2]}; if(a[0]==='V') return {t:'V',v:a[1]}; if(a[0]==='NEG') return {t:'NEG'}; return null; }

const ITEMS={};               // key -> base item
function reg(list,rows){ return P(rows).map(r=>{ const key=list+':'+slug(r[1]); ITEMS[key]={key,e:r[0],w:[r[1],r[2]],c:r[3]||'n',g:parseG(r[4])}; return key; }); }

// ---------- Core words: master grid of 10 columns x 6 rows ----------
// Smaller grids keep the most important columns and rows, in the same left-to-right and top-to-bottom order,
// so a child who moves up a size finds every word they already know in the same relative place.
const CORE_COLS=[
`❓|what|wat|q
🧑|who|wie|q
📍|where|waar|q
🕒|when|wanneer|q
🤔|why|hoekom|q
🛠️|how|hoe|q`,
`🙋|I|ek|p|S:1s:I
🫵|you|jy|p|S:2s:you
👉|it|dit|p|S:3s:it
👦|he|hy|p|S:3s:he
👧|she|sy|p|S:3s:she
👫|we|ons|p|S:1p:we`,
`🫴|want|wil hê|v|V:want
😍|like|hou van|v|V:like
🚶|go|gaan|v|V:go
🤝|help|help|v|V:help
✋|stop|stop|v|V:stop
👀|look|kyk|v|V:look`,
`🍽️|eat|eet|v|V:eat
🥤|drink|drink|v|V:drink
🧸|play|speel|v|V:play
🫳|get|kry|v|V:get
📥|put|sit|v|V:put
🔨|make|maak|v|V:make`,
`🫶|feel|voel|v|V:feel
👁️|see|sien|v|V:see
❗|need|het nodig|v|V:need
🎒|have|het|v|V:have
✅|do|doen|v|V:do
👈|come|kom|v|V:come`,
`🚫|not|nie|x|NEG
➕|more|nog|d
🔁|again|weer|d
🏁|finished|klaar|d
💪|can|kan|v|V:can
🟰|is|is|w`,
`🐘|big|groot|d
🐭|little|klein|d
👍|good|goed|d
👎|bad|sleg|d
🔥|hot|warm|d
🧊|cold|koud|d`,
`📦|in|in|w
🔛|on|op|w
📤|out|uit|w
📴|off|af|w
⬇️|here|hier|w
↗️|there|daar|w`,
`✅|yes|ja|s
❌|no|nee|x
👋|hello|hallo|s
🙏|please|asseblief|s
💐|thank you|dankie|s
😔|sorry|jammer|s`,
`➕|and|en|w
🔤|the|die|w
1️⃣|a|’n|w
👇|this|hierdie|w
👆|that|daardie|w
💯|all|alles|w`];
const CORE=CORE_COLS.map(c=>reg('core',c));          // CORE[col][row] = key
const COL_PRIORITY=[1,2,5,3,8,0,6,4,7,9];             // which columns appear first as the grid grows
const ROW_PRIORITY=[0,1,2,3,4,5];
const GRIDS=[['3x3','9 (3 × 3)'],['4x4','16 (4 × 4)'],['5x4','20 (5 × 4)'],['6x5','30 (6 × 5)'],['8x6','48 (8 × 6)'],['10x6','60 (10 × 6)']];
function coreLayout(c,r){
  const cols=COL_PRIORITY.slice(0,Math.min(c,10)).sort((a,b)=>a-b), rows=ROW_PRIORITY.slice(0,Math.min(r,6)).sort((a,b)=>a-b);
  const out=[]; rows.forEach(rw=>cols.forEach(cl=>out.push(CORE[cl][rw])));
  return out;
}

// ---------- QuickFires: whole phrases for speed ----------
const QUICKFIRES=reg('quick',`
👋|Good morning|Goeie môre|s
🙂|How are you?|Hoe gaan dit?|q
👌|I’m fine|Dit gaan goed|s
👋🏽|Goodbye|Totsiens|s
😋|I’m hungry|Ek is honger|d
🥤|I’m thirsty|Ek is dors|d
🚽|I need the toilet|Ek moet toilet toe gaan|v
😩|I’m tired|Ek is moeg|d
🤕|I’m sore|Ek het pyn|x
☕|I need a break|Ek het ’n blaaskans nodig|v
🙋|Help me, please|Help my asseblief|v
🙈|Leave me alone|Los my uit|x
✋|Stop it|Hou op|x
🔁|Do it again|Doen dit weer|v
🏁|All done|Klaar|d
😍|I like it|Ek hou daarvan|s
🙅|I don’t like it|Ek hou nie daarvan nie|x
☝️|My turn|My beurt|s
👉|Your turn|Jou beurt|s
⏳|Wait for me|Wag vir my|v
😂|That’s funny|Dis snaaks|s
🤷|I don’t know|Ek weet nie|s
🙏|Excuse me|Verskoon my|s
❤️|I love you|Ek is lief vir jou|s
👀|Look at me|Kyk na my|s
🗣️|I want to tell you something|Ek wil jou iets vertel|v
❓|What’s that?|Wat is dit?|q
🌟|Good job|Mooi so|s`);

// ---------- Word lists (right-hand column) ----------
const LISTS={
 little:{e:'🧩',n:['Little words','Klein woordjies'],items:reg('little',`
👥|they|hulle|p|S:3p:they
🙋‍♂️|me|my|p
🫵|my|my|p
👉|your|jou|p
👦|his|sy|p
👧|her|haar|p
👫|our|ons|p
⬆️|up|op|w
⬇️|down|af|w
🤝|with|met|w
🎁|for|vir|w
➡️|to|na|w
⬅️|from|van|w
📌|at|by|w
🔽|under|onder|w
🔼|over|oor|w
🧍‍♂️|next to|langs|w
🔙|behind|agter|w
🔜|in front|voor|w
🔀|or|of|w
⚖️|but|maar|w
💡|because|want|w
❔|if|as|w
⏭️|then|dan|w
🤲|some|bietjie|w
🔄|other|ander|w
‼️|very|baie|w
➕|too|ook|w
✔️|just|net|w
🌀|around|rondom|w
🫱|mine|myne|p
🫲|yours|joune|p`)},
 describe:{e:'🎨',n:['Describing','Beskrywend'],items:reg('describe',`
🔴|red|rooi|d
🔵|blue|blou|d
🟢|green|groen|d
🟡|yellow|geel|d
🟠|orange|oranje|d
🟣|purple|pers|d
🩷|pink|pienk|d
⚫|black|swart|d
⚪|white|wit|d
🟤|brown|bruin|d
🐇|fast|vinnig|d
🐢|slow|stadig|d
📢|loud|hard|d
🤫|quiet|stil|d
💦|wet|nat|d
🏜️|dry|droog|d
🫠|dirty|vuil|d
✨|clean|skoon|d
😋|yummy|lekker|d
🤢|yucky|aaklig|d
💔|broken|stukkend|d
🆕|new|nuut|d
👴|old|oud|d
🫙|full|vol|d
🕳️|empty|leeg|d
🏋️|heavy|swaar|d
🪶|light|lig|d
🧸|soft|sag|d
🪨|hard|hard|d
😀|easy|maklik|d
😓|difficult|moeilik|d
🟰|same|dieselfde|d
🔀|different|anders|d
😂|funny|snaaks|d
👻|scary|grillerig|d
🌸|beautiful|mooi|d
🤕|sore|seer|d
📏|long|lank|d
✂️|short|kort|d
🌙|dark|donker|d`)},
 feel:{e:'😊',n:['Feelings','Gevoelens'],items:reg('feel',`
😊|happy|bly|d
😢|sad|hartseer|d
😠|angry|kwaad|d
😨|scared|bang|d
😩|tired|moeg|d
🤒|sick|siek|d
😤|frustrated|gefrustreerd|d
🤩|excited|opgewonde|d
🥱|bored|verveeld|d
😌|calm|rustig|d
😎|proud|trots|d
🙈|shy|skaam|d
😲|surprised|verbaas|d
😟|worried|bekommerd|d
🥺|lonely|eensaam|d
🤪|silly|lawwig|d
😋|hungry|honger|d
🥤|thirsty|dors|d
😪|sleepy|vaak|d
🥵|too hot|te warm|d
🥶|too cold|te koud|d
👌|okay|reg|d`)},
 body:{e:'♿',n:['Comfort','Gemak'],items:reg('body',`
🔄|Move me|Skuif my|v
🙃|Turn me over|Draai my om|v
🪑|Sit me up|Sit my regop|v
🛏️|Lie me down|Laat my lê|v
🦿|Too tight|Te styf|d
🧦|Splints off|Spalke af|v
♿|My chair|My stoel|n
🙆|Stretch me|Strek my|v
🧻|Wipe my mouth|Vee my mond af|v
🤧|Blow my nose|Snuit my neus|v
💊|Medicine|Medisyne|n
😣|Itchy|Jeuk|d
🤕|It hurts|Dit maak seer|d
🤢|I feel sick|Ek voel naar|d
👓|Glasses|Bril|n
🛌|Blanket|Kombers|n
🛏️|Pillow|Kussing|n
🩲|Change my nappy|Ruil my doek|v`)},
 time:{e:'🗓️',n:['Date & time','Datum & tyd'],items:reg('time',`
⚡|now|nou|d
⏭️|later|later|d
⏩|soon|binnekort|d
📅|today|vandag|d
🌅|tomorrow|môre|d
⏮️|yesterday|gister|d
🌄|morning|oggend|d
🌤️|afternoon|middag|d
🌙|night|nag|d
🎉|weekend|naweek|d
🎂|birthday|verjaarsdag|d
1️⃣|Monday|Maandag|d
2️⃣|Tuesday|Dinsdag|d
3️⃣|Wednesday|Woensdag|d
4️⃣|Thursday|Donderdag|d
5️⃣|Friday|Vrydag|d
6️⃣|Saturday|Saterdag|d
7️⃣|Sunday|Sondag|d
⬅️|before|voor|d
➡️|after|na|d
🥇|first|eerste|d
⏭️|next|volgende|d
🏁|last|laaste|d
🐓|early|vroeg|d
🦉|late|laat|d
⏰|time|tyd|d
📆|week|week|d
🗓️|month|maand|d
🏖️|holiday|vakansie|d`)}
};
const LIST_ORDER=['personal','little','describe','feel','body','time'];

// ---------- Topics ----------
const TOPICS={
 actions:{e:'🏃',n:['Actions','Aksies'],items:reg('actions',`
🏃|run|hardloop|v|V:run
🦘|jump|spring|v|V:jump
😴|sleep|slaap|v|V:sleep
🪑|sit|sit|v|V:sit
🚶‍♀️|walk|loop|v|V:walk
📖|read|lees|v|V:read
✏️|write|skryf|v|V:write
🖍️|draw|teken|v|V:draw
🎤|sing|sing|v|V:sing
💃|dance|dans|v|V:dance
👂|listen|luister|v|V:listen
📺|watch|kyk|v|V:watch
🧼|wash|was|v|V:wash
🪥|brush|borsel|v|V:brush
🍳|cook|kook|v|V:cook
🧽|clean|skoonmaak|v|V:clean
📂|open|oopmaak|v|V:open
🚪|close|toemaak|v|V:close
🎁|give|gee|v|V:give
🤾|throw|gooi|v|V:throw
🧤|catch|vang|v|V:catch
🦵|kick|skop|v|V:kick
👐|push|stoot|v|V:push
🪢|pull|trek|v|V:pull
🤗|hug|druk|v|V:hug
😘|kiss|soen|v|V:kiss
😂|laugh|lag|v|V:laugh
😭|cry|huil|v|V:cry
🗣️|talk|praat|v|V:talk
🏊|swim|swem|v|V:swim
🚲|ride|ry|v|V:ride
🧗|climb|klim|v|V:climb
💭|think|dink|v|V:think
🧠|know|weet|v|V:know
💪|try|probeer|v|V:try
🔎|find|vind|v|V:find
👉|show|wys|v|V:show
🗨️|tell|vertel|v|V:tell
✂️|cut|sny|v|V:cut
⏳|wait|wag|v|V:wait`)},
 food:{e:'🍎',n:['Food','Kos'],items:reg('food',`
🍞|bread|brood|n
🍚|pap|pap|n
🍙|rice|rys|n
🥣|cereal|graankos|n
🥚|egg|eier|n
🍗|chicken|hoender|n
🌭|boerewors|boerewors|n
🥩|meat|vleis|n
🐟|fish|vis|n
🍕|pizza|pizza|n
🍔|burger|burger|n
🍟|chips|skyfies|n
🥪|sandwich|toebroodjie|n
🍞|toast|roosterbrood|n
🍲|soup|sop|n
🍝|pasta|pasta|n
🥔|potato|aartappel|n
🥦|vegetables|groente|n
🥕|carrot|wortel|n
🫛|peas|ertjies|n
🍌|banana|piesang|n
🍎|apple|appel|n
🍊|orange|lemoen|n
🍇|grapes|druiwe|n
🍉|watermelon|waatlemoen|n
🍓|strawberry|aarbei|n
🥛|yoghurt|jogurt|n
🧀|cheese|kaas|n
🍪|biscuit|koekie|n
🍰|cake|koek|n
🍬|sweets|lekkers|n
🍦|ice cream|roomys|n
🍫|chocolate|sjokolade|n
🥖|rusks|beskuit|n
🥨|koeksister|koeksister|n
🍩|vetkoek|vetkoek|n
🔥|braai|braai|n`)},
 drinks:{e:'🥤',n:['Drinks','Drinkgoed'],items:reg('drinks',`
💧|water|water|n
🧃|juice|sap|n
🥛|milk|melk|n
☕|rooibos tea|rooibostee|n
🍵|tea|tee|n
☕|coffee|koffie|n
🍫|hot chocolate|warm sjokolade|n
🥤|cold drink|koeldrank|n
🥤|milkshake|melkskommel|n
🍹|smoothie|smoothie|n`)},
 people:{e:'👪',n:['People','Mense'],items:reg('people',`
👩|Mom|Ma|p
👨|Dad|Pa|p
👵|Granny|Ouma|p
👴|Grandpa|Oupa|p
👦|brother|broer|p
👧|sister|suster|p
👶|baby|baba|p
👩‍🦱|aunt|tannie|p
👨‍🦱|uncle|oom|p
🧒|cousin|neef|p
🧑‍🤝‍🧑|friend|vriend|p
🧑‍🏫|teacher|juffrou|p
🤸|therapist|terapeut|p
🧑‍⚕️|doctor|dokter|p
👩‍⚕️|nurse|verpleegster|p
🤲|carer|versorger|p
🚐|driver|bestuurder|p
👮|police|polisie|p`)},
 animals:{e:'🐶',n:['Animals','Diere'],items:reg('animals',`
🐕|dog|hond|n
🐈|cat|kat|n
🐦|bird|voël|n
🐟|fish|vis|n
🐄|cow|koei|n
🐎|horse|perd|n
🐑|sheep|skaap|n
🐖|pig|vark|n
🦆|duck|eend|n
🦁|lion|leeu|n
🐘|elephant|olifant|n
🦒|giraffe|kameelperd|n
🦓|zebra|sebra|n
🦏|rhino|renoster|n
🐒|monkey|aap|n
🐍|snake|slang|n
🐸|frog|padda|n
🦋|butterfly|skoenlapper|n
🕷️|spider|spinnekop|n
🐧|penguin|pikkewyn|n
🐋|whale|walvis|n
🐇|rabbit|konyn|n
🐢|tortoise|skilpad|n`)},
 bodyparts:{e:'🖐️',n:['My body','My lyf'],items:reg('bodyparts',`
🙂|head|kop|n
💇|hair|hare|n
👀|eyes|oë|n
👂|ears|ore|n
👃|nose|neus|n
👄|mouth|mond|n
🦷|teeth|tande|n
👅|tongue|tong|n
🦒|neck|nek|n
🤷|shoulder|skouer|n
💪|arm|arm|n
✋|hand|hand|n
🖐️|fingers|vingers|n
🫃|tummy|maag|n
🔙|back|rug|n
🦵|leg|been|n
🦿|knee|knie|n
🦶|foot|voet|n
🦶|toes|tone|n`)},
 clothes:{e:'👕',n:['Clothes','Klere'],items:reg('clothes',`
👔|shirt|hemp|n
👕|T-shirt|T-hemp|n
👖|pants|broek|n
🩳|shorts|kortbroek|n
👗|dress|rok|n
👚|skirt|romp|n
🧶|jersey|trui|n
🧥|jacket|baadjie|n
👟|shoes|skoene|n
🧦|socks|sokkies|n
🧢|hat|hoed|n
🧣|beanie|mus|n
🩱|pyjamas|pajamas|n
🩲|nappy|doek|n
🧤|gloves|handskoene|n
🏫|school uniform|skooldrag|n
🦿|splints|spalke|n
👓|glasses|bril|n`)},
 places:{e:'🏠',n:['Places','Plekke'],items:reg('places',`
🏠|home|huis|n
🏫|school|skool|n
🌳|outside|buite|n
🛝|park|park|n
🛒|shop|winkel|n
🏬|mall|winkelsentrum|n
🏥|hospital|hospitaal|n
⛪|church|kerk|n
🏖️|beach|strand|n
🏊|swimming pool|swembad|n
🚜|farm|plaas|n
🌻|garden|tuin|n
🎠|playground|speelpark|n
👵|Granny’s house|Ouma se huis|n
🍽️|restaurant|restaurant|n
📚|library|biblioteek|n
🦁|zoo|dieretuin|n
🛏️|bedroom|slaapkamer|n
🍳|kitchen|kombuis|n
🛁|bathroom|badkamer|n`)},
 school:{e:'🎒',n:['School','Skool'],items:reg('school',`
🧑‍🏫|teacher|juffrou|p
🏫|class|klas|n
📚|book|boek|n
✏️|pencil|potlood|n
🖍️|crayons|kryte|n
📄|paper|papier|n
✂️|scissors|skêr|n
🧴|glue|gom|n
🎨|paint|verf|n
💻|computer|rekenaar|n
📱|tablet|tablet|n
📖|story|storie|n
🎶|song|liedjie|n
🔔|break time|pouse|n
🍱|lunch box|kosblik|n
🎒|bag|sak|n
📝|homework|huiswerk|n
⭕|circle time|kringtyd|n
🖼️|art|kuns|n
🎵|music|musiek|n
🧑‍🤝‍🧑|friends|maats|p`)},
 toys:{e:'🧸',n:['Toys & play','Speelgoed'],items:reg('toys',`
⚽|ball|bal|n
🫧|bubbles|borrels|n
🧱|blocks|blokke|n
🧩|puzzle|legkaart|n
🪆|doll|pop|n
🧸|teddy|teddie|n
🚗|toy car|karretjie|n
🚂|train|trein|n
🟥|Lego|Lego|n
🎲|game|speletjie|n
🃏|cards|kaarte|n
🌳|swing|swaai|n
🛝|slide|glyband|n
🤸|trampoline|trampolien|n
⛱️|sandpit|sandput|n
🚲|bike|fiets|n
📱|iPad|iPad|n
📺|cartoons|tekenprente|n`)},
 transport:{e:'🚗',n:['Transport','Vervoer'],items:reg('transport',`
🚗|car|motor|n
🚐|taxi|taxi|n
🚌|bus|bus|n
🚆|train|trein|n
✈️|aeroplane|vliegtuig|n
🚲|bicycle|fiets|n
⛵|boat|boot|n
🚚|truck|vragmotor|n
🚑|ambulance|ambulans|n
🚒|fire engine|brandweerwa|n
🚓|police car|polisiemotor|n
♿|wheelchair|rolstoel|n
🦯|walker|looprak|n
🏍️|motorbike|motorfiets|n`)},
 weather:{e:'⛅',n:['Weather','Weer'],items:reg('weather',`
☀️|sunny|sonnig|d
🌧️|rain|reën|n
☁️|cloudy|bewolk|d
🌬️|windy|winderig|d
🔥|hot|warm|d
🧊|cold|koud|d
⛈️|storm|storm|n
⚡|lightning|weerlig|n
🌩️|thunder|donderweer|n
🌈|rainbow|reënboog|n
❄️|snow|sneeu|n`)},
 home:{e:'🛋️',n:['Home','Huis'],items:reg('home',`
🚪|door|deur|n
🪟|window|venster|n
🛏️|bed|bed|n
🪑|chair|stoel|n
🍽️|table|tafel|n
🛋️|couch|bank|n
📺|TV|TV|n
💡|light|lig|n
🧊|fridge|yskas|n
🗄️|cupboard|kas|n
🚽|toilet|toilet|n
🛁|bath|bad|n
🚿|shower|stort|n
🛌|blanket|kombers|n
🛏️|pillow|kussing|n
📱|phone|foon|n`)},
 care:{e:'🛁',n:['Bath & care','Bad & versorging'],items:reg('care',`
🛁|bath time|badtyd|n
🚿|shower|stort|n
🧼|soap|seep|n
🧻|towel|handdoek|n
🪥|toothbrush|tandeborsel|n
🦷|brush teeth|borsel tande|v
💇|brush hair|borsel hare|v
👐|wash hands|was hande|v
🧴|cream|room|n
🩲|nappy|doek|n
🚽|toilet|toilet|n
👕|get dressed|trek aan|v
🩱|undress|trek uit|v
💊|medicine|medisyne|n`)},
 therapy:{e:'🤸',n:['Therapy','Terapie'],items:reg('therapy',`
🤸|physio|fisio|n
🖐️|OT|AT|n
🗣️|speech therapy|spraakterapie|n
🏋️|exercise|oefen|n
🙆|stretch|strek|v
🧍|stand up|staan op|v
🪑|sit down|sit|v
🚶|walking|loop|n
🦯|walker|looprak|n
🧍‍♂️|standing frame|staanraam|n
🦿|splints|spalke|n
💆|massage|masseer|n
😮‍💨|rest|rus|v
🔃|roll over|rol om|v
🦵|kick|skop|v
🙋‍♂️|reach|strek uit|v
👐|push|stoot|v
🪢|pull|trek|v
😓|too hard|te moeilik|d
😀|easy|maklik|d
➕|one more|nog een|d
🌟|well done|mooi so|s
🏊|hydrotherapy|hidroterapie|n`)},
 medical:{e:'🩺',n:['Doctor & hospital','Dokter & hospitaal'],items:reg('medical',`
🧑‍⚕️|doctor|dokter|p
👩‍⚕️|nurse|verpleegster|p
🏥|hospital|hospitaal|n
💊|medicine|medisyne|n
💉|injection|inspuiting|n
🩹|plaster|pleister|n
🌡️|fever|koors|n
😷|cough|hoes|n
🗣️|sore throat|seer keel|n
👂|earache|oorpyn|n
🤕|headache|kopseer|n
🤢|tummy ache|maagpyn|n
🛏️|operation|operasie|n
🩻|X-ray|X-straal|n
♿|wheelchair|rolstoel|n`)},
 sport:{e:'⚽',n:['Sport','Sport'],items:reg('sport',`
⚽|soccer|sokker|n
🏉|rugby|rugby|n
🏏|cricket|krieket|n
🏐|netball|netbal|n
🏊|swimming|swem|n
🏃|running|hardloop|n
💃|dancing|dans|n
🏇|horse riding|perdry|n
🎯|boccia|boccia|n
🏀|wheelchair basketball|rolstoelbasketbal|n
👕|team|span|n
🥅|goal|doel|n
🏆|win|wen|v
😞|lose|verloor|v`)},
 media:{e:'🎵',n:['Music & TV','Musiek & TV'],items:reg('media',`
🎵|music|musiek|n
🎶|song|liedjie|n
🎤|sing|sing|v
💃|dance|dans|v
🥁|drum|drom|n
🎸|guitar|kitaar|n
🎹|piano|klavier|n
📺|TV|TV|n
📺|cartoons|tekenprente|n
🎬|movie|fliek|n
▶️|YouTube|YouTube|n
🔊|louder|harder|d
🔉|softer|sagter|d
📴|turn it off|sit dit af|v`)},
 nature:{e:'🌳',n:['Nature','Natuur'],items:reg('nature',`
🌳|tree|boom|n
🌸|flower|blom|n
🌱|grass|gras|n
☀️|sun|son|n
🌙|moon|maan|n
⭐|stars|sterre|n
☁️|sky|lug|n
⛰️|mountain|berg|n
🌊|sea|see|n
🏞️|river|rivier|n
🏖️|sand|sand|n
🪨|rocks|klippe|n
🍂|leaves|blare|n`)},
 celebrate:{e:'🎉',n:['Celebrations','Feeste'],items:reg('celebrate',`
🎂|birthday|verjaarsdag|n
🎉|party|partytjie|n
🎁|present|geskenk|n
🍰|cake|koek|n
🎈|balloons|ballonne|n
🎄|Christmas|Kersfees|n
🐣|Easter|Paasfees|n
🏖️|holiday|vakansie|n
🔥|braai|braai|n
🇿🇦|Heritage Day|Erfenisdag|n
🕯️|candles|kersies|n
👪|family|familie|n`)},
 numbers:{e:'🔢',n:['Numbers','Getalle'],items:reg('numbers',`
1️⃣|one|een|d
2️⃣|two|twee|d
3️⃣|three|drie|d
4️⃣|four|vier|d
5️⃣|five|vyf|d
6️⃣|six|ses|d
7️⃣|seven|sewe|d
8️⃣|eight|agt|d
9️⃣|nine|nege|d
🔟|ten|tien|d
💯|a lot|baie|d
🤏|a little|’n bietjie|d`)}
};
const TOPIC_ORDER=['actions','food','drinks','people','animals','bodyparts','clothes','places','school','toys','transport','weather','home','care','therapy','medical','sport','media','nature','celebrate','numbers'];

// ---------- Personal pages: filled by the family ----------
const PERSONAL=[
 ['family','👪',['Family names','Familiename']],['friends','🧑‍🤝‍🧑',['Friends','Vriende']],['foods','🍽️',['Favourite foods','Gunsteling kos']],
 ['places','📍',['Favourite places','Gunsteling plekke']],['tv','📺',['Movies & TV','Flieks & TV']],['school','🏫',['My school','My skool']],
 ['leisure','🎨',['My leisure','My stokperdjies']],['stores','🛍️',['Favourite shops','Gunsteling winkels']]];

// ---------- Verbs for the sentence builder ----------
// en: base (third person and particles are worked out below). af: v = finite verb; end = word that moves to the end
// (hê, nodig, oop, toe, skoon); part = particle before the object (van, na); modal = following verbs go to the end;
// withVerb = what replaces the verb when another verb follows (need + verb -> moet; like + verb -> daarvan om ... te).
const AFV={want:{v:'wil',end:'hê',modal:true},like:{v:'hou',part:'van',withVerb:'om'},need:{v:'het',end:'nodig',withVerb:'moet'},
  go:{v:'gaan',modal:true},can:{v:'kan',modal:true},look:{v:'kyk',part:'na'},listen:{v:'luister',part:'na'},
  open:{v:'maak',end:'oop'},close:{v:'maak',end:'toe'},clean:{v:'maak',end:'skoon'},get:{v:'kry'},put:{v:'sit'}};
const EN_OBJ={look:'at',listen:'to'};
const EN_IRREG={have:'has',do:'does',go:'goes',can:'can'};
const VERBS={};
Object.values(ITEMS).forEach(it=>{ if(it.g&&it.g.t==='V'&&!VERBS[it.g.v]){
  const k=it.g.v, base=it.w[0];
  const s3=EN_IRREG[k]||(/(s|sh|ch|x|o)$/.test(base)?base+'es':/[^aeiou]y$/.test(base)?base.slice(0,-1)+'ies':base+'s');
  const af=AFV[k]||{v:it.w[1]};
  VERBS[k]={en:base,en3:s3,enObj:EN_OBJ[k]||'',enModal:k==='can',af,afInf:({open:'oopmaak',close:'toemaak',clean:'skoonmaak',want:'hê',need:'nodig hê',like:'hou'})[k]||af.v};
}});
VERBS.can.enNeg='can’t';

// ---------- Sentence builder ----------
// One clause: [question] [subject] [not] verb [not] [rest]. Words without a verb are joined as they are.
const capF=s=>s?s[0].toUpperCase()+s.slice(1):s, lowF=s=>s?s[0].toLowerCase()+s.slice(1):s;
function wordOf(it,lang){ const i=LI[lang]??0; return it.label||it.w[i]||it.w[0]; }
function plainW(it,lang,mid){ let w=wordOf(it,lang); if(mid&&!it.custom&&!it.label&&it.c!=='p'&&it.key!=='pain'&&!/^[A-Z]{2}/.test(w)) w=lowF(w); return w; }
const isV=it=>!!(it&&it.g&&it.g.t==='V'&&VERBS[it.g.v]);
function compose(list,lang,grammar=true){
  if(!list.length) return '';
  if(typeof BANTU!=='undefined'&&BANTU.includes(lang)) return grammar?composeB(list,lang):capF(list.map((it,i)=>plainW(it,lang,i>0)).join(' '));
  const q=list[0]&&list[0].c==='q'&&!/\s/.test(list[0].w[0])?list[0]:null;
  const vi=grammar?list.findIndex(isV):-1;
  const end=s=>{ s=capF(s.replace(/\s+/g,' ').trim()); return q&&!/[?]$/.test(s)?s+'?':s; };
  if(vi<0) return end(list.map((it,i)=>plainW(it,lang,i>0)).join(' '));
  const used=new Set([vi]); let si=-1, neg=false;
  for(let j=vi-1;j>=0;j--){ const g=list[j].g; if(g&&g.t==='NEG'&&!neg){neg=true;used.add(j);continue;} if(g&&g.t==='S'){si=j;used.add(j);} break; }
  if(list[vi+1]&&list[vi+1].g&&list[vi+1].g.t==='NEG'){ neg=true; used.add(vi+1); }
  const lo=Math.min(...used), hi=Math.max(...used);
  let pre=list.slice(0,lo); const rest=list.slice(hi+1);
  const asQ=q&&pre[0]===q&&si>=0; if(asQ) pre=pre.slice(1);
  const subj=si>=0?list[si].g:{t:'S',p:'1s',en:'I'};
  const V=VERBS[list[vi].g.v];
  const restV=rest.filter(isV), restO=rest.filter(it=>!isV(it));
  const pw=pre.map((it,i)=>plainW(it,lang,i>0||asQ));
  const qw=asQ?plainW(q,lang,false):null;
  let words=[];
  if(lang==='en'){
    const third=subj.p==='3s', sw=subj.en;
    const restW=rest.map(it=>isV(it)?(V.enModal?VERBS[it.g.v].en:'to '+VERBS[it.g.v].en):plainW(it,lang,true));
    const obj=restO.length&&V.enObj&&!restV.length?[V.enObj]:[];
    if(V.enModal){ const aux=neg?V.enNeg:V.en; words=asQ?[qw,aux,sw,...restW]:[sw,aux,...restW]; }
    else if(asQ){ const aux=(third?'does':'do')+(neg?'n’t':''); words=[qw,aux,sw,V.en,...obj,...restW]; }
    else { const vp=neg?[(third?'doesn’t':'don’t'),V.en]:[third?V.en3:V.en]; words=[sw,...vp,...obj,...restW]; }
  } else {
    const a=V.af, sw=si>=0?lowF(plainW(list[si],'af',false)):'ek';
    const ro=restO.map(it=>plainW(it,'af',true)), rv=restV.map(it=>VERBS[it.g.v].afInf);
    const head=v=>asQ?[qw,v,sw]:[sw,v];
    if(rv.length&&a.withVerb==='om'){                      // Ek hou (nie) daarvan om bal te speel (nie)
      words=[...head(a.v),...(neg?['nie']:[]),'daarvan','om',...ro,'te',...rv,...(neg?['nie']:[])];
    } else if(rv.length&&(a.modal||a.withVerb)){          // Ek wil / kan / moet / gaan (nie) water drink (nie)
      words=[...head(a.withVerb||a.v),...(neg?['nie']:[]),...ro,...rv,...(neg?['nie']:[])];
    } else if(a.end&&!ro.length){                          // Ek wil dit (nie) hê (nie) / Wat wil jy hê?
      words=asQ?[...head(a.v),...(neg?['nie']:[]),a.end,...(neg?['nie']:[])]:[...head(a.v),'dit',...(neg?['nie']:[]),a.end,...(neg?['nie']:[])];
    } else {
      words=[...head(a.v),...(neg?['nie']:[]),...(a.part&&ro.length?[a.part]:[]),...ro,...(a.end?[a.end]:[]),...(neg&&(ro.length||a.end)?['nie']:[])];
    }
  }
  const clause=words.join(' ');
  return end([...pw,pw.length&&!/^I /.test(clause)?lowF(clause):clause].join(' '));
}

if(typeof module!=='undefined') module.exports={ITEMS,CORE,coreLayout,QUICKFIRES,LISTS,TOPICS,VERBS,compose,LANGS,GRIDS};
