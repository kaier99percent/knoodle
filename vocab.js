/* ==========================================================================
   Knoodle — vocab.js
   ALL vocabulary lives in this one file. It is only downloaded when someone
   actually opens the Languages tab / starts a flashcard session, so it never
   slows down the rest of the app.

   HOW TO ADD WORDS
   ----------------
   Every word is one row:
     [ "french", "english", "example sentence (French)", "example (English)", {optional} ]

   • "english" can hold several accepted answers separated by " / ".
     The FIRST one is the main one shown when the learner must produce French,
     so keep the first one unique inside the deck.
     Text in (brackets) is optional when the learner types: "to know (a fact)"
     accepts both "to know" and "to know a fact".
   • Nouns: always include the article  ->  "le chat", "la maison", "l'eau".
     The cards then train gender and colour-code it (blue = masculine,
     coral = feminine). For nouns starting with l' add  g: "m"  or  g: "f".
   • Optional {object} at the end of a row:
       note:   "a tip or a trap shown on the card"
       cloze:  "mange"   exact text in the example sentence to blank out
                         (needed for conjugated verbs / agreeing adjectives;
                          for everything else it is found automatically)
       pos:    "p"       force a type: n (noun) v (verb) a (adjective) p (phrase/other)
       g:      "m" | "f" gender for nouns that start with l'
       altFr:  ["..."]   extra French answers that should also be accepted
       id:     "custom"  only if you ever need to fix a word's identity (see below)

   HOW TO ADD A SECTION (= a "tab"/topic the learner can pick)
   ------------------------------------------------------------
   Add another { id, title, blurb, pos, words: [ ... ] } object to `sections`.
   • pos is the default type for the section (v = verbs, a = adjectives, p = other).
   • flag: "trap" shows a "Watch out" badge on every card in the section.

   HOW TO ADD A NEW LANGUAGE
   -------------------------
   Copy the whole  D["fr-en"] = { ... }  block below, change the id
   (e.g. "es-en"), name, from, speech ("es-ES") and fill in the sections.
   The Languages tab shows a deck switcher as soon as there is more than one.

   IMPORTANT — progress is stored per word id.
   The id is made from the section id + the French text. If you later FIX A
   TYPO in the French, give the word  id: "section:old-spelling"  in its
   options, otherwise learners lose their progress on that word.
   ========================================================================== */

