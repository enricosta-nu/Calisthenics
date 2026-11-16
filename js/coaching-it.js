// Italian version of coaching.js: come si fa, come non farsi male, come trarne il massimo.

const c = (how, safe, most) => ({ how, safe, most });

export const COACHING_IT = {
  // ---------- dorso ----------
  'pull-up': c(
    ['Appenditi alla sbarra, mani poco più larghe delle spalle, palmi in avanti.', 'Porta le scapole in basso e indietro, poi tira finché il mento supera la sbarra.', 'Scendi con controllo fino a braccia distese.'],
    ['Non lasciarti cadere in basso: una sospensione molle e a strappi affatica spalle e gomiti.', 'Tieni le spalle lontane dalle orecchie per tutta la ripetizione.', 'Niente slanci o kipping finché le trazioni rigorose non sono solide.'],
    ['Escursione completa: braccia distese in basso, mento sopra la sbarra in alto.', 'Scendi in 2–3 secondi: la discesa costruisce forza quanto la salita.', 'Stringi i glutei e tieni le gambe unite, così il corpo non oscilla.'],
  ),
  'chin-up': c(
    ['Appenditi coi palmi verso di te, mani alla larghezza delle spalle.', 'Porta il petto verso la sbarra finché il mento la supera.', 'Scendi lentamente fino a braccia distese.'],
    ['Scalda prima gomiti e polsi: la presa supina carica il tendine del bicipite.', 'Non iperestendere i gomiti in basso: distesi, non bloccati.', 'Fermati se senti un dolore acuto all\'interno del gomito.'],
    ['Pensa "gomiti verso le tasche dietro" per usare i dorsali, non solo le braccia.', 'Pausa di un secondo col mento sopra la sbarra.', 'Costole basse: non inarcarti per raggiungere la sbarra.'],
  ),
  'pull-up-iso': c(
    ['Sali in alto con un salto o una trazione: mento sopra la sbarra.', 'Resta lì, spalle basse, gomiti vicini al corpo.', 'Scendi lentamente allo scadere del tempo.'],
    ['Respira: non trattenere il fiato per tutta la tenuta.', 'Scendi con calma o appoggiati, non lasciarti cadere dall\'alto.', 'Collo lungo: non spingere il mento in avanti.'],
    ['Stringi forte la sbarra: una presa salda rende la tenuta più facile.', 'Porta il petto alla sbarra invece di appenderti solo col mento.', 'Quando diventa facile, prova le tenute a 90° e in basso.'],
  ),
  'chin-up-iso': c(
    ['Palmi verso di te, sali col mento sopra la sbarra.', 'Tieni, petto vicino alla sbarra, gomiti stretti.', 'Alla fine scendi lentamente.'],
    ['Scalda prima i gomiti.', 'Non far salire le spalle verso le orecchie.', 'Scendi con controllo, non lasciarti cadere.'],
    ['Corpo fermo e gambe unite.', 'Contrai bicipiti e schiena insieme.', 'Aggiungi qualche secondo alla volta.'],
  ),
  'scapular-pull': c(
    ['Appenditi a braccia distese.', 'Senza piegare i gomiti, porta le scapole in basso: il corpo sale di qualche centimetro.', 'Torna in sospensione con controllo.'],
    ['Braccia distese: il movimento è solo delle scapole.', 'Muoviti lentamente, senza rimbalzare in basso.', 'Fermati se senti un pizzicore davanti alla spalla.'],
    ['Pausa di un secondo in alto a ogni ripetizione.', 'È la prima parte di ogni trazione: allenala per trazioni più forti e sicure.', 'Pensa "spalle lontane dalle orecchie".'],
  ),
  'dead-hang': c(
    ['Afferra la sbarra alla larghezza delle spalle.', 'Appenditi a braccia distese, piedi staccati da terra.', 'Respira con calma e tieni.'],
    ['Se le spalle sono delicate, tienile leggermente attive, non del tutto abbandonate.', 'Scendi appoggiando i piedi, non lasciandoti cadere.', 'Magnesite o mani asciutte aiutano a non scivolare.'],
    ['Usala per allenare la presa: tieni un po\' di più ogni settimana.', 'Rilassa la parte bassa del corpo e lascia allungare la schiena.', 'Progredisci verso la sospensione a un braccio con l\'altro di supporto.'],
  ),
  'negative-pull-up': c(
    ['Sali in alto con un salto o un rialzo: mento sopra la sbarra.', 'Scendi più lentamente che puoi, 3–5 secondi.', 'Arrivato a braccia distese, appoggiati e ripeti.'],
    ['Controlla tutta la discesa: l\'ultimo tratto non deve diventare una caduta.', 'Spalle basse anche in fondo.', 'Sono faticose: poche ripetizioni, di qualità.'],
    ['Conta i secondi ad alta voce per tenere il ritmo lento.', 'Rallenta di più dove sei più debole.', 'Ottime per arrivare alla prima trazione.'],
  ),
  'archer-pull-up': c(
    ['Appenditi con presa larga.', 'Tira verso una mano mentre l\'altro braccio si distende lungo la sbarra.', 'Scendi, poi tira dall\'altro lato.'],
    ['Solo quando fai 10 o più trazioni rigorose.', 'Il braccio disteso resta morbido, non bloccato.', 'Fermati se il gomito del braccio disteso fa male.'],
    ['Scendi lentamente dal lato che lavora.', 'Bacino dritto: non ruotare.', 'È il passo verso la trazione a un braccio.'],
  ),
  australian: c(
    ['Sdraiati sotto una sbarra bassa, mani poco più larghe delle spalle.', 'Corpo dritto dai talloni alla testa, talloni a terra.', 'Porta il petto alla sbarra, poi scendi a braccia distese.'],
    ['Bacino alto: non cedere coi fianchi.', 'Non allungare il mento verso la sbarra: porta il petto.', 'Controlla che sbarra o anelli siano ben fissati prima di appenderti.'],
    ['Stringi le scapole in alto.', 'Più il corpo è orizzontale, più è difficile: piega le ginocchia per facilitare.', 'Pausa di un secondo in alto.'],
  ),
  'underhand-row': c(
    ['Sdraiati sotto una sbarra bassa, palmi verso di te.', 'Corpo dritto, talloni a terra.', 'Porta il petto alla sbarra, gomiti vicini al corpo.'],
    ['Scalda i gomiti: la presa supina carica i bicipiti.', 'Bacino alto e collo neutro.', 'Scendi fino in fondo, con controllo.'],
    ['Pausa in alto e contrai i bicipiti.', 'Avvicina i piedi per facilitare, allontanali per rendere più difficile.', 'Gomiti stretti per lavorare di più sui bicipiti.'],
  ),
  'biceps-curl': c(
    ['Sotto una sbarra bassa, presa supina, corpo dritto.', 'Piega solo i gomiti, portando la fronte verso la sbarra.', 'Distendi le braccia lentamente.'],
    ['Inizia col corpo abbastanza verticale: è più dura di quanto sembri.', 'Spalle ferme: si muovono solo i gomiti.', 'Fermati se fa male l\'articolazione del gomito (non il muscolo).'],
    ['Lento al ritorno.', 'Glutei contratti, così il corpo resta dritto.', 'Abbassa la sbarra o avvicina i piedi per renderlo più difficile.'],
  ),
  'australian-iso': c(
    ['Posizionati come per il rematore australiano.', 'Sali finché il petto è alla sbarra.', 'Tieni lì, corpo dritto.'],
    ['Continua a respirare.', 'Bacino alto, senza cedere.', 'Alla fine scendi lentamente.'],
    ['Stringi le scapole per tutto il tempo.', 'Tira la sbarra verso di te come se volessi piegarla.', 'Rendi il corpo più orizzontale per aumentare la difficoltà.'],
  ),
  'one-arm-hang-rotation': c(
    ['Appenditi alla sbarra con due mani, poi lascia una mano.', 'Ruota lentamente il corpo intorno al braccio appeso.', 'Riprendi la sbarra, cambia mano.'],
    ['Solo quando 30 secondi di sospensione a due braccia sono facili.', 'Spalla del braccio appeso attiva: non abbandonata.', 'Ruota lentamente, senza oscillare.'],
    ['Allena presa e controllo della spalla.', 'Corpo lungo e gambe unite.', 'Tieni la mano libera vicino alla sbarra in caso serva.'],
  ),
  'inverted-hang': c(
    ['Appeso alla sbarra, raccogli le ginocchia e rotola indietro finché il bacino è sopra la testa.', 'Distendi il corpo a testa in giù, braccia distese.', 'Torna giù allo stesso modo.'],
    ['Imparala prima su una sbarra bassa o agli anelli.', 'Non mollare la presa: la testa è vicina al pavimento.', 'Scendi lentamente; un po\' di capogiro all\'inizio è normale, fermati se è forte.'],
    ['Corpo dritto e punte tese.', 'Respira lentamente a testa in giù.', 'Tieni un po\' di più ogni seduta.'],
  ),
  'skin-the-cat': c(
    ['Dalla sospensione, raccogli le ginocchia e porta le gambe tra le braccia.', 'Continua a ruotare finché i piedi puntano in basso dietro di te.', 'Torna allo stesso modo.'],
    ['Vai solo fin dove le spalle lo permettono: non forzare mai l\'allungamento.', 'Usa una sbarra bassa o gli anelli, così i piedi toccano terra.', 'Muoviti lentamente, senza slanci.'],
    ['Ottimo lavoro di mobilità per le spalle.', 'Braccia distese per tutto il tempo.', 'Fai una pausa di un respiro nella posizione di allungamento.'],
  ),

  // ---------- petto ----------
  'push-up': c(
    ['Mani sotto le spalle, corpo dritto dai talloni alla testa.', 'Scendi finché il petto quasi tocca terra, gomiti a circa 45° dal corpo.', 'Spingi fino a braccia distese.'],
    ['Non far cedere né alzare il bacino: stringi glutei e addome.', 'Non aprire i gomiti di lato.', 'Se i polsi fanno male, usa i pugni, le maniglie o le parallettes.'],
    ['Escursione completa a ogni ripetizione: petto giù, braccia distese in alto.', 'In alto spingi via il pavimento per attivare il dentato.', 'Scendi in 2 secondi per più controllo.'],
  ),
  'incline-push-up': c(
    ['Mani su una panca, un rialzo o le parallettes, poco più larghe delle spalle.', 'Corpo dritto, porta il petto al bordo.', 'Spingi fino a braccia distese.'],
    ['Assicurati che l\'appoggio non scivoli.', 'Corpo dritto, bacino che non cede.', 'Gomiti a 45°, non aperti.'],
    ['Abbassa l\'appoggio man mano che diventi forte, fino al pavimento.', 'Tocca il bordo col petto a ogni ripetizione.', 'Lento in discesa.'],
  ),
  'wide-push-up': c(
    ['Mani più larghe delle spalle.', 'Corpo dritto, petto a terra.', 'Spingi in alto.'],
    ['Non esagerare con la larghezza: le spalle soffrono con le mani troppo aperte.', 'Gomiti piegati verso i piedi, non dritti di lato.', 'Fermati prima che le spalle diano fastidio in basso.'],
    ['Contrai il petto mentre spingi.', 'Mani leggermente ruotate verso l\'esterno sono più comode.', 'Pausa di un secondo in basso.'],
  ),
  'decline-push-up': c(
    ['Piedi su un rialzo o una panca, mani a terra.', 'Corpo dritto, porta testa e petto verso il pavimento.', 'Spingi in alto.'],
    ['Inizia con un rialzo basso.', 'Bacino in linea, né piegato né ceduto.', 'Scendi con controllo: c\'è più peso sulle braccia.'],
    ['Più alti i piedi, più lavorano parte alta del petto e spalle.', 'Collo neutro; guarda poco davanti alle mani.', 'Escursione completa a ogni ripetizione.'],
  ),
  'push-up-hold': c(
    ['Mettiti in fondo al piegamento, petto a 2 cm da terra.', 'Gomiti a 45°, corpo rigido.', 'Tieni.'],
    ['Respira.', 'Se le spalle fanno male, tieni un po\' più in alto.', 'Non far cedere il bacino.'],
    ['Contrai tutto: glutei, addome, gambe.', 'Ottimo per costruire forza nel punto più debole.', 'Aggiungi qualche secondo ogni settimana.'],
  ),
  dip: c(
    ['In appoggio sulle parallele, braccia distese.', 'Sbilanciati un po\' in avanti e scendi finché le spalle sono appena sotto i gomiti.', 'Spingi fino a braccia distese.'],
    ['All\'inizio non scendere troppo: affatica la parte anteriore delle spalle.', 'Spalle basse, lontane dalle orecchie.', 'Mai rimbalzare in basso.'],
    ['Busto in avanti per più petto, verticale per più tricipiti.', 'Distendi completamente in alto a ogni ripetizione.', 'Un elastico sotto le ginocchia aiuta i principianti.'],
  ),
  'archer-push-up': c(
    ['Mani molto larghe.', 'Sposta il corpo su una mano e scendi, mentre l\'altro braccio resta disteso.', 'Spingi in alto, poi dall\'altro lato.'],
    ['Solo quando 20 piegamenti ben fatti sono facili.', 'Il braccio disteso resta morbido, non bloccato.', 'Bacino dritto.'],
    ['Lento in discesa.', 'È il passo verso i piegamenti a un braccio.', 'Metti più peso sul braccio che lavora man mano che diventi forte.'],
  ),
  'hindu-push-up': c(
    ['Parti dal cane a testa in giù: bacino alto, braccia e gambe distese.', 'Scendi col petto in avanti, vicino al pavimento, fino al cane a testa in su.', 'Spingi il bacino indietro alla partenza.'],
    ['Movimento fluido, non forzare mai l\'inarcamento.', 'Nel cane a testa in su tieni le spalle lontane dalle orecchie.', 'Saltalo se la zona lombare fa male inarcandoti.'],
    ['Espira mentre passi in basso.', 'Ottimo per petto, spalle e mobilità della schiena insieme.', 'Rendi il movimento più lungo e fluido che puoi.'],
  ),
  'clap-push-up': c(
    ['Scendi in un piegamento.', 'Spingi in modo esplosivo così le mani si staccano; batti le mani.', 'Atterra con i gomiti morbidi e riparti subito.'],
    ['Solo con un piegamento solido e veloce.', 'Atterra a gomiti piegati, mai distesi.', 'Falli da riposato, non alla fine di una seduta dura.'],
    ['Qualità prima della quantità: smetti quando rallentano.', 'Inizia senza battuta: lascia solo staccare le mani.', 'Corpo rigido in volo.'],
  ),
  'ring-push-up': c(
    ['Anelli bassi, corpo dritto.', 'Porta il petto tra gli anelli, tenendoli vicini al corpo.', 'Spingi e ruota le mani verso l\'esterno in alto.'],
    ['Inizia con gli anelli più alti (inclinato) se traballano.', 'Non lasciare che gli anelli si allarghino.', 'Corpo dritto.'],
    ['La rotazione in alto allena gli stabilizzatori della spalla.', 'Abbassa gli anelli per aumentare la difficoltà.', 'Movimento lento: il controllo è lo scopo.'],
  ),
  'ring-dip': c(
    ['In appoggio sugli anelli, braccia distese, anelli vicini al corpo.', 'Scendi finché le spalle sono sotto i gomiti.', 'Spingi e ruota le mani verso l\'esterno in alto.'],
    ['Avanzato: prima padroneggia l\'appoggio agli anelli e i dip alle parallele.', 'Anelli sempre vicini al corpo.', 'Non scendere oltre quanto le spalle permettono.'],
    ['Tieni un appoggio solido in alto prima di ogni ripetizione.', 'Lento in discesa.', 'Allena le tenute in alto e in basso.'],
  ),

  // ---------- spalle ----------
  'pike-push-up': c(
    ['Bacino alto a V rovesciata, mani alla larghezza delle spalle.', 'Piega i gomiti e porta la testa a terra, tra e davanti alle mani.', 'Spingi in alto.'],
    ['Appoggia la testa con delicatezza, non sbatterla.', 'Gomiti indietro, non di lato.', 'Scalda prima i polsi.'],
    ['Più il corpo è verticale, più lavorano le spalle.', 'Gambe più distese possibile.', 'Prepara ai piegamenti in verticale.'],
  ),
  'elevated-pike-push-up': c(
    ['Piedi su un rialzo, mani a terra, bacino sopra le spalle.', 'Porta la testa tra le mani.', 'Spingi in alto.'],
    ['Inizia con un rialzo basso.', 'Scendi lentamente: la testa porta molto peso.', 'Gomiti a circa 45°, non aperti.'],
    ['Alza il rialzo per avvicinarti ai piegamenti in verticale.', 'Guarda tra le mani.', 'Bacino allineato sopra le spalle.'],
  ),
  'box-pike-handstand': c(
    ['Piedi su un rialzo dietro di te, mani a terra.', 'Avvicina le mani al rialzo finché il bacino è sopra le spalle.', 'Tieni, braccia distese.'],
    ['Assicurati che il rialzo sia stabile.', 'Scalda i polsi.', 'Scendi allontanando le mani, lentamente.'],
    ['Spingi via il pavimento: spalle vicino alle orecchie.', 'Braccia ben distese.', 'Un ottimo primo passo verso la verticale.'],
  ),
  'wall-handstand': c(
    ['Di fronte al muro, sali coi piedi lungo il muro, mani a circa una spanna dal muro.', 'Corpo dritto, petto verso il muro.', 'Tieni, poi scendi camminando.'],
    ['Impara prima a scendere in sicurezza: camminando o con una ruota laterale.', 'Scalda bene i polsi.', 'Fermati se hai capogiri.'],
    ['Spingi via il pavimento e stringi glutei e gambe.', 'Mani più vicine al muro: linea più dritta.', 'Guarda il pavimento tra le mani.'],
  ),
  hspu: c(
    ['Sali in verticale con la schiena al muro.', 'Porta lentamente la testa a terra.', 'Spingi fino a braccia distese.'],
    ['Avanzato: prima padroneggia pike push-up e pike con piedi rialzati.', 'Scendi lentamente: il collo non deve mai prendere il peso.', 'Metti un tappetino piegato sotto la testa.'],
    ['Mani poco più larghe delle spalle.', 'Gomiti in avanti a circa 45°.', 'Le ripetizioni parziali su un rialzo sono un buon passo.'],
  ),
  handstand: c(
    ['Mani alla larghezza delle spalle, dita aperte.', 'Sali con uno slancio o di forza: polsi, spalle, bacino e piedi in linea.', 'Trova l\'equilibrio con le dita.'],
    ['Impara a uscire (girandoti di lato) prima di provare la verticale libera.', 'Scalda i polsi ogni volta.', 'Allenati su una superficie morbida, lontano dai mobili.'],
    ['Spingi via il pavimento, spalle vicino alle orecchie.', 'Stringi i glutei e tendi le punte.', 'Meglio tentativi brevi e frequenti che lunghi.'],
  ),
  'planche-lean': c(
    ['Posizione da piegamento, braccia distese, mani un po\' ruotate verso l\'esterno.', 'Porta le spalle in avanti oltre le mani.', 'Tieni, corpo dritto.'],
    ['Scalda bene i polsi: portano molto carico.', 'Sbilanciati un po\' alla volta.', 'Gomiti distesi ma non iperestesi.'],
    ['Arrotonda un po\' la parte alta della schiena e spingi via il pavimento.', 'Più ti sbilanci, più è difficile.', 'Costruisce la forza per la planche.'],
  ),
  'pseudo-planche-push-up': c(
    ['Mani all\'altezza del bacino, dita verso l\'esterno.', 'Sbilanciati in avanti con le spalle oltre le mani.', 'Scendi col petto e spingi, mantenendo lo sbilanciamento.'],
    ['Scalda i polsi.', 'All\'inizio sbilanciati poco.', 'Fermati se gomiti o polsi fanno male.'],
    ['Mantieni lo sbilanciamento per tutta la ripetizione.', 'Corpo dritto, glutei contratti.', 'Lentamente.'],
  ),
  'frog-stand': c(
    ['Accosciati, mani a terra alla larghezza delle spalle.', 'Appoggia le ginocchia all\'esterno dei gomiti.', 'Sbilanciati in avanti finché i piedi si staccano; tieni l\'equilibrio.'],
    ['Le prime volte metti un cuscino davanti alla testa.', 'Scalda i polsi.', 'Sbilanciati lentamente, a piccoli spostamenti.'],
    ['Guarda poco avanti, non tra le mani.', 'Usa le dita per controllare l\'equilibrio.', 'Insegna l\'equilibrio per gli appoggi sulle braccia e la verticale.'],
  ),
  'wall-walk': c(
    ['Sdraiati a pancia in giù coi piedi al muro.', 'Spingi in alto, sali coi piedi lungo il muro e avvicina le mani.', 'Scendi allo stesso modo.'],
    ['Sali solo fin dove riesci a controllare.', 'Scalda i polsi.', 'Scendi lentamente, passo dopo passo.'],
    ['Corpo compatto come in plank.', 'Piccoli passi con le mani.', 'Ottimo per forza delle spalle e sicurezza a testa in giù.'],
  ),
  'tuck-planche': c(
    ['Mani a terra o sulle parallettes, braccia distese.', 'Sbilanciati in avanti e stacca i piedi, ginocchia al petto.', 'Tieni, bacino all\'altezza delle spalle.'],
    ['Avanzato: costruiscila prima con i planche lean.', 'Scalda bene polsi e gomiti.', 'Le parallettes sono più gentili coi polsi.'],
    ['Arrotonda la parte alta della schiena e spingi via il pavimento.', 'Braccia ben distese.', 'Tenute brevi, tante serie.'],
  ),

  // ---------- braccia ----------
  'triceps-dip': c(
    ['In appoggio alle parallele o sulle parallettes.', 'Busto verticale, gomiti che puntano indietro.', 'Scendi fino a 90° ai gomiti, spingi in alto.'],
    ['Non scendere oltre 90° se le spalle protestano.', 'Spalle basse.', 'Niente rimbalzi in basso.'],
    ['Resta verticale per concentrarti sui tricipiti.', 'Distendi completamente in alto.', 'Lento in discesa.'],
  ),
  'bench-dip': c(
    ['Mani su una panca o una sedia dietro di te, dita in avanti.', 'Gambe in avanti, piega i gomiti per abbassare il bacino.', 'Spingi in alto.'],
    ['Scendi solo fino a circa 90° ai gomiti: oltre affatica le spalle.', 'Bacino vicino alla panca.', 'Assicurati che la panca non scivoli.'],
    ['Piega le ginocchia per facilitare, distendi le gambe per rendere più difficile.', 'Gomiti che puntano indietro.', 'Pausa in basso.'],
  ),
  'diamond-push-up': c(
    ['Mani unite sotto il petto, pollici e indici a formare un diamante.', 'Corpo dritto, porta il petto alle mani.', 'Spingi in alto.'],
    ['Se i polsi fanno male, allarga un po\' le mani.', 'Gomiti vicini al corpo.', 'Non far cedere il bacino.'],
    ['Contrai i tricipiti in alto.', 'Inizia sulle ginocchia o su una panca.', 'Lento in discesa.'],
  ),
  'triceps-extension': c(
    ['Mani su una sbarra o una panca, corpo dritto come in un piegamento inclinato.', 'Piega solo i gomiti, portando la testa sotto le mani.', 'Spingi fino a braccia distese.'],
    ['Inizia con una sbarra o una panca alta: diventa difficile in fretta.', 'Lentamente: i gomiti portano il carico.', 'Fermati se fa male l\'articolazione del gomito.'],
    ['Braccia ferme nella parte alta.', 'Abbassa l\'appoggio per renderlo più difficile.', 'Stringi i glutei così il corpo resta dritto.'],
  ),
  'l-sit-dip': c(
    ['In appoggio alle parallele o sulle parallettes con le gambe distese in avanti a L.', 'Fai il dip tenendo le gambe alte.', 'Spingi in alto.'],
    ['Solo quando sia L-sit sia dip sono solidi.', 'Non scendere troppo.', 'Spalle basse.'],
    ['Gambe più alte che puoi.', 'Raccogli le ginocchia per facilitare.', 'Lentamente.'],
  ),

  // ---------- core ----------
  plank: c(
    ['Avambracci a terra, gomiti sotto le spalle.', 'Corpo dritto dai talloni alla testa.', 'Tieni.'],
    ['Non far cedere il bacino: affatica la zona lombare.', 'Collo neutro; guarda il pavimento.', 'Respira normalmente.'],
    ['Stringi i glutei e porta le costole in basso.', 'Spingi via il pavimento con gli avambracci.', 'Meglio 30 secondi intensi che 2 minuti fatti male.'],
  ),
  'side-plank': c(
    ['Sdraiati su un fianco, gomito sotto la spalla.', 'Solleva il bacino finché il corpo è dritto.', 'Tieni, poi cambia lato.'],
    ['Bacino alto e allineato.', 'Spalla sopra il gomito.', 'Piega le ginocchia per facilitare.'],
    ['Allunga il braccio sopra verso il soffitto.', 'Stringi i glutei.', 'Solleva la gamba sopra per renderlo più difficile.'],
  ),
  'hollow-hold': c(
    ['Sdraiati sulla schiena.', 'Premi la zona lombare a terra, solleva spalle e gambe.', 'Braccia sopra la testa, tieni la forma a banana.'],
    ['La zona lombare deve restare a terra: se si stacca, alza le gambe o piega le ginocchia.', 'Collo rilassato, mento leggermente in dentro.', 'Respira.'],
    ['Più basse braccia e gambe, più è difficile.', 'Tendi le punte e stringi le gambe.', 'Questa forma è la base della maggior parte delle skill di calisthenics.'],
  ),
  'hollow-rock': c(
    ['Mettiti in hollow hold.', 'Dondola avanti e indietro mantenendo la forma.', 'Continua in modo fluido.'],
    ['Non perdere la forma; fermati se la zona lombare si inarca.', 'Fallo su un tappetino.', 'Mento in dentro.'],
    ['Il dondolio viene dalla forma, non dai calci delle gambe.', 'Braccia sempre vicino alle orecchie.', 'Rendilo più piccolo e lento per aumentare la difficoltà.'],
  ),
  'leg-raise': c(
    ['Supino, mani lungo i fianchi o sotto il bacino.', 'Solleva le gambe distese fino alla verticale.', 'Abbassale lentamente, senza toccare terra.'],
    ['Zona lombare premuta a terra; piega le ginocchia se si stacca.', 'Scendi lentamente: niente cadute.', 'Fermati se la zona lombare fa male.'],
    ['Solleva un po\' il bacino in alto per lavorare di più sugli addominali.', 'Impiega 3 secondi a scendere.', 'Gambe unite.'],
  ),
  'hanging-leg-raise': c(
    ['Appenditi alla sbarra.', 'Solleva le gambe distese a 90° o più.', 'Abbassale lentamente.'],
    ['Niente oscillazioni: pausa in basso.', 'Spalle attive.', 'Piega le ginocchia per iniziare.'],
    ['In alto ruota il bacino verso l\'alto per usare gli addominali, non solo i flessori dell\'anca.', 'Lento in discesa.', 'Progredisci verso i piedi alla sbarra.'],
  ),
  'l-sit': c(
    ['Sulle parallettes o a terra, mani accanto al bacino.', 'Spingi in basso, solleva il corpo, gambe distese in avanti.', 'Tieni, gambe parallele al pavimento.'],
    ['Scalda i polsi.', 'Spalle basse, braccia distese.', 'Raccogli le ginocchia se le gambe scendono.'],
    ['Spingi forte via il pavimento.', 'Tendi le punte e stringi le gambe.', 'Una gamba raccolta e una distesa è un buon passo intermedio.'],
  ),
  'dragon-flag': c(
    ['Sdraiati su una panca, afferrala dietro la testa.', 'Solleva il corpo dritto dalle spalle.', 'Scendi lentamente, corpo dritto, senza toccare la panca.'],
    ['Avanzato: inizia con le ginocchia piegate.', 'Peso sulla parte alta della schiena, mai sul collo.', 'Assicurati che la panca sia solida.'],
    ['Anche distese, non piegarti.', 'Scendi più lentamente che puoi.', 'All\'inizio solo negative.'],
  ),
  'mountain-climber': c(
    ['Plank alto, mani sotto le spalle.', 'Porta un ginocchio al petto, poi cambia velocemente.', 'Mantieni un ritmo costante.'],
    ['Bacino basso, in linea col corpo.', 'Mani sotto le spalle.', 'Atterra morbido sulle punte.'],
    ['Più veloce per il cardio, più lento per gli addominali.', 'Spalle ferme.', 'Conta ogni gamba.'],
  ),
  'v-up': c(
    ['Supino, braccia sopra la testa.', 'Solleva gambe e busto insieme, cerca le punte dei piedi.', 'Scendi con controllo.'],
    ['Scendi lentamente; non crollare.', 'Piega le ginocchia se la zona lombare fa male.', 'Fallo su un tappetino.'],
    ['Allungati con le mani, non tirare il collo.', 'Espira salendo.', 'Gambe distese per renderlo più difficile.'],
  ),
  'tuck-to-l-sit': c(
    ['Sulle parallettes, spingi in basso e solleva il corpo con le ginocchia raccolte.', 'Distendi le gambe a L.', 'Riportale raccolte.'],
    ['Scalda i polsi.', 'Braccia distese e spalle basse.', 'Siediti quando perdi la posizione.'],
    ['Muoviti lentamente, senza slanci.', 'Gambe alte quando le distendi.', 'Costruisce l\'L-sit.'],
  ),
  'toes-to-bar': c(
    ['Appenditi alla sbarra.', 'Solleva le gambe distese fino a toccare la sbarra.', 'Scendi lentamente.'],
    ['Avanzato: padroneggia prima i sollevamenti gambe alla sbarra.', 'Niente oscillazioni; pausa in basso.', 'Spalle attive.'],
    ['Inclinati un po\' indietro e spingi la sbarra in basso a braccia distese.', 'Controlla la discesa.', 'Piega le ginocchia per facilitare.'],
  ),
  'windshield-wiper': c(
    ['Appenditi alla sbarra, solleva le gambe (piegate o distese).', 'Ruota il bacino da un lato, poi dall\'altro.', 'Parte alta del corpo ferma.'],
    ['Avanzato: inizia a ginocchia piegate e con un\'escursione piccola.', 'Muoviti lentamente; non farti trascinare dalle gambe.', 'Spalle attive.'],
    ['Gambe distese per renderlo più difficile.', 'Pausa a ogni lato.', 'Ottimo per gli obliqui.'],
  ),
  'side-leg-raise': c(
    ['Sdraiati su un fianco, gambe distese.', 'Solleva la gamba sopra con controllo.', 'Abbassala lentamente.'],
    ['Bacino allineato; non ruotare all\'indietro.', 'Lentamente.', 'Sostieni la testa col braccio sotto.'],
    ['Punta dei piedi in avanti, non in alto.', 'Pausa in alto.', 'Tieni qualche secondo in alto per renderlo più difficile.'],
  ),

  // ---------- gambe ----------
  squat: c(
    ['Piedi alla larghezza delle spalle, punte un po\' aperte.', 'Siediti in basso e indietro, petto alto, finché il bacino è sotto le ginocchia.', 'Risali spingendo con tutto il piede.'],
    ['Ginocchia nella direzione delle punte: non farle cadere in dentro.', 'Talloni a terra.', 'Schiena neutra, non arrotondata.'],
    ['Profondità completa se la mobilità lo permette.', 'Lento in discesa, veloce in salita.', 'Braccia in avanti aiutano l\'equilibrio.'],
  ),
  'wall-sit': c(
    ['Schiena al muro.', 'Scivola giù finché le cosce sono parallele al pavimento.', 'Tieni.'],
    ['Ginocchia sopra le caviglie, non oltre le punte.', 'Schiena piatta contro il muro.', 'Risali lentamente.'],
    ['Più in basso, più è difficile.', 'Premi la zona lombare contro il muro.', 'Respira.'],
  ),
  'squat-jump': c(
    ['Scendi in squat.', 'Salta più in alto che puoi.', 'Atterra morbido e riparti col prossimo squat.'],
    ['Atterra sull\'avampiede a ginocchia piegate.', 'All\'atterraggio le ginocchia seguono le punte.', 'Saltalo se le ginocchia fanno male.'],
    ['Usa le braccia per saltare più in alto.', 'Atterraggi silenziosi vuol dire buon controllo.', 'Qualità prima: smetti quando i salti si abbassano.'],
  ),
  'bulgarian-split-squat': c(
    ['Piede dietro su una panca.', 'Scendi col ginocchio dietro verso terra.', 'Risali spingendo col piede davanti.'],
    ['Il ginocchio davanti segue la punta.', 'Trova una distanza stabile dalla panca prima di iniziare.', 'Busto dritto.'],
    ['Lento in discesa.', 'Sbilanciati un po\' in avanti per più glutei.', 'All\'inizio tieniti a qualcosa per l\'equilibrio.'],
  ),
  'pistol-squat': c(
    ['In piedi su una gamba, l\'altra distesa in avanti.', 'Scendi completamente sulla gamba d\'appoggio.', 'Risali.'],
    ['Avanzato: allenati prima scendendo su un rialzo.', 'Tallone a terra e ginocchio sopra la punta.', 'All\'inizio tieniti a qualcosa per l\'equilibrio.'],
    ['Braccia avanti per l\'equilibrio.', 'Controlla la discesa.', 'Risali senza rimbalzare.'],
  ),
  'glute-bridge': c(
    ['Supino, ginocchia piegate, piedi a terra.', 'Spingi il bacino in alto finché il corpo è dritto dalle ginocchia alle spalle.', 'Scendi lentamente.'],
    ['In alto non inarcare la zona lombare: stringi i glutei.', 'Spingi coi talloni.', 'Ginocchia in linea coi piedi.'],
    ['Pausa e contrazione in alto.', 'Piedi più vicini al bacino per più glutei.', 'Prova su una gamba per renderlo più difficile.'],
  ),
  'lateral-lunge': c(
    ['In piedi a piedi uniti.', 'Fai un passo largo di lato e siediti su quell\'anca; l\'altra gamba resta distesa.', 'Torna alla partenza.'],
    ['Il ginocchio segue la punta.', 'Talloni a terra.', 'Petto alto.'],
    ['Scendi di più man mano che le anche si sciolgono.', 'Spingi il bacino indietro.', 'Ottimo per l\'interno coscia.'],
  ),
  'single-leg-bridge': c(
    ['Supino, un piede a terra, l\'altra gamba in alto.', 'Spingi il bacino in alto tenendolo dritto.', 'Scendi lentamente.'],
    ['Non far inclinare il bacino.', 'Non inarcare la zona lombare.', 'Spingi col tallone.'],
    ['Pausa in alto.', 'Gamba sollevata ferma.', 'Conta le ripetizioni per lato.'],
  ),
  'single-leg-rdl': c(
    ['In piedi su una gamba.', 'Piegati alle anche a schiena piatta, gamba libera indietro.', 'Risali stringendo i glutei.'],
    ['Schiena piatta, mai arrotondata.', 'Leggera flessione del ginocchio d\'appoggio.', 'All\'inizio tieniti a qualcosa per l\'equilibrio.'],
    ['Bacino parallelo al pavimento.', 'Lentamente.', 'Allungati verso terra per sentire i femorali.'],
  ),
  'nordic-curl': c(
    ['In ginocchio coi talloni bloccati sotto qualcosa di solido.', 'Corpo dritto dalle ginocchia alla testa, inclinati in avanti più lentamente che puoi.', 'Frena con le mani, spingi per tornare su.'],
    ['Molto duro per i femorali: inizia con un\'escursione piccola.', 'Usa un tappetino morbido sotto le ginocchia.', 'Frena sempre con le mani.'],
    ['Anche distese; non piegarti in vita.', 'Più lenta la discesa, meglio è.', 'Un elastico da dietro può aiutare.'],
  ),
  lunge: c(
    ['Fai un passo avanti.', 'Abbassa il ginocchio dietro verso terra.', 'Risali, alterna le gambe.'],
    ['Ginocchio davanti sopra la caviglia, non verso l\'interno.', 'Busto dritto.', 'Passo abbastanza lungo perché il ginocchio davanti resti dietro la punta.'],
    ['Lento in discesa.', 'Spingi col tallone davanti.', 'Falli camminando per una serie più lunga.'],
  ),
  'calf-raise': c(
    ['In piedi su un gradino, talloni fuori dal bordo.', 'Sali sulle punte.', 'Abbassa i talloni sotto il gradino.'],
    ['Tieniti a qualcosa per l\'equilibrio.', 'Lento in basso.', 'Niente rimbalzi.'],
    ['Pausa in alto.', 'Escursione completa a ogni ripetizione.', 'Prova una gamba alla volta.'],
  ),
  'horse-stance': c(
    ['Piedi larghi, punte avanti o un po\' aperte.', 'Siediti in basso, schiena dritta.', 'Tieni.'],
    ['Ginocchia spinte in fuori sopra le punte.', 'Schiena dritta.', 'Risali lentamente.'],
    ['Più in basso, più è difficile.', 'Respira profondamente.', 'Ottimo per gambe e anche.'],
  ),
  'sissy-squat': c(
    ['Sulle punte dei piedi, tenendoti a qualcosa.', 'Porta le ginocchia avanti e il busto indietro, anche distese.', 'Torna su.'],
    ['Duro per le ginocchia: inizia con un\'escursione piccola.', 'Tieniti a qualcosa di stabile.', 'Saltalo se le ginocchia fanno male.'],
    ['Linea dritta dalle ginocchia alla testa.', 'Lentamente.', 'Ottimo per i quadricipiti.'],
  ),
  burpee: c(
    ['Accosciati e metti le mani a terra.', 'Porta i piedi indietro con un salto, petto a terra.', 'Spingi in alto, piedi avanti e salta.'],
    ['Atterra morbido.', 'Schiena dritta nel plank.', 'Se serve, porta i piedi indietro un passo alla volta invece di saltare.'],
    ['Ritmo costante su una serie lunga.', 'Piegamento completo in basso per più forza.', 'Batti le mani sopra la testa in alto.'],
  ),

  // ---------- riscaldamento ----------
  'jumping-jacks': c(['Salta aprendo le gambe mentre le braccia vanno sopra la testa.', 'Salta chiudendo, braccia giù.', 'Ritmo tranquillo.'], ['Atterra morbido sull\'avampiede.', 'Se serve, fai un passo invece del salto.'], ['Serve ad alzare i battiti prima dell\'allenamento.']),
  'arm-circles': c(['Braccia aperte di lato.', 'Fai grandi cerchi in avanti, poi indietro.', 'Inizia piccolo, poi allarga.'], ['Niente dolore: resta in un\'escursione comoda.'], ['Scalda le spalle prima di spinte e trazioni.']),
  'wrist-circles': c(['Ruota i polsi in entrambe le direzioni.', 'Poi allunga a terra, palmi in giù e palmi in su.', 'Dondola delicatamente avanti e indietro.'], ['Con delicatezza: non forzare mai un allungamento.'], ['Fallo sempre prima di verticali, planche lean e piegamenti.']),
  'cat-cow': c(['A quattro zampe.', 'Arrotonda la schiena in alto (gatto), poi lasciala scendere e guarda in alto (mucca).', 'Muoviti lentamente col respiro.'], ['Resta in un\'escursione comoda.'], ['Espira nel gatto, inspira nella mucca.']),
  'scapular-push-up': c(['Plank alto, braccia distese.', 'Lascia scendere il petto tra le spalle, poi spingilo in alto.', 'Si muovono solo le scapole.'], ['Braccia distese.'], ['Risveglia il dentato e le scapole prima delle spinte.']),
  'deep-squat-hold': c(['Siediti in fondo allo squat.', 'Talloni giù, petto alto.', 'Rilassati e respira.'], ['Tieniti a qualcosa se i talloni si staccano.'], ['Spingi le ginocchia in fuori coi gomiti per aprire le anche.']),
  'leg-swings': c(['Tieniti al muro.', 'Slancia una gamba avanti e indietro, poi di lato.', 'Cambia gamba.'], ['Lascia crescere l\'escursione; non calciare forte.'], ['Scioglie le anche prima di squat e affondi.']),

  // ---------- defaticamento ----------
  stretching: c(['Allungati in alto, poi allunga ogni parte che hai allenato.', 'Tieni ogni allungamento 20–30 secondi.', 'Respira lentamente.'], ['Mai molleggiare; allunga fino a una leggera tensione, non al dolore.'], ['Espira per andare un po\' più a fondo.']),
  'leg-stretch': c(['Seduto a gambe distese.', 'Piegati in avanti dalle anche a schiena lunga.', 'Tieni.'], ['Non molleggiare; piega le ginocchia se serve.'], ['Guida col petto, non con la testa.']),
  'shoulder-stretch': c(['Porta un braccio davanti al petto.', 'Poi portalo sopra la testa e piega il gomito per il tricipite.', 'Cambia lato.'], ['Tira solo con delicatezza.'], ['Rilassa le spalle in basso.']),
  'hip-flexor-stretch': c(['In mezzo affondo, un piede avanti.', 'Spingi il bacino avanti, stringi il gluteo dietro.', 'Cambia lato.'], ['Un cuscino sotto il ginocchio; non inarcare la schiena.'], ['Alza il braccio dal lato del ginocchio a terra.']),
  'pancake-stretch': c(['Seduto a gambe larghe.', 'Piegati in avanti a schiena lunga.', 'Tieni.'], ['Resta dove senti un allungamento, non dolore.'], ['Porta le mani un po\' più avanti a ogni respiro.']),
  'childs-pose': c(['In ginocchio, siediti sui talloni.', 'Allunga le braccia in avanti, fronte a terra.', 'Rilassati.'], ['Ginocchia larghe se le anche sono rigide.'], ['Respira nella schiena.']),
  'dead-hang-stretch': c(['Appenditi morbido alla sbarra.', 'Lascia allungare il corpo.', 'Respira.'], ['Scendi appoggiando i piedi, non lasciandoti cadere.'], ['Rilassa schiena e spalle dopo l\'allenamento.']),
  rest: c(['Cammina o resta in piedi.', 'Respira lentamente e profondamente.', 'Bevi un po\' d\'acqua.'], [], ['Usa il recupero per prepararti a ciò che viene dopo.']),
};
