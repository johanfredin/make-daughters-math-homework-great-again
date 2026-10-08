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
    taskOf: (i, n) => `Uppgift ${i} av ${n}`,
    question: (expr) => `${expr}\u00a0=\u00a0?`,
    answerLabel: "Ditt svar",
    invalid: "Skriv ett tal.",
    hintComma: "Nästan! Kolla var kommat ska stå.",
    hintPlus: "Det ska vara gånger, inte plus.",
    hintGeneric: ["Nästan! Prova igen.", "Inte riktigt. Försök en gång till.", "Ta det lugnt och räkna en gång till."],
    breakdownButton: "Dela upp det",
    praise: ["Snyggt!", "Klockrent!", "Där satt den!", "Bra jobbat!", "Grymt!"],
    levelDone: "Banan är klar!",
    keyEarned: "Du fick en nyckel! 🔑",
    alreadyHaveKey: "Nyckeln har du redan. Bra övning ändå!",
    backToMap: "Tillbaka till kartan",
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
      hundredths: (p) => `Hundra hundradelar blir en hel. Hur många hela blir ${p} hundradelar?`,
    },
    bar: {
      tenths: "10 tiondelar = 1 hel",
      hundredths: "100 hundradelar = 1 hel",
    },
    // Feedback inside a step
    stepWrong: "Inte riktigt. Läs tipset och prova igen.",
    reveal: (ans) => `Svaret är ${ans}. Vi tar nästa steg tillsammans.`,
    revealLast: (ans) => `Svaret är ${ans}.`,
    assembled: (expr, ans) => `${expr} = ${ans}`,
    doneTitle: "Där ser du, du klarade det!",
    placeNames: { 3: "tusental", 2: "hundratal", 1: "tiotal", 0: "ental", [-1]: "tiondelar", [-2]: "hundradelar", [-3]: "tusendelar" },
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
