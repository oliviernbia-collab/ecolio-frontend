import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faHandSparkles, faUsers, faCalendarDays, faChartLine, faCalendarCheck,
  faGraduationCap, faUserTie, faWallet, faEnvelope, faBookOpen,
  faHouseUser, faShieldHalved, faRocket,
} from '@fortawesome/free-solid-svg-icons'

export interface GuideChapter {
  id: string
  title: string
  icon: IconDefinition
  // Texte lu à voix haute (et affiché en sous-titres).
  text: string
  // Mots-clés sans accents, utilisés pour répondre aux questions des visiteurs.
  keywords: string[]
}

export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'intro', title: 'Bienvenue', icon: faHandSparkles,
    text: "Bonjour et bienvenue sur Écolio ! Je suis votre assistante. Écolio est une application de gestion scolaire complète, pensée pour les écoles maternelles, primaires et secondaires. Elle réunit dans un seul outil les élèves, les notes, les présences, les finances, le personnel et la communication avec les familles. Je vais vous présenter chaque fonctionnalité.",
    // Pas de mot-clé « ecolio » : il apparaît dans trop de questions (« combien coûte Écolio ? »).
    keywords: ['presentation', 'bonjour', 'salut', 'c est quoi', 'qu est ce', 'qui es tu', 'a quoi sert'],
  },
  {
    id: 'eleves', title: 'Élèves & inscriptions', icon: faUsers,
    text: "Commençons par la gestion des élèves. Chaque élève dispose d'un dossier complet : identité, matricule, classe, photo et coordonnées des parents. Lors de l'inscription, un compte parent est créé avec un mot de passe sécurisé. Vous pouvez imprimer des cartes scolaires avec QR code et exporter la liste des élèves vers Excel.",
    keywords: ['eleve', 'eleves', 'inscription', 'inscrire', 'matricule', 'dossier', 'carte', 'cartes', 'qr', 'excel', 'photo'],
  },
  {
    id: 'organisation', title: 'Classes & emploi du temps', icon: faCalendarDays,
    text: "Ensuite, l'organisation pédagogique. Vous créez vos années scolaires, vos classes et vos matières, puis vous construisez l'emploi du temps. Écolio détecte automatiquement les conflits d'horaires : un enseignant ou une salle ne peut pas être occupé deux fois au même moment.",
    keywords: ['classe', 'classes', 'matiere', 'matieres', 'emploi du temps', 'horaire', 'horaires', 'conflit', 'salle', 'annee scolaire', 'planning'],
  },
  {
    id: 'notes', title: 'Notes & bulletins', icon: faChartLine,
    text: "Les enseignants saisissent les notes par matière et par trimestre. Les moyennes sont calculées automatiquement, et les bulletins sont générés en PDF, prêts à imprimer. La direction peut aussi désigner les meilleurs élèves de chaque niveau, qui apparaissent sur le tableau d'honneur public.",
    keywords: ['note', 'notes', 'bulletin', 'bulletins', 'moyenne', 'moyennes', 'trimestre', 'pdf', 'tableau d honneur', 'honneur', 'major', 'meilleur'],
  },
  {
    id: 'presences', title: 'Présences & pointage', icon: faCalendarCheck,
    text: "Pour les présences, l'appel se fait en quelques clics depuis un ordinateur ou un téléphone. Les absences et les retards sont enregistrés, peuvent être justifiés, et les parents en sont informés. Le personnel dispose aussi d'un pointage d'arrivée et de départ.",
    keywords: ['presence', 'presences', 'absence', 'absences', 'appel', 'retard', 'retards', 'pointage', 'pointer', 'justifier'],
  },
  {
    id: 'examens', title: 'Examens', icon: faGraduationCap,
    text: "Le module examens permet de planifier les épreuves, d'attribuer les salles et de désigner les surveillants, sans chevauchement.",
    keywords: ['examen', 'examens', 'epreuve', 'composition', 'surveillant', 'surveillants', 'devoir'],
  },
  {
    id: 'personnel', title: 'Personnel & paye', icon: faUserTie,
    text: "Côté ressources humaines, vous gérez tout le personnel : enseignants, secrétariat, comptable, bibliothécaire, infirmière et plus encore. Chaque membre reçoit son propre compte. La paye est intégrée, avec génération des bulletins de salaire en PDF.",
    keywords: ['personnel', 'enseignant', 'enseignants', 'professeur', 'staff', 'paye', 'paie', 'salaire', 'salaires', 'bulletin de paie', 'rh'],
  },
  {
    id: 'finance', title: 'Finance', icon: faWallet,
    text: "Le module finance gère la scolarité : création des factures, suivi des paiements, des impayés et des retards. Les parents reçoivent une notification dès qu'un paiement est confirmé, et toutes les factures s'exportent vers Excel pour la comptabilité.",
    keywords: ['finance', 'finances', 'facture', 'factures', 'paiement', 'paiements', 'scolarite', 'frais', 'impaye', 'impayes', 'comptable', 'comptabilite', 'argent'],
  },
  {
    id: 'communication', title: 'Communication', icon: faEnvelope,
    text: "Pour communiquer, Écolio propose une messagerie interne entre la direction, les enseignants et les parents, l'envoi de SMS groupés aux familles, et des notifications en temps réel. Chaque école peut aussi publier des annonces, des photos et des vidéos sur sa page publique.",
    keywords: ['message', 'messages', 'messagerie', 'sms', 'communication', 'notification', 'notifications', 'annonce', 'annonces', 'publication', 'publications', 'video', 'contacter les parents'],
  },
  {
    id: 'services', title: 'Bibliothèque, santé & cantine', icon: faBookOpen,
    text: "Écolio couvre aussi la vie scolaire. La bibliothèque gère le catalogue de livres, les emprunts et les retours. L'infirmerie enregistre les visites des élèves et prévient automatiquement les parents. Enfin, le module services gère les abonnements à la cantine et au transport scolaire.",
    keywords: ['bibliotheque', 'livre', 'livres', 'emprunt', 'emprunts', 'infirmerie', 'sante', 'infirmiere', 'cantine', 'transport', 'bus', 'repas', 'service', 'services'],
  },
  {
    id: 'portails', title: 'Espaces parents & élèves', icon: faHouseUser,
    text: "Les parents et les élèves ont leur propre espace. Ils y consultent les notes, les bulletins, les absences, l'emploi du temps et les factures, et échangent avec l'école, sur ordinateur comme sur mobile.",
    keywords: ['parent', 'parents', 'portail', 'espace parent', 'espace eleve', 'famille', 'familles', 'mobile', 'telephone', 'smartphone'],
  },
  {
    id: 'securite', title: 'Sécurité', icon: faShieldHalved,
    text: "La sécurité est au cœur d'Écolio. Chaque rôle n'accède qu'aux fonctions qui le concernent, les données de chaque école sont strictement séparées, la double authentification est disponible, et un journal d'activité trace toutes les actions importantes.",
    keywords: ['securite', 'securise', 'donnees', 'confidentialite', 'role', 'roles', 'permission', 'permissions', 'mot de passe', 'authentification', 'journal', 'historique'],
  },
  {
    id: 'demarrer', title: 'Démarrer & tarifs', icon: faRocket,
    text: "Pour démarrer, il suffit d'inscrire votre école : aucune installation, tout se passe dans le navigateur. Vous profitez de trente jours d'essai gratuit, puis l'abonnement est de cinq mille francs CFA par mois, payable par Wave. Cliquez sur « Inscrire votre école » pour commencer. Merci de votre écoute !",
    keywords: ['prix', 'tarif', 'tarifs', 'cout', 'coute', 'coutent', 'combien', 'abonnement', 'gratuit', 'essai', 'payer', 'wave', 'commencer', 'demarrer', 'installation', 'fcfa'],
  },
]

