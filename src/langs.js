// ===== isiZulu, isiXhosa and Sesotho =====
// These translations are a first draft: have them checked by first-language speakers (ideally a speech-language
// therapist) before using them with a child. Each line: English | isiZulu | isiXhosa | Sesotho.
// A line starting with # gives the word for one button only (key), when one English word has two meanings.
const BANTU=['zu','xh','st'];
Object.assign(LANGS,{zu:{name:'isiZulu',bcp:'zu-ZA',code:'ZU'},xh:{name:'isiXhosa',bcp:'xh-ZA',code:'XH'},st:{name:'Sesotho',bcp:'st-ZA',code:'ST'}});
LC.push('zu','xh','st'); Object.assign(LI,{zu:2,xh:3,st:4});
const XN=s=>String(s||'').toLowerCase().replace(/[’`]/g,"'").replace(/\s+/g,' ').trim();
const XW={}, XK={};
function xload(rows){ P(rows).forEach(r=>{ if(r[0][0]==='#') XK[r[0].slice(1)]=r.slice(1,4); else XW[XN(r[0])]=r.slice(1,4); }); }

// ---------- core words ----------
xload(`
what|ini|ntoni|eng
who|ubani|ubani|mang
where|kuphi|phi|kae
when|nini|nini|neng
why|kungani|kutheni|hobaneng
how|kanjani|njani|jwang
I|mina|mna|nna
you|wena|wena|wena
it|yona|yona|sona
he|yena|yena|yena
she|yena|yena|yena
we|thina|thina|rona
want|funa|funa|batla
like|thanda|thanda|rata
go|hamba|hamba|tsamaya
help|siza|nceda|thusa
stop|yeka|yeka|emisa
look|bheka|jonga|sheba
eat|dla|tya|ja
drink|phuza|sela|nwa
play|dlala|dlala|bapala
get|thola|fumana|fumana
put|beka|beka|bea
make|enza|enza|etsa
feel|zwa|va|utlwa
see|bona|bona|bona
need|dinga|dinga|hloka
have|na|na|na le
do|enza|enza|etsa
come|woza|yiza|tla
not|hhayi|hayi|tjhe
more|okunye|okunye|hape
again|futhi|kwakhona|hape
finished|kuphelile|kugqityiwe|ho fedile
can|kwazi|kwazi|kgona
is|ngu|ngu|ke
big|khulu|khulu|kgolo
little|ncane|ncinci|nyane
good|kuhle|kuhle|hantle
bad|kubi|kubi|hampe
hot|kuyashisa|kushushu|ho a chesa
cold|kuyabanda|kuyabanda|ho a bata
in|phakathi|ngaphakathi|ka hare
on|phezu|phezu|hodima
out|phandle|phandle|ka ntle
off|cisha|cima|tima
here|lapha|apha|mona
there|lapho|apho|mane
yes|yebo|ewe|e
no|cha|hayi|tjhe
hello|sawubona|molo|dumela
please|ngicela|nceda|ka kopo
thank you|ngiyabonga|enkosi|ke a leboha
sorry|ngiyaxolisa|uxolo|ke kopa tshwarelo
and|futhi|kwaye|le
this|lokhu|oku|sena
that|lokho|loo|seo
all|konke|konke|tsohle
`);

// ---------- QuickFires and scenes ----------
xload(`
Good morning|Sawubona|Molo|Dumela
How are you?|Unjani?|Unjani?|O kae?
I'm fine|Ngikhona|Ndiphilile|Ke phela hantle
Goodbye|Hamba kahle|Hamba kakuhle|Tsamaya hantle
I'm hungry|Ngilambile|Ndilambile|Ke lapile
I'm thirsty|Ngomile|Ndinxaniwe|Ke nyorilwe
I need the toilet|Ngifuna ukuya endlini yangasese|Ndifuna ukuya ethoyilethi|Ke batla ho ya ntlwaneng
I'm tired|Ngikhathele|Ndidiniwe|Ke kgathetse
I'm sore|Ngizwa ubuhlungu|Ndiva iintlungu|Ke utlwa bohloko
I need a break|Ngidinga ikhefu|Ndidinga ikhefu|Ke hloka phomolo
Help me, please|Ngicela ungisize|Nceda undincede|Ka kopo nthuse
Leave me alone|Ngiyeke|Ndiyeke|Ntlohele
Stop it|Yeka|Yeka|Emisa
Do it again|Phinda futhi|Phinda kwakhona|Etsa hape
All done|Sengiqedile|Ndigqibile|Ke qetile
I like it|Ngiyakuthanda|Ndiyayithanda|Ke a e rata
I don't like it|Angikuthandi|Andiyithandi|Ha ke e rate
My turn|Ithuba lami|Ithuba lam|Ke nako ya ka
Your turn|Ithuba lakho|Ithuba lakho|Ke nako ya hao
Wait for me|Ngilinde|Ndilinde|Nkemele
That's funny|Kuyahlekisa|Kuyahlekisa|Ho a qabola
I don't know|Angazi|Andazi|Ha ke tsebe
Excuse me|Uxolo|Uxolo|Ka kopo
I love you|Ngiyakuthanda|Ndiyakuthanda|Ke a o rata
Look at me|Ngibheke|Ndijonge|Ntjhebe
I want to tell you something|Ngifuna ukukutshela okuthile|Ndifuna ukukuxelela into|Ke batla ho o bolella ho hong
What's that?|Yini leyo?|Yintoni leyo?|Ke eng seo?
Good job|Wenze kahle|Wenze kakuhle|O entse hantle
Read me a story|Ngifundele indaba|Ndifundele ibali|Mpalle pale
Light off|Cisha ilambu|Cima isibane|Tima lebone
Sing to me|Ngiculele|Ndiculele|Mpinele
Hold me|Ngibambe|Ndibambe|Ntshware
I'm sleepy|Ngiyozela|Ndiyozela|Ke otsela
Push me|Ngiphushe|Ndityhale|Ntsutumetse
`);

// ---------- little words, describing, feelings ----------
xload(`
they|bona|bona|bona
me|mina|mna|nna
my|wami|wam|ya ka
your|wakho|wakho|ya hao
his|wakhe|wakhe|ya hae
her|wakhe|wakhe|ya hae
our|wethu|wethu|ya rona
up|phezulu|phezulu|hodimo
down|phansi|phantsi|tlase
with|na|na|le
for|ku|ku|bakeng sa
to|ku|ku|ho
from|kusuka|ukusuka|ho tswa
at|ku|ku|ho
under|ngaphansi|phantsi|ka tlasa
over|phezu|ngaphezulu|hodima
next to|eduze|ecaleni|haufi le
behind|ngemuva|emva|ka morao
in front|phambili|phambi|ka pele
or|noma|okanye|kapa
but|kodwa|kodwa|empa
because|ngoba|kuba|hobane
if|uma|ukuba|haeba
then|bese|emva koko|jwale
some|okunye|ezinye|tse ding
other|okunye|enye|e nngwe
very|kakhulu|kakhulu|haholo
too|kakhulu|kakhulu|haholo
just|nje|nje|feela
around|nxazonke|ngeenxa zonke|ho potoloha
mine|okwami|okwam|sa ka
yours|okwakho|okwakho|sa hao
red|bomvu|bomvu|kgubedu
blue|luhlaza okwesibhakabhaka|luhlaza okwesibhakabhaka|putsoa
green|luhlaza|luhlaza|tala
yellow|phuzi|tyheli|tshehla
#describe:orange|orenji|orenji|lamunu
purple|phephuli|mfusa|perese
pink|pinki|pinki|pinki
black|mnyama|mnyama|ntsho
white|mhlophe|mhlophe|tshweu
brown|nsundu|mdaka|sootho
fast|shesha|khawuleza|ka potlako
slow|kancane|kancinci|butle
loud|nomsindo|ngxola|lerata
quiet|thula|thula|kgutsitse
wet|manzi|manzi|metsi
dry|omile|omile|omeletse
dirty|ngcolile|mdaka|ditshila
clean|hlanzekile|cocekile|hlwekile
yummy|mnandi|mnandi|monate
yucky|akumnandi|akumnandi|ha ho monate
broken|phukile|aphukile|robehile
new|sha|ntsha|ntjha
old|dala|dala|kgale
full|gcwele|zele|tletse
empty|ize|ize|lefeela
heavy|nzima|nzima|boima
#describe:light|lula|lula|bobebe
soft|thambile|thambile|bonolo
hard|lukhuni|lukhuni|thata
easy|lula|lula|bonolo
difficult|nzima|nzima|thata
same|fanayo|fanayo|tshwanang
different|ehlukile|ahlukile|fapaneng
funny|hlekisayo|hlekisayo|qabolang
scary|esabekayo|oyikekayo|tshabehang
beautiful|hle|hle|ntle
sore|buhlungu|buhlungu|bohloko
long|de|de|telele
short|fushane|futshane|kgutshwanyane
dark|mnyama|mnyama|lefifi
happy|jabulile|onwabile|thabile
sad|dabukile|buhlungu|swabile
angry|thukuthele|qumbile|halefile
scared|esaba|oyika|tshohile
tired|khathele|diniwe|kgathetse
sick|gula|gula|kula
frustrated|khungathekile|khathazekile|tenehile
excited|jabule kakhulu|chulumancile|thabile haholo
bored|dikiwe|dikiwe|bodutu
calm|zolile|zolile|kgutsitse
proud|ziqhenya|nebhongo|motlotlo
shy|namahloni|neentloni|dihlong
surprised|mangele|mangalisiwe|maketse
worried|khathazekile|khathazekile|tshwenyehile
lonely|nesizungu|nesithukuthezi|bodutu
silly|ngiyadlala|ndiyadlala|ke a bapala
hungry|lambile|lambile|lapile
thirsty|omile|nxaniwe|nyorilwe
sleepy|ozela|ozela|otsela
too hot|kushisa kakhulu|kushushu kakhulu|ho chesa haholo
too cold|kubanda kakhulu|kubanda kakhulu|ho bata haholo
okay|kulungile|kulungile|ho lokile
`);

// ---------- comfort, time, actions ----------
xload(`
Move me|Ngihambise|Ndishukumise|Ntshuthise
Turn me over|Ngiphendule|Ndiguqule|Mphethole
Sit me up|Ngihlalise|Ndihlalise|Ndulise
Lie me down|Ngilalise|Ndilalise|Ndobatse
Too tight|Kuqinile kakhulu|Kuqinile kakhulu|Ho tiile haholo
Splints off|Khumula ama-splint|Khulula ii-splint|Ntsha di-splint
My chair|Isihlalo sami|Isitulo sam|Setulo sa ka
Stretch me|Ngelule|Ndolule|Nkotlolle
Wipe my mouth|Sula umlomo wami|Sula umlomo wam|Hlakola molomo wa ka
Blow my nose|Finya ikhala lami|Finya impumlo yam|Fiela nko ya ka
Medicine|Umuthi|Iyeza|Moriana
Itchy|Kuyalunywa|Kuyarhawuzelela|Ho a hlohlona
It hurts|Kubuhlungu|Kubuhlungu|Ho bohloko
I feel sick|Ngiyagula|Ndiyagula|Ke a kula
Glasses|Izibuko|Iiglasi|Dikgalase
Blanket|Ingubo|Ingubo|Kobo
Pillow|Umcamelo|Umqamelo|Mosamo
Change my nappy|Shintsha inabukeni yami|Tshintsha inapkeni yam|Fetola lesela la ka
now|manje|ngoku|jwale
later|kamuva|emva kwexesha|hamorao
soon|maduze|kungekudala|haufinyane
today|namuhla|namhlanje|kajeno
tomorrow|kusasa|ngomso|hosane
yesterday|izolo|izolo|maobane
morning|ekuseni|kusasa|hoseng
afternoon|ntambama|emva kwemini|thapama
night|ebusuku|ebusuku|bosiu
weekend|impelasonto|impela-veki|mafelo a beke
birthday|usuku lokuzalwa|umhla wokuzalwa|letsatsi la tswalo
Monday|uMsombuluko|uMvulo|Mantaha
Tuesday|uLwesibili|uLwesibini|Labobedi
Wednesday|uLwesithathu|uLwesithathu|Laboraro
Thursday|uLwesine|uLwesine|Labone
Friday|uLwesihlanu|uLwesihlanu|Labohlano
Saturday|uMgqibelo|uMgqibelo|Moqebelo
Sunday|iSonto|iCawa|Sontaha
before|ngaphambi|phambi|pele
after|ngemuva|emva|kamora
first|kuqala|kuqala|pele
next|okulandelayo|okulandelayo|e latelang
last|okokugcina|okokugqibela|ya ho qetela
early|kusenesikhathi|kwangoko|kapele
late|sekwephuzile|emva kwexesha|diehile
time|isikhathi|ixesha|nako
week|iviki|iveki|beke
month|inyanga|inyanga|kgwedi
holiday|iholide|iholide|matsatsi a phomolo
run|gijima|baleka|matha
jump|gxuma|tsiba|tlola
sleep|lala|lala|robala
sit|hlala|hlala|dula
walk|hamba|hamba|tsamaya
read|funda|funda|bala
write|bhala|bhala|ngola
draw|dweba|zoba|taka
sing|cula|cula|bina
dance|dansa|danisa|tantsha
listen|lalela|mamela|mamela
watch|buka|bukela|shebella
wash|geza|hlamba|hlatswa
brush|xubha|xukuxa|borasha
cook|pheka|pheka|pheha
#actions:clean|hlanza|coca|hlwekisa
open|vula|vula|bula
close|vala|vala|kwala
give|nika|nika|fa
throw|phonsa|phosa|lahla
catch|bamba|bamba|tshwara
kick|khahlela|khaba|raha
push|phusha|tyhala|sutumetsa
pull|donsa|tsala|hula
hug|gona|wola|haka
kiss|qabula|anga|aka
laugh|hleka|hleka|tsheha
cry|khala|lila|lla
talk|khuluma|thetha|bua
swim|bhukuda|qubha|sesa
ride|gibela|khwela|palama
climb|khwela|nyuka|hloa
think|cabanga|cinga|nahana
know|azi|azi|tseba
try|zama|zama|leka
find|thola|fumana|fumana
show|khombisa|bonisa|bontsha
tell|tshela|xelela|bolella
cut|sika|sika|seha
wait|linda|linda|ema
`);

// ---------- topics ----------
xload(`
bread|isinkwa|isonka|bohobe
pap|uphuthu|umphokoqo|papa
rice|irayisi|irayisi|reisi
cereal|isiriyeli|isiriyeli|disiriale
egg|iqanda|iqanda|lehe
chicken|inkukhu|inkukhu|kgoho
boerewors|iwors|iwors|boerewors
meat|inyama|inyama|nama
fish|inhlanzi|intlanzi|tlhapi
pizza|iphizza|ipizza|pizza
burger|ibhega|ibhega|burger
chips|amashibusi|iitshipsi|ditjhipisi
sandwich|isemishi|isandwich|sandwich
toast|ithosi|ithosti|thousete
soup|isobho|isuphu|sopho
pasta|ipasta|ipasta|pasta
potato|izambane|itapile|tapole
vegetables|imifino|imifuno|meroho
carrot|isanqante|umnqathe|sehwete
peas|uphizi|iiertyisi|dierekisi
banana|ubhanana|ibhanana|banana
apple|i-aphula|iapile|apole
#food:orange|iwolintshi|iorenji|lamunu
grapes|amagilebhisi|iidiliya|morara
watermelon|ikhabe|ivatala|lehapu
strawberry|isitrobheli|iqunube|fragole
yoghurt|iyogathi|iyogathi|yogate
cheese|ushizi|itshizi|tjhisi
biscuit|ibhisikidi|ibhiskithi|bisikiti
cake|ikhekhe|ikeyiki|kuku
sweets|amaswidi|iilekese|dimonamone
ice cream|u-ayisikhilimu|i-ayisikrimu|ayesekrime
chocolate|ushokoledi|itshokolethi|tjhokolete
rusks|amarasks|iirasks|diraski
koeksister|ikoeksister|ikoeksister|koeksister
vetkoek|igwinya|igwinya|makoenya
braai|ibraai|ibraai|braai
water|amanzi|amanzi|metsi
juice|ujusi|ijusi|jusi
milk|ubisi|ubisi|lebese
rooibos tea|itiye le-rooibos|iti ye-rooibos|tee ya rooibos
tea|itiye|iti|tee
coffee|ikhofi|ikofu|kofi
hot chocolate|ushokoledi oshisayo|itshokolethi eshushu|tjhokolete e chesang
cold drink|isiphuzo esibandayo|isiselo esibandayo|seno se batang
milkshake|i-milkshake|i-milkshake|milkshake
smoothie|i-smoothie|i-smoothie|smoothie
Mom|uMama|uMama|Mme
Dad|uBaba|uTata|Ntate
Granny|uGogo|uMakhulu|Nkgono
Grandpa|uMkhulu|uTatomkhulu|Ntatemoholo
brother|umfowethu|ubhuti|abuti
sister|udadewethu|usisi|ausi
baby|ingane|usana|lesea
aunt|u-anti|u-anti|rakgadi
uncle|umalume|umalume|malome
cousin|umzala|umzala|motswala
friend|umngane|umhlobo|motswalle
teacher|uthisha|utitshala|mosuwe
therapist|umelaphi|umnyangi|mophekodi
doctor|udokotela|ugqirha|ngaka
nurse|unesi|umongikazi|mooki
carer|umnakekeli|umkhathaleli|mohlokomedi
driver|umshayeli|umqhubi|mokganni
police|amaphoyisa|amapolisa|mapolesa
dog|inja|inja|ntja
cat|ikati|ikati|katse
bird|inyoni|intaka|nonyana
cow|inkomo|inkomo|kgomo
horse|ihhashi|ihashe|pere
sheep|imvu|igusha|nku
pig|ingulube|ihagu|kolobe
duck|idada|idada|letata
lion|ibhubesi|ingonyama|tau
elephant|indlovu|indlovu|tlou
giraffe|indlulamithi|indlulamthi|thutlwa
zebra|idube|iqwarha|pitsi
rhino|ubhejane|umkhombe|tshukudu
monkey|inkawu|inkawu|tshwene
snake|inyoka|inyoka|noha
frog|ixoxo|isele|senqanqane
butterfly|uvemvane|ibhabhathane|serurubele
spider|isicabucabu|isigcawu|sekgo
penguin|ipenguin|ipenguin|phenkwini
whale|umkhomo|umnenga|leruarua
rabbit|unogwaja|umvundla|mmutla
tortoise|ufudu|ufudo|kgudu
head|ikhanda|intloko|hlooho
hair|izinwele|iinwele|moriri
eyes|amehlo|amehlo|mahlo
ears|izindlebe|iindlebe|ditsebe
nose|ikhala|impumlo|nko
mouth|umlomo|umlomo|molomo
teeth|amazinyo|amazinyo|meno
tongue|ulimi|ulwimi|leleme
neck|intamo|intamo|molala
shoulder|ihlombe|igxalaba|lehetla
arm|ingalo|ingalo|letsoho
hand|isandla|isandla|letsoho
fingers|iminwe|iminwe|menwana
tummy|isisu|isisu|mpa
back|umhlane|umqolo|mokokotlo
leg|umlenze|umlenze|leoto
knee|idolo|idolo|lengole
foot|unyawo|unyawo|leoto
toes|izinzwane|iinzwane|menwana ya maoto
shirt|ihembe|ihempe|hempe
T-shirt|isikibha|isikipa|sekipa
pants|ibhulukwe|ibhulukhwe|borikgwe
shorts|izikhindi|ishots|borikgwe bo bokgutshwane
dress|ingubo|ilokhwe|mose
skirt|isiketi|isiketi|sekete
jersey|ijezi|ijezi|jesi
jacket|ijakhethi|ibhatyi|baki
shoes|izicathulo|izihlangu|dieta
socks|amasokisi|iikawusi|dikausu
hat|isigqoko|umnqwazi|katiba
beanie|ubhini|ibhini|beanie
pyjamas|amaphajama|iipijama|diphajama
nappy|inabukeni|inapkeni|lesela
gloves|amagilavu|iiglavu|ditlelafo
school uniform|iyunifomu yesikole|iyunifomu yesikolo|junifomo ya sekolo
splints|ama-splint|ii-splint|di-splint
glasses|izibuko|iiglasi|dikgalase
home|ekhaya|ekhaya|lapeng
school|isikole|isikolo|sekolo
outside|ngaphandle|phandle|ka ntle
park|ipaki|ipaka|phaka
shop|isitolo|ivenkile|lebenkele
mall|i-mall|imall|mall
hospital|isibhedlela|isibhedlele|sepetlele
church|isonto|icawa|kereke
beach|ogwini|elunxwemeni|lebopong
swimming pool|ichibi lokubhukuda|ichibi lokuqubha|letamo la ho sesa
farm|ipulazi|ifama|polasi
garden|ingadi|igadi|serapa
playground|inkundla yokudlala|ibala lokudlala|lebala la ho bapala
Granny's house|kwaGogo|kwaMakhulu|ha nkgono
restaurant|indawo yokudlela|indawo yokutyela|resturente
library|umtapo wolwazi|ithala leencwadi|laeborari
zoo|izu|izu|zoo
bedroom|ikamelo lokulala|igumbi lokulala|kamore ya ho robala
kitchen|ikhishi|ikhitshi|kitjhini
bathroom|indlu yokugezela|igumbi lokuhlambela|kamore ya ho hlapela
class|ikilasi|iklasi|sehlopha
book|incwadi|incwadi|buka
pencil|ipensela|ipensile|pensele
crayons|amakhrayoni|iikhrayoni|dikreyone
paper|iphepha|iphepha|pampiri
scissors|isikelo|isikere|sekere
glue|iglu|iglu|sekgomaretsi
paint|upende|ipeyinti|pente
computer|ikhompyutha|ikhompyutha|khomputha
tablet|ithebhulethi|ithebhulethi|tabolete
story|indaba|ibali|pale
song|ingoma|ingoma|pina
break time|isikhathi sekhefu|ixesha lekhefu|nako ya phomolo
lunch box|ibhokisi lokudla|ibhokisi lesidlo|lebokose la dijo
bag|isikhwama|ingxowa|mokotla
homework|umsebenzi wasekhaya|umsebenzi wasekhaya|mosebetsi wa sekolo
circle time|isikhathi sendilinga|ixesha lesangqa|nako ya sedikadikwe
art|ubuciko|ubugcisa|bonono
music|umculo|umculo|mmino
friends|abangane|abahlobo|metswalle
ball|ibhola|ibhola|bolo
bubbles|amabhamuza|amaqamza|dipudula
blocks|amabhulokhi|iibhloko|diboloko
puzzle|iphazili|iphazili|phazele
doll|unodoli|unopopi|popi
teddy|ithedi|ithedi|tedi
toy car|imoto yokudlala|imoto yokudlala|koloi ya ho bapala
train|isitimela|uloliwe|terene
Lego|iLego|iLego|Lego
game|umdlalo|umdlalo|papadi
cards|amakhadi|amakhadi|dikarete
swing|ijingi|ijingi|swing
slide|isilayidi|isilayidi|selaete
trampoline|ithrampolini|itrampolini|terempoline
sandpit|umgodi wesihlabathi|umgodi wentlabathi|sekoti sa lehlabathe
bike|ibhayisikili|ibhayisekile|baesekele
iPad|i-iPad|i-iPad|iPad
cartoons|opopayi|opopayi|dikhathune
car|imoto|imoto|koloi
taxi|itekisi|iteksi|tekesi
bus|ibhasi|ibhasi|bese
aeroplane|ibhanoyi|inqwelomoya|sefofane
bicycle|ibhayisikili|ibhayisekile|baesekele
boat|isikebhe|isikhephe|sekepe
truck|iloli|ilori|lori
ambulance|i-ambulensi|i-ambulensi|ambulense
fire engine|imoto yomlilo|inqwelo yomlilo|enjene ya mollo
police car|imoto yamaphoyisa|imoto yamapolisa|koloi ya mapolesa
wheelchair|isihlalo esinamasondo|isitulo esinamavili|setulo sa mabidi
walker|isihambisi|isihambisi|sethusi sa ho tsamaya
motorbike|isithuthuthu|isithuthuthu|sethuthuthu
sunny|kunelanga|kukho ilanga|ho a chabela
rain|imvula|imvula|pula
cloudy|kunamafu|kunamafu|ho na le maru
windy|kunomoya|kunomoya|ho na le moya
storm|isiphepho|isaqhwithi|sefefo
lightning|umbani|umbane|lehadima
thunder|ukuduma|ukududuma|ho duma
rainbow|uthingo lwenkosazana|umnyama|mookodi
snow|iqhwa|ikhephu|lehlwa
door|umnyango|ucango|monyako
window|iwindi|ifestile|fensetere
bed|umbhede|ibhedi|bethe
chair|isihlalo|isitulo|setulo
table|itafula|itafile|tafole
couch|usofa|isofa|sofa
TV|i-TV|umabonakude|thelevishene
#home:light|ilambu|isibane|lebone
fridge|ifriji|ifriji|sehatsetsi
cupboard|ikhabethe|ikhabhathi|khabote
toilet|indlu yangasese|ithoyilethi|ntlwana
bath|ubhavu|ibhafu|bate
shower|ishawa|ishawa|shawara
phone|ifoni|ifowuni|fono
bath time|isikhathi sokugeza|ixesha lokuhlamba|nako ya ho hlapa
soap|insipho|isepha|sesepa
towel|ithawula|itawuli|thaole
toothbrush|ibhulashi lamazinyo|ibrashi yamazinyo|borashe ya meno
brush teeth|xubha amazinyo|xukuxa amazinyo|hlatswa meno
brush hair|kama izinwele|kama iinwele|kama moriri
wash hands|geza izandla|hlamba izandla|hlatswa matsoho
cream|ukhilimu|ikhrimu|setlolo
get dressed|gqoka|nxiba|apara
undress|khumula|khulula|hlobola
physio|i-physio|i-physio|physio
OT|i-OT|i-OT|OT
speech therapy|ukwelashwa kokukhuluma|unyango lwentetho|phekolo ya puo
exercise|ukuzivocavoca|ukuzilolonga|boikwetliso
stretch|elula|olula|otlolla
stand up|sukuma|sukuma|ema
sit down|hlala phansi|hlala phantsi|dula fatshe
walking|ukuhamba|ukuhamba|ho tsamaya
standing frame|isisekelo sokuma|isakhelo sokuma|foreime ya ho ema
massage|ukuhlikihla|ukuphulula|ho silila
rest|phumula|phumla|phomola
roll over|phenduka|jika|phethoha
reach|fikelela|fikelela|fihlella
too hard|kunzima kakhulu|kunzima kakhulu|ho thata haholo
one more|okukodwa futhi|enye kwakhona|e nngwe hape
well done|wenze kahle|wenze kakuhle|o entse hantle
hydrotherapy|ukwelashwa ngamanzi|unyango ngamanzi|phekolo ka metsi
injection|umjovo|isitofu|ente
plaster|uplasta|iplasta|polasetara
fever|imfiva|ifiva|feberu
cough|ukukhwehlela|ukukhohlela|ho kgohlela
sore throat|umphimbo obuhlungu|umqala obuhlungu|qoqotho e bohloko
earache|indlebe ebuhlungu|indlebe ebuhlungu|tsebe e bohloko
headache|ikhanda elibuhlungu|intloko ebuhlungu|hlooho e bohloko
tummy ache|isisu esibuhlungu|isisu esibuhlungu|mpa e bohloko
operation|ukuhlinzwa|utyando|opereishene
X-ray|i-X-ray|i-X-ray|X-ray
soccer|ibhola likanobhutshuzwayo|ibhola ekhatywayo|bolo ya maoto
rugby|umbhoxo|umbhoxo|rakbi
cricket|ikhilikithi|iqakamba|kerikete
netball|ibhola lomnqakiswano|ibhola lomnyazi|netbolo
swimming|ukubhukuda|ukuqubha|ho sesa
running|ukugijima|ukubaleka|ho matha
dancing|ukudansa|ukudanisa|ho tantsha
horse riding|ukugibela ihhashi|ukukhwela ihashe|ho palama pere
boccia|i-boccia|i-boccia|boccia
wheelchair basketball|ibhasikidi yesihlalo esinamasondo|ibhola yomnyazi ezitulweni|basketbolo ya setulo sa mabidi
team|iqembu|iqela|sehlopha
goal|igoli|inqaku|sepheo
win|wina|phumelela|hlola
lose|hlulwa|oyiswa|hlolwa
drum|isigubhu|igubu|moropa
guitar|isiginci|ikatala|katara
piano|upiyano|ipiyano|piano
movie|ifilimu|imovie|filimi
YouTube|YouTube|YouTube|YouTube
louder|khulisa umsindo|nyusa isandi|phahamisa modumo
softer|nciphisa umsindo|thoba isandi|theola modumo
turn it off|kucishe|yicime|e time
tree|isihlahla|umthi|sefate
flower|imbali|intyatyambo|palesa
grass|utshani|ingca|jwang
sun|ilanga|ilanga|letsatsi
moon|inyanga|inyanga|kgwedi
stars|izinkanyezi|iinkwenkwezi|dinaledi
sky|isibhakabhaka|isibhakabhaka|lehodimo
mountain|intaba|intaba|thaba
sea|ulwandle|ulwandle|lewatle
river|umfula|umlambo|noka
sand|isihlabathi|intlabathi|lehlabathe
rocks|amatshe|amatye|majwe
leaves|amaqabunga|amagqabi|makgasi
party|iphathi|itheko|mokete
present|isipho|isipho|mpho
balloons|amabhaluni|iibhaluni|dibalune
Christmas|uKhisimusi|iKrismesi|Keresemese
Easter|iPhasika|iPasika|Paseka
Heritage Day|uSuku Lwamagugu|uSuku lweMbali|Letsatsi la Lefa
candles|amakhandlela|amakhandlela|dikerese
family|umndeni|usapho|lelapa
one|kunye|nye|nngwe
two|kubili|mbini|pedi
three|kuthathu|ntathu|tharo
four|kune|ne|nne
five|kuhlanu|ntlanu|hlano
six|isithupha|ntandathu|tshelela
seven|isikhombisa|sixhenxe|supa
eight|isishiyagalombili|sibhozo|robedi
nine|isishiyagalolunye|lithoba|robong
ten|ishumi|lishumi|leshome
a lot|kakhulu|kakhulu|haholo
a little|kancane|kancinci|hanyane
`);

// ---------- page names and screen words ----------
xload(`
Little words|Amagama amancane|Amagama amancinci|Mantswe a manyane
Describing|Ukuchaza|Ukuchaza|Ho hlalosa
Feelings|Imizwa|Iimvakalelo|Maikutlo
Comfort|Ukunethezeka|Intuthuzelo|Boiketlo
Date & time|Usuku nesikhathi|Umhla nexesha|Letsatsi le nako
Actions|Izenzo|Izenzo|Diketso
Food|Ukudla|Ukutya|Dijo
Drinks|Iziphuzo|Iziselo|Dino
People|Abantu|Abantu|Batho
Animals|Izilwane|Izilwanyana|Diphoofolo
My body|Umzimba wami|Umzimba wam|Mmele wa ka
Clothes|Izingubo|Iimpahla|Diaparo
Places|Izindawo|Iindawo|Dibaka
Toys & play|Amathoyizi|Izinto zokudlala|Dibapadi
Transport|Ezokuthutha|Uthutho|Dipalangwang
Weather|Isimo sezulu|Imozulu|Boemo ba lehodimo
Bath & care|Ukugeza nokunakekela|Ukuhlamba nokhathalelo|Ho hlapa le tlhokomelo
Therapy|Ukwelashwa|Unyango|Phekolo
Doctor & hospital|Udokotela nesibhedlela|Ugqirha nesibhedlele|Ngaka le sepetlele
Sport|Ezemidlalo|Ezemidlalo|Dipapadi
Music & TV|Umculo ne-TV|Umculo ne-TV|Mmino le TV
Nature|Imvelo|Indalo|Tlhaho
Celebrations|Imigubho|Imibhiyozo|Mekete
Numbers|Izinombolo|Amanani|Dinomoro
Family names|Amagama omndeni|Amagama osapho|Mabitso a lelapa
Favourite foods|Ukudla engikuthandayo|Ukutya endikuthandayo|Dijo tseo ke di ratang
Favourite places|Izindawo engizithandayo|Iindawo endizithandayo|Dibaka tseo ke di ratang
Movies & TV|Amafilimu ne-TV|Iimovie ne-TV|Difilimi le TV
My school|Isikole sami|Isikolo sam|Sekolo sa ka
My leisure|Okungijabulisayo|Izinto endizithandayo|Boithabiso ba ka
Favourite shops|Izitolo engizithandayo|Iivenkile endizithandayo|Mabenkele ao ke a ratang
Bedtime|Isikhathi sokulala|Ixesha lokulala|Nako ya ho robala
`);
// screen buttons (kept apart from the vocabulary because "Back" here means "go back")
const XU={speak:['Khuluma','Thetha','Bua'],del:['Susa','Cima','Hlakola'],clear:['Sula konke','Cima konke','Hlakola tsohle'],share:['Kopisha','Kopa','Kopitsa'],
  language:['Ulimi','Ulwimi','Puo'],rest:['Phumuza amehlo','Phumza amehlo','Phomotsa mahlo'],resume:['Qala futhi','Qala kwakhona','Qala hape'],
  attn:['Woza lapha','Yiza apha','Tloo mona'],goback:['Emuva','Emva','Morao'],core:['Amagama ayinhloko','Amagama aphambili','Mantswe a motheo'],
  quick:['Okusheshayo','Okukhawulezayo','Tse potlakileng'],topics:['Izihloko','Imixholo','Dihlooho'],keyboard:['Ikhibhodi','Ikhibhodi','Khiboto'],
  pain:['Kubuhlungu kuphi','Kubuhlungu phi','Ho bohloko kae'],scenes:['Izithombe','Imifanekiso','Ditshwantsho'],personal:['Okwami','Okwam','Tsa ka'],
  hold:['Bamba: izilungiselelo','Bamba: useto','Tshwara: disetting'],library:['Umtapo','Ithala','Laeborari'],back:['Umhlane wami','Umqolo wam','Mokokotlo wa ka'],
  pick:['Bheka lapho kubuhlungu khona','Jonga apho kubuhlungu khona','Sheba moo ho bohloko'],space:['isikhala','isithuba','sebaka'],addword:['Faka igama','Yongeza igama','Kenya lentswe']};
const XSAYS=['Uthi','Uthi','O re'];

// ---------- fill every button's words ----------
function xword(en,key){ const t=(key&&XK[key])||XW[XN(en)]; if(!t) return null;
  return t.map(w=>w&&/^[A-Z]/.test(en)&&/^[a-z]/.test(w)&&!/[A-Z]/.test(w)?w[0].toUpperCase()+w.slice(1):w); }
function xfill(arr,key){ if(!Array.isArray(arr)||arr.length>=5) return arr; const t=xword(arr[0],key)||[]; for(let i=0;i<3;i++) arr[2+i]=t[i]||''; return arr; }
Object.values(ITEMS).forEach(it=>xfill(it.w,it.key));
Object.values(LISTS).forEach(l=>xfill(l.n)); Object.values(TOPICS).forEach(l=>xfill(l.n)); PERSONAL.forEach(p=>xfill(p[2]));

// ---------- sentences: subject concord + verb (I want water -> Ngifuna amanzi / Ndifuna amanzi / Ke batla metsi) ----------
const SC_B={zu:{'1s':'ngi','2s':'u','3s':'u',it:'i','1p':'si','2p':'ni','3p':'ba'},xh:{'1s':'ndi','2s':'u','3s':'u',it:'i','1p':'si','2p':'ni','3p':'ba'},
  st:{'1s':'ke','2s':'o','3s':'o',it:'e','1p':'re','2p':'le','3p':'ba'}};
const NEG_B={zu:{'1s':'angi','2s':'awu','3s':'aka',it:'ayi','1p':'asi','2p':'ani','3p':'aba'},xh:{'1s':'andi','2s':'awu','3s':'aka',it:'ayi','1p':'asi','2p':'ani','3p':'aba'},
  st:{'1s':'ha ke','2s':'ha o','3s':'ha a',it:'ha e','1p':'ha re','2p':'ha le','3p':'ha ba'}};
const STEM_B={come:{zu:'za',xh:'za'},stop:{zu:'yeka',xh:'yeka',st:'emisa'}};
const isVow=s=>/^[aeiou]/.test(s);
function stemOf(vkey,lang){ const s=(STEM_B[vkey]||{})[lang]; if(s) return s; const it=Object.values(ITEMS).find(x=>x.g&&x.g.t==='V'&&x.g.v===vkey); return it?String(it.w[LI[lang]]||it.w[0]).toLowerCase():vkey; }
function finalNeg(stem,lang){ if(lang==='st') return stem.replace(/a$/,'e'); return stem.replace(/a$/,'i'); }
function joinSC(sc,stem){ if(!isVow(stem)) return sc+stem; if(sc==='u') return 'w'+stem; if(sc==='i') return 'y'+stem; return sc.replace(/[aeiou]$/,'')+stem; }
function infB(stem,lang){ if(lang==='st') return 'ho '+stem; return (isVow(stem)?'ukw':'uku')+stem; }
function composeB(list,lang){
  const q=list[0]&&list[0].c==='q'&&!/\s/.test(list[0].w[0])?list[0]:null;
  const vi=list.findIndex(isV);
  const end=s=>{ s=capF(s.replace(/\s+/g,' ').trim()); return q&&!/[?]$/.test(s)?s+'?':s; };
  if(vi<0) return end(list.map((it,i)=>plainW(it,lang,i>0)).join(' '));
  const used=new Set([vi]); let si=-1, neg=false;
  for(let j=vi-1;j>=0;j--){ const g=list[j].g; if(g&&g.t==='NEG'&&!neg){neg=true;used.add(j);continue;} if(g&&g.t==='S'){si=j;used.add(j);} break; }
  if(list[vi+1]&&list[vi+1].g&&list[vi+1].g.t==='NEG'){ neg=true; used.add(vi+1); }
  const lo=Math.min(...used), hi=Math.max(...used);
  let pre=list.slice(0,lo); const rest=list.slice(hi+1);
  const asQ=q&&pre[0]===q; if(asQ) pre=pre.slice(1);
  const g=si>=0?list[si].g:{p:'1s',en:'I'}, p=g.en==='it'?'it':g.p;
  const stem=stemOf(list[vi].g.v,lang);
  const restW=rest.map(it=>isV(it)?infB(stemOf(it.g.v,lang),lang):plainW(it,lang,true));
  let verb;
  const longForm=!restW.length&&!asQ&&!['have','can'].includes(list[vi].g.v);   // present tense without an object: ngiya-, ndiya-, ke a
  if(lang==='st'){ verb=neg?NEG_B.st[p]+' '+finalNeg(stem,lang):SC_B.st[p]+' '+(longForm?'a ':'')+stem; }
  else { verb=neg?joinSC(NEG_B[lang][p],finalNeg(stem,lang)):joinSC(SC_B[lang][p]+(longForm?'ya':''),stem); }
  const words=[...pre.map((it,i)=>plainW(it,lang,i>0)),verb,...restW,...(asQ?[plainW(q,lang,false).toLowerCase()]:[])];
  return end(words.join(' '));
}
