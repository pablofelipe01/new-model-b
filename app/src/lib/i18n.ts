export type Lang = "es" | "en";

export const translations: Record<Lang, Record<string, string>> = {
  es: {
    // Devnet disclaimer
    devnetBanner:
      "Matiz es un prototipo de investigación desplegado en Solana Devnet. No está en producción, no acepta pagos, y los tokens no tienen valor monetario.",
    devnetShort: "Prototipo en Solana Devnet · sin valor monetario",
    devnetParams:
      "Todas las cifras son parámetros simulados en devnet. No se cobra ni se paga dinero real.",

    // Nav
    signIn: "Entrar",
    signInGoogle: "Entrar con Google",
    explore: "Explorar",
    allTokens: "Tokens",
    allTokensTitle: "Todos los tokens",
    allTokensSub: "Cada economía lanzada en Matiz.",
    searchCreators: "Buscar creador por nombre o símbolo…",
    noResults: "No encontramos creadores que coincidan.",
    fundWallet: "Cargar billetera",
    noUsdcPrompt: "¿Aún sin USDC? Recarga tu billetera para respaldar.",
    guideTitle: "Te invitaron a respaldar a alguien temprano",
    guideSub:
      "Mira cómo empezar en menos de un minuto y conéctate para entrar.",
    copied: "¡Copiado!",
    shareToken: "Compartir token",
    dashboard: "Panel",
    launch: "Lanzar",
    creators: "Creadores",
    portfolio: "Cartera",
    home: "Inicio",
    langSwitch: "EN",

    // Hero
    eyebrow: "La economía del Return on Influence",
    heroH1: "Tus fans no tienen que solo suscribirse.",
    heroH2: "Pueden respaldarte ",
    heroH2Accent: "temprano.",
    heroSub:
      "Convierte tu audiencia gratis en una economía de early backers. En vez de una suscripción que se evapora cada mes, tus fans toman una posición tokenizada en tu carrera: acceso, estatus de founder fan y una parte de tu crecimiento. Como una ronda seed de startup, pero para tu comunidad.",
    launchYourEconomy: "Abre tu economía",
    seeWhoAlready: "Explora quiénes ya lo hicieron",
    heroMeta1: "3 pasos para abrir",
    heroMeta2: "Con dólares digitales",
    heroMeta3: "Entras con Google",

    // Promises
    promisesHeader: "Lo que te prometemos",
    promise1Title: "Un suscriptor consume. Un backer participa.",
    promise1Body:
      "En vez de pagar una mensualidad que desaparece, tus fans toman una posición en tu economía. Quienes llegan primero entran más abajo y quedan registrados como founder fans. No es una suscripción — es una comunidad de early backers donde el reconocimiento es mutuo. (En este prototipo todo ocurre en devnet: los tokens no tienen valor monetario.)",
    promise2Title: "Tus backers son tuyos.",
    promise2Body:
      "Si mañana una plataforma de suscripción cambia las reglas, se queda con un corte mayor o cierra tu cuenta — tus backers siguen contigo. Viven on-chain, no en el servidor de nadie. La relación es tuya, no de la plataforma.",
    promise3Title: "La reserva no la puede tocar nadie.",
    promise3Body:
      "Cada aporte que entra queda bloqueado en un contrato público. Ni nosotros, ni tú, ni un hacker pueden sacarlo. La única forma de que salga es que un backer venda su token. Matemáticamente. Verificable en dos clics.",

    // How it works
    howHeader: "Cómo funciona, en tres pasos",
    step1Title: "1. Abre tu ronda.",
    step1Body:
      "Entra con Google. Pon un nombre, un símbolo, una foto. Define tu comisión de creador: entre 0% y 5%. La comisión de lanzamiento ($25) es un parámetro simulado en devnet — no se cobra dinero real. Listo: tienes un link para invitar a tu círculo interno.",
    step2Title: "2. Tus fans entran como backers.",
    step2Body:
      "Cada persona que cree en ti toma una parte de tu economía con tokens de devnet. Los primeros —tu ronda friends & family— entran más abajo. El precio de la curva sube con cada backer nuevo. Todo queda en una reserva pública que nadie puede vaciar.",
    step3Title: "3. Crecen contigo.",
    step3Body:
      "Mientras más backers se suman, más sube el precio de la curva. Si alguien quiere salir, devuelve su parte al precio que dicta la curva y la reserva responde. Tú recibes un porcentaje de cada transacción. Todo con tokens sin valor monetario, en devnet.",
    plusOneTitle: "+1. Tú también puedes entrar.",
    plusOneBody:
      "Nada te impide tomar una parte de tu propio token: entrar en tu propia ronda, respaldar a tu comunidad cuando haga falta, o regalarle una parte a los founder fans que te apoyaron desde el día uno. Eres creator y también puedes ser parte.",
    curveCaptionShort: "Cuanto antes respaldas, más bajo entras.",

    // Guarantee
    guaranteeTitle: "La promesa está en el código.",
    guaranteeBody1:
      "En otras plataformas tienes que confiar en la compañía. En Matiz confías en matemáticas públicas.",
    guaranteeBody2:
      "La función que permitiría retirar la reserva fue **físicamente borrada del código antes del lanzamiento**. No existe. Ni un hacker, ni un empleado deshonesto, ni nosotros mismos podemos tocarla. La única forma de que los fondos salgan es que un backer venda su token — y recibe lo que la curva dice.",
    guaranteeBody3: "Todo es público. Verificable. Auditable.",
    guaranteeCta: "Ver el contrato en Solana Explorer →",

    // Mosseri
    mosseriTitle: "El Head of Instagram ya lo dijo.",
    mosseriIntro:
      "En 2022, Adam Mosseri subió al escenario de TED. Describió un futuro donde los creators son dueños de su comunidad. Donde sus fans no solo se suscriben: los respaldan temprano, como a una startup. Donde si una plataforma desaparece, la relación con la audiencia sobrevive.",
    mosseriQuote:
      '"Ninguna compañía puede quitarle a Lisa su comunidad. Instagram podría desaparecer mañana, y ella mantendría su relación con sus suscriptores, y mantendría sus ingresos."',
    mosseriAttrib: "— Adam Mosseri, Head of Instagram",
    mosseriPunch:
      'Después admitió: "Meta no puede construir esto. Ninguna compañía sola puede."',
    mosseriWeDid: "Nosotros lo estamos investigando.",
    mosseriCta: "Ver el TED completo →",

    // For whom
    forWhomHeader: "Matiz es para ti si…",
    forWhom1Title: "Vives de tu contenido y de tu comunidad.",
    forWhom1Body:
      "Creadores de suscripción, contenido premium, membresías, close friends. Personas cuyos fans pagan por acceso directo, no solo por seguir. Matiz convierte a esos suscriptores en backers: quien llegó cuando empezabas queda registrado, on-chain, como founder fan y parte de tu historia.",
    forWhom2Title: "Tu círculo interno merece más que un 'gracias'.",
    forWhom2Body:
      'Tus fans más fieles —los que renuevan cada mes, los que te escriben, los que llegaron primero— pueden tener una parte real de tu economía. Con perks: contenido exclusivo, material sin publicar, llamadas privadas, acceso anticipado, prioridad. Y si alguien se va, el valor queda en la comunidad.',
    forWhom3Title: "Crees en alguien y quieres respaldarlo de verdad.",
    forWhom3Body:
      "No como suscripción que se evapora cada mes. Como una posición que queda registrada, te da acceso y estatus de founder fan, y que puedes retirar cuando quieras. En este prototipo la señal es simbólica: corre en devnet y los tokens no tienen valor monetario.",

    // Stories placeholder
    storiesTitle: "Historias, pronto.",
    storiesBody:
      "Estamos trabajando con los primeros creadores que van a abrir su economía en Matiz. Cuando sus historias estén listas, aquí las contaremos.",
    storiesCta: "¿Eres creador y quieres ser de los primeros? Escríbenos →",

    // Featured
    featuredLabel: "En movimiento",
    featuredTitle: "Creadores para respaldar",

    // FAQ
    faqHeader: "Preguntas frecuentes",
    faq1q: "¿En qué red corre Matiz hoy?",
    faq1a:
      "En Solana Devnet. Matiz es un prototipo de investigación: no está en producción, no acepta pagos y los tokens que se emiten no tienen valor monetario. Todo lo que ves en la plataforma corre con activos de prueba.",
    faq2q: "¿Esto reemplaza mi suscripción?",
    faq2a:
      "No tiene por qué. Puedes seguir con tu plataforma de suscripción y usar Matiz para convertir a tus fans más fieles en backers: acceso, estatus de founder fan y una posición en tu economía. Es la capa de respaldo temprano, no un reemplazo de tu contenido diario.",
    faq3q: "¿Cómo funciona la curva?",
    faq3a:
      'El precio sigue una fórmula pública: sube cuando entran más backers en circulación y baja cuando salen. La reserva del contrato siempre puede responder a una venta al precio que dicta la curva, sin "esperar a que haya liquidez". En devnet puedes probarlo tú mismo.',
    faq4q: "¿Qué parámetros usa el prototipo?",
    faq4a:
      "Comisión de plataforma 0.5% por transacción, comisión de creador entre 0% y 5%, y $25 al lanzar. Son parámetros simulados en devnet, no precios: no se cobra ni se paga dinero real, y pueden cambiar.",

    // CTA final
    ctaH1: "Tu audiencia gratis ya es una economía.",
    ctaH2: "Solo falta convertirla en backers.",

    // Footer
    footProduct: "Producto",
    footCompany: "Empresa",
    footLegal: "Legal",
    footCommunity: "Comunidad",
    footExplore: "Explora",
    footHowItWorks: "Cómo funciona",
    footFaq: "FAQ",
    footPricing: "Precios",
    footSimulations: "Simulaciones",
    footAbout: "Nosotros",
    footBlog: "Blog",
    footWhitepaper: "Whitepaper",
    footMarketResearch: "Investigación de mercado",
    footContact: "Contacto",
    footTerms: "Términos",
    footPrivacy: "Privacidad",
    footAccessibility: "Accesibilidad",
    footSolanaNote:
      "Matiz corre sobre Solana Devnet. El contrato es público y auditable. Prototipo de investigación: no acepta pagos y los tokens no tienen valor monetario.",

    // Trading
    buy: "Comprar",
    sell: "Vender",
    price: "Precio",
    supply: "Circulación",
    holders: "Backers",
    change24: "Últimas 24 h",
    yourBalance: "Tu saldo",
    holdings: "Tus posiciones",
    earnings: "Ingresos",
    totalValue: "Valor total",
    reserveNote:
      "La reserva no puede ser retirada por nadie. Verificado on-chain.",
    seeOnChain: "Ver on-chain",
    youPay: "Pagas",
    youGet: "Recibes",
    amountToSpend: "Cuánto quieres gastar",
    youReceive: "Recibes",
    priceRange: "Margen de precio ±1%",
    platformFee: "Comisión plataforma",
    creatorFee: "Comisión creador",
    confirmBuy: "Confirmar compra",
    confirmSell: "Confirmar venta",
    quantity: "Cantidad",
    believersWord: "backers",
    reservePool: "Fondo de reserva",
    contract: "Contrato",
    youOwn: "Tienes",
    tokensShort: "tokens",
    recentActivity: "Actividad reciente",
    bought: "compró",
    sold: "vendió",
    launchedWord: "lanzó",
    viewToken: "Ver token",
    searchPh: "Busca creadores, clubes, comunidades…",

    // Launch wizard
    step1: "Tu historia",
    step2: "La curva",
    step3: "Abrir",
    launchMine: "Abrir mi economía",
    shareMoment: "¡La abriste!",
    shareCopy: "Comparte tu enlace para que tu círculo interno entre temprano.",
    shareWA: "Compartir por WhatsApp",
    copyLink: "Copiar enlace",
    receipt: "Comprobante",
    done: "Listo",
    launchYourToken: "Abre tu economía",
    launchName: "Nombre del token",
    launchSymbol: "Símbolo",
    launchBio: "Bio corta",
    launchStartPrice: "Precio inicial",
    next: "Siguiente",
    back: "Atrás",
    step1Sub: "Cuéntanos quién eres. Lo verán tus primeros backers.",
    step2Sub: "Elige cómo se mueve el precio cuando tus backers entran.",
    step3Sub: "Revisa y abre tu ronda. Se firma contigo en segundos.",

    // Dashboard
    send: "Enviar",
    refresh: "Actualizar",
    sendTitle: "Enviar",
    recipientAddress: "Dirección destino",
    amount: "Cantidad",
    sendSuccess: "Enviado con éxito",
  },

  en: {
    // Devnet disclaimer
    devnetBanner:
      "Matiz is a research prototype deployed on Solana Devnet. It is not in production, it does not accept payments, and the tokens have no monetary value.",
    devnetShort: "Research prototype on Solana Devnet · no monetary value",
    devnetParams:
      "All figures are simulated devnet parameters. No real money is charged or paid out.",

    // Nav
    signIn: "Sign in",
    signInGoogle: "Sign in with Google",
    explore: "Explore",
    allTokens: "Tokens",
    allTokensTitle: "All tokens",
    allTokensSub: "Every economy launched on Matiz.",
    searchCreators: "Search a creator by name or symbol…",
    noResults: "No creators match your search.",
    fundWallet: "Fund wallet",
    noUsdcPrompt: "No USDC yet? Top up your wallet to back a creator.",
    guideTitle: "You've been invited to back someone early",
    guideSub: "See how to start in under a minute, then connect to get in.",
    copied: "Copied!",
    shareToken: "Share token",
    dashboard: "Dashboard",
    launch: "Launch",
    creators: "Creators",
    portfolio: "Portfolio",
    home: "Home",
    langSwitch: "ES",

    // Hero
    eyebrow: "The Return on Influence economy",
    heroH1: "Your fans don't have to just subscribe.",
    heroH2: "They can back you ",
    heroH2Accent: "early.",
    heroSub:
      "Turn your free audience into an economy of early backers. Instead of a subscription that evaporates every month, your fans take a tokenized position in your career: access, founder-fan status, and a stake in your growth. Like a startup seed round, but for your community.",
    launchYourEconomy: "Open your economy",
    seeWhoAlready: "See who already did",
    heroMeta1: "3 steps to open",
    heroMeta2: "Just digital dollars",
    heroMeta3: "Sign in with Google",

    // Promises
    promisesHeader: "What we promise you",
    promise1Title: "A subscriber consumes. A backer participates.",
    promise1Body:
      "Instead of paying a monthly fee that disappears, your fans take a position in your economy. The ones who arrive first come in lower and are recorded as founder fans. This isn't a subscription — it's a community of early backers where recognition is mutual. (In this prototype everything runs on devnet: the tokens have no monetary value.)",
    promise2Title: "Your backers belong to you.",
    promise2Body:
      "If a subscription platform changes the rules tomorrow, takes a bigger cut, or shuts down your account — your backers stay with you. They live on-chain, not on someone else's server. The relationship is yours, not the platform's.",
    promise3Title: "No one can touch the reserve.",
    promise3Body:
      "Every contribution that comes in is locked inside a public contract. Not us, not you, not a hacker can withdraw it. The only way it leaves is when a backer sells their token. Mathematically. Verifiable in two clicks.",

    // How it works
    howHeader: "How it works, in three steps",
    step1Title: "1. Open your round.",
    step1Body:
      "Sign in with Google. Add a name, a symbol, a photo. Set your creator fee: between 0% and 5%. The $25 launch fee is a simulated devnet parameter — no real money is charged. Done: you have a link to invite your inner circle.",
    step2Title: "2. Your fans come in as backers.",
    step2Body:
      "Every person who believes in you takes a share of your economy with devnet tokens. The first ones — your friends & family round — come in lower. The curve price rises with each new backer. Everything goes into a public reserve that no one can empty.",
    step3Title: "3. They grow with you.",
    step3Body:
      "The more backers join, the higher the curve price goes. If anyone wants out, they return their share at the price the curve dictates and the reserve answers for it. You receive a percentage of every transaction. All of it with devnet tokens that have no monetary value.",
    plusOneTitle: "+1. You can take part too.",
    plusOneBody:
      "Nothing stops you from taking a share of your own token: come into your own round early, back your community when it needs it, or gift a share to the founder fans who supported you from day one. You're the creator, and you can also take part.",
    curveCaptionShort: "The earlier you back, the lower you come in.",

    // Guarantee
    guaranteeTitle: "The promise lives in the code.",
    guaranteeBody1:
      "On other platforms, you have to trust the company. On Matiz, you trust public math.",
    guaranteeBody2:
      "The function that would allow withdrawing the reserve was **physically deleted from the code before launch**. It doesn't exist. Not a hacker, not a rogue employee, not us — no one can touch it. The only way funds leave is when a backer sells their token, and they receive exactly what the curve says.",
    guaranteeBody3: "All of it is public. Verifiable. Auditable.",
    guaranteeCta: "See the contract on Solana Explorer →",

    // Mosseri
    mosseriTitle: "The Head of Instagram already said it.",
    mosseriIntro:
      "In 2022, Adam Mosseri took the TED stage. He described a future where creators own their community. Where fans don't just subscribe — they back them early, like a startup. Where if a platform disappears, the relationship with the audience survives.",
    mosseriQuote:
      '"No company can ever take Lisa\'s community away from her. Instagram could disappear tomorrow, and she would maintain her relationship with her subscribers, and she would maintain her income."',
    mosseriAttrib: "— Adam Mosseri, Head of Instagram",
    mosseriPunch:
      'Then he admitted: "Meta can\'t build this. No single company can."',
    mosseriWeDid: "We're researching it.",
    mosseriCta: "Watch the TED →",

    // For whom
    forWhomHeader: "Matiz is for you if…",
    forWhom1Title: "You live off your content and your community.",
    forWhom1Body:
      "Subscription creators, premium content, memberships, close friends. People whose fans pay for direct access, not just to follow. Matiz turns those subscribers into backers: whoever showed up when you were starting is recorded on-chain, as a founder fan and part of your story.",
    forWhom2Title: "Your inner circle deserves more than a 'thank you.'",
    forWhom2Body:
      'Your most loyal fans — the ones who renew every month, the ones who message you, the ones who came first — can own a real piece of your economy. With perks: exclusive content, unreleased material, private calls, early access, priority. And if someone leaves, the value stays in the community.',
    forWhom3Title: "You believe in someone and want to truly back them.",
    forWhom3Body:
      "Not as a subscription that evaporates every month. As a position that gets recorded, gives you access and founder-fan status, and that you can withdraw whenever you want. In this prototype the signal is symbolic: it runs on devnet and the tokens have no monetary value.",

    // Stories placeholder
    storiesTitle: "Stories, coming soon.",
    storiesBody:
      "We're working with the first creators who will open their economy on Matiz. When their stories are ready, we'll tell them here.",
    storiesCta:
      "Are you a creator and want to be one of the first? Write to us →",

    // Featured
    featuredLabel: "Moving now",
    featuredTitle: "Creators to back",

    // FAQ
    faqHeader: "Frequent questions",
    faq1q: "What network does Matiz run on today?",
    faq1a:
      "Solana Devnet. Matiz is a research prototype: it is not in production, it does not accept payments, and the tokens it mints have no monetary value. Everything you see on the platform runs on test assets.",
    faq2q: "Does this replace my subscription?",
    faq2a:
      "It doesn't have to. You can keep your subscription platform and use Matiz to turn your most loyal fans into backers: access, founder-fan status, and a position in your economy. It's the early-backing layer, not a replacement for your day-to-day content.",
    faq3q: "How does the curve work?",
    faq3a:
      'The price follows a public formula: it rises as more backers enter circulation and falls as they leave. The contract\'s reserve can always answer a sale at the price the curve dictates — no "waiting for liquidity." On devnet you can try it yourself.',
    faq4q: "What parameters does the prototype use?",
    faq4a:
      "Platform fee 0.5% per transaction, creator fee between 0% and 5%, and $25 at launch. These are simulated devnet parameters, not prices: no real money is charged or paid out, and they may change.",

    // CTA final
    ctaH1: "Your free audience is already an economy.",
    ctaH2: "It just needs to turn into backers.",

    // Footer
    footProduct: "Product",
    footCompany: "Company",
    footLegal: "Legal",
    footCommunity: "Community",
    footExplore: "Explore",
    footHowItWorks: "How it works",
    footFaq: "FAQ",
    footPricing: "Pricing",
    footSimulations: "Simulations",
    footAbout: "About",
    footBlog: "Blog",
    footWhitepaper: "Whitepaper",
    footMarketResearch: "Market research",
    footContact: "Contact",
    footTerms: "Terms",
    footPrivacy: "Privacy",
    footAccessibility: "Accessibility",
    footSolanaNote:
      "Matiz runs on Solana Devnet. The contract is public and auditable. Research prototype: it does not accept payments and the tokens have no monetary value.",

    // Trading
    buy: "Buy",
    sell: "Sell",
    price: "Price",
    supply: "In circulation",
    holders: "Backers",
    change24: "Last 24 h",
    yourBalance: "Your balance",
    holdings: "Your holdings",
    earnings: "Earnings",
    totalValue: "Total value",
    reserveNote:
      "The reserve cannot be withdrawn by anyone. Verified on-chain.",
    seeOnChain: "See on-chain",
    youPay: "You pay",
    youGet: "You get",
    amountToSpend: "How much to spend",
    youReceive: "You receive",
    priceRange: "Price range ±1%",
    platformFee: "Platform fee",
    creatorFee: "Creator fee",
    confirmBuy: "Confirm buy",
    confirmSell: "Confirm sell",
    quantity: "Quantity",
    believersWord: "backers",
    reservePool: "Reserve pool",
    contract: "Contract",
    youOwn: "You own",
    tokensShort: "tokens",
    recentActivity: "Recent activity",
    bought: "bought",
    sold: "sold",
    launchedWord: "launched",
    viewToken: "View token",
    searchPh: "Search creators, clubs, communities…",

    // Launch wizard
    step1: "Your story",
    step2: "The curve",
    step3: "Open",
    launchMine: "Open my economy",
    shareMoment: "You opened it!",
    shareCopy: "Share your link so your inner circle gets in early.",
    shareWA: "Share on WhatsApp",
    copyLink: "Copy link",
    receipt: "Receipt",
    done: "Done",
    launchYourToken: "Open your economy",
    launchName: "Token name",
    launchSymbol: "Symbol",
    launchBio: "Short bio",
    launchStartPrice: "Starting price",
    next: "Next",
    back: "Back",
    step1Sub: "Tell us who you are. Your first backers will see this.",
    step2Sub: "Pick how the price moves when your backers arrive.",
    step3Sub: "Review and open your round. Signed with you in seconds.",

    // Dashboard
    send: "Send",
    refresh: "Refresh",
    sendTitle: "Send",
    recipientAddress: "Recipient address",
    amount: "Amount",
    sendSuccess: "Sent successfully!",
  },
};