export interface GuideFaq {
  question: string
  answer: string
  keywords: string[]
}

// Réponses courtes aux questions précises. Chaque réponse a été vérifiée dans le code :
// ne rien y promettre que l'application ne fait pas réellement.
export const GUIDE_FAQ: GuideFaq[] = [
  {
    question: 'Faut-il une connexion internet ?',
    answer: "Oui. Écolio est une application en ligne : une connexion internet est nécessaire, mais une simple connexion mobile suffit. Vos données sont enregistrées sur nos serveurs, pas sur votre ordinateur.",
    keywords: ['internet', 'hors ligne', 'sans connexion', 'connexion internet', 'offline', 'reseau', 'wifi'],
  },
  {
    question: 'Y a-t-il une application à télécharger ?',
    answer: "Pas pour l'instant. Écolio s'utilise directement dans le navigateur et s'adapte aux téléphones, aux tablettes et aux ordinateurs. Il n'y a rien à installer.",
    keywords: ['application mobile', 'appli', 'app', 'play store', 'playstore', 'app store', 'android', 'iphone', 'telecharger', 'installer'],
  },
  {
    question: 'Comment ajouter un élève ?',
    answer: "Connectez-vous, ouvrez le menu Élèves, puis cliquez sur « Ajouter un élève ». Renseignez son identité, sa classe et les coordonnées d'un parent. Le compte du parent est alors créé, et ses identifiants s'affichent pour que vous puissiez les lui transmettre.",
    keywords: ['ajouter un eleve', 'ajouter des eleves', 'ajouter les eleves', 'enregistrer un eleve', 'inscrire un eleve', 'inscrire les eleves', 'nouvel eleve', 'creer un eleve'],
  },
  {
    question: 'Puis-je importer mes élèves depuis Excel ?',
    answer: "L'import automatique depuis un fichier Excel n'est pas encore disponible : les élèves s'ajoutent depuis le menu Élèves. En revanche, la liste des élèves et les factures peuvent être exportées vers Excel.",
    keywords: ['importer', 'import', 'importation', 'importer mes eleves', 'importer les eleves', 'importer des eleves', 'depuis excel', 'charger un fichier', 'fichier excel'],
  },
  {
    question: "Combien d'élèves puis-je gérer ?",
    answer: "Il n'y a pas de limite. Le même abonnement couvre tous vos élèves, toutes vos classes et tout votre personnel.",
    keywords: ['limite', 'nombre d eleves', 'combien d eleves', 'maximum', 'beaucoup d eleves'],
  },
  {
    question: 'Comment inscrire mon école ?',
    answer: "Cliquez sur « Inscrire votre école ». Renseignez le nom de l'école, puis vos informations de directeur, votre email et un mot de passe. Votre essai gratuit de trente jours commence aussitôt, sans aucun paiement à l'avance.",
    keywords: ['inscrire mon ecole', 'inscrire notre ecole', 'inscrire une ecole', 'inscription de mon ecole', 'inscription de l ecole', 'creer un compte', 's inscrire', 'ouvrir un compte'],
  },
  {
    question: "J'ai oublié mon mot de passe",
    answer: "Sur la page de connexion, cliquez sur « Mot de passe oublié ? », puis saisissez votre email et le numéro de téléphone enregistré sur votre compte. Un mot de passe temporaire vous est alors donné. Si cela ne fonctionne pas, contactez l'administrateur de votre école.",
    keywords: ['mot de passe oublie', 'oublie mon mot de passe', 'oublie', 'reinitialiser', 'perdu mon mot de passe', 'connexion impossible'],
  },
  {
    question: 'Comment les parents paient-ils la scolarité ?',
    answer: "L'école enregistre chaque paiement de scolarité avec son mode : espèces, Orange Money, MTN Money, Wave ou Moov Money. Le parent reçoit une notification dès que le paiement est confirmé.",
    keywords: ['orange money', 'mtn', 'moov', 'mobile money', 'mode de paiement', 'moyen de paiement', 'payer la scolarite', 'payer les frais', 'especes'],
  },
  {
    question: 'Comment contacter Écolio ?',
    answer: "Vous pouvez joindre l'équipe Écolio par email à oliviernbia@gmail.com, par téléphone au +225 05 54 18 33 78, ou via le formulaire de la page Contact.",
    keywords: ['contact', 'contacter', 'support', 'aide', 'assistance', 'joindre', 'whatsapp', 'appeler', 'parler a quelqu un'],
  },
  {
    question: 'Mon enfant est malade',
    answer: "Je ne peux pas donner d'avis médical : contactez directement l'école de votre enfant ou un professionnel de santé. Pour information, l'infirmerie de l'école peut enregistrer les visites dans Écolio, et les parents en sont alors prévenus automatiquement.",
    keywords: ['malade', 'blesse', 'blessure', 'fievre', 'urgence', 'medecin', 'docteur'],
  },
]

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

