// ===== Advanced vocabulary: extra themed pages (switch on in Board & language › Vocabulary) =====
// Row: emoji | English | Afrikaans | class | grammar | isiZulu | isiXhosa | Sesotho
// The isiZulu, isiXhosa and Sesotho words are a first draft: have them checked by first-language speakers.
function regA(list,rows){ return P(rows).map(r=>{ const key=list+':'+slug(r[1]); ITEMS[key]={key,e:r[0],w:[r[1],r[2],r[5]||'',r[6]||'',r[7]||''],c:r[3]||'n',g:parseG(r[4])}; return key; }); }
const ADV_TOPICS={
 cooking:{e:'🍳',n:['Kitchen & cooking','Kombuis & kook','Ikhishi nokupheka','Ikhitshi nokupheka','Kitjhini le ho pheha'],items:regA('cooking',`
🥄|spoon|lepel|n||isipuni|icephe|kgaba
🍴|fork|vurk|n||imfoloko|ifolokhwe|fereko
🔪|knife|mes|n||ummese|imela|thipa
🍽️|plate|bord|n||ipuleti|ipleyiti|poleiti
🥣|bowl|bak|n||isitsha|isitya|sekotlolo
☕|cup|koppie|n||inkomishi|ikomityi|kopi
🥛|glass|glas|n||ingilazi|iglasi|galase
🍳|pan|pan|n||ipani|ipani|pane
🍲|pot|pot|n||ibhodwe|imbiza|pitsa
🔥|stove|stoof|n||isitofu|isitovu|setofo
📦|microwave|mikrogolf|n||i-microwave|i-microwave|maekrowave
🧂|salt|sout|n||usawoti|ityuwa|letswai
🍬|sugar|suiker|n||ushukela|iswekile|tswekere
🧈|butter|botter|n||ibhotela|ibhotolo|botoro
🍓|jam|konfyt|n||ujamu|ijam|jeme
🥜|peanut butter|grondboontjiebotter|n||ibhotela yamakinati|ibhotolo yamandongomane|botoro ya matokomane
🧽|wash the dishes|was die skottelgoed|v||geza izitsha|hlamba izitya|hlatswa dijana
🥄|stir|roer|v|V:stir|govuza|xuba|fehla`)},
 shopping:{e:'🛒',n:['Shopping & money','Inkopies & geld','Ukuthenga nemali','Ukuthenga nemali','Ho reka le tjhelete'],items:regA('shopping',`
🛒|trolley|trollie|n||ingoloyi|itroli|terolli
🧺|basket|mandjie|n||ubhasikidi|ibhaskithi|baskete
💰|money|geld|n||imali|imali|tjhelete
🪙|coins|munte|n||izinhlamvu zemali|iingqekembe|dikoena
💵|banknotes|banknote|n||amaphepha emali|amaphepha emali|dinoutu
💳|card|kaart|n||ikhadi|ikhadi|karete
🧾|slip|strokie|n||irisidi|irisithi|rasiti
🏷️|price|prys|n||intengo|ixabiso|theko
💸|expensive|duur|d||kuyabiza|kuyabiza|ho a bitsa
🤑|cheap|goedkoop|d||kushibhile|kutshiphu|theko e tlase
🛍️|buy|koop|v|V:buy|thenga|thenga|reka
💲|pay|betaal|v|V:pay|khokha|hlawula|lefa
🏪|supermarket|supermark|n||isitolo esikhulu|ivenkile enkulu|lebenkele le leholo
💊|pharmacy|apteek|n||ikhemisi|ikhemesti|khemese
👗|clothes shop|klerewinkel|n||isitolo sezingubo|ivenkile yeempahla|lebenkele la diaparo
🥖|bakery|bakkery|n||ibhikawozi|indawo yokubhaka|bekari
⛽|petrol station|vulstasie|n||igaraji|igaraji|karatjhe`)},
 jobs:{e:'👷',n:['Community helpers','Gemeenskapshelpers','Abasizi bomphakathi','Abancedi boluntu','Bathusi ba setjhaba'],items:regA('jobs',`
🧑‍🚒|firefighter|brandweerman|p||isicishamlilo|umcimi-mlilo|motimamollo
👮|police officer|polisiebeampte|p||iphoyisa|ipolisa|lepolesa
🚑|paramedic|paramedikus|p||uparamedikhi|iparamedikhi|paramediki
🦷|dentist|tandarts|p||udokotela wamazinyo|ugqirha wamazinyo|ngaka ya meno
💇|hairdresser|haarkapper|p||umlungisi wezinwele|umlungisi weenwele|moetsi wa moriri
🧑‍🍳|chef|sjef|p||umpheki|umpheki|moapehi
🧑‍🌾|farmer|boer|p||umlimi|umlimi|sehwai
📮|postman|posman|p||umthwali weposi|umthumeli weeposi|monna wa poso
🧹|cleaner|skoonmaker|p||umhlanzi|umcoci|mohlwekisi
🔧|mechanic|werktuigkundige|p||umakhenikha|umakhenikhi|makheneke
🧑‍🏫|principal|skoolhoof|p||uthishanhloko|inqununu|mosuwehlooho
🚌|bus driver|busbestuurder|p||umshayeli webhasi|umqhubi webhasi|mokganni wa bese
💂|security guard|sekuriteitswag|p||unogada|unogada|molebedi
🧑‍💼|boss|baas|p||umphathi|umphathi|mookamedi
🧑‍🔬|scientist|wetenskaplike|p||usosayensi|isazinzulu|rasaense`)},
 safety:{e:'🚨',n:['Safety & emergencies','Veiligheid & noodgevalle','Ukuphepha nezimo eziphuthumayo','Ukhuseleko neemeko ezingxamisekileyo','Polokeho le maemo a tshohanyetso'],items:regA('safety',`
🆘|Help me now|Help my nou|x||Ngisize manje|Ndincede ngoku|Nthuse jwale
🚨|emergency|noodgeval|x||isimo esiphuthumayo|imeko engxamisekileyo|tshohanyetso
🤕|I fell|Ek het geval|x||Ngiwile|Ndiwile|Ke wele
🩸|I'm bleeding|Ek bloei|x||Ngiyopha|Ndiyopha|Ke a tsoa madi
😮‍💨|I can't breathe|Ek kan nie asemhaal nie|x||Angikwazi ukuphefumula|Andikwazi ukuphefumla|Ha ke kgone ho hema
🤢|I'm going to vomit|Ek gaan opgooi|x||Ngizohlanza|Ndiza kugabha|Ke tla hlatsa
🔥|fire|brand|x||umlilo|umlilo|mollo
⚠️|danger|gevaar|x||ingozi|ingozi|kotsi
🙅|Don't touch me|Moenie aan my raak nie|x||Ungangithinti|Ungandichukumisi|O se ke wa nkama
😨|I'm scared|Ek is bang|x||Ngiyesaba|Ndiyoyika|Ke a tshaba
🧍|I'm lost|Ek is verdwaal|x||Ngilahlekile|Ndilahlekile|Ke lahlehile
📞|Call my mom|Bel my ma|x||Shayela umama wami|Tsalela umama wam|Letsetsa mme wa ka
🏠|Take me home|Neem my huis toe|x||Ngiyise ekhaya|Ndise ekhaya|Nkise hae
👤|I don't know you|Ek ken jou nie|x||Angikwazi|Andikwazi|Ha ke o tsebe
✋|No, stop|Nee, stop|x||Cha, yeka|Hayi, yeka|Tjhe, emisa`)},
 sea:{e:'🐠',n:['Sea creatures','Seediere','Izilwane zasolwandle','Izilwanyana zaselwandle','Diphoofolo tsa lewatle'],items:regA('sea',`
🦈|shark|haai|n||ushaka|ukrebe|shaka
🐬|dolphin|dolfyn|n||ihlengethwa|ihlengesi|dolefine
🐙|octopus|seekat|n||ingwane|ingwane|okthopase
🦀|crab|krap|n||inkalankala|unonkala|kraba
🐢|turtle|seeskilpad|n||ufudu lwasolwandle|ufudo lwaselwandle|kgudu ya lewatle
🪼|jellyfish|jellievis|n||ijelifishi|ijelifishi|jellyfish
⭐|starfish|seester|n||inkanyezi yasolwandle|inkwenkwezi yaselwandle|naledi ya lewatle
🐚|shell|skulp|n||igobolondo|iqokobhe|kgetla
🦭|seal|rob|n||imvu yamanzi|itywina|seale
🌊|waves|branders|n||amagagasi|amaza|maqhubu
🏄|surfing|branderplankry|n||ukuntweza emagagasini|ukutyibilika emazeni|ho thellela maqhubung
⛱️|umbrella|sambreel|n||isambulela|iambrela|sekhele`)},
 farm:{e:'🚜',n:['On the farm','Op die plaas','Epulazini','Efama','Polasing'],items:regA('farm',`
🐓|rooster|haan|n||iqhude|iqhagi|mokoko
🐐|goat|bok|n||imbuzi|ibhokhwe|pudi
🫏|donkey|donkie|n||imbongolo|iesile|tonki
🦃|turkey|kalkoen|n||ikalikuni|ikarikuni|kalakune
🐑|lamb|lam|n||iwundlu|itakane|konyana
🐄|calf|kalf|n||ithole|ithole|namane
🐣|chick|kuiken|n||ichwane|intshontsho|kgogonyana
🌽|mealies|mielies|n||ummbila|umbona|poone
🚜|tractor|trekker|n||ugandaganda|itrektara|terekere
🏚️|barn|skuur|n||isibaya|isitali|ntlo ya polasi
🥚|eggs|eiers|n||amaqanda|amaqanda|mahe
🐄|milk the cow|melk die koei|v||senga inkomo|senga inkomo|hama kgomo
🌾|wheat|koring|n||ukolo|ingqolowa|koro`)},
 bugs:{e:'🐞',n:['Bugs & garden','Goggas & tuin','Izinambuzane nengadi','Izinambuzane negadi','Dikokonyana le serapa'],items:regA('bugs',`
🐜|ant|mier|n||intuthwane|imbovane|bohlwa
🐝|bee|by|n||inyosi|inyosi|notshi
🐞|ladybird|liewenheersbesie|n||i-ladybird|i-ladybird|ladybird
🪱|worm|wurm|n||isibungu|umbungu|seboko
🐌|snail|slak|n||umnenke|inkumba|kgofu
🦗|grasshopper|sprinkaan|n||intethe|intethe|tsie
🪰|fly|vlieg|n||impukane|impukane|ntsintsi
🦟|mosquito|muskiet|n||umiyane|ingcongconi|monwang
🪴|plant|plant|n||isitshalo|isityalo|semela
🌱|seeds|saad|n||imbewu|imbewu|peo
🚿|water the plants|gee die plante water|v||nisela izitshalo|nkcenkceshela izityalo|nosetsa dimela
⛏️|dig|grawe|v|V:dig|mba|emba|cheka
🌹|roses|rose|n||ama-rose|iirozi|dirosa`)},
 shapes:{e:'🔷',n:['Shapes','Vorms','Izimo','Iimilo','Dibopeho'],items:regA('shapes',`
⚪|circle|sirkel|n||indilinga|isangqa|sedikadikwe
🟥|square|vierkant|n||isikwele|isikwere|sekwere
🔺|triangle|driehoek|n||unxantathu|unxantathu|kgutlotharo
⭐|star|ster|n||inkanyezi|inkwenkwezi|naledi
❤️|heart|hart|n||inhliziyo|intliziyo|pelo
🔷|diamond|diamant|n||idayimane|idayimani|daemane
▭|rectangle|reghoek|n||unxande|uxande|khutlonne
🥚|oval|ovaal|n||i-oval|i-oval|oval
➖|line|lyn|n||umugqa|umgca|mola
🔵|dot|kolletjie|n||ichashazi|ichaphaza|letheba`)},
 tech:{e:'📱',n:['Tablets & tech','Tegnologie','Ubuchwepheshe','Itekhnoloji','Theknoloji'],items:regA('tech',`
🔋|battery|battery|n||ibhethri|ibhetri|betri
🔌|charge it|laai dit|v||yishaje|yitshaje|e tjhaje
🎧|headphones|oorfone|n||ama-headphone|ii-headphone|di-headphone
🔊|volume up|harder|v||khulisa umsindo|nyusa isandi|phahamisa modumo
🔈|volume down|sagter|v||nciphisa umsindo|thoba isandi|theola modumo
📷|camera|kamera|n||ikhamera|ikhamera|khamera
📸|take a photo|neem ’n foto|v||thatha isithombe|thatha ifoto|nka foto
🤳|video call|video-oproep|n||ikholi yevidiyo|umnxeba wevidiyo|mohala wa video
🎮|video game|videospeletjie|n||umdlalo wevidiyo|umdlalo wevidiyo|papadi ya video
📶|wifi|wifi|n||i-wifi|i-wifi|wifi
▶️|play it|speel dit|v||kudlale|yidlale|e bapale
⏸️|pause|pouse|v||misa kancane|nqumama|emisa hanyane
⏭️|next one|volgende een|n||okulandelayo|olulandelayo|e latelang`)},
 months:{e:'📅',n:['Months & seasons','Maande & seisoene','Izinyanga nezinkathi','Iinyanga namaxesha onyaka','Dikgwedi le dihla'],items:regA('months',`
📅|January|Januarie|n||uMasingana|uJanuwari|Pherekgong
📅|February|Februarie|n||uNhlolanja|uFebruwari|Hlakola
📅|March|Maart|n||uNdasa|uMatshi|Hlakubele
📅|April|April|n||uMbasa|uEpreli|Mmesa
📅|May|Mei|n||uNhlaba|uMeyi|Motsheanong
📅|June|Junie|n||uNhlangulana|uJuni|Phupjane
📅|July|Julie|n||uNtulikazi|uJulayi|Phupu
📅|August|Augustus|n||uNcwaba|uAgasti|Phato
📅|September|September|n||uMandulo|uSeptemba|Lwetse
📅|October|Oktober|n||uMfumfu|uOktobha|Mphalane
📅|November|November|n||uLwezi|uNovemba|Pudungwana
📅|December|Desember|n||uZibandlela|uDisemba|Tshitwe
☀️|summer|somer|n||ihlobo|ihlobo|lehlabula
🍂|autumn|herfs|n||ikwindla|ukwindla|hwetla
❄️|winter|winter|n||ubusika|ubusika|mariha
🌸|spring|lente|n||intwasahlobo|intlakohlaza|selemo`)},
 subjects:{e:'📚',n:['School subjects','Skoolvakke','Izifundo zesikole','Izifundo zesikolo','Dithuto tsa sekolo'],items:regA('subjects',`
🔢|maths|wiskunde|n||izibalo|izibalo|dipalo
📖|reading|lees|n||ukufunda|ukufunda|ho bala
✍️|writing|skryf|n||ukubhala|ukubhala|ho ngola
🔬|science|wetenskap|n||isayensi|inzululwazi|saense
🖌️|painting|verf|n||ukupenda|ukupeyinta|ho penta
🤸|PE|LO|n||imfundo yomzimba|imfundo yomzimba|thuto ya mmele
🎵|music class|musiekklas|n||ikilasi lomculo|iklasi lomculo|sehlopha sa mmino
💻|computer class|rekenaarklas|n||ikilasi lekhompyutha|iklasi lekhompyutha|sehlopha sa khomputha
🔤|letters|letters|n||izinhlamvu|oonobumba|ditlhaku
🗞️|news|nuus|n||izindaba|iindaba|ditaba
📝|test|toets|n||isivivinyo|uvavanyo|teko
⭐|sticker|plakker|n||isitikha|isitika|setikara
🏆|prize|prys|n||umklomelo|ibhaso|moputso`)},
 routine:{e:'🛌',n:['My day','My dag','Usuku lwami','Usuku lwam','Letsatsi la ka'],items:regA('routine',`
⏰|wake up|word wakker|v||vuka|vuka|tsoha
🛏️|make the bed|maak die bed op|v||ndlala umbhede|ndlala ibhedi|alafa bethe
🥣|breakfast|ontbyt|n||ukudla kwasekuseni|isidlo sakusasa|dijo tsa hoseng
🥪|lunch|middagete|n||ukudla kwasemini|isidlo sasemini|dijo tsa motsheare
🍝|supper|aandete|n||ukudla kwakusihlwa|isidlo sangokuhlwa|dijo tsa mantsiboya
🚌|go to school|gaan skool toe|v||ukuya esikoleni|ukuya esikolweni|ho ya sekolong
🏡|come home|kom huis toe|v||ukubuya ekhaya|ukubuya ekhaya|ho kgutlela hae
📺|TV time|TV-tyd|n||isikhathi se-TV|ixesha le-TV|nako ya TV
🦷|brush my teeth|borsel my tande|v||xubha amazinyo ami|xukuxa amazinyo am|hlatswa meno a ka
📖|bedtime story|slaaptydstorie|n||indaba yokulala|ibali lokulala|pale ya ho robala
😴|go to sleep|gaan slaap|v||yolala|yiya kulala|eya robala
💤|nap|slapie|n||ukuthatha isihlwathi|ukulala kancinci|ho otsela`)},
 hobbies:{e:'🎨',n:['Arts & hobbies','Kuns & stokperdjies','Ubuciko nezinto ozithandayo','Ubugcisa nezinto ozithandayo','Bonono le boithabiso'],items:regA('hobbies',`
🖍️|colouring in|inkleur|n||ukufaka imibala|ukufaka imibala|ho kenya mebala
✂️|cutting|knip|n||ukusika|ukusika|ho seha
🟣|playdough|speeldeeg|n||inhlama yokudlala|intlama yokudlala|hlama ya ho bapala
🧱|building|bou|n||ukwakha|ukwakha|ho aha
🎭|dress up|aantrek|n||ukugqoka imvunulo|ukunxiba iimpahla zokudlala|ho apara diaparo tsa papadi
🎤|karaoke|karaoke|n||ikaraoke|ikaraoke|karaoke
🪁|kite|vlieër|n||ikhayithi|ikhayithi|khaete
🎣|fishing|visvang|n||ukudoba|ukuloba|ho tshwasa ditlhapi
🌿|walk outside|stap buite|n||ukuhamba ngaphandle|ukuhamba phandle|ho tsamaya ka ntle
🎲|board game|bordspeletjie|n||umdlalo webhodi|umdlalo webhodi|papadi ya boto
✨|glitter|blinkertjies|n||i-glitter|i-glitter|glitter`)},
 space:{e:'🚀',n:['Space','Ruimte','Umkhathi','Umkhathi','Sebaka'],items:regA('space',`
🚀|rocket|vuurpyl|n||irokhethi|irokethi|rokete
🧑‍🚀|astronaut|ruimtevaarder|p||usomkhathi|usomkhathi|astronaut
🪐|planet|planeet|n||iplanethi|iplanethi|polanete
🌍|earth|aarde|n||umhlaba|umhlaba|lefatshe
👽|alien|ruimtewese|n||isidalwa sasemkhathini|isidalwa sasemkhathini|sebopuwa sa sebaka
🌠|shooting star|verskietende ster|n||inkanyezi enomsila|inkwenkwezi enomsila|naledi e thellang
🔭|telescope|teleskoop|n||isibonakude|isibonakude|thelesekopo`)},
 moreactions:{e:'🤸',n:['More actions','Meer aksies','Izenzo ezengeziwe','Izenzo ezongezelelweyo','Diketso tse ding'],items:regA('moreactions',`
🤸|roll|rol|v|V:roll|gingqa|qengqeleka|pitikisa
🐛|crawl|kruip|v|V:crawl|khasa|rhubuluza|kgasa
✊|grab|gryp|v|V:grab|bamba|bamba|tshwara
👉|point|wys|v|V:point|khomba|khomba|supa
👏|clap|klap|v|V:clap|shaya izandla|qhwaba|opa diatla
👋|wave|waai|v|V:wave|vayizela|wangawangisa|tsoka letsoho
🏗️|build|bou|v|V:build|akha|akha|aha
🧹|sweep|vee|v|V:sweep|shanela|tshayela|fiela
🍪|share|deel|v|V:share|abelana|abelana|arolelana
🔍|search|soek|v|V:search|cinga|khangela|batla
🤫|whisper|fluister|v|V:whisper|hleba|sebeza|hweshetsa
📢|shout|skree|v|V:shout|memeza|khwaza|hoeletsa
🌬️|blow|blaas|v|V:blow|phephetha|vuthela|foka
🏁|finish|klaarmaak|v|V:finish|qeda|gqiba|qeta
☝️|choose|kies|v|V:choose|khetha|khetha|kgetha
🛁|bathe|bad|v|V:bathe|geza|hlamba|hlapa
😌|relax|ontspan|v|V:relax|phumula|phumla|phomola
🚶|follow|volg|v|V:follow|landela|landela|latela
🎒|carry|dra|v|V:carry|thwala|thwala|jara`)},
 moredescribe:{e:'🌈',n:['More describing','Meer beskrywend','Ukuchaza okwengeziwe','Ukuchaza okongezelelweyo','Ho hlalosa ho hong'],items:regA('moredescribe',`
👍|nice|lekker|d||kumnandi|kumnandi|monate
🌟|bright|helder|d||kukhanyayo|kuqaqambileyo|kganya
🥱|boring|vervelig|d||kuyadina|kuyadika|ho a tena
🤩|amazing|wonderlik|d||kuyamangalisa|kuyamangalisa|ho a makatsa
📢|noisy|raserig|d||kunomsindo|kungxola|lerata
🪶|smooth|glad|d||bushelelezi|gudileyo|boreleli
🌵|sharp|skerp|d||bukhali|butsolo|bohale
🧵|thin|dun|d||ncane|bhityile|tshesane
📚|thick|dik|d||shubile|shinyeneyo|teteaneng
🦒|tall|lank|d||de|lide|telele
🐜|tiny|piepklein|d||ncane kakhulu|ncinci kakhulu|nyane haholo
🦕|huge|reusagtig|d||khulu kakhulu|khulu kakhulu|kgolo haholo
🍯|sticky|taai|d||namathelayo|ncangathi|kgomarelang
🌶️|spicy|pikant|d||kubabayo|kuqholiweyo|ho baba
🍋|sour|suur|d||kumuncu|kumuncu|ho bodila
🍭|sweet|soet|d||kunoshukela|kuswiti|monate
🧂|salty|souterig|d||kunosawoti|kunetyuwa|ho na le letswai
✅|right|reg|d||kulungile|kulungile|ho nepahetse
❎|wrong|verkeerd|d||akulungile|akulunganga|ho fosahetse`)},
 chat:{e:'💬',n:['Chat & manners','Gesels & maniere','Ukuxoxa nezimilo','Incoko nesimilo','Puisano le mekgwa'],items:regA('chat',`
🤝|Nice to meet you|Aangename kennis|s||Ngiyajabula ukukwazi|Ndiyavuya ukukwazi|Ke thabela ho o tseba
🙂|What's your name?|Wat is jou naam?|q||Ubani igama lakho?|Ngubani igama lakho?|Lebitso la hao ke mang?
🙋|My name is|My naam is|s||Igama lami ngu|Igama lam ngu|Lebitso la ka ke
🎂|How old are you?|Hoe oud is jy?|q||Uneminyaka emingaki?|Uneminyaka emingaphi?|O dilemo di kae?
🙌|Me too|Ek ook|s||Nami futhi|Nam|Le nna
🤷|I don't mind|Ek gee nie om nie|s||Akunandaba|Andinangxaki|Ha ho na taba
👀|Guess what|Raai wat|s||Qagela|Qikelela|Nahana
😮|Really?|Regtig?|q||Ngempela?|Ngenene?|Ka nnete?
😎|Cool|Cool|s||Kuhle|Kuhle|Ho monate
🧸|Can I play?|Kan ek speel?|q||Ngingadlala?|Ndingadlala?|Na nka bapala?
⏳|Wait a minute|Wag ’n bietjie|s||Linda kancane|Linda kancinci|Ema hanyane
🙃|Just kidding|Net ’n grap|s||Ngiyadlala nje|Ndiyadlala nje|Ke a soma feela
🥲|I miss you|Ek mis jou|s||Ngiyakukhumbula|Ndiyakukhumbula|Ke o hopotse
🌙|Good night|Goeienag|s||Ulale kahle|Ulale kakuhle|Robala hantle`)},
 sensory:{e:'🎧',n:['Senses & sensory','Sintuie','Izinzwa','Izivamvo','Dikutlo'],items:regA('sensory',`
🙉|It's too loud|Dit is te hard|x||Kunomsindo kakhulu|Kungxola kakhulu|Ho lerata haholo
😎|Too bright|Te helder|x||Kukhanya kakhulu|Kukhanya kakhulu|Ho kganya haholo
🌑|Lights off|Ligte af|v||Cisha izibani|Cima izibane|Tima mabone
🎧|I need my headphones|Ek het my oorfone nodig|x||Ngidinga ama-headphone ami|Ndidinga ii-headphone zam|Ke hloka di-headphone tsa ka
🫂|Squeeze me|Druk my|v||Ngicindezele|Ndicinezele|Mpitlele
🌀|Spin me|Draai my|v||Ngiphendulisa|Ndijikelezise|Ntjekolohise
🤲|I want to touch it|Ek wil daaraan vat|v||Ngifuna ukukuthinta|Ndifuna ukuyichukumisa|Ke batla ho e tshwara
👃|It smells|Dit ruik|d||Kuyanuka|Kuyanuka|Ho a nkga
😋|It tastes nice|Dit smaak lekker|d||Kunambitheka kahle|Kunencasa|Ho latsweha hantle
🤫|Quiet please|Stil asseblief|s||Thula ngicela|Thula nceda|Kgutsa ka kopo
🛋️|quiet corner|stil hoekie|n||ikhona elithulile|ikona ezolileyo|sekhutlo se kgutsitseng
🪀|fidget toy|vroetelspeelding|n||ithoyizi lokudlala ngezandla|into yokudlala ngezandla|sebapadi sa matsoho`)},
 health:{e:'🩹',n:['Health','Gesondheid','Impilo','Impilo','Bophelo'],items:regA('health',`
🤧|sneeze|nies|v||thimula|thimla|thimola
🥵|sweaty|sweterig|d||ngijulukile|ndibila|ke fufuletswe
🩹|bandage|verband|n||ibhandishi|ibhandeji|patise
🌡️|thermometer|termometer|n||isilinganisi sokushisa|ithemometha|themometara
💉|vaccine|entstof|n||umgomo|isitofu sokhuselo|ente ya thibelo
🫁|breathing|asemhaling|n||ukuphefumula|ukuphefumla|ho hema
🦽|my wheelchair|my rolstoel|n||isihlalo sami esinamasondo|isitulo sam esinamavili|setulo sa ka sa mabidi
🦿|my brace|my stut|n||isisekelo sami|isixhasi sam|setshehetsi sa ka
😷|mask|masker|n||imaski|imaski|maske
🧴|sunscreen|sonroom|n||ukhilimu welanga|ikrimu yelanga|setlolo sa letsatsi
🩺|check-up|ondersoek|n||ukuhlolwa|uhlolo|tlhahlobo`)},
 morefood:{e:'🥭',n:['More food','Meer kos','Ukudla okwengeziwe','Ukutya okongezelelweyo','Dijo tse ding'],items:regA('morefood',`
🥭|mango|mango|n||umango|imango|mango
🍍|pineapple|pynappel|n||uphayinaphu|ipayina|phaenapole
🍐|pear|peer|n||ipheya|ipere|pere
🍑|peach|perske|n||ipentshisi|ipesika|perekisi
🥑|avocado|avokado|n||ukwatapheya|iavokhado|avokado
🥦|broccoli|broccoli|n||ibroccoli|ibroccoli|broccoli
🎃|pumpkin|pampoen|n||ithanga|ithanga|mokopu
🧅|onion|ui|n||u-anyanisi|itswele|eiye
🍅|tomato|tamatie|n||utamatisi|itumato|tamati
🥒|cucumber|komkommer|n||ikhukhamba|ikhukhamba|kokomoro
🥗|salad|slaai|n||isaladi|isaladi|salate
🌭|hot dog|worsbroodjie|n||i-hot dog|i-hot dog|hot dog
🍿|popcorn|springmielies|n||ipopcorn|ipopcorn|popkhone
🥞|pancakes|pannekoek|n||amapanekuku|iipancake|diphanekuku
🥟|samoosa|samoosa|n||isamoosa|isamoosa|samosa
🥧|pie|pastei|n||uphaya|ipayi|phae
🍜|noodles|noedels|n||ama-noodle|ii-noodle|di-noodle
🫓|roti|roti|n||iroti|iroti|roti
🍞|bunny chow|bunny chow|n||i-bunny chow|i-bunny chow|bunny chow
🌶️|chakalaka|chakalaka|n||ichakalaka|ichakalaka|chakalaka
🥩|biltong|biltong|n||ibiltong|ibiltong|biltong
🍲|potjiekos|potjiekos|n||ipotjiekos|ipotjiekos|potjiekos`)}
};
const ADV_ORDER=Object.keys(ADV_TOPICS);
Object.entries(ADV_TOPICS).forEach(([id,t])=>{ t.adv=true; TOPICS[id]=t; });
// the advanced pages' action words also work in the sentence builder
Object.values(ITEMS).forEach(it=>{ if(it.g&&it.g.t==='V'&&!VERBS[it.g.v]){ const k=it.g.v, base=it.w[0];
  const s3=/(s|sh|ch|x|o)$/.test(base)?base+'es':/[^aeiou]y$/.test(base)?base.slice(0,-1)+'ies':base+'s';
  VERBS[k]={en:base,en3:s3,enObj:'',enModal:false,af:{v:it.w[1]},afInf:it.w[1]}; } });
const STANDARD_COUNT=Object.keys(ITEMS).filter(k=>!ADV_TOPICS[k.split(':')[0]]).length, ADVANCED_COUNT=Object.keys(ITEMS).length;
