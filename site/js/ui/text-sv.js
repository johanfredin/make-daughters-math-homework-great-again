// Every string the player sees lives here (R15). Swedish only; follow the kid-math-pedagogy skill.
// Functions take already formatted numbers (strings) so this module never formats maths itself.

export const T = {
  start: {
    title: "Kattklanens matteäventyr",
    subtitle: "Ett tal i taget genom skogen",
    play: "Spela",
    continue: "Fortsätt",
    restart: "Börja om",
    confirmRestart: "Vill du verkligen börja om? Dina nycklar försvinner.",
    confirmYes: "Ja, börja om",
    confirmNo: "Nej, tillbaka",
    chooseFur: "Välj pälsfärg",
    furNames: ["Rödbrun", "Grå", "Svart", "Ljus"],
    nameLabel: "Vad heter din katt?",
    namePlaceholder: "Skriv ett smeknamn",
    defaultName: "Gnista",
    go: "Ut i skogen!",
  },

  map: {
    keys: (n, total) => `Nycklar: ${n}/${total}`,
    comingSoon: "Kommer snart",
    enter: "Gå in",
    bossLocked: (n, total) => `Lyan är låst. Du behöver ${total} nycklar och har ${n}.`,
    helpTouch: "Dra med tummen på vänster sida för att gå.",
    helpKeys: "Gå med piltangenterna. Tryck Enter för att gå in.",
    progressReset: "Ditt sparade spel gick inte att läsa, så vi börjar från början.",
    loadError: "Något gick fel när spelet laddades. Ladda om sidan.",
    mapLabel: "Karta över skogen",
  },

  level: {
    question: (expr) => `${expr}\u00a0=\u00a0?`,
    answerLabel: "Ditt svar",
    invalid: "Skriv ett tal.",
    hintComma: "Nästan! Kolla var kommat ska stå.",
    hintPlus: "Det ska vara gånger, inte plus.",
    hintGeneric: ["Nästan! Prova igen.", "Inte riktigt. Försök en gång till.", "Ta det lugnt och räkna en gång till."],
    breakdownButton: "Dela upp det",
    praise: ["Snyggt!", "Klockrent!", "Där satt den!", "Bra jobbat!", "Grymt!"],
    backToMap: "Tillbaka till kartan",
  },

  // 0003: levels play the homework sheets in sections; 2/3 solved gives the key
  sections: {
    title: "Välj en del",
    label: (n, range) => `Del ${n}: ${range}`,
    progress: (solved, total) => `${solved}/${total} lösta`,
    allSolved: "Allt löst!",
    keyProgress: (solved, total, need) => `Lösta: ${solved}/${total} – ${need} ger nyckeln`,
    keyDone: (solved, total) => `Lösta: ${solved}/${total} – nyckeln är din!`,
    taskLabel: (id) => `Uppgift ${id}`,
    skip: "Hoppa över",
    skipHint: "Du kan hoppa över den och ta den sen.",
    sectionDone: "Delen är klar!",
    sectionResult: (n, of) => `Du löste ${n} av ${of}.`,
    keyNow: "Du har löst två tredjedelar – du fick en nyckel! 🔑",
    backToSections: "Tillbaka till delarna",
    nothingLeft: "Alla uppgifter här är lösta. Vi tar dem en gång till för övningens skull.",
  },

  kinds: {
    estimate: (expr) => `${expr} \u2248 ?`,
    fraction: "Skriv täljaren:",
    numberline: (arrow) => `Pil ${arrow}`,
    numberlineLabel: "Tallinje",
  },

  sound: {
    on: "Ljud på",
    off: "Ljud av",
  },

  breakdown: {
    title: "Dela upp det",
    finish: "Klart!",
    stepOf: (i, n) => `Steg ${i} av ${n}`,
    // Split strategy (decimal ≥ 1), e.g. 1,5 · 5
    splitPrompt: (x) => `Hur kan du dela upp ${x}?`,
    splitHelp: "Dela upp talet i en hel del och en decimaldel.",
    wholePartPrompt: (w, b) => `${w} · ${b}\u00a0=\u00a0?`,
    wholePartHelp: "Börja med den hela delen. Den är lättast.",
    halfPrompt: (h, b) => `${h} · ${b}\u00a0=\u00a0?`,
    halfHelp: (b) => `0,5 är en halv. Vad är hälften av ${b}?`,
    sumPrompt: (x, y) => `${x} + ${y}\u00a0=\u00a0?`,
    sumHelp: "Lägg ihop de två delarna.",
    // Units strategy (decimal < 1), e.g. 0,3 · 20: count in tenths/hundredths, then pick the right size
    units: {
      tenths: { one: "tiondel", many: "tiondelar" },
      hundredths: { one: "hundradel", many: "hundradelar" },
      thousandths: { one: "tusendel", many: "tusendelar" },
    },
    unitCountPrompt: (x, unit) => `Hur många ${unit} är ${x}?`,
    unitCountHelp: {
      tenths: "Första rutan efter kommat är tiondelar. Vilken siffra står där?",
      hundredths: "Andra rutan efter kommat är hundradelar. Vilken siffra står där?",
    },
    unitTimesPrompt: (n, unitN, w, unitResult) => `${n} ${unitN} · ${w}\u00a0=\u00a0? ${unitResult}`,
    unitTimesHelp: (unit) => `Räkna som vanligt, men med ${unit} i stället för hela.`,
    unitWhichPrompt: (p, unit) => `${p} ${unit}, vilket tal är det?`,
    unitWhichHelp: {
      tenths: (p) => `Tio tiondelar blir en hel. Hur många hela blir ${p} tiondelar?`,
      hundredths: (p) =>
        `Hundradelar står i andra rutan efter kommat. ${p.length === 1 ? `Siffran ${p}` : `Sista siffran i ${p}`} ska stå där.`,
      thousandths: (p) =>
        `Tusendelar står i tredje rutan efter kommat. ${p.length === 1 ? `Siffran ${p}` : `Sista siffran i ${p}`} ska stå där.`,
    },
    // 0004: "Dela upp det" for + − · / with decimals and whole numbers
    countHelp: {
      tenths: "En hel är tio tiondelar, och siffran efter kommat är tiondelar.",
      hundredths: "En hel är hundra hundradelar, och en tiondel är tio hundradelar.",
      thousandths: "En hel är tusen tusendelar, och en hundradel är tio tusendelar.",
    },
    wholesCountPrompt: (n, helWord, unit) => `Hur många ${unit} är ${n} ${helWord}?`,
    hel: { one: "hel", many: "hela" },
    wholesCountHelp: {
      tenths: "En hel är tio tiondelar.",
      hundredths: "En hel är hundra hundradelar.",
      thousandths: "En hel är tusen tusendelar.",
    },
    unitAddPrompt: (a, ua, b, ub, u) => `${a} ${ua} + ${b} ${ub} = ? ${u}`,
    unitAddHelp: (u) => `Lägg ihop som vanligt, men med ${u}.`,
    unitSubPrompt: (a, ua, b, ub, u) => `${a} ${ua} − ${b} ${ub} = ? ${u}`,
    unitSubHelp: (u) => `Räkna minus som vanligt, men med ${u}.`,
    unitDivPrompt: (a, ua, n, u) => `${a} ${ua} / ${n} = ? ${u}`,
    unitDivHelp: (u) => `Dela som vanligt, men med ${u}.`,
    // whole numbers: to the next ten first, or tens first and the ones after
    bridgeUpPrompt: (a, ten) => `Hur långt är det från ${a} upp till ${ten}?`,
    bridgeDownPrompt: (a, ten) => `Hur långt är det från ${a} ner till ${ten}?`,
    bridgeHelp: "Räkna till närmaste tiotal först.",
    calcPrompt: (a, op, b) => `${a} ${op} ${b} = ?`,
    bridgeRestHelp: (b, part, rest) => `${b} är ${part} + ${rest}. ${part} har du redan räknat.`,
    tensFirstHelp: "Räkna med tiotalen först. Entalen sparar vi till sist.",
    onesLastHelp: "Lägg till entalen som du sparade.",
    // negative numbers: the number line
    directionPrompt: "Åt vilket håll går du på tallinjen?",
    directionOptions: ["Åt höger", "Åt vänster"],
    directionHelp: "Plus går åt höger och minus går åt vänster på tallinjen.",
    walkPrompt: (a, b, dir) => `Börja på ${a} och gå ${b} steg åt ${dir}. Var hamnar du?`,
    directions: { right: "höger", left: "vänster" },
    walkHelp: "Räkna stegen ett i taget. Efter noll kommer minus ett, minus två och så vidare.",
    // chains: one part at a time
    chainHelp: {
      plus: "Plus går åt höger på tallinjen.",
      minus: "Minus går åt vänster på tallinjen.",
      decimals: "Räkna med tiondelar och hundradelar, precis som med hela tal.",
    },
    // · and / by 10, 100, 1 000
    scaleBiggerPrompt: (x) => `Blir svaret större eller mindre än ${x}?`,
    scaleBiggerOptions: ["Större", "Mindre"],
    scaleBiggerHelp: {
      times: (p) => `Tänk på 1 · ${p}. Blir det mer eller mindre än 1?`,
      divide: (p) => `Tänk på 1 / ${p}. Blir det mer eller mindre än 1?`,
    },
    scaleWhichHelp: {
      times: (p, times, boxes) => `· ${p} gör talet ${times} gånger större. Varje siffra hamnar ${boxes} längre åt vänster.`,
      divide: (p, times, boxes) => `/ ${p} gör talet ${times} gånger mindre. Varje siffra hamnar ${boxes} längre åt höger.`,
    },
    powerWords: { 10: "tio", 100: "hundra", 1000: "tusen" },
    boxes: { 1: "en ruta", 2: "två rutor", 3: "tre rutor" },
    // decimal · decimal and whole · whole
    tableFactHelp: "Börja med gångertabellen. Kommat tar vi sen.",
    tableFactWholeHelp: "Börja med gångertabellen. Nollorna tar vi sen.",
    unitTimesUnitPrompt: (u1, u2) => `${u1} gånger ${u2} blir …`,
    unitTimesUnitOptions: ["tiondelar", "hundradelar", "tusendelar"],
    unitTimesUnitHelp: "En tiondel av en tiondel är en hundradel. En tiondel av en hundradel är en tusendel.",
    zerosHelp: (a, b, zeros, x) => `${a} och ${b} har ${zeros} tillsammans. Sätt dit lika många nollor efter ${x}.`,
    zeroWords: { 1: "en nolla", 2: "två nollor", 3: "tre nollor", 4: "fyra nollor", 5: "fem nollor" },
    // whole / whole and dividing by a decimal
    cancelPrompt: (expr) => `Stryk lika många nollor i båda talen. ${expr} blir …`,
    cancelHelp: "Stryker du lika många nollor i båda talen blir svaret detsamma.",
    divideHelp: (b, a) => `Tänk baklänges: vad gånger ${b} blir ${a}?`,
    wholeUnits: {
      tens: { one: "tiotal", many: "tiotal" },
      hundreds: { one: "hundratal", many: "hundratal" },
    },
    wholeUnitCountPrompt: (n, u) => `Hur många ${u} är ${n}?`,
    wholeUnitCountHelp: {
      tens: "Ett tiotal är tio. Stryk nollan på slutet.",
      hundreds: "Ett hundratal är hundra. Stryk de två nollorna på slutet.",
    },
    wholeUnitWhichPrompt: (c, u) => `${c} ${u}, vilket tal är det?`,
    wholeUnitWhichHelp: {
      tens: "Ett tiotal är tio.",
      hundreds: "Ett hundratal är hundra.",
    },
    divisorPrompt: (expr) => `Gör talet du delar med till ett heltal. ${expr} blir …`,
    divisorHelp: (p) => `Multiplicera båda talen med ${p}. Då blir svaret detsamma.`,
    bar: {
      tenths: "10 tiondelar = 1 hel",
    },
    // Feedback inside a step
    stepWrong: "Inte riktigt. Läs tipset och prova igen.",
    reveal: (ans) => `Svaret är ${ans}. Vi tar nästa steg tillsammans.`,
    revealLast: (ans) => `Svaret är ${ans}.`,
    assembled: (expr, ans) => `${expr} = ${ans}`,
    doneTitle: "Där ser du, du klarade det!",
    // \u00ad = soft hyphen, so long names can wrap in narrow place-value columns
    placeNames: { 3: "tusen\u00adtal", 2: "hundra\u00adtal", 1: "tiotal", 0: "ental", [-1]: "tion\u00addelar", [-2]: "hundra\u00addelar", [-3]: "tusen\u00addelar" },
  },

  camp: {
    // Keyed by the camp's "camp" field in world.json; greetingDefault for camps without their own line.
    greetings: {
      multiplication: "Hej, lärling! Ska vi knäcka gångertal med decimaler tillsammans?",
    },
    greetingDefault: "Hej, lärling! Vad vill du öva på i dag?",
    showMe: "Visa mig hur",
    another: "Ett till exempel",
    practice: "Öva",
    showMeIntro: (expr) => `Vi tar ${expr} tillsammans, ett steg i taget.`,
    anotherIntro: (expr) => `Här är ett till: ${expr}.`,
    practiceIntro: "Tre övningsuppgifter. Inga nycklar, ingen brådska.",
    practiceDone: "Bra övat! Kom tillbaka när du vill.",
    backToMap: "Tillbaka till kartan",
    backToCamp: "Tillbaka till lägret",
  },

  numpad: {
    ok: "OK",
    erase: "Sudda",
  },
}

/** Pick a random line from a list (praise, generic hints). */
export function oneOf(list, rng = Math.random) {
  return list[Math.floor(rng() * list.length)]
}