export const OFF_TOPIC_ANSWER =
  "Je suis l'assistante d'Écolio : je réponds uniquement aux questions sur l'application, comme les élèves, les notes, les présences, les finances ou les tarifs. Pour toute autre demande, écrivez-nous depuis la page Contact."

// Mots signalant une question hors sujet : ils évitent qu'un mot-clé isolé (« acheter un livre »)
// déclenche une réponse sans rapport.
const OFF_TOPIC_HINTS = [
  'meteo', 'temps qu il fait', 'president', 'politique', 'blague', 'foot', 'football', 'match',
  'recette', 'cuisine', 'film', 'musique', 'chanson', 'acheter', 'vendre', 'bitcoin', 'jeu', 'jeux',
]

export interface GuideAnswer {
  title: string
  text: string
  // Index du chapitre de la présentation correspondant, null pour une FAQ ou un hors-sujet.
  chapterIndex: number | null
}

// Les expressions de plusieurs mots pèsent plus lourd qu'un mot isolé.
const score = (q: string, keywords: string[]) =>
  keywords.reduce((acc, k) => acc + (q.includes(` ${k} `) ? k.split(' ').length : 0), 0)

// Répond à une question libre : FAQ d'abord (plus précise, gagne à égalité), puis chapitres.
export function findAnswer(question: string): GuideAnswer {
  const q = ` ${normalize(question)} `
  let best: GuideAnswer | null = null
  let bestScore = 0
  for (const f of GUIDE_FAQ) {
    const s = score(q, f.keywords)
    if (s > bestScore) { best = { title: f.question, text: f.answer, chapterIndex: null }; bestScore = s }
  }
  GUIDE_CHAPTERS.forEach((c, i) => {
    const s = score(q, c.keywords)
    if (s > bestScore) { best = { title: c.title, text: c.text, chapterIndex: i }; bestScore = s }
  })
  const offTopic = OFF_TOPIC_HINTS.some(h => q.includes(` ${h} `))
  if (!best || (offTopic && bestScore <= 1)) return { title: 'Hors sujet', text: OFF_TOPIC_ANSWER, chapterIndex: null }
  return best
}
