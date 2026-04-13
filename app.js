(() => {
  "use strict";

  const STORAGE_KEY = "hosp74_redactor_pro_state";

  const SUBTYPES = {
    admission_s1: "Admission semaine 1 alcool",
    retour_s2: "Admission retour semaine 2",
    evolution_s1: "Évolution semaine 1",
    evolution_s2: "Évolution semaine 2",
    sortie_s1: "Sortie fin semaine 1",
    sortie_definitive: "Sortie définitive fin semaine 2",
    consultation: "Consultation liée à l’hospitalisation"
  };

  const SECTION_LABELS = {
    intro: "Introduction",
    motif: "Motif",
    anamnese: "Anamnèse",
    consommation: "Consommation",
    contexte_psychosocial: "Contexte psychosocial",
    atcd_traitement: "ATCD",
    examen_mental: "Examen mental",
    traitement: "Traitement",
    reseau_actuel: "Réseau actuel",
    reseau_prevu: "Réseau prévu",
    conclusion: "Conclusion",
    notes_libres: "Notes libres"
  };

  const DEFAULT_SECTION_ORDER = [
    "intro",
    "motif",
    "anamnese",
    "consommation",
    "contexte_psychosocial",
    "atcd_traitement",
    "examen_mental",
    "traitement",
    "reseau_actuel",
    "reseau_prevu",
    "conclusion",
    "notes_libres"
  ];

  const SUBTYPE_ORDERS = {
    admission_s1: ["intro", "motif", "anamnese", "consommation", "contexte_psychosocial", "atcd_traitement", "examen_mental", "traitement", "reseau_actuel", "conclusion", "notes_libres"],
    retour_s2: ["intro", "motif", "anamnese", "consommation", "examen_mental", "traitement", "reseau_actuel", "reseau_prevu", "conclusion", "notes_libres"],
    evolution_s1: ["intro", "anamnese", "consommation", "examen_mental", "traitement", "conclusion", "notes_libres"],
    evolution_s2: ["intro", "anamnese", "consommation", "examen_mental", "traitement", "reseau_prevu", "conclusion", "notes_libres"],
    sortie_s1: ["intro", "anamnese", "consommation", "traitement", "reseau_prevu", "conclusion", "notes_libres"],
    sortie_definitive: ["intro", "anamnese", "consommation", "examen_mental", "traitement", "reseau_actuel", "reseau_prevu", "conclusion", "notes_libres"],
    consultation: ["intro", "anamnese", "examen_mental", "traitement", "conclusion", "notes_libres"]
  };

  const SCENARIOS = {
    lundi_matin: {
      label: "Lundi matin",
      globals: [
        "Arriver à 8h30",
        "Vérifier transmissions et sorties prévues",
        "Vérifier facturation",
        "Donner courriers et traitements de sortie si nécessaire"
      ],
      patientTemplates: {
        s1: ["Patient vu", "Note admission inscrite", "Traitement / sevrage vérifié", "Transmission faite"],
        s2: ["Patient vu", "Note retour semaine 2", "Traitement adapté si nécessaire", "Transmission faite"],
        evol: [],
        sortie: ["Sortie patient", "Courrier donné", "Traitement de sortie vérifié", "Facturation vérifiée"]
      }
    },
    mardi_matin: {
      label: "Mardi matin",
      globals: [
        "Faire le point avec l’équipe",
        "Vérifier adaptations de traitement si besoin"
      ],
      patientTemplates: {
        s1: [],
        s2: [],
        evol: ["Patient vu", "Note d’évolution faite", "Traitement adapté si nécessaire", "Transmission faite"],
        sortie: []
      }
    },
    vendredi_apresmidi: {
      label: "Vendredi après-midi",
      globals: [
        "Vérifier sorties prévues",
        "Vérifier facturation",
        "Préparer courriers de sortie"
      ],
      patientTemplates: {
        s1: [],
        s2: [],
        evol: ["Patient vu", "Note d’évolution faite", "Traitement adapté si nécessaire", "Transmission faite"],
        sortie: ["Sortie patient", "Courrier de sortie fait", "Courrier donné", "Facturation vérifiée"]
      }
    }
  };

  const EXAM_PRESETS_SHORT = [
    {
      label: "Normal bref",
      text: "Patient bien orienté dans le temps et l’espace, contact adéquat, discours cohérent, pensée organisée, sans élément psychotique manifeste. Humeur stable. Pas d’idéation suicidaire active rapportée.",
      add: ["orientation", "contact", "cohérence", "stabilité"]
    },
    {
      label: "Anxieux bref",
      text: "Patient bien orienté, collaborant, humeur anxieuse avec tension interne et ruminations. Discours cohérent, pensée centrée sur les difficultés actuelles. Pas d’élément psychotique manifeste.",
      add: ["anxieux", "ruminations", "cohérence"]
    },
    {
      label: "Anxio-dépressif bref",
      text: "Patient bien orienté, contact correct, humeur triste et anxieuse, ruminations importantes. Discours cohérent, pensée sans désorganisation. Idées noires passives à rechercher / préciser selon le contexte.",
      add: ["triste", "anxieux", "ruminations"]
    },
    {
      label: "Psychotique bref",
      text: "Contact plus méfiant, pensée moins bien organisée avec suspicion d’éléments productifs à réévaluer. Nécessité de poursuite de l’observation clinique.",
      add: ["méfiant", "désorganisation"]
    }
  ];

  const EXAM_PRESETS_LONG = [
    {
      label: "Normal complet",
      text: "Patient bien orienté dans le temps et l’espace. Présentation correcte. Contact adéquat, bonne collaboration à l’entretien. Psychomotricité sans particularité. Humeur globalement stable. Discours cohérent, pensée organisée, sans désorganisation ni élément psychotique manifeste. Sommeil et appétit à préciser selon l’anamnèse. Pas d’élément suicidaire actif objectivé à ce stade.",
      add: ["orientation", "contact", "cohérence", "stabilité", "collaboration"]
    },
    {
      label: "Anxieux complet",
      text: "Patient bien orienté dans le temps et l’espace. Contact adéquat, bonne collaboration. Humeur anxieuse avec tension interne, hypervigilance et ruminations. Discours cohérent, pensée organisée mais centrée sur les difficultés actuelles. Pas d’élément psychotique manifeste. Sommeil souvent perturbé, à préciser cliniquement.",
      add: ["orientation", "anxieux", "hypervigilance", "ruminations"]
    },
    {
      label: "Anxio-dépressif complet",
      text: "Patient bien orienté dans le temps et l’espace. Contact correct, collaboration globalement satisfaisante. Humeur triste et anxieuse avec perte d’élan, ruminations et fatigabilité psychique. Discours cohérent, pensée sans désorganisation. Le sommeil apparaît perturbé et l’énergie diminuée. Idées noires passives à préciser selon le contexte clinique. Pas d’élément psychotique manifeste.",
      add: ["triste", "anxieux", "ruminations", "fatigabilité"]
    },
    {
      label: "Fragilité borderline",
      text: "Patient bien orienté, contact possible mais parfois plus fluctuant selon les affects du moment. Humeur labile avec tension interne importante. Réactivité émotionnelle marquée. Discours cohérent mais centré sur les expériences relationnelles et les fragilités actuelles. Impulsivité à réévaluer selon l’entretien. Pas d’élément psychotique franc objectivé à ce stade.",
      add: ["labilité", "tension", "impulsivité"]
    },
    {
      label: "Trauma / hypervigilance",
      text: "Patient bien orienté, contact adéquat mais souvent prudent. Humeur anxieuse, hypervigilance importante, tension interne et difficultés de relâchement. Discours cohérent, pensée organisée, centrée sur les éléments de stress ou de menace. Le sommeil est souvent perturbé avec repos peu réparateur.",
      add: ["hypervigilance", "tension", "prudence"]
    }
  ];

  const LIBRARY = {
    intro: {
      common: [
        { label: "Intro neutre", block: "intro", text: "Patient vu ce jour dans le cadre de la prise en charge hospitalière en unité 74." },
        { label: "Suivi régulier", block: "intro", text: "Le suivi est repris ce jour dans le cadre de l’hospitalisation en cours à l’unité 74." }
      ],
      admission_s1: [
        { label: "Admission S1 classique", block: "intro", text: "Je vois ce jour le patient dans le cadre d’une admission en semaine 1 pour sevrage alcool à l’unité 74." },
        { label: "Admission S1 motivée", block: "intro", text: "Je vois ce jour le patient dans le cadre d’une admission en semaine 1 pour sevrage alcool, avec une demande active de reprise en main de la consommation." }
      ],
      retour_s2: [
        { label: "Retour S2 neutre", block: "intro", text: "Je revois ce jour le patient dans le cadre de son retour en semaine 2 après semaine intermédiaire à domicile." },
        { label: "Retour S2 avec bilan", block: "intro", text: "Le patient est revu ce jour au retour de semaine intermédiaire, afin de faire le point sur l’évolution, les éventuelles reconsommations et la poursuite du travail clinique." }
      ],
      evolution_s1: [
        { label: "Évolution S1", block: "intro", text: "Entretien d’évolution clinique réalisé ce jour dans le cadre de la semaine 1 d’hospitalisation." }
      ],
      evolution_s2: [
        { label: "Évolution S2", block: "intro", text: "Entretien d’évolution clinique réalisé ce jour dans le cadre de la semaine 2 d’hospitalisation." }
      ],
      sortie_s1: [
        { label: "Sortie S1", block: "intro", text: "Le patient est vu ce jour dans le cadre de sa sortie de fin de semaine 1 avant semaine intermédiaire." }
      ],
      sortie_definitive: [
        { label: "Sortie définitive", block: "intro", text: "Le patient est vu ce jour dans le cadre de sa sortie définitive au terme de la prise en charge hospitalière." }
      ],
      consultation: [
        { label: "Consultation", block: "intro", text: "Je vois ce jour le patient en consultation dans la continuité de la prise en charge hospitalière." }
      ]
    },

    anamnese: {
      common: [
        { label: "Contexte psychosocial complexe", block: "anamnese", text: "Le tableau s’inscrit dans un contexte psychosocial complexe, à reprendre avec le patient." },
        { label: "Alliance correcte", block: "anamnese", text: "L’alliance de travail apparaît globalement correcte et permet une reprise progressive des éléments cliniques." },
        { label: "Ambivalence", block: "anamnese", text: "Une certaine ambivalence persiste quant à la place de l’alcool et aux changements à mettre en place." }
      ],
      admission_s1: [
        { label: "Anamnèse complète alcool", block: "anamnese", text: "L’anamnèse reprend l’histoire globale de la consommation, sa progression, ses fonctions possibles, les tentatives antérieures d’arrêt, le contexte psychosocial, les antécédents et la motivation actuelle à entreprendre un sevrage." },
        { label: "Demande claire", block: "anamnese", text: "Le patient verbalise une demande claire d’aide face à une consommation devenue problématique et à son retentissement sur le fonctionnement global." },
        { label: "Demande plus contrainte", block: "anamnese", text: "La demande d’hospitalisation apparaît davantage portée par l’environnement ou par l’épuisement lié aux conséquences de la consommation, avec une élaboration encore partielle de la motivation propre." }
      ],
      retour_s2: [
        { label: "Retour semaine intermédiaire", block: "anamnese", text: "Le retour sur la semaine intermédiaire est repris avec le patient, en évaluant le maintien ou non de l’abstinence, les éventuelles reconsommations, leur contexte et leur mise en sens." },
        { label: "Bonne mise au travail", block: "anamnese", text: "Le patient rapporte avoir pu utiliser utilement cette période intermédiaire et revient avec une élaboration plus approfondie de ses difficultés." },
        { label: "Semaine intermédiaire fragile", block: "anamnese", text: "La semaine intermédiaire apparaît plus fragile, avec difficultés à maintenir le cadre, éléments de tension interne et possible reconsommation à analyser." }
      ],
      evolution_s1: [
        { label: "Travail de motivation", block: "anamnese", text: "L’entretien porte notamment sur la motivation, les facteurs déclenchants de consommation et les premières pistes d’alternative." },
        { label: "Élaboration progressive", block: "anamnese", text: "Le travail d’élaboration se poursuit progressivement autour du sens de la consommation et des facteurs de vulnérabilité." }
      ],
      evolution_s2: [
        { label: "Projection dans la suite", block: "anamnese", text: "L’entretien porte davantage sur la consolidation des acquis, la prévention de rechute et la projection dans la suite du suivi." },
        { label: "Craving / situations à risque", block: "anamnese", text: "Les situations à risque, le craving et les moyens d’y faire face sont repris avec le patient." }
      ],
      sortie_s1: [
        { label: "Préparer la semaine intermédiaire", block: "anamnese", text: "L’entretien de sortie de semaine 1 permet de reprendre les points de vigilance pour la semaine intermédiaire, les situations à risque et les moyens de soutien disponibles." }
      ],
      sortie_definitive: [
        { label: "Bilan global", block: "anamnese", text: "Le bilan global de la prise en charge est repris avec le patient, en mettant en évidence les bénéfices, les fragilités persistantes et les points d’attention pour la suite." }
      ],
      consultation: [
        { label: "Consultation post-hospit", block: "anamnese", text: "L’entretien reprend l’évolution depuis la sortie, la consommation, l’état psychique, le traitement et la mise en place du relais." }
      ]
    },

    alcohol: {
      common: [
        { label: "Fonction anxiolytique", block: "consommation", text: "La consommation semble remplir une fonction essentiellement anxiolytique et de régulation émotionnelle." },
        { label: "Fonction sommeil", block: "consommation", text: "L’alcool est décrit comme utilisé notamment dans une tentative d’aide à l’endormissement ou d’apaisement le soir." },
        { label: "Craving important", block: "consommation", text: "Un craving important est rapporté et travaillé avec le patient." }
      ],
      admission_s1: [
        { label: "Histoire de consommation", block: "consommation", text: "L’histoire de consommation est reprise de manière détaillée, avec le type d’alcool, les quantités, le rythme, la temporalité, les périodes d’aggravation et les conséquences cliniques et sociales." },
        { label: "ATCD sevrage compliqué", block: "consommation", text: "Les antécédents de sevrage sont particulièrement importants à documenter compte tenu du risque de complications." },
        { label: "Autres substances", block: "consommation", text: "Les autres consommations éventuelles sont recherchées et précisées au cours de l’entretien." }
      ],
      retour_s2: [
        { label: "Abstinence maintenue", block: "consommation", text: "Le patient rapporte un maintien de l’abstinence pendant la semaine intermédiaire." },
        { label: "Reconsommation analysée", block: "consommation", text: "Une reconsommation est rapportée pendant la semaine intermédiaire, dans un contexte à analyser avec le patient afin d’en dégager les enjeux et les déclencheurs." },
        { label: "Mise en sens de la rechute", block: "consommation", text: "L’analyse de la reconsommation permet un travail de mise en sens plutôt qu’une lecture uniquement culpabilisante." }
      ],
      evolution_s1: [
        { label: "Tolérance sevrage", block: "consommation", text: "La tolérance du sevrage est reprise cliniquement, tant sur le plan somatique que psychique." }
      ],
      evolution_s2: [
        { label: "Prévention rechute", block: "consommation", text: "Le travail se centre davantage sur la prévention de rechute, l’identification des situations à risque et les stratégies alternatives." }
      ],
      sortie_s1: [
        { label: "Vigilance semaine intermédiaire", block: "consommation", text: "Les situations de vulnérabilité à la reconsommation pendant la semaine intermédiaire sont travaillées et rappelées au patient." }
      ],
      sortie_definitive: [
        { label: "Consolidation", block: "consommation", text: "Les acquis autour de la consommation, les fragilités persistantes et les points de vigilance pour la suite sont repris dans une perspective de consolidation." }
      ],
      consultation: [
        { label: "Suivi consommation", block: "consommation", text: "La consultation reprend l’évolution de la consommation depuis la sortie et les éventuelles difficultés rencontrées." }
      ]
    },

    evolution: {
      common: [
        { label: "Bonne alliance", block: "conclusion", text: "L’alliance thérapeutique apparaît globalement bonne et permet un travail utile." },
        { label: "Investissement partiel", block: "conclusion", text: "L’investissement du patient apparaît présent mais encore fluctuant par moments." },
        { label: "Peu investi", block: "conclusion", text: "L’investissement clinique reste limité et nécessite encore un cadre contenant et des reprises progressives." },
        { label: "Bonne mentalisation", block: "conclusion", text: "Le patient montre une capacité croissante à mettre en lien sa consommation, ses affects et son contexte de vie." }
      ],
      evolution_s1: [
        { label: "Évolution favorable", block: "conclusion", text: "L’évolution en cours de semaine 1 apparaît globalement favorable, avec bonne participation aux entretiens et meilleure disponibilité psychique." },
        { label: "Évolution mitigée", block: "conclusion", text: "L’évolution apparaît plus partielle, avec quelques éléments de mise au travail mais des fragilités encore importantes." }
      ],
      evolution_s2: [
        { label: "Consolidation", block: "conclusion", text: "La semaine 2 semble permettre une consolidation du travail engagé, notamment autour de la prévention de rechute et de la projection dans le suivi." },
        { label: "Sortie fragile", block: "conclusion", text: "La perspective de sortie paraît encore fragile et nécessite un étayage important du réseau." }
      ],
      admission_s1: [
        { label: "Motivation présente", block: "conclusion", text: "La motivation à entreprendre le sevrage apparaît présente, même si elle mérite encore d’être consolidée." }
      ],
      retour_s2: [
        { label: "Retour engagé", block: "conclusion", text: "Le retour en semaine 2 s’inscrit dans une démarche de poursuite du travail clinique et de prévention de rechute." }
      ],
      sortie_s1: [
        { label: "Retour attendu", block: "conclusion", text: "Le retour en semaine 2 est prévu afin de poursuivre le travail engagé et d’en consolider les acquis." }
      ],
      sortie_definitive: [
        { label: "Bilan favorable", block: "conclusion", text: "Au terme de la prise en charge, l’évolution globale apparaît plutôt favorable malgré la persistance de certaines fragilités." },
        { label: "Fragilités persistantes", block: "conclusion", text: "Des fragilités persistent, justifiant un maintien de l’étayage ambulatoire et de la vigilance autour des situations à risque." }
      ],
      consultation: [
        { label: "Continuité du travail", block: "conclusion", text: "La consultation s’inscrit dans la continuité du travail engagé pendant l’hospitalisation." }
      ]
    },

    discharge: {
      common: [
        { label: "Réseau à renforcer", block: "reseau_prevu", text: "Le renforcement du réseau ambulatoire apparaît indiqué pour soutenir la suite de la prise en charge." },
        { label: "Suivi addictologique", block: "reseau_prevu", text: "Une poursuite d’accompagnement addictologique est proposée dans la suite de la prise en charge." }
      ],
      sortie_s1: [
        { label: "Consignes semaine intermédiaire", block: "conclusion", text: "Les consignes pour la semaine intermédiaire sont reprises avec le patient, notamment en termes de vigilance, de prises médicamenteuses et de recours au réseau si difficulté." },
        { label: "Traitement de sortie", block: "traitement", text: "Le traitement pour la semaine intermédiaire est remis et expliqué au patient." }
      ],
      sortie_definitive: [
        { label: "Relais clairement organisés", block: "reseau_prevu", text: "Les relais de soins post-hospitaliers sont organisés et explicités avec le patient." },
        { label: "Sortie solide", block: "conclusion", text: "La sortie paraît suffisamment structurée sur le plan clinique et organisationnel, avec relais identifiés." },
        { label: "Sortie plus fragile", block: "conclusion", text: "La sortie reste plus fragile et nécessite un étayage important ainsi qu’une vigilance accrue du réseau." }
      ],
      consultation: [
        { label: "Relais en place", block: "reseau_actuel", text: "Les relais mis en place après l’hospitalisation sont repris et réévalués." }
      ]
    },

    exam: {
      common: [
        { label: "Pas de psychose manifeste", block: "examen_mental", text: "Aucun élément psychotique manifeste n’est objectivé à ce stade." },
        { label: "Discours cohérent", block: "examen_mental", text: "Le discours reste cohérent et la pensée globalement organisée." },
        { label: "Idées noires passives", block: "examen_mental", text: "Des idées noires passives peuvent être rapportées sans scénarisation active à ce stade, à préciser cliniquement." }
      ]
    },

    style: {
      common: [
        { label: "Formulation directe", block: "notes_libres", text: "Formulation à garder : phrases courtes, claires, cliniques, sans lourdeur inutile." },
        { label: "Style plus humain", block: "notes_libres", text: "Le style peut rester clinique tout en gardant une formulation plus naturelle et incarnée." },
        { label: "Style sobre", block: "notes_libres", text: "Privilégier une écriture sobre, cohérente et immédiatement utilisable dans le dossier." }
      ]
    }
  };

  const state = {
    noteSubtype: "admission_s1",
    detailLevel: "standard",
    patientLabel: "",
    noteDate: new Date().toISOString().slice(0, 10),
    sex: "homme",
    civility: "auto",
    focus: "",
    styleTone: "fluide",
    theme: "cream",

    dictTarget: "",
    dictScratch: "",
    dictListening: false,

    activeWindow: null,
    leftOpenMobile: false,
    rightOpenMobile: false,
    leftCollapsed: false,
    rightCollapsed: false,

    blocks: emptyBlocks(),
    additions: emptyBlocks(),

    fields: {
      anamMotif: "",
      anamHistory: "",
      anamIntermediate: "",
      anamDemand: "",
      alcoolType: [],
      alcoolPattern: [],
      alcoolQty: "",
      alcoolLast: "",
      alcoolFunction: [],
      alcoolSeverity: [],
      alcoolOther: "",
      alcoolAnalysis: "",
      examPresetShort: "",
      examPresetLong: "",
      examMood: [],
      examAnxiety: [],
      examThought: [],
      examRisk: [],
      examFree: "",
      medChoices: [],
      medDose: "",
      medAdapt: [],
      medPlan: "",
      psyHousing: [],
      psyWork: [],
      psyStress: [],
      psyFamily: "",
      psyContext: "",
      atcdPsych: "",
      atcdSom: "",
      atcdAddicto: "",
      atcdFamily: "",
      networkCurrent: "",
      networkPlanned: "",
      notesTarget: "notes_libres",
      notesFree: ""
    },

    todoScenario: "lundi_matin",
    todoCounts: {
      s1: 0,
      s2: 0,
      evol: 0,
      sortie: 0
    },
    todoGlobal: [],
    todoPatients: [],
    workspaceModules: []
  };

  let recognition = null;

  function emptyBlocks() {
    return {
      intro: "",
      motif: "",
      anamnese: "",
      consommation: "",
      contexte_psychosocial: "",
      atcd_traitement: "",
      examen_mental: "",
      traitement: "",
      reseau_actuel: "",
      reseau_prevu: "",
      conclusion: "",
      notes_libres: ""
    };
  }

  function $(id) {
    return document.getElementById(id);
  }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function clean(value) {
    return (value || "").toString().trim();
  }

  function unique(arr) {
    return [...new Set(arr.filter(Boolean))];
  }

  function cap(str) {
    const t = clean(str);
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }

  function sentence(str) {
    const t = clean(str);
    if (!t) return "";
    return /[.!?]$/.test(t) ? t : `${t}.`;
  }

  function joinFr(arr) {
    const list = arr.filter(Boolean);
    if (!list.length) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} et ${list[1]}`;
    return `${list.slice(0, -1).join(", ")} et ${list[list.length - 1]}`;
  }

  function isMobile() {
    return window.innerWidth <= 980;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
      state.blocks = { ...emptyBlocks(), ...(parsed.blocks || {}) };
      state.additions = { ...emptyBlocks(), ...(parsed.additions || {}) };
      state.fields = { ...state.fields, ...(parsed.fields || {}) };
      if (!Array.isArray(state.todoGlobal)) state.todoGlobal = [];
      if (!Array.isArray(state.todoPatients)) state.todoPatients = [];
      if (!Array.isArray(state.workspaceModules)) state.workspaceModules = [];
    } catch (e) {}
  }

  function applyTheme() {
    document.body.classList.toggle("theme-dark", state.theme === "dark");
    document.body.classList.toggle("theme-cream", state.theme !== "dark");

    if (!isMobile()) {
      document.body.classList.toggle("left-collapsed", !!state.leftCollapsed);
      document.body.classList.toggle("right-collapsed", !!state.rightCollapsed);
      document.body.classList.remove("mobile-left-open", "mobile-right-open");
      $("mobileOverlay")?.classList.add("hidden");
    } else {
      document.body.classList.remove("left-collapsed", "right-collapsed");
      document.body.classList.toggle("mobile-left-open", !!state.leftOpenMobile);
      document.body.classList.toggle("mobile-right-open", !!state.rightOpenMobile);
      $("mobileOverlay")?.classList.toggle("hidden", !(state.leftOpenMobile || state.rightOpenMobile));
    }
  }

  function currentCivility() {
    if (state.civility === "monsieur") return "Monsieur";
    if (state.civility === "madame") return "Madame";
    return state.sex === "femme" ? "Madame" : "Monsieur";
  }

  function currentPatientToken() {
    return state.sex === "femme" ? "la patiente" : "le patient";
  }

  function mergeParagraph(oldText, newText, keepDup = false) {
    const a = clean(oldText);
    const b = clean(newText);
    if (!a) return b;
    if (!b) return a;
    if (keepDup) return `${a} ${b}`.trim();

    const parts = [...a.split(/(?<=[.!?])\s+/), ...b.split(/(?<=[.!?])\s+/)]
      .map(clean)
      .filter(Boolean);

    const seen = new Set();
    const out = [];
    parts.forEach(part => {
      const key = part.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(part);
      }
    });
    return out.join(" ").trim();
  }

  function autoGrow(el, minHeight = 120) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }

  function autoGrowAll() {
    $all("textarea").forEach(el => {
      if (el.id === "outputText") autoGrow(el, isMobile() ? 360 : 440);
      else autoGrow(el, el.classList.contains("xl") ? 240 : 100);
    });
  }

  function renderStaticFields() {
    $("noteSubtype").value = state.noteSubtype;
    $("detailLevel").value = state.detailLevel;
    $("patientLabel").value = state.patientLabel;
    $("noteDate").value = state.noteDate;
    $("sexSelect").value = state.sex;
    $("civilitySelect").value = state.civility;
    $("focusSelect").value = state.focus;
    $("styleToneSelect").value = state.styleTone;

    $("countS1").value = state.todoCounts.s1;
    $("countS2").value = state.todoCounts.s2;
    $("countEvol").value = state.todoCounts.evol;
    $("countSortie").value = state.todoCounts.sortie;

    Object.entries(state.fields).forEach(([key, val]) => {
      const el = $(key);
      if (!el) return;
      if (el.tagName === "SELECT" || el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        el.value = Array.isArray(val) ? "" : val;
      }
    });

    $("dictScratch").value = state.dictScratch || "";
    $("outputText").value = buildOutputText();
  }

  function renderQuickChips() {
    $all("[data-subtype-chip]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.subtypeChip === state.noteSubtype);
    });
  }

  function renderTokenGroup(containerId, options, activeValues, onClick, single = false) {
    const container = $(containerId);
    if (!container) return;
    container.innerHTML = "";
    options.forEach(option => {
      const label = typeof option === "string" ? option : option.label;
      const value = typeof option === "string" ? option : option.value || option.label;
      const isActive = single ? activeValues === value : Array.isArray(activeValues) && activeValues.includes(value);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `token${isActive ? " active" : ""}`;
      btn.textContent = label;
      btn.addEventListener("click", () => onClick(value, label));
      container.appendChild(btn);
    });
  }

  function toggleFieldArray(fieldKey, value) {
    const arr = Array.isArray(state.fields[fieldKey]) ? [...state.fields[fieldKey]] : [];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
    state.fields[fieldKey] = arr;
    saveState();
  }

  function renderFieldTokenGroups() {
    renderTokenGroup("scenarioChoices", Object.keys(SCENARIOS).map(key => ({ label: SCENARIOS[key].label, value: key })), state.todoScenario, (value) => {
      state.todoScenario = value;
      renderTodo();
      saveState();
    }, true);

    renderTokenGroup("alcoolTypeChoices", ["bière","vin","alcool fort","mixte","apéritifs"], state.fields.alcoolType, (value) => {
      toggleFieldArray("alcoolType", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("alcoolPatternChoices", ["quotidien","binge","épisodique","fluctuant","majoré le soir","avec prise matinale"], state.fields.alcoolPattern, (value) => {
      toggleFieldArray("alcoolPattern", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("alcoolFunctionChoices", ["anxiolytique","sommeil","socialisation","solitude","gestion émotionnelle","ennui","habitude","couper les pensées"], state.fields.alcoolFunction, (value) => {
      toggleFieldArray("alcoolFunction", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("alcoolSeverityChoices", ["craving","tolérance","perte de contrôle","sevrage simple","sevrage compliqué","DT","convulsions","retentissement social"], state.fields.alcoolSeverity, (value) => {
      toggleFieldArray("alcoolSeverity", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("examShortChoices", EXAM_PRESETS_SHORT.map(p => ({ label: p.label, value: p.label })), state.fields.examPresetShort, (value) => {
      state.fields.examPresetShort = state.fields.examPresetShort === value ? "" : value;
      if (state.fields.examPresetShort === value) state.fields.examPresetLong = "";
      renderFieldTokenGroups();
      saveState();
    }, true);

    renderTokenGroup("examLongChoices", EXAM_PRESETS_LONG.map(p => ({ label: p.label, value: p.label })), state.fields.examPresetLong, (value) => {
      state.fields.examPresetLong = state.fields.examPresetLong === value ? "" : value;
      if (state.fields.examPresetLong === value) state.fields.examPresetShort = "";
      renderFieldTokenGroups();
      saveState();
    }, true);

    renderTokenGroup("examMoodChoices", ["humeur stable","humeur anxieuse","humeur triste","labilité émotionnelle","irritabilité","fragilité thymique"], state.fields.examMood, (value) => {
      toggleFieldArray("examMood", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("examAnxietyChoices", ["tension interne","ruminations","hypervigilance","angoisse importante","anxiété anticipatoire"], state.fields.examAnxiety, (value) => {
      toggleFieldArray("examAnxiety", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("examThoughtChoices", ["discours cohérent","pensée organisée","contact adéquat","contact méfiant","ralentissement","pas de psychose manifeste"], state.fields.examThought, (value) => {
      toggleFieldArray("examThought", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("examRiskChoices", ["absence d’idées suicidaires actives","idées noires passives","idées suicidaires à préciser","impulsivité"], state.fields.examRisk, (value) => {
      toggleFieldArray("examRisk", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("medChoices", ["diazépam","lorazépam","trazodone","quétiapine","mirtazapine","fluoxétine","venlafaxine","escitalopram","sertraline"], state.fields.medChoices, (value) => {
      toggleFieldArray("medChoices", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("medAdaptChoices", ["traitement poursuivi","adaptation thérapeutique","switch en cours","médication symptomatique","traitement si nécessaire"], state.fields.medAdapt, (value) => {
      toggleFieldArray("medAdapt", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("psyHousingChoices", ["seul","en couple","chez les parents","logement instable","hébergé","institution"], state.fields.psyHousing, (value) => {
      toggleFieldArray("psyHousing", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("psyWorkChoices", ["travail","mutuelle","chômage","sans activité","arrêt de travail","études"], state.fields.psyWork, (value) => {
      toggleFieldArray("psyWork", value);
      renderFieldTokenGroups();
    });

    renderTokenGroup("psyStressChoices", ["familial","professionnel","financier","logement","isolement","charge mentale","rupture"], state.fields.psyStress, (value) => {
      toggleFieldArray("psyStress", value);
      renderFieldTokenGroups();
    });
  }

  function getLibraryItems(sectionKey) {
    const group = LIBRARY[sectionKey] || {};
    const items = [...(group.common || []), ...(group[state.noteSubtype] || [])];
    if (state.focus === "motivation") {
      items.push({ label: "Focus motivation", block: "conclusion", text: "L’entretien insiste particulièrement sur les éléments de motivation et de mobilisation au changement." });
    }
    if (state.focus === "ambivalence") {
      items.push({ label: "Focus ambivalence", block: "conclusion", text: "Une ambivalence significative persiste et nécessite encore un travail clinique d’élaboration." });
    }
    if (state.focus === "craving") {
      items.push({ label: "Focus craving", block: "consommation", text: "Le craving occupe une place centrale dans l’entretien et nécessite des repères précis pour la suite." });
    }
    if (state.focus === "rechute") {
      items.push({ label: "Focus rechute", block: "consommation", text: "L’analyse de la reconsommation est centrale afin d’éviter une lecture uniquement culpabilisante et d’en dégager des leviers de prévention." });
    }
    if (state.focus === "sortie_fragile") {
      items.push({ label: "Focus sortie fragile", block: "conclusion", text: "La perspective de sortie reste fragile et justifie un étayage renforcé du réseau." });
    }
    return unique(items.map(item => JSON.stringify(item))).map(item => JSON.parse(item));
  }

  function renderLibrary() {
    const maps = [
      ["presetIntro", "intro"],
      ["presetAnamnese", "anamnese"],
      ["presetAlcohol", "alcohol"],
      ["presetEvolution", "evolution"],
      ["presetDischarge", "discharge"],
      ["presetExam", "exam"],
      ["presetStyle", "style"]
    ];

    maps.forEach(([containerId, libKey]) => {
      const container = $(containerId);
      if (!container) return;
      container.innerHTML = "";
      getLibraryItems(libKey).forEach(item => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "token";
        btn.textContent = item.label;
        btn.addEventListener("click", () => {
          injectPreset(item.block, item.text);
        });
        container.appendChild(btn);
      });
    });

    const summary = $("leftContextSummary");
    if (summary) {
      summary.textContent = `${SUBTYPES[state.noteSubtype]} · ${state.detailLevel} · ${state.focus ? `focus ${state.focus}` : "focus neutre"}`;
    }
  }

  function injectPreset(block, text) {
    state.additions[block] = mergeParagraph(state.additions[block], text);
    renderAll();
    saveState();
  }

  function buildBaseStructurePreview() {
    const order = SUBTYPE_ORDERS[state.noteSubtype] || DEFAULT_SECTION_ORDER;
    return order.map(key => SECTION_LABELS[key]);
  }

  function patientNameText() {
    const civ = currentCivility();
    if (clean(state.patientLabel)) return state.patientLabel;
    return civ;
  }

  function buildBaseBlocks() {
    const who = patientNameText();
    const patientToken = currentPatientToken();

    const blocks = emptyBlocks();

    if (state.noteSubtype === "admission_s1") {
      blocks.intro = `Je vois ce jour ${who} dans le cadre d’une admission en semaine 1 à l’unité 74 pour sevrage alcool.`;
      blocks.motif = `L’admission s’inscrit dans une demande d’aide face à une problématique de consommation d’alcool avec retentissement sur le fonctionnement global.`;
      blocks.anamnese = `L’anamnèse initiale vise à reprendre l’histoire globale de la consommation, son évolution, ses fonctions possibles, les tentatives antérieures d’arrêt, le contexte psychosocial, les antécédents pertinents et la motivation actuelle à entreprendre un sevrage.`;
      blocks.conclusion = state.detailLevel === "bref"
        ? `L’objectif de cette première phase est d’initier le sevrage, contenir le risque, et commencer le travail clinique autour de la consommation.`
        : `L’objectif de cette première phase de prise en charge est d’initier le sevrage dans un cadre contenant, d’évaluer la tolérance clinique, et de commencer le travail d’élaboration autour des facteurs de vulnérabilité, de la motivation et des perspectives de suivi.`;
    }

    if (state.noteSubtype === "retour_s2") {
      blocks.intro = `Je revois ce jour ${who} dans le cadre de son retour en semaine 2 après semaine intermédiaire à domicile.`;
      blocks.motif = `L’entretien vise à faire le point sur la période intermédiaire, l’évolution de la consommation, l’état psychique et la poursuite du travail engagé.`;
      blocks.anamnese = `Le retour sur la semaine intermédiaire permet d’évaluer le maintien ou non de l’abstinence, les éventuelles reconsommations, leur contexte, et la manière dont ${patientToken} les analyse.`;
      blocks.conclusion = `Cette reprise en semaine 2 doit permettre de consolider le travail engagé, de prévenir la rechute et d’organiser la suite de la prise en charge.`;
    }

    if (state.noteSubtype === "evolution_s1") {
      blocks.intro = `Entretien d’évolution clinique réalisé ce jour dans le cadre de la semaine 1 d’hospitalisation.`;
      blocks.anamnese = `L’entretien porte sur l’évolution depuis l’admission, la tolérance du sevrage, la qualité de l’alliance, la motivation, l’état psychique et les premiers axes de travail clinique.`;
      blocks.conclusion = `L’évolution est réévaluée avec adaptation du cadre ou du traitement si nécessaire.`;
    }

    if (state.noteSubtype === "evolution_s2") {
      blocks.intro = `Entretien d’évolution clinique réalisé ce jour dans le cadre de la semaine 2 d’hospitalisation.`;
      blocks.anamnese = `L’entretien porte sur la consolidation des acquis, l’évolution du craving, les situations à risque, la projection dans la suite et l’organisation du réseau.`;
      blocks.conclusion = `Le travail se centre davantage sur la prévention de rechute et l’organisation de l’après-hospitalisation.`;
    }

    if (state.noteSubtype === "sortie_s1") {
      blocks.intro = `Le patient est vu ce jour dans le cadre de sa sortie de fin de semaine 1 avant semaine intermédiaire.`;
      blocks.anamnese = `L’évolution globale de cette première semaine est reprise, de même que les points de vigilance pour la semaine intermédiaire, les situations à risque et les moyens de recours au réseau.`;
      blocks.conclusion = `Les consignes, le traitement et les repères de vigilance sont repris avec le patient avant la sortie.`;
    }

    if (state.noteSubtype === "sortie_definitive") {
      blocks.intro = `Le patient est vu ce jour dans le cadre de sa sortie définitive au terme de la prise en charge hospitalière.`;
      blocks.anamnese = state.detailLevel === "bref"
        ? `Le bilan global de la prise en charge est repris avec le patient.`
        : `Le bilan global de la prise en charge est repris avec le patient, en mettant en évidence les bénéfices du séjour, les fragilités persistantes, l’évolution de la consommation, les adaptations thérapeutiques et l’organisation du relais.`;
      blocks.conclusion = `La sortie et les relais sont discutés de manière clinique et pragmatique selon les fragilités encore présentes.`;
    }

    if (state.noteSubtype === "consultation") {
      blocks.intro = `Je vois ce jour ${who} en consultation dans la continuité de la prise en charge hospitalière.`;
      blocks.anamnese = `L’entretien reprend l’évolution depuis l’hospitalisation, l’état psychique, la consommation, le traitement et la mise en place du relais.`;
      blocks.conclusion = `La consultation s’inscrit dans la continuité du travail engagé pendant l’hospitalisation.`;
    }

    if (state.focus === "anxiete") {
      blocks.conclusion = mergeParagraph(blocks.conclusion, "L’anxiété garde une place importante dans le tableau actuel et reste à prendre en compte dans la suite de la prise en charge.");
    }
    if (state.focus === "depressif") {
      blocks.conclusion = mergeParagraph(blocks.conclusion, "Une composante dépressive du tableau reste à surveiller cliniquement.");
    }

    return blocks;
  }

  function buildAnamneseText() {
    const parts = [];
    if (clean(state.fields.anamMotif)) parts.push(sentence(state.fields.anamMotif));
    if (clean(state.fields.anamHistory)) parts.push(sentence(state.fields.anamHistory));
    if (clean(state.fields.anamIntermediate)) parts.push(sentence(state.fields.anamIntermediate));
    if (clean(state.fields.anamDemand)) parts.push(sentence(state.fields.anamDemand));
    return parts.join(" ");
  }

  function buildAlcoholText() {
    const parts = [];
    if (state.fields.alcoolType.length) parts.push(`La consommation principale concerne ${joinFr(state.fields.alcoolType)}.`);
    if (state.fields.alcoolPattern.length) parts.push(`Le mode de consommation est décrit comme ${joinFr(state.fields.alcoolPattern)}.`);
    if (clean(state.fields.alcoolQty)) parts.push(`Les quantités rapportées sont ${clean(state.fields.alcoolQty)}.`);
    if (clean(state.fields.alcoolLast)) parts.push(`La dernière prise est rapportée ${clean(state.fields.alcoolLast)}.`);
    if (state.fields.alcoolFunction.length) parts.push(`Les fonctions possibles de cette consommation semblent être ${joinFr(state.fields.alcoolFunction)}.`);
    if (state.fields.alcoolSeverity.length) parts.push(`Les éléments de gravité ou d’antécédents de sevrage retrouvés sont ${joinFr(state.fields.alcoolSeverity)}.`);
    if (clean(state.fields.alcoolOther)) parts.push(sentence(state.fields.alcoolOther));
    if (clean(state.fields.alcoolAnalysis)) parts.push(sentence(state.fields.alcoolAnalysis));
    return parts.join(" ");
  }

  function buildExamText() {
    const parts = [];

    if (clean(state.fields.examPresetShort)) {
      const preset = EXAM_PRESETS_SHORT.find(p => p.label === state.fields.examPresetShort);
      if (preset) parts.push(sentence(preset.text));
    }
    if (clean(state.fields.examPresetLong)) {
      const preset = EXAM_PRESETS_LONG.find(p => p.label === state.fields.examPresetLong);
      if (preset) parts.push(sentence(preset.text));
    }

    if (state.fields.examMood.length) parts.push(`Sur le plan thymique, on retrouve ${joinFr(state.fields.examMood)}.`);
    if (state.fields.examAnxiety.length) parts.push(`Sur le plan anxieux, on note ${joinFr(state.fields.examAnxiety)}.`);
    if (state.fields.examThought.length) parts.push(`Le contact et la pensée sont caractérisés par ${joinFr(state.fields.examThought)}.`);
    if (state.fields.examRisk.length) parts.push(`Concernant le risque, sont relevés ${joinFr(state.fields.examRisk)}.`);
    if (clean(state.fields.examFree)) parts.push(sentence(state.fields.examFree));

    return parts.join(" ");
  }

  function buildTreatmentText() {
    const parts = [];
    if (state.fields.medChoices.length) parts.push(`Le traitement en cours comprend ${joinFr(state.fields.medChoices)}.`);
    if (clean(state.fields.medDose)) parts.push(sentence(state.fields.medDose));
    if (state.fields.medAdapt.length) parts.push(`Sur le plan thérapeutique, il s’agit de ${joinFr(state.fields.medAdapt)}.`);
    if (clean(state.fields.medPlan)) parts.push(sentence(state.fields.medPlan));
    return parts.join(" ");
  }

  function buildPsychosocialText() {
    const parts = [];
    if (state.fields.psyHousing.length) parts.push(`Concernant le logement, ${patientNameText()} vit ${joinFr(state.fields.psyHousing)}.`);
    if (state.fields.psyWork.length) parts.push(`Concernant l’activité, on retrouve ${joinFr(state.fields.psyWork)}.`);
    if (state.fields.psyStress.length) parts.push(`Les facteurs de stress principaux incluent ${joinFr(state.fields.psyStress)}.`);
    if (clean(state.fields.psyFamily)) parts.push(sentence(state.fields.psyFamily));
    if (clean(state.fields.psyContext)) parts.push(sentence(state.fields.psyContext));
    return parts.join(" ");
  }

  function buildAtcdText() {
    const parts = [];
    if (clean(state.fields.atcdPsych)) parts.push(`Les antécédents psychiatriques personnels repris sont les suivants : ${clean(state.fields.atcdPsych)}.`);
    if (clean(state.fields.atcdSom)) parts.push(`Les antécédents somatiques pertinents sont les suivants : ${clean(state.fields.atcdSom)}.`);
    if (clean(state.fields.atcdAddicto)) parts.push(`Sur le plan addictologique, sont notamment rapportés : ${clean(state.fields.atcdAddicto)}.`);
    if (clean(state.fields.atcdFamily)) parts.push(`Les antécédents familiaux psychiatriques rapportés sont : ${clean(state.fields.atcdFamily)}.`);
    return parts.join(" ");
  }

  function buildNetworkCurrentText() {
    if (!clean(state.fields.networkCurrent)) return "";
    return `Le réseau de soins actuel comprend ${clean(state.fields.networkCurrent)}.`;
  }

  function buildNetworkPlannedText() {
    if (!clean(state.fields.networkPlanned)) return "";
    return `Le réseau de soins prévu comprend ${clean(state.fields.networkPlanned)}.`;
  }

  function buildOutputText() {
    const base = buildBaseBlocks();
    const assembled = emptyBlocks();

    assembled.anamnese = mergeParagraph(base.anamnese, buildAnamneseText());
    assembled.consommation = mergeParagraph(base.consommation, buildAlcoholText());
    assembled.examen_mental = mergeParagraph(base.examen_mental, buildExamText());
    assembled.traitement = mergeParagraph(base.traitement, buildTreatmentText());
    assembled.contexte_psychosocial = mergeParagraph(base.contexte_psychosocial, buildPsychosocialText());
    assembled.atcd_traitement = mergeParagraph(base.atcd_traitement, buildAtcdText());
    assembled.reseau_actuel = mergeParagraph(base.reseau_actuel, buildNetworkCurrentText());
    assembled.reseau_prevu = mergeParagraph(base.reseau_prevu, buildNetworkPlannedText());

    Object.keys(base).forEach(key => {
      if (!assembled[key]) assembled[key] = base[key];
    });

    const finalBlocks = {};
    Object.keys(assembled).forEach(key => {
      finalBlocks[key] = mergeParagraph(assembled[key], state.additions[key]);
    });

    state.blocks = assembled;

    const order = SUBTYPE_ORDERS[state.noteSubtype] || DEFAULT_SECTION_ORDER;
    return order
      .map(key => clean(finalBlocks[key]))
      .filter(Boolean)
      .join("\n\n");
  }

  function renderStructurePreview() {
    const container = $("structurePreview");
    if (!container) return;
    container.innerHTML = "";
    buildBaseStructurePreview().forEach(label => {
      const row = document.createElement("div");
      row.className = "stack-item small";
      row.textContent = label;
      container.appendChild(row);
    });
  }

  function computeMissingSections() {
    const outText = buildOutputText();
    const existing = {};
    const order = SUBTYPE_ORDERS[state.noteSubtype] || DEFAULT_SECTION_ORDER;
    const base = buildBaseBlocks();

    order.forEach(key => {
      const combined = mergeParagraph(mergeParagraph(base[key], state.blocks[key]), state.additions[key]);
      existing[key] = clean(combined) || clean(state.blocks[key]);
    });

    const required = [];
    if (state.noteSubtype === "admission_s1") required.push("anamnese","consommation","examen_mental","traitement","conclusion");
    if (state.noteSubtype === "retour_s2") required.push("anamnese","consommation","examen_mental","conclusion");
    if (state.noteSubtype === "evolution_s1" || state.noteSubtype === "evolution_s2") required.push("anamnese","examen_mental","conclusion");
    if (state.noteSubtype === "sortie_s1") required.push("anamnese","traitement","conclusion");
    if (state.noteSubtype === "sortie_definitive") required.push("anamnese","traitement","reseau_prevu","conclusion");
    if (state.noteSubtype === "consultation") required.push("anamnese","examen_mental","conclusion");

    return required.filter(key => !clean(existing[key]) && !outText.includes(existing[key]));
  }

  function renderMissingPreview() {
    const container = $("missingPreview");
    if (!container) return;
    container.innerHTML = "";
    const missing = computeMissingSections();
    if (!missing.length) {
      const row = document.createElement("div");
      row.className = "stack-item small";
      row.textContent = "Aucune section prioritaire manquante.";
      container.appendChild(row);
      return;
    }
    missing.forEach(key => {
      const row = document.createElement("div");
      row.className = "stack-item small";
      row.textContent = SECTION_LABELS[key];
      container.appendChild(row);
    });
  }

  function renderAdditionsPreview() {
    const container = $("activeAdditionsPreview");
    if (!container) return;
    container.innerHTML = "";

    const active = Object.entries(state.additions)
      .filter(([, val]) => clean(val))
      .map(([key, val]) => ({ key, text: val }));

    if (!active.length) {
      const row = document.createElement("div");
      row.className = "stack-item small";
      row.textContent = "Aucun ajout actif.";
      container.appendChild(row);
      return;
    }

    active.forEach(item => {
      const row = document.createElement("div");
      row.className = "stack-item small";
      row.textContent = `${SECTION_LABELS[item.key]} — ${clean(item.text).slice(0, 110)}${clean(item.text).length > 110 ? "…" : ""}`;
      container.appendChild(row);
    });
  }

  function renderTodo() {
    const globalsContainer = $("globalTodoList");
    const cardsContainer = $("patientTodoCards");
    if (!globalsContainer || !cardsContainer) return;

    globalsContainer.innerHTML = "";
    cardsContainer.innerHTML = "";

    const scenario = SCENARIOS[state.todoScenario];
    state.todoGlobal = state.todoGlobal.filter(item => item && item.label);

    const globalItems = [
      ...scenario.globals.map(text => ({ id: uid(), label: text, done: false })),
      ...state.todoGlobal
    ];

    globalItems.forEach(item => {
      const row = buildCheckRow(item, () => saveState());
      globalsContainer.appendChild(row);
    });

    if (!state.todoPatients.length) {
      const row = document.createElement("div");
      row.className = "stack-item small";
      row.textContent = "Aucune to-do patient générée.";
      cardsContainer.appendChild(row);
      return;
    }

    state.todoPatients.forEach(card => {
      const box = document.createElement("div");
      box.className = "patient-card";

      const title = document.createElement("div");
      title.className = "patient-card-title";
      title.textContent = card.title;
      box.appendChild(title);

      card.tasks.forEach(task => {
        box.appendChild(buildCheckRow(task, () => saveState()));
      });

      const customRow = document.createElement("div");
      customRow.className = "patient-custom-row";
      customRow.innerHTML = `
        <input class="input" type="text" placeholder="Ajouter une tâche..." />
        <button class="mini-btn" type="button">ajouter</button>
      `;
      const input = customRow.querySelector("input");
      const btn = customRow.querySelector("button");
      btn.addEventListener("click", () => {
        const label = clean(input.value);
        if (!label) return;
        card.tasks.push({ id: uid(), label, done: false });
        input.value = "";
        renderTodo();
        saveState();
      });
      box.appendChild(customRow);

      cardsContainer.appendChild(box);
    });
  }

  function buildCheckRow(item, onChange) {
    const row = document.createElement("label");
    row.className = "check-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!item.done;
    const span = document.createElement("span");
    span.textContent = item.label;
    span.style.textDecoration = item.done ? "line-through" : "none";
    cb.addEventListener("change", () => {
      item.done = cb.checked;
      span.style.textDecoration = item.done ? "line-through" : "none";
      onChange();
    });
    row.appendChild(cb);
    row.appendChild(span);
    return row;
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function generateTodoScenario() {
    const scenario = SCENARIOS[state.todoScenario];
    const cards = [];

    const buildCard = (label, index, taskList) => ({
      id: uid(),
      title: `${label} #${index}`,
      tasks: taskList.map(t => ({ id: uid(), label: t, done: false }))
    });

    for (let i = 1; i <= Number(state.todoCounts.s1 || 0); i++) {
      if (scenario.patientTemplates.s1.length) cards.push(buildCard("Admission semaine 1", i, scenario.patientTemplates.s1));
    }
    for (let i = 1; i <= Number(state.todoCounts.s2 || 0); i++) {
      if (scenario.patientTemplates.s2.length) cards.push(buildCard("Retour semaine 2", i, scenario.patientTemplates.s2));
    }
    for (let i = 1; i <= Number(state.todoCounts.evol || 0); i++) {
      if (scenario.patientTemplates.evol.length) cards.push(buildCard("Évolution", i, scenario.patientTemplates.evol));
    }
    for (let i = 1; i <= Number(state.todoCounts.sortie || 0); i++) {
      if (scenario.patientTemplates.sortie.length) cards.push(buildCard("Sortie", i, scenario.patientTemplates.sortie));
    }

    state.todoPatients = cards;
    saveState();
    renderTodo();
  }

  function openWindow(id) {
    state.activeWindow = id;
    renderWindows();
    saveState();
  }

  function closeWindow() {
    state.activeWindow = null;
    renderWindows();
    saveState();
  }

  function renderWindows() {
    $all(".floating-window").forEach(el => {
      el.classList.toggle("hidden", el.id !== state.activeWindow);
    });
    $("modalOverlay")?.classList.toggle("hidden", !state.activeWindow);
  }

  function setDictTarget(id) {
    state.dictTarget = id;
    state.dictScratch = "";
    $("dictScratch").value = "";
    $("dictTargetLabel").textContent = id;
    $("dictStatus").textContent = "En attente.";
    openWindow("dictationWindow");
  }

  function normalizeDictation(text) {
    let out = ` ${text} `;
    const rules = [
      [/\bpoint virgule\b/gi, " ; "],
      [/\bdeux points\b/gi, " : "],
      [/\bvirgule\b/gi, ", "],
      [/\bpoint\b/gi, ". "],
      [/\bnouveau paragraphe\b/gi, "\n\n"],
      [/\bretour à la ligne\b/gi, "\n"]
    ];
    rules.forEach(([pattern, replacement]) => {
      out = out.replace(pattern, replacement);
    });
    return out.replace(/[ ]{2,}/g, " ").replace(/\s+\n/g, "\n").trim();
  }

  function startDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      $("dictStatus").textContent = "Dictée non disponible sur ce navigateur.";
      return;
    }
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }

    recognition = new SpeechRecognition();
    recognition.lang = "fr-BE";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      state.dictListening = true;
      $("dictStatus").textContent = "Écoute en cours…";
    };

    recognition.onresult = event => {
      const last = event.results[event.results.length - 1];
      if (!last || !last[0]) return;
      const text = normalizeDictation(last[0].transcript || "");
      state.dictScratch = clean(state.dictScratch) ? `${state.dictScratch} ${text}` : text;
      $("dictScratch").value = state.dictScratch;
      autoGrow($("dictScratch"), 220);
      saveState();
    };

    recognition.onerror = () => {
      $("dictStatus").textContent = "Erreur de dictée.";
    };

    recognition.onend = () => {
      state.dictListening = false;
      $("dictStatus").textContent = "Arrêtée.";
    };

    recognition.start();
  }

  function stopDictation() {
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
  }

  function validateDictation() {
    const target = $(state.dictTarget);
    if (!target) {
      closeWindow();
      return;
    }
    const text = clean(state.dictScratch);
    if (text) {
      const add = target.value ? ` ${text}` : text;
      target.value = `${target.value}${add}`;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      autoGrow(target, target.classList.contains("xl") ? 240 : 100);
    }
    state.dictScratch = "";
    state.dictTarget = "";
    closeWindow();
  }

  function bindInputs() {
    const simpleMap = [
      ["noteSubtype", "noteSubtype"],
      ["detailLevel", "detailLevel"],
      ["patientLabel", "patientLabel"],
      ["noteDate", "noteDate"],
      ["sexSelect", "sex"],
      ["civilitySelect", "civility"],
      ["focusSelect", "focus"],
      ["styleToneSelect", "styleTone"]
    ];

    simpleMap.forEach(([id, key]) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", () => {
        state[key] = el.value;
        renderAll();
        saveState();
      });
      el.addEventListener("change", () => {
        state[key] = el.value;
        renderAll();
        saveState();
      });
    });

    [["countS1","s1"],["countS2","s2"],["countEvol","evol"],["countSortie","sortie"]].forEach(([id,key]) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", () => {
        state.todoCounts[key] = Number(el.value || 0);
        saveState();
      });
    });

    const fieldIds = [
      "anamMotif","anamHistory","anamIntermediate","anamDemand",
      "alcoolQty","alcoolLast","alcoolOther","alcoolAnalysis",
      "examFree",
      "medDose","medPlan",
      "psyFamily","psyContext",
      "atcdPsych","atcdSom","atcdAddicto","atcdFamily",
      "networkCurrent","networkPlanned",
      "notesFree","notesTarget"
    ];

    fieldIds.forEach(id => {
      const el = $(id);
      if (!el) return;
      const handler = () => {
        state.fields[id] = el.value;
        if (el.tagName === "TEXTAREA") autoGrow(el, el.classList.contains("xl") ? 240 : 100);
        renderAll(false);
        saveState();
      };
      el.addEventListener("input", handler);
      el.addEventListener("change", handler);
    });

    $("outputText")?.addEventListener("input", () => {
      saveState();
      autoGrow($("outputText"), isMobile() ? 360 : 440);
    });
  }

  function bindTopButtons() {
    $("btnGenerateBase")?.addEventListener("click", () => {
      $("outputText").value = buildOutputText();
      autoGrow($("outputText"), isMobile() ? 360 : 440);
      renderAll(false);
      saveState();
    });

    $("btnHarmonize")?.addEventListener("click", () => {
      const text = buildOutputText();
      $("outputText").value = text;
      autoGrow($("outputText"), isMobile() ? 360 : 440);
      renderAll(false);
      saveState();
    });

    $("btnCopy")?.addEventListener("click", async () => {
      const text = $("outputText").value || "";
      if (text) await navigator.clipboard.writeText(text);
    });

    $("btnNewNote")?.addEventListener("click", () => {
      state.blocks = emptyBlocks();
      state.additions = emptyBlocks();
      state.fields = {
        ...state.fields,
        anamMotif: "",
        anamHistory: "",
        anamIntermediate: "",
        anamDemand: "",
        alcoolType: [],
        alcoolPattern: [],
        alcoolQty: "",
        alcoolLast: "",
        alcoolFunction: [],
        alcoolSeverity: [],
        alcoolOther: "",
        alcoolAnalysis: "",
        examPresetShort: "",
        examPresetLong: "",
        examMood: [],
        examAnxiety: [],
        examThought: [],
        examRisk: [],
        examFree: "",
        medChoices: [],
        medDose: "",
        medAdapt: [],
        medPlan: "",
        psyHousing: [],
        psyWork: [],
        psyStress: [],
        psyFamily: "",
        psyContext: "",
        atcdPsych: "",
        atcdSom: "",
        atcdAddicto: "",
        atcdFamily: "",
        networkCurrent: "",
        networkPlanned: "",
        notesTarget: "notes_libres",
        notesFree: ""
      };
      renderAll();
      saveState();
    });

    $("btnShowStructure")?.addEventListener("click", () => {
      alert(buildBaseStructurePreview().join("\n"));
    });

    $("btnShowMissing")?.addEventListener("click", () => {
      const missing = computeMissingSections();
      alert(missing.length ? missing.map(key => SECTION_LABELS[key]).join("\n") : "Aucune section prioritaire manquante.");
    });
  }

  function bindChips() {
    $all("[data-subtype-chip]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.noteSubtype = btn.dataset.subtypeChip;
        $("noteSubtype").value = state.noteSubtype;
        renderAll();
        saveState();
      });
    });
  }

  function bindInlineButtons() {
    $all(".inline-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const area = $("outputText");
        const text = btn.dataset.inline || "";
        if (!text || !area) return;
        const start = area.selectionStart ?? area.value.length;
        const end = area.selectionEnd ?? area.value.length;
        area.value = area.value.slice(0, start) + text + area.value.slice(end);
        const pos = start + text.length;
        area.selectionStart = pos;
        area.selectionEnd = pos;
        area.focus();
        autoGrow(area, isMobile() ? 360 : 440);
        saveState();
      });
    });
  }

  function bindDictationButtons() {
    $all(".dictation-btn").forEach(btn => {
      btn.addEventListener("click", () => setDictTarget(btn.dataset.dictTarget));
    });

    $("btnStartDictation")?.addEventListener("click", startDictation);
    $("btnStopDictation")?.addEventListener("click", stopDictation);
    $("btnValidateDictation")?.addEventListener("click", validateDictation);
  }

  function addBuiltTextToBlock(block, text) {
    if (!clean(text)) return;
    state.additions[block] = mergeParagraph(state.additions[block], text);
    $("outputText").value = buildOutputText();
    autoGrow($("outputText"), isMobile() ? 360 : 440);
    renderAll(false);
    saveState();
    closeWindow();
  }

  function bindModuleAddButtons() {
    $("btnAddAnamnese")?.addEventListener("click", () => addBuiltTextToBlock("anamnese", buildAnamneseText()));
    $("btnAddAlcool")?.addEventListener("click", () => addBuiltTextToBlock("consommation", buildAlcoholText()));
    $("btnAddExamen")?.addEventListener("click", () => addBuiltTextToBlock("examen_mental", buildExamText()));
    $("btnAddTraitement")?.addEventListener("click", () => addBuiltTextToBlock("traitement", buildTreatmentText()));
    $("btnAddPsychosocial")?.addEventListener("click", () => addBuiltTextToBlock("contexte_psychosocial", buildPsychosocialText()));
    $("btnAddAtcd")?.addEventListener("click", () => addBuiltTextToBlock("atcd_traitement", buildAtcdText()));
    $("btnAddReseau")?.addEventListener("click", () => {
      const cur = buildNetworkCurrentText();
      const fut = buildNetworkPlannedText();
      if (cur) state.additions.reseau_actuel = mergeParagraph(state.additions.reseau_actuel, cur);
      if (fut) state.additions.reseau_prevu = mergeParagraph(state.additions.reseau_prevu, fut);
      $("outputText").value = buildOutputText();
      autoGrow($("outputText"), isMobile() ? 360 : 440);
      renderAll(false);
      saveState();
      closeWindow();
    });
    $("btnAddNotes")?.addEventListener("click", () => {
      const target = clean(state.fields.notesTarget) || "notes_libres";
      addBuiltTextToBlock(target, clean(state.fields.notesFree));
    });
  }

  function bindWindows() {
    $all(".close-window").forEach(btn => {
      btn.addEventListener("click", closeWindow);
    });
    $("modalOverlay")?.addEventListener("click", closeWindow);

    $all(".dock-module").forEach(btn => {
      btn.addEventListener("click", () => openWindow(btn.dataset.window));
      btn.addEventListener("dragstart", e => {
        btn.classList.add("dragging");
        e.dataTransfer.setData("text/plain", btn.dataset.module);
      });
      btn.addEventListener("dragend", () => btn.classList.remove("dragging"));
    });
  }

  function renderWorkspaceModules() {
    const zone = $("moduleDropzone");
    if (!zone) return;
    zone.innerHTML = "";

    if (!state.workspaceModules.length) {
      const ph = document.createElement("div");
      ph.className = "module-dropzone-placeholder";
      ph.textContent = "Fais glisser un module du bas ici pour l’avoir sous la main.";
      zone.appendChild(ph);
      return;
    }

    state.workspaceModules.forEach(moduleKey => {
      const card = document.createElement("div");
      card.className = "workspace-module-card";

      const title = document.createElement("div");
      title.className = "workspace-module-title";
      title.textContent = moduleKey;

      const hint = document.createElement("div");
      hint.className = "mini-summary";
      hint.textContent = "Ouvrir le module ou le retirer de la zone.";

      const actions = document.createElement("div");
      actions.className = "inline-actions mt12";

      const open = document.createElement("button");
      open.type = "button";
      open.className = "mini-btn";
      open.textContent = "ouvrir";
      open.addEventListener("click", () => openWindow(`${moduleKey}Window`));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "mini-btn";
      remove.textContent = "retirer";
      remove.addEventListener("click", () => {
        state.workspaceModules = state.workspaceModules.filter(x => x !== moduleKey);
        renderWorkspaceModules();
        saveState();
      });

      actions.appendChild(open);
      actions.appendChild(remove);
      card.appendChild(title);
      card.appendChild(hint);
      card.appendChild(actions);
      zone.appendChild(card);
    });
  }

  function bindDropzone() {
    const zone = $("moduleDropzone");
    if (!zone) return;

    zone.addEventListener("dragover", e => {
      e.preventDefault();
      zone.classList.add("is-over");
    });
    zone.addEventListener("dragleave", () => {
      zone.classList.remove("is-over");
    });
    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("is-over");
      const moduleKey = e.dataTransfer.getData("text/plain");
      if (!moduleKey) return;
      if (!state.workspaceModules.includes(moduleKey)) {
        state.workspaceModules.push(moduleKey);
      }
      renderWorkspaceModules();
      saveState();
    });

    $("btnClearWorkspaceModules")?.addEventListener("click", () => {
      state.workspaceModules = [];
      renderWorkspaceModules();
      saveState();
    });
  }

  function bindTodoButtons() {
    $("btnGenerateTodo")?.addEventListener("click", generateTodoScenario);
    $("btnResetTodo")?.addEventListener("click", () => {
      state.todoGlobal = [];
      state.todoPatients = [];
      renderTodo();
      saveState();
    });
    $("btnAddGlobalTask")?.addEventListener("click", () => {
      const input = $("customGlobalTask");
      const label = clean(input?.value);
      if (!label) return;
      state.todoGlobal.push({ id: uid(), label, done: false });
      if (input) input.value = "";
      renderTodo();
      saveState();
    });
  }

  function bindPanels() {
    $("toggleLeft")?.addEventListener("click", () => {
      if (isMobile()) {
        state.leftOpenMobile = !state.leftOpenMobile;
        state.rightOpenMobile = false;
      } else {
        state.leftCollapsed = !state.leftCollapsed;
      }
      applyTheme();
      saveState();
    });

    $("toggleRight")?.addEventListener("click", () => {
      if (isMobile()) {
        state.rightOpenMobile = !state.rightOpenMobile;
        state.leftOpenMobile = false;
      } else {
        state.rightCollapsed = !state.rightCollapsed;
      }
      applyTheme();
      saveState();
    });

    $("closeLeft")?.addEventListener("click", () => {
      if (isMobile()) state.leftOpenMobile = false;
      else state.leftCollapsed = !state.leftCollapsed;
      applyTheme();
      saveState();
    });

    $("closeRight")?.addEventListener("click", () => {
      if (isMobile()) state.rightOpenMobile = false;
      else state.rightCollapsed = !state.rightCollapsed;
      applyTheme();
      saveState();
    });

    $("mobileOverlay")?.addEventListener("click", () => {
      state.leftOpenMobile = false;
      state.rightOpenMobile = false;
      applyTheme();
      saveState();
    });

    $("themeToggle")?.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "cream" : "dark";
      applyTheme();
      saveState();
    });
  }

  function renderAll(full = true) {
    if (full) renderStaticFields();
    renderQuickChips();
    renderFieldTokenGroups();
    renderLibrary();
    renderStructurePreview();
    renderMissingPreview();
    renderAdditionsPreview();
    renderTodo();
    renderWorkspaceModules();
    renderWindows();
    applyTheme();
    $("outputText").value = buildOutputText();
    autoGrowAll();
  }

  function bindResize() {
    window.addEventListener("resize", () => {
      if (!isMobile()) {
        state.leftOpenMobile = false;
        state.rightOpenMobile = false;
      }
      applyTheme();
      autoGrowAll();
      saveState();
    });
  }

  function init() {
    loadState();
    bindInputs();
    bindTopButtons();
    bindChips();
    bindInlineButtons();
    bindDictationButtons();
    bindModuleAddButtons();
    bindWindows();
    bindDropzone();
    bindTodoButtons();
    bindPanels();
    bindResize();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