(function () {
  var D = (window.KNOODLE_VOCAB = window.KNOODLE_VOCAB || {});

  D["fr-en"] = {
    id: "fr-en",
    name: "French → English",
    from: "French",
    to: "English",
    speech: "fr-FR",
    version: 1,

    sections: [

      /* ---------------------------------------------------------------- */
      {
        id: "greetings",
        title: "Greetings & politeness",
        blurb: "The first things you say to anyone.",
        pos: "p",
        words: [
          ["bonjour", "hello / good morning", "Bonjour, comment allez-vous ?", "Hello, how are you?"],
          ["bonsoir", "good evening", "Bonsoir, madame.", "Good evening, madam."],
          ["salut", "hi / hey", "Salut, ça va ?", "Hi, how's it going?", { note: "Informal. Friends also say it when leaving, like “bye”." }],
          ["au revoir", "goodbye", "Au revoir et à demain !", "Goodbye and see you tomorrow!"],
          ["à bientôt", "see you soon", "À bientôt, j'espère !", "See you soon, I hope!"],
          ["merci", "thank you / thanks", "Merci pour ton aide.", "Thank you for your help."],
          ["s'il vous plaît", "please", "Un café, s'il vous plaît.", "A coffee, please.", { note: "With friends and family: s'il te plaît." }],
          ["de rien", "you're welcome / it's nothing", "— Merci ! — De rien.", "“Thanks!” “You're welcome.”"],
          ["excusez-moi", "excuse me", "Excusez-moi, où est la gare ?", "Excuse me, where is the station?"],
          ["pardon", "pardon me / sorry", "Pardon, je n'ai pas fait attention.", "Sorry, I wasn't paying attention.", { note: "Use it when you bump into someone or didn't hear." }],
          ["désolé", "sorry", "Je suis désolé pour le retard.", "I'm sorry for the delay.", { note: "A woman says désolée (same sound)." }],
          ["oui", "yes", "Oui, je veux bien.", "Yes, I'd love to."],
          ["non", "no", "Non, merci.", "No, thank you."],
          ["ça va ?", "how are you? / how's it going?", "Salut Marie, ça va ?", "Hi Marie, how are you?", { note: "Typical answer: ça va bien, merci." }],
          ["je m'appelle", "my name is / I'm called", "Je m'appelle Léa.", "My name is Léa.", { note: "Literally “I call myself”." }],
          ["enchanté", "nice to meet you / pleased to meet you", "Enchanté, je suis Paul.", "Nice to meet you, I'm Paul.", { note: "A woman says enchantée (same sound)." }],
          ["bienvenue", "welcome", "Bienvenue chez nous !", "Welcome to our home!"],
          ["bonne nuit", "good night", "Bonne nuit, fais de beaux rêves.", "Good night, sweet dreams."],
          ["bon appétit", "enjoy your meal", "Bon appétit à tous !", "Enjoy your meal, everyone!"],
          ["je ne comprends pas", "I don't understand", "Désolé, je ne comprends pas.", "Sorry, I don't understand."],
          ["parlez-vous anglais ?", "do you speak English?", "Excusez-moi, parlez-vous anglais ?", "Excuse me, do you speak English?"]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "numbers-time",
        title: "Numbers & time",
        blurb: "Counting, days and how often things happen.",
        pos: "p",
        words: [
          ["un", "one", "J'ai un frère et une sœur.", "I have a brother and a sister."],
          ["deux", "two", "Il y a deux chats dans le jardin.", "There are two cats in the garden."],
          ["trois", "three", "Je voudrais trois croissants.", "I'd like three croissants."],
          ["cinq", "five", "Le train part dans cinq minutes.", "The train leaves in five minutes."],
          ["dix", "ten", "Il est dix heures du matin.", "It is ten o'clock in the morning."],
          ["vingt", "twenty", "Elle a vingt ans.", "She is twenty years old."],
          ["cent", "one hundred / a hundred", "Ça coûte cent euros.", "It costs a hundred euros."],
          ["mille", "one thousand / a thousand", "Ce livre a mille pages.", "This book has a thousand pages."],
          ["aujourd'hui", "today", "Aujourd'hui, il fait beau.", "Today the weather is nice."],
          ["demain", "tomorrow", "Je pars demain matin.", "I'm leaving tomorrow morning."],
          ["hier", "yesterday", "Hier, j'ai mangé une pizza.", "Yesterday I ate a pizza."],
          ["maintenant", "now", "Je dois partir maintenant.", "I have to leave now."],
          ["toujours", "always", "Il est toujours en retard.", "He is always late.", { note: "Can also mean “still”." }],
          ["souvent", "often", "Nous mangeons souvent ici.", "We often eat here."],
          ["jamais", "never", "Je ne mange jamais de viande.", "I never eat meat.", { note: "Works with ne: je ne … jamais." }],
          ["le matin", "morning", "Je bois du café le matin.", "I drink coffee in the morning."],
          ["le soir", "evening", "Le soir, nous regardons un film.", "In the evening we watch a film."],
          ["la semaine", "week", "La semaine prochaine, je pars en vacances.", "Next week I'm going on holiday."],
          ["le mois", "month", "Le mois dernier, il a plu tous les jours.", "Last month it rained every day."],
          ["l'année", "year", "Cette année, j'apprends le français.", "This year I'm learning French.", { g: "f" }],
          ["l'heure", "hour", "À quelle heure part le train ?", "At what time does the train leave?", { g: "f", note: "Also “time of day”: quelle heure est-il ? = what time is it?" }]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "food",
        title: "Food & drink",
        blurb: "Ordering, shopping and eating.",
        pos: "p",
        words: [
          ["le pain", "bread", "Je vais acheter du pain à la boulangerie.", "I'm going to buy bread at the bakery."],
          ["le fromage", "cheese", "Le fromage est très bon avec du pain.", "The cheese is very good with bread."],
          ["l'eau", "water", "Je voudrais un verre d'eau, s'il vous plaît.", "I'd like a glass of water, please.", { g: "f" }],
          ["le lait", "milk", "Elle met du lait dans son café.", "She puts milk in her coffee."],
          ["le café", "coffee", "Un café et un croissant, s'il vous plaît.", "A coffee and a croissant, please."],
          ["le vin", "wine", "Mon père aime le vin rouge.", "My father likes red wine."],
          ["la pomme", "apple", "Je mange une pomme chaque matin.", "I eat an apple every morning."],
          ["le poulet", "chicken", "Ce soir, nous mangeons du poulet avec du riz.", "Tonight we're eating chicken with rice."],
          ["le poisson", "fish", "Elle ne mange pas de poisson.", "She doesn't eat fish."],
          ["la viande", "meat", "Il préfère la viande au poisson.", "He prefers meat to fish."],
          ["le riz", "rice", "Le poulet est servi avec du riz.", "The chicken is served with rice."],
          ["les légumes", "vegetables", "Mange tes légumes !", "Eat your vegetables!", { note: "Always plural in French." }],
          ["le fruit", "fruit", "Je prends un fruit pour le goûter.", "I have a piece of fruit for my snack."],
          ["l'œuf", "egg", "Je mange un œuf au petit déjeuner.", "I eat an egg for breakfast.", { g: "m", note: "Typing œ is awkward — “oe” is accepted." }],
          ["le beurre", "butter", "Je mets du beurre sur mon pain.", "I put butter on my bread."],
          ["le sucre", "sugar", "Tu veux du sucre dans ton thé ?", "Do you want sugar in your tea?"],
          ["le sel", "salt", "Passe-moi le sel, s'il te plaît.", "Pass me the salt, please."],
          ["la soupe", "soup", "La soupe est encore chaude.", "The soup is still hot."],
          ["le gâteau", "cake", "Elle a fait un gâteau pour ton anniversaire.", "She made a cake for your birthday."],
          ["le petit déjeuner", "breakfast", "Le petit déjeuner est à huit heures.", "Breakfast is at eight o'clock."],
          ["le déjeuner", "lunch", "Nous prenons le déjeuner à midi.", "We have lunch at noon."],
          ["le dîner", "dinner", "Qu'est-ce qu'on mange pour le dîner ?", "What are we eating for dinner?"],
          ["l'addition", "the bill", "L'addition, s'il vous plaît.", "The bill, please.", { g: "f" }],
          ["la carte", "menu / card / map", "Pouvez-vous m'apporter la carte ?", "Could you bring me the menu?", { note: "In a restaurant la carte is the full menu; le menu is a fixed-price meal." }],
          ["le repas", "meal", "Le repas est prêt !", "The meal is ready!"]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "family-people",
        title: "Family & people",
        blurb: "Who's who.",
        pos: "p",
        words: [
          ["la famille", "family", "Ma famille habite à Lyon.", "My family lives in Lyon."],
          ["la mère", "mother", "Ma mère travaille à l'hôpital.", "My mother works at the hospital."],
          ["le père", "father", "Mon père cuisine très bien.", "My father cooks very well."],
          ["le frère", "brother", "J'ai un frère et deux sœurs.", "I have a brother and two sisters."],
          ["la sœur", "sister", "Ma sœur étudie à Paris.", "My sister studies in Paris."],
          ["le fils", "son", "Leur fils a dix ans.", "Their son is ten years old.", { note: "The s is pronounced: “feess”." }],
          ["la fille", "daughter / girl", "Sa fille joue au football.", "His daughter plays football."],
          ["le grand-père", "grandfather", "Mon grand-père raconte de belles histoires.", "My grandfather tells lovely stories."],
          ["la grand-mère", "grandmother", "Ma grand-mère fait un gâteau délicieux.", "My grandmother makes a delicious cake."],
          ["un ami", "friend (male)", "C'est un ami d'enfance.", "He's a childhood friend."],
          ["une amie", "friend (female)", "Je dîne avec une amie ce soir.", "I'm having dinner with a friend tonight.", { note: "Same sound as un ami — only the spelling shows the gender." }],
          ["le mari", "husband", "Son mari est professeur.", "Her husband is a teacher."],
          ["la femme", "woman", "Cette femme est médecin.", "This woman is a doctor.", { note: "Also means “wife”: ma femme = my wife." }],
          ["l'enfant", "child", "L'enfant dort dans sa chambre.", "The child is sleeping in his room.", { g: "m", note: "Masculine or feminine depending on the child — the word doesn't change." }],
          ["le garçon", "boy", "Le garçon joue dans le jardin.", "The boy is playing in the garden."],
          ["l'homme", "man", "L'homme lit le journal.", "The man is reading the newspaper.", { g: "m" }],
          ["les parents", "parents", "Mes parents habitent près de la mer.", "My parents live near the sea.", { note: "Careful: les parents = mum and dad, not “relatives”." }],
          ["le voisin", "neighbour", "Mon voisin a un chien.", "My neighbour has a dog."],
          ["le collègue", "colleague", "Mon collègue arrive à neuf heures.", "My colleague arrives at nine."],
          ["le médecin", "doctor", "Le médecin est très gentil.", "The doctor is very kind."]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "town-travel",
        title: "Town & travel",
        blurb: "Getting around and finding your way.",
        pos: "p",
        words: [
          ["la ville", "city / town", "J'habite dans une petite ville.", "I live in a small town."],
          ["la rue", "street", "Il y a beaucoup de monde dans la rue.", "There are lots of people in the street."],
          ["la gare", "train station", "Le train part de la gare à midi.", "The train leaves from the station at noon."],
          ["l'aéroport", "airport", "L'aéroport est à vingt kilomètres.", "The airport is twenty kilometres away.", { g: "m" }],
          ["le train", "train", "Je prends le train tous les matins.", "I take the train every morning."],
          ["le bus", "bus", "Le bus est en retard aujourd'hui.", "The bus is late today."],
          ["la voiture", "car", "Notre voiture est au garage.", "Our car is at the garage."],
          ["le vélo", "bicycle", "Il va au travail à vélo.", "He goes to work by bike."],
          ["le billet", "ticket", "J'ai acheté un billet pour Paris.", "I bought a ticket to Paris."],
          ["la valise", "suitcase", "Ma valise est trop lourde.", "My suitcase is too heavy."],
          ["l'hôtel", "hotel", "L'hôtel est près de la plage.", "The hotel is near the beach.", { g: "m" }],
          ["la plage", "beach", "Nous passons l'été à la plage.", "We spend the summer at the beach."],
          ["la banque", "bank", "La banque ferme à cinq heures.", "The bank closes at five."],
          ["le magasin", "shop / store", "Ce magasin est ouvert le dimanche.", "This shop is open on Sundays."],
          ["le marché", "market", "Je fais mes courses au marché.", "I do my shopping at the market."],
          ["la boulangerie", "bakery", "La boulangerie vend de très bonnes baguettes.", "The bakery sells very good baguettes."],
          ["la pharmacie", "pharmacy", "Il y a une pharmacie en face de la gare.", "There's a pharmacy opposite the station."],
          ["l'hôpital", "hospital", "Elle travaille à l'hôpital.", "She works at the hospital.", { g: "m" }],
          ["à gauche", "to the left / on the left", "Tournez à gauche après la banque.", "Turn left after the bank.", { pos: "p" }],
          ["à droite", "to the right / on the right", "La gare est à droite.", "The station is on the right.", { pos: "p" }],
          ["tout droit", "straight ahead", "Allez tout droit jusqu'au marché.", "Go straight ahead to the market.", { pos: "p" }]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "verbs",
        title: "Everyday verbs",
        blurb: "The verbs you'll use in almost every conversation.",
        pos: "v",
        words: [
          ["être", "to be", "Nous sommes contents de te voir.", "We are glad to see you.", { cloze: "sommes", note: "Irregular: je suis, tu es, il est, nous sommes." }],
          ["avoir", "to have", "J'ai deux frères.", "I have two brothers.", { cloze: "ai", note: "Irregular: j'ai, tu as, il a, nous avons." }],
          ["aller", "to go", "Nous allons au marché samedi.", "We're going to the market on Saturday.", { cloze: "allons" }],
          ["faire", "to do / to make", "Qu'est-ce que tu fais ce soir ?", "What are you doing tonight?", { cloze: "fais" }],
          ["manger", "to eat", "Nous mangeons à midi.", "We eat at noon.", { cloze: "mangeons", note: "With nous the g gets an e: mangeons." }],
          ["boire", "to drink", "Il boit beaucoup d'eau.", "He drinks a lot of water.", { cloze: "boit" }],
          ["parler", "to speak", "Elle parle trois langues.", "She speaks three languages.", { cloze: "parle" }],
          ["vouloir", "to want", "Je veux un café, s'il vous plaît.", "I want a coffee, please.", { cloze: "veux", note: "Politer: je voudrais = I would like." }],
          ["pouvoir", "to be able to / can", "Je peux t'aider ?", "Can I help you?", { cloze: "peux" }],
          ["savoir", "to know (a fact)", "Je ne sais pas.", "I don't know.", { cloze: "sais", note: "savoir = facts and skills; connaître = people and places." }],
          ["connaître", "to know (a person or place)", "Tu connais mon frère ?", "Do you know my brother?", { cloze: "connais" }],
          ["voir", "to see", "Je vois la mer d'ici.", "I can see the sea from here.", { cloze: "vois" }],
          ["prendre", "to take", "Je prends le bus tous les jours.", "I take the bus every day.", { cloze: "prends" }],
          ["donner", "to give", "Il donne un cadeau à sa mère.", "He gives a present to his mother.", { cloze: "donne" }],
          ["venir", "to come", "Tu viens avec nous ?", "Are you coming with us?", { cloze: "viens" }],
          ["partir", "to leave", "Le train part à huit heures.", "The train leaves at eight o'clock.", { cloze: "part" }],
          ["dire", "to say / to tell", "Qu'est-ce qu'il dit ?", "What is he saying?", { cloze: "dit" }],
          ["aimer", "to like / to love", "J'aime le fromage.", "I like cheese.", { cloze: "aime" }],
          ["travailler", "to work", "Il travaille dans une banque.", "He works in a bank.", { cloze: "travaille" }],
          ["habiter", "to live (somewhere)", "J'habite à Berlin.", "I live in Berlin.", { cloze: "habite" }],
          ["acheter", "to buy", "Elle achète du pain tous les matins.", "She buys bread every morning.", { cloze: "achète" }],
          ["comprendre", "to understand", "Je comprends un peu le français.", "I understand a little French.", { cloze: "comprends" }],
          ["apprendre", "to learn", "J'apprends le français depuis un an.", "I've been learning French for a year.", { cloze: "apprends" }],
          ["chercher", "to look for / to search for", "Je cherche mes clés.", "I'm looking for my keys.", { cloze: "cherche", note: "No extra word for “for” — chercher already includes it." }],
          ["trouver", "to find", "Je ne trouve pas mon téléphone.", "I can't find my phone.", { cloze: "trouve" }]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "describing",
        title: "Describing things",
        blurb: "Adjectives for people, places and how you feel.",
        pos: "a",
        words: [
          ["grand", "big / tall", "Mon frère est très grand.", "My brother is very tall.", { note: "Feminine: grande." }],
          ["petit", "small / short", "Elle habite dans un petit appartement.", "She lives in a small flat.", { note: "Feminine: petite." }],
          ["bon", "good", "Ce gâteau est vraiment bon.", "This cake is really good.", { note: "Feminine: bonne." }],
          ["mauvais", "bad", "Il fait mauvais aujourd'hui.", "The weather is bad today.", { note: "Feminine: mauvaise." }],
          ["beau", "beautiful / handsome", "Quel beau jardin !", "What a beautiful garden!", { cloze: "beau", note: "Feminine: belle." }],
          ["nouveau", "new", "J'ai un nouveau téléphone.", "I have a new phone.", { note: "Feminine: nouvelle." }],
          ["vieux", "old", "C'est une vieille maison.", "It's an old house.", { cloze: "vieille", note: "Feminine: vieille." }],
          ["jeune", "young", "Ma sœur est plus jeune que moi.", "My sister is younger than me."],
          ["chaud", "hot / warm", "Le café est trop chaud.", "The coffee is too hot.", { note: "Feminine: chaude." }],
          ["froid", "cold", "Il fait froid en hiver.", "It's cold in winter."],
          ["facile", "easy", "Cet exercice est facile.", "This exercise is easy."],
          ["difficile", "difficult / hard", "Le français n'est pas difficile.", "French isn't difficult."],
          ["heureux", "happy", "Elle est heureuse ce soir.", "She is happy tonight.", { cloze: "heureuse", note: "Feminine: heureuse." }],
          ["triste", "sad", "Pourquoi es-tu triste ?", "Why are you sad?"],
          ["fatigué", "tired", "Je suis très fatigué ce soir.", "I'm very tired tonight.", { note: "Feminine: fatiguée (same sound)." }],
          ["cher", "expensive", "Ce restaurant est trop cher.", "This restaurant is too expensive.", { note: "Feminine: chère." }],
          ["lent", "slow", "Le train est lent.", "The train is slow.", { note: "Feminine: lente." }],
          ["ouvert", "open", "Le magasin est ouvert jusqu'à huit heures.", "The shop is open until eight."],
          ["fermé", "closed", "La banque est fermée le dimanche.", "The bank is closed on Sundays.", { cloze: "fermée" }],
          ["vrai", "true", "Ce n'est pas vrai !", "That's not true!"]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "home-daily",
        title: "Home & daily life",
        blurb: "The things around you.",
        pos: "p",
        words: [
          ["la maison", "house", "Notre maison a un grand jardin.", "Our house has a big garden."],
          ["l'appartement", "apartment / flat", "Leur appartement est au troisième étage.", "Their flat is on the third floor.", { g: "m" }],
          ["la chambre", "bedroom", "Ma chambre est au premier étage.", "My bedroom is on the first floor."],
          ["la cuisine", "kitchen", "On mange dans la cuisine.", "We eat in the kitchen.", { note: "Also “cooking”: faire la cuisine." }],
          ["la salle de bains", "bathroom", "La salle de bains est à côté de la chambre.", "The bathroom is next to the bedroom."],
          ["la porte", "door", "Peux-tu fermer la porte ?", "Can you close the door?"],
          ["la fenêtre", "window", "J'ouvre la fenêtre.", "I'm opening the window."],
          ["la table", "table", "Le dîner est sur la table.", "Dinner is on the table."],
          ["la chaise", "chair", "Il y a quatre chaises autour de la table.", "There are four chairs around the table.", { cloze: "chaises" }],
          ["le lit", "bed", "Le chat dort sur mon lit.", "The cat sleeps on my bed."],
          ["la clé", "key", "Je ne trouve pas ma clé.", "I can't find my key."],
          ["le téléphone", "phone", "Mon téléphone est sur la table.", "My phone is on the table."],
          ["l'ordinateur", "computer", "Il travaille sur son ordinateur.", "He's working on his computer.", { g: "m" }],
          ["le livre", "book", "Je lis un livre intéressant.", "I'm reading an interesting book."],
          ["le travail", "work / job", "Le travail commence à neuf heures.", "Work starts at nine."],
          ["l'école", "school", "Les enfants vont à l'école à pied.", "The children walk to school.", { g: "f" }],
          ["le jardin", "garden", "Il y a des fleurs dans le jardin.", "There are flowers in the garden."],
          ["le chien", "dog", "Mon chien adore la plage.", "My dog loves the beach."],
          ["le chat", "cat", "Le chat dort sur le canapé.", "The cat is sleeping on the sofa."]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "little-words",
        title: "Little words & questions",
        blurb: "Small words that hold every sentence together.",
        pos: "p",
        words: [
          ["et", "and", "Du pain et du fromage, s'il vous plaît.", "Bread and cheese, please."],
          ["ou", "or", "Tu préfères le thé ou le café ?", "Do you prefer tea or coffee?", { note: "Not to be mixed up with où (where)." }],
          ["mais", "but", "Je veux venir, mais je suis fatigué.", "I want to come, but I'm tired."],
          ["parce que", "because", "Je reste à la maison parce que je suis fatigué.", "I'm staying at home because I'm tired."],
          ["avec", "with", "Je vais au cinéma avec une amie.", "I'm going to the cinema with a friend."],
          ["sans", "without", "Un café sans sucre, s'il vous plaît.", "A coffee without sugar, please."],
          ["pour", "for", "Ce cadeau est pour toi.", "This present is for you."],
          ["dans", "in / inside", "Les clés sont dans mon sac.", "The keys are in my bag."],
          ["sur", "on", "Le livre est sur la table.", "The book is on the table."],
          ["sous", "under", "Le chat est sous le lit.", "The cat is under the bed."],
          ["chez", "at the home of", "Ce soir, je dîne chez mes parents.", "Tonight I'm having dinner at my parents' place.", { note: "chez moi = at my place, chez le médecin = at the doctor's." }],
          ["très", "very", "Il est très gentil.", "He is very kind."],
          ["trop", "too much / too", "Il y a trop de bruit.", "There's too much noise."],
          ["beaucoup", "a lot", "Elle lit beaucoup de livres.", "She reads a lot of books."],
          ["un peu", "a little", "Je parle un peu français.", "I speak a little French.", { pos: "p" }],
          ["aussi", "also / too", "Moi aussi, j'aime le fromage.", "I like cheese too."],
          ["déjà", "already", "Tu as déjà mangé ?", "Have you eaten already?"],
          ["où", "where", "Où est la gare ?", "Where is the station?", { note: "The accent separates it from ou (or)." }],
          ["quand", "when", "Quand part le train ?", "When does the train leave?"],
          ["pourquoi", "why", "Pourquoi es-tu en retard ?", "Why are you late?"],
          ["comment", "how", "Comment tu t'appelles ?", "What's your name? (lit. how are you called?)"],
          ["qui", "who", "Qui est cette femme ?", "Who is this woman?"],
          ["combien", "how much / how many", "Combien ça coûte ?", "How much does it cost?"]
        ]
      },

      /* ---------------------------------------------------------------- */
      {
        id: "false-friends",
        title: "Watch out: false friends",
        blurb: "Words that look English and aren't. These are the ones that trip learners up.",
        flag: "trap",
        pos: "p",
        words: [
          ["la librairie", "bookshop", "La librairie ouvre à dix heures.", "The bookshop opens at ten.", { note: "NOT “library” — that's la bibliothèque." }],
          ["la bibliothèque", "library", "Je travaille à la bibliothèque.", "I work at the library.", { note: "A librairie sells books, a bibliothèque lends them." }],
          ["actuellement", "currently / at the moment", "Actuellement, j'habite à Lyon.", "At the moment I live in Lyon.", { note: "NOT “actually” — that's en fait." }],
          ["en fait", "actually / in fact", "En fait, je n'ai pas faim.", "Actually, I'm not hungry."],
          ["attendre", "to wait (for)", "J'attends le bus depuis dix minutes.", "I've been waiting for the bus for ten minutes.", { cloze: "attends", note: "NOT “to attend”. And no word for “for”: j'attends le bus." }],
          ["assister à", "to attend", "Nous assistons à un concert ce soir.", "We're attending a concert tonight.", { cloze: "assistons", note: "NOT “to assist” (that's aider)." }],
          ["la chance", "luck", "Bonne chance pour demain !", "Good luck for tomorrow!", { note: "Mostly means luck. j'ai de la chance = I'm lucky." }],
          ["le collège", "middle school", "Mon frère va au collège.", "My brother goes to middle school.", { note: "NOT “college” — that's l'université." }],
          ["rester", "to stay", "Je reste à la maison ce soir.", "I'm staying at home tonight.", { cloze: "reste", note: "NOT “to rest” — that's se reposer." }],
          ["la monnaie", "small change", "Avez-vous de la monnaie ?", "Do you have any change?"],
          ["éventuellement", "possibly / if need be", "On peut éventuellement partir plus tôt.", "We could possibly leave earlier.", { note: "NOT “eventually” — that's finalement." }],
          ["blesser", "to hurt / to injure", "Attention, tu vas te blesser !", "Careful, you'll hurt yourself!", { note: "NOT “to bless”." }],
          ["sensible", "sensitive", "Elle est très sensible.", "She is very sensitive.", { note: "NOT “sensible” — that's raisonnable." }],
          ["la lecture", "reading", "La lecture est mon passe-temps préféré.", "Reading is my favourite pastime.", { note: "NOT “lecture” — that's le cours / la conférence." }],
          ["la location", "rental", "La location de la voiture coûte cher.", "The car rental is expensive."],
          ["réussir", "to succeed / to pass (an exam)", "J'ai réussi mon examen !", "I passed my exam!", { cloze: "réussi", note: "passer un examen = to TAKE an exam. réussir = to pass it." }]
        ]
      }

    ]
  };
})();
