import { useState } from 'react';
import { 
  X, Megaphone, Tv, Calendar, CheckCircle2, Sparkles, Send, CreditCard, 
  TrendingUp, Radio, Eye, ShieldCheck, Award, MessageCircle, Phone, Mail, HelpCircle, Flame
} from 'lucide-react';

interface PartnerAdPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdPack {
  id: string;
  name: string;
  tag: string;
  badgeColor: string;
  pricePerUnit: number;
  unitLabel: string;
  period: 'semaine' | 'mois' | 'evenement';
  description: string;
  features: string[];
  popular?: boolean;
  icon: any;
}

const AD_PACKS: AdPack[] = [
  {
    id: 'pack_hebdo_diffusion',
    name: 'Pack Diffusion Émission Hebdo',
    tag: 'Très Populaire pour Églises & Créateurs',
    badgeColor: 'bg-red-600 text-white',
    pricePerUnit: 20,
    unitLabel: '20 $USD / semaine',
    period: 'semaine',
    popular: true,
    icon: Tv,
    description: 'Diffusez votre émission, culte hebdomadaire, podcast ou vidéo chaque semaine en direct sur TV PRO MEDIA.',
    features: [
      'Créneau de diffusion dédié chaque semaine',
      'Compatibilité directe avec vMix, OBS et YouTube',
      'Affichage prioritaire "À la Une" pendant votre direct',
      'Bascule automatique de secours 24h/24 sans écran noir',
      'Lien partageable direct pour votre communauté sur WhatsApp'
    ]
  },
  {
    id: 'pack_hebdo_pub',
    name: 'Pack Bannière & Spot Pub Hebdo',
    tag: 'Idéal Entreprises & Commerces',
    badgeColor: 'bg-amber-500 text-black',
    pricePerUnit: 15,
    unitLabel: '15 $USD / semaine',
    period: 'semaine',
    icon: Megaphone,
    description: 'Affichez votre bannière publicitaire avec lien direct vers votre WhatsApp ou site web.',
    features: [
      'Bannière sponsorisée visible sous le lecteur vidéo',
      'Lien cliquable vers votre numéro WhatsApp ou boutique',
      'Mention du partenaire dans la barre d\'actualités en direct',
      'Statistiques des clics et de visibilité hebdomadaire',
      'Format dynamique pour smartphone et ordinateur'
    ]
  },
  {
    id: 'pack_mensuel_chaine',
    name: 'Pack Chaîne TV Dédiée 24h/24',
    tag: 'Formule Complète & Économique',
    badgeColor: 'bg-emerald-600 text-white',
    pricePerUnit: 70,
    unitLabel: '70 $USD / mois',
    period: 'mois',
    icon: Radio,
    description: 'Votre propre chaîne de télévision permanente intégrée dans la grille officielle 24h/24 avec logo personnalisé.',
    features: [
      'Chaîne permanente dans le catalogue officiel TV PRO MEDIA',
      'Serveur d\'ingestion RTMP privé et flux HLS M3U8 haute vitesse',
      'Diffusion illimitée 24h/24 et 7j/7 en 1080p Full HD',
      'Clé de diffusion dédiée & sauvegarde automatique YouTube',
      'Support technique et assistance VIP personnalisée'
    ]
  },
  {
    id: 'pack_event_direct',
    name: 'Pack Événement Spécial / Live VIP',
    tag: 'Concert, Conférence, Mariage',
    badgeColor: 'bg-blue-600 text-white',
    pricePerUnit: 35,
    unitLabel: '35 $USD / événement',
    period: 'evenement',
    icon: Sparkles,
    description: 'Retransmission en direct d\'un événement unique (concert, conférence, séminaire, mariage, croisade).',
    features: [
      'Bannière géante événementielle à l\'ouverture du site',
      'Bande passante renforcée pour les pics d\'audience',
      'Enregistrement vidéo master fourni après l\'événement',
      'Bouton de contact et de don direct pour les spectateurs'
    ]
  }
];

