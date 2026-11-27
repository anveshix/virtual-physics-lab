/**
 * Bilingual UI strings (English + NCERT-style Devanagari Hindi).
 *
 * Only interface chrome lives here. Deep scientific prose (theory paragraphs,
 * viva answers) intentionally falls back to English so that a translation is
 * never lower quality than the source; the switch still affects everything that
 * has a vetted Hindi string below.
 */
export interface Localized {
  en: string;
  hi: string;
}

export const STRINGS = {
  // ------------------------------------------------------------- navigation
  "nav.simulators": { en: "Simulators", hi: "सिम्युलेटर" },
  "nav.class12": { en: "Class XII", hi: "कक्षा XII" },
  "nav.practicals": { en: "Practicals", hi: "प्रयोग" },
  "nav.skip": { en: "Skip to main content", hi: "मुख्य सामग्री पर जाएँ" },
  "nav.home": { en: "home", hi: "मुखपृष्ठ" },
  "nav.about": { en: "About", hi: "परिचय" },

  // ----------------------------------------------------------------- header
  "header.search": { en: "Search", hi: "खोजें" },
  "header.searchExperiments": { en: "Search experiments", hi: "प्रयोग खोजें" },
  "header.searchPlaceholder": {
    en: "Search experiments, chapters or apparatus…",
    hi: "प्रयोग, अध्याय या उपकरण खोजें…",
  },
  "header.searchEmpty": {
    en: "No experiment matches",
    hi: "कोई प्रयोग मेल नहीं खाता",
  },
  "header.toggleIndex": {
    en: "Toggle experiment index",
    hi: "प्रयोग सूची खोलें/बंद करें",
  },
  "header.favourites": { en: "Favourites", hi: "पसंदीदा" },
  "header.langToggle": { en: "Language", hi: "भाषा" },
  "header.curriculum": { en: "CBSE / NCERT aligned", hi: "CBSE / NCERT संरेखित" },

  // ----------------------------------------------------------------- footer
  "footer.units": { en: "Physics units", hi: "भौतिकी इकाइयाँ" },
  "footer.practicals": { en: "Practicals", hi: "प्रयोग" },
  "footer.popular": { en: "Popular apparatus", hi: "प्रमुख उपकरण" },
  "footer.about": { en: "About this lab", hi: "इस प्रयोगशाला के बारे में" },
  "footer.blurb": {
    en: "An independent implementation of an interactive physics laboratory for CBSE Class XII. Every apparatus is driven by a numerical model — nothing here is a static diagram.",
    hi: "CBSE कक्षा XII हेतु एक स्वतंत्र, अंतःक्रियात्मक भौतिकी प्रयोगशाला। प्रत्येक उपकरण एक संख्यात्मक मॉडल द्वारा संचालित है — यहाँ कुछ भी स्थिर चित्र नहीं है।",
  },

  // ------------------------------------------------------- experiment shell
  "shell.breadcrumb.class12": { en: "Class XII", hi: "कक्षा XII" },
  "shell.theory": { en: "Theory", hi: "सिद्धांत" },
  "shell.formulae": { en: "Formulae", hi: "सूत्र" },
  "shell.procedure": { en: "Procedure", hi: "प्रक्रिया" },
  "shell.result": { en: "Result", hi: "परिणाम" },
  "shell.precautions": { en: "Precautions", hi: "सावधानियाँ" },
  "shell.viva": { en: "Viva", hi: "मौखिकी" },
  "shell.tips": { en: "Tips", hi: "सुझाव" },
  "shell.variables": { en: "Variables", hi: "राशियाँ" },
  "shell.sourcesOfError": { en: "Sources of error", hi: "त्रुटि के स्रोत" },
  "shell.symbol": { en: "Symbol", hi: "संकेत" },
  "shell.quantity": { en: "Quantity", hi: "राशि" },
  "shell.siUnit": { en: "SI unit", hi: "SI मात्रक" },
  "shell.note": { en: "Note", hi: "टिप्पणी" },
  "shell.measurements": { en: "Measurements", hi: "मापन" },
  "shell.graph": { en: "Graph", hi: "ग्राफ" },
  "shell.favourite": { en: "Favourite", hi: "पसंदीदा" },
  "shell.favourited": { en: "Favourited", hi: "पसंदीदा ✓" },
  "shell.print": { en: "Print", hi: "प्रिंट" },
  "shell.defaults": { en: "Defaults", hi: "मूल मान" },
  "shell.record": { en: "Record reading", hi: "पाठ्यांक अंकित करें" },
  "shell.observation": { en: "Observation table", hi: "प्रेक्षण सारणी" },
  "shell.labNotebook": { en: "Lab notebook", hi: "प्रेक्षण पुस्तिका" },
  "shell.clear": { en: "Clear", hi: "साफ़ करें" },
  "shell.remove": { en: "Remove", hi: "हटाएँ" },
  "shell.resultFromState": {
    en: "Result from the current apparatus state",
    hi: "वर्तमान उपकरण स्थिति से परिणाम",
  },
  "shell.checkParams": { en: "Check the parameters", hi: "पैरामीटर जाँचें" },
  "shell.outOfRange": {
    en: "Working outside the usual range",
    hi: "सामान्य सीमा से बाहर",
  },
  "shell.moreInUnit": {
    en: "More experiments in this unit",
    hi: "इस इकाई में और प्रयोग",
  },
  "shell.allUnits": { en: "All units", hi: "सभी इकाइयाँ" },
  "shell.previous": { en: "Previous", hi: "पिछला" },
  "shell.next": { en: "Next", hi: "अगला" },

  // ------------------------------------------------------------- catalogue
  "cat.viewAll": { en: "View all", hi: "सभी देखें" },
  "cat.experiments": { en: "experiments", hi: "प्रयोग" },
  "cat.startHere": { en: "Start here", hi: "यहाँ से आरंभ करें" },
  "cat.searchLabel": { en: "Search", hi: "खोज" },

  // -------------------------------------------------------------- difficulty
  "diff.easy": { en: "Easy", hi: "सरल" },
  "diff.moderate": { en: "Moderate", hi: "मध्यम" },
  "diff.advanced": { en: "Advanced", hi: "उन्नत" },

  // ------------------------------------------------------------------ kind
  "kind.practical": { en: "Listed practical", hi: "सूचीबद्ध प्रयोग" },
  "kind.activity": { en: "Activity", hi: "क्रियाकलाप" },
  "kind.theory": { en: "Theory simulator", hi: "सिद्धांत सिम्युलेटर" },

  // ------------------------------------------------------------------- rail
  "rail.browse": { en: "Browse", hi: "ब्राउज़" },
  "rail.allSimulators": { en: "All simulators", hi: "सभी सिम्युलेटर" },
  "rail.class12units": { en: "Class XII units", hi: "कक्षा XII इकाइयाँ" },
  "rail.units": { en: "Units", hi: "इकाइयाँ" },

  // ----------------------------------------------------------------- filter
  "filter.theory": { en: "Theory", hi: "सिद्धांत" },
  "filter.practical": { en: "Practical", hi: "प्रयोग" },
  "filter.favourites": { en: "Favourites", hi: "पसंदीदा" },
  "filter.shown": { en: "shown", hi: "दर्शित" },
  "filter.placeholder": {
    en: "Search by experiment, chapter or apparatus",
    hi: "प्रयोग, अध्याय या उपकरण से खोजें",
  },
  "filter.empty": {
    en: "No experiment matches these filters",
    hi: "इन फ़िल्टरों से कोई प्रयोग मेल नहीं खाता",
  },
  "filter.clear": { en: "Clear filters", hi: "फ़िल्टर साफ़ करें" },

  // ------------------------------------------------------------------- home
  "home.title": { en: "Physics you can touch.", hi: "भौतिकी, जिसे आप छूकर समझें।" },
  "home.tagline": {
    en: "live experiments · real equations · your own lab notebook",
    hi: "जीवंत प्रयोग · वास्तविक समीकरण · आपकी अपनी प्रेक्षण पुस्तिका",
  },
  "home.start": { en: "Start experimenting", hi: "प्रयोग शुरू करें" },
  "home.practicals": { en: "CBSE practicals", hi: "CBSE प्रयोग" },
  "home.experiments": { en: "Experiments", hi: "प्रयोग" },
  "home.units": { en: "Units", hi: "इकाइयाँ" },
  "home.fieldHint": {
    en: "Drag a charge · tap to flip its sign",
    hi: "आवेश खींचें · चिह्न बदलने हेतु टैप करें",
  },
  "home.lgField": { en: "Field lines (+ to −)", hi: "क्षेत्र रेखाएँ (+ से −)" },
  "home.lgEqui": { en: "Equipotentials", hi: "समविभव रेखाएँ" },
  "home.popular": { en: "Popular experiments", hi: "लोकप्रिय प्रयोग" },
  "home.viewAll": { en: "View all", hi: "सभी देखें" },
  "home.explore": { en: "Explore by unit", hi: "इकाई अनुसार देखें" },
  "home.how": { en: "How a lab session works", hi: "प्रयोग कैसे करें" },
  "home.step1": { en: "Set up", hi: "व्यवस्थित करें" },
  "home.step1b": {
    en: "Turn knobs and drag parts on the apparatus",
    hi: "उपकरण पर नॉब घुमाएँ और भाग खिसकाएँ",
  },
  "home.step2": { en: "Observe", hi: "प्रेक्षण" },
  "home.step2b": {
    en: "Rays, fields and currents respond live",
    hi: "किरणें, क्षेत्र और धारा तुरंत बदलती हैं",
  },
  "home.step3": { en: "Measure", hi: "मापन" },
  "home.step3b": {
    en: "Read the meters and the live graph",
    hi: "मीटर और जीवंत ग्राफ पढ़ें",
  },
  "home.step4": { en: "Record", hi: "अंकन" },
  "home.step4b": {
    en: "Log trials and export your table",
    hi: "पाठ्यांक दर्ज करें और तालिका निर्यात करें",
  },
  "home.recent": { en: "Continue where you left off", hi: "जहाँ छोड़ा था वहीं से" },
} satisfies Record<string, Localized>;

export type StrKey = keyof typeof STRINGS;