export default function PartnerAdPortalModal({ isOpen, onClose }: PartnerAdPortalModalProps) {
  const [selectedPackId, setSelectedPackId] = useState<string>('pack_hebdo_diffusion');
  const [durationUnits, setDurationUnits] = useState<number>(1); // number of weeks or months
  const [partnerName, setPartnerName] = useState('');
  const [partnerContact, setPartnerContact] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'airtel' | 'mpesa' | 'orange' | 'card' | 'paypal' | 'virement'>('mpesa');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPack = AD_PACKS.find(p => p.id === selectedPackId) || AD_PACKS[0];
  const totalPrice = currentPack.pricePerUnit * durationUnits;

  const getDurationLabel = () => {
    if (currentPack.period === 'semaine') {
      return durationUnits === 1 ? '1 semaine' : `${durationUnits} semaines`;
    }
    if (currentPack.period === 'mois') {
      return durationUnits === 1 ? '1 mois' : `${durationUnits} mois`;
    }
    return durationUnits === 1 ? '1 événement' : `${durationUnits} événements`;
  };

  const generateWhatsAppMessage = () => {
    const text = `🌟 *DEMANDE DE PARTENARIAT / PUBLICITÉ TV PRO MEDIA* 🌟\n\n` +
      `👤 *Annonceur / Chaîne :* ${partnerName || 'Non spécifié'}\n` +
      `📞 *Contact :* ${partnerContact || 'Non spécifié'}\n` +
      `📧 *Email :* ${partnerEmail || 'Non spécifié'}\n` +
      `📦 *Formule choisie :* ${currentPack.name}\n` +
      `⏳ *Durée :* ${getDurationLabel()}\n` +
      `💰 *Montant calculé :* ${totalPrice} $USD\n` +
      `💳 *Moyen de paiement souhaité :* ${paymentMethod.toUpperCase()}\n` +
      (additionalNotes ? `📝 *Détails / Besoins :* ${additionalNotes}\n` : '') +
      `\n_Envoyé depuis la plateforme tvpromedia.com_`;
    return encodeURIComponent(text);
  };

  const handleSendWhatsApp = () => {
    if (!partnerName.trim() || !partnerContact.trim()) {
      alert("Veuillez saisir votre nom (ou entreprise) et votre numéro de contact.");
      return;
    }
    const message = generateWhatsAppMessage();
    const phone = "243899532822"; // Promoteur officiel Patrick Feni
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    setSubmittedSuccess(true);
  };

  const handleSendEmail = () => {
    if (!partnerName.trim() || !partnerContact.trim()) {
      alert("Veuillez saisir votre nom (ou entreprise) et votre numéro de contact.");
      return;
    }
    const subject = encodeURIComponent(`Demande de Partenariat: ${currentPack.name} - ${partnerName}`);
    const body = generateWhatsAppMessage();
    window.open(`mailto:madiaott@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setSubmittedSuccess(true);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="partner-portal-modal">
      <div className="w-full max-w-4xl bg-[#0e1322] border border-red-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#180a0a] via-[#161226] to-[#0f172a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shrink-0">
              <Megaphone className="w-6 h-6 text-red-500 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-wider">
                  Espace Partenaires & Annonceurs
                </h2>
                <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider hidden sm:inline-block">
                  Monétisation Hebdo
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Diffusez votre émission, votre culte ou votre publicité chaque semaine sur TV PRO MEDIA
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all focus:outline-none"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {/* KEY VALUE PROPOSITION BANNER */}
          <div className="bg-gradient-to-r from-red-950/40 via-purple-950/30 to-blue-950/40 border border-red-500/20 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center justify-center md:justify-start gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" /> Opportunité de visibilité maximale
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Touchez des milliers de spectateurs chaque jour en RDC et dans la diaspora
              </h3>
              <p className="text-xs text-gray-300">
                Paiements flexibles à la semaine ou au mois par Mobile Money (M-Pesa, Airtel, Orange) et Carte bancaire.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 bg-black/40 px-4 py-2.5 rounded-xl border border-white/10">
              <div className="text-center">
                <span className="text-xs font-bold text-gray-400 block">Qualité</span>
                <span className="text-sm font-black text-emerald-400">1080p FHD</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-center">
                <span className="text-xs font-bold text-gray-400 block">Disponibilité</span>
                <span className="text-sm font-black text-blue-400">24h/24 7j/7</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-center">
                <span className="text-xs font-bold text-gray-400 block">À partir de</span>
                <span className="text-sm font-black text-amber-400">15 $ / sem</span>
              </div>
            </div>
          </div>

          {/* 1. SELECTION DES PACKS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">1</span>
                Choisissez votre formule publicitaire ou de diffusion :
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {AD_PACKS.map((pack) => {
                const isSelected = selectedPackId === pack.id;
                const IconComponent = pack.icon;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-[#181d33] border-red-500 shadow-xl shadow-red-600/20 ring-1 ring-red-500' 
                        : 'bg-[#0a0d18] border-white/10 hover:border-white/20 hover:bg-[#0f1424]'
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 right-4 text-[9px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow">
                        ⭐ Le plus demandé
                      </span>
                    )}

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white leading-snug">{pack.name}</h4>
                            <span className="text-[10px] text-gray-400 block">{pack.tag}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base sm:text-lg font-black text-amber-400 block leading-tight">
                            {pack.pricePerUnit} $
                          </span>
                          <span className="text-[9px] text-gray-400 uppercase font-bold">
                            /{pack.period}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                        {pack.description}
                      </p>

                      <ul className="space-y-1.5 mb-2">
                        {pack.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="text-[11px] text-gray-300 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className={`font-bold ${isSelected ? 'text-red-400' : 'text-gray-500'}`}>
                        {isSelected ? '✓ Formule sélectionnée' : 'Cliquer pour choisir'}
                      </span>
                      <span className="text-gray-400 text-[10px]">
                        Facturation {pack.period === 'semaine' ? 'hebdomadaire' : 'mensuelle'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CONFIGURATEUR DE DURÉE & CALCULATEUR */}
          <div className="bg-[#0b0e1b] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">2</span>
              Durée de diffusion et calcul du tarif :
            </h3>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
              <div className="w-full sm:w-auto">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Nombre de {currentPack.period === 'semaine' ? 'semaines' : (currentPack.period === 'mois' ? 'mois' : 'événements')} :
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 4, 8, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDurationUnits(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        durationUnits === num
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {num} {currentPack.period === 'semaine' ? 'sem.' : (currentPack.period === 'mois' ? 'mois' : 'évt')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center sm:text-right w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">
                  Total estimé ({getDurationLabel()})
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 block tracking-tight">
                  {totalPrice} $USD
                </span>
                <span className="text-[10px] text-gray-400 block font-mono mt-0.5">
                  ≈ {(totalPrice * 2850).toLocaleString()} CDF / {(totalPrice * 610).toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* 3. FORMULAIRE DE SOUMISSION / COORDONNÉES */}
          <div className="bg-[#0b0e1b] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">3</span>
              Vos coordonnées et mode de paiement :
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Nom de l&apos;Annonceur / Église / Chaîne *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Église Parole Vivante / Entreprise Star / Artiste..."
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Numéro WhatsApp / Téléphone *
                </label>
                <input
                  type="tel"
                  placeholder="Ex: +243 89 953 28 22 / +33 6..."
                  value={partnerContact}
                  onChange={(e) => setPartnerContact(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Adresse Email (Optionnel)
                </label>
                <input
                  type="email"
                  placeholder="contact@votre-domaine.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Mode de règlement préféré
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 transition-all font-medium"
                >
                  <option value="mpesa">📱 M-Pesa (Vodacom RDC)</option>
                  <option value="airtel">📱 Airtel Money</option>
                  <option value="orange">📱 Orange Money</option>
                  <option value="card">💳 Carte Bancaire (Visa / Mastercard)</option>
                  <option value="paypal">🌐 PayPal / Virement International</option>
                  <option value="virement">🏦 Virement Bancaire Direct</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Détails de votre contenu ou créneau souhaité
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Nous souhaitons diffuser chaque dimanche de 10h à 12h via notre encodeur vMix / ou afficher notre bannière..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Paiement sécurisé et activation de votre diffusion sous 24h</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Par Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[#25D366] hover:bg-[#20b858] text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Réserver sur WhatsApp ➔</span>
                </button>
              </div>
            </div>

            {submittedSuccess && (
              <div className="bg-emerald-600/20 border border-emerald-500/40 rounded-xl p-3 text-center text-xs text-emerald-300 font-bold animate-fade-in">
                ✅ Votre demande a été préparée ! Notre équipe régie vous contacte immédiatement pour activer votre créneau.
              </div>
            )}
          </div>

          {/* 4. PROCESSUS EN 3 ÉTAPES & CONTACT DIRECT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <span className="text-lg font-black text-red-500 block mb-1">01</span>
              <h5 className="font-bold text-white mb-0.5">Réservation</h5>
              <p className="text-[11px] text-gray-400">Sélectionnez votre formule et envoyez votre demande en 1 clic.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <span className="text-lg font-black text-amber-500 block mb-1">02</span>
              <h5 className="font-bold text-white mb-0.5">Paiement Simple</h5>
              <p className="text-[11px] text-gray-400">Réglez chaque semaine par M-Pesa, Airtel, Orange ou Carte.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <span className="text-lg font-black text-emerald-500 block mb-1">03</span>
              <h5 className="font-bold text-white mb-0.5">Diffusion en Direct</h5>
              <p className="text-[11px] text-gray-400">Votre contenu est immédiatement en onde et visible par tous.</p>
            </div>
          </div>

          {/* DIRECT CONTACT FOOTER */}
          <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
            <div>
              <span>Direction Commerciale & Partenariats : </span>
              <strong className="text-white">MR PATRICK FENI</strong>
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:+243899532822" className="hover:text-red-400 transition-colors flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> +243 89 953 28 22
              </a>
              <a href="mailto:madiaott@gmail.com" className="hover:text-red-400 transition-colors flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> madiaott@gmail.com
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
