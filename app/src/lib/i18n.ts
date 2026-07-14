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
    noUsdcPrompt: "¿Aún sin USDC? Recarga tu billetera para comprar.",
    guideTitle: "Te invitaron a creer en alguien",
    guideSub:
      "Mira cómo empezar en menos de un minuto y conéctate para comprar.",
    copied: "¡Copiado!",
    shareToken: "Compartir token",
    dashboard: "Panel",
    launch: "Lanzar",
    creators: "Creadores",
    portfolio: "Cartera",
    home: "Inicio",
    langSwitch: "EN",

    // Hero
    eyebrow: "Tu matiz tiene una comunidad",
    heroH1: "Tu audiencia en Instagram es prestada.",
    heroH2: "Tu economía en Matiz es ",
    heroH2Accent: "tuya.",
    heroSub:
      "Tokeniza tu marca personal. Deja que quienes crean en ti temprano crezcan contigo. Tu comunidad, on-chain, portable, y tuya para siempre.",
    launchYourEconomy: "Lanza tu economía",
    seeWhoAlready: "Explora quiénes ya lo hicieron",
    heroMeta1: "3 pasos para lanzar",
    heroMeta2: "Con dólares digitales",
    heroMeta3: "Entras con Google",

    // Promises
    promisesHeader: "Lo que te prometemos",
    promise1Title: "Cuando tú creces, tu comunidad crece contigo.",
    promise1Body:
      "Tus fans no te siguen desde afuera: sostienen tu proyecto desde adentro. Quienes llegaron primero entraron con menos. Esto no es una suscripción — es una economía compartida donde el reconocimiento es mutuo. (En este prototipo todo ocurre en devnet: los tokens no tienen valor monetario.)",
    promise2Title: "Tu comunidad es tuya.",
    promise2Body:
      "Si mañana Instagram cierra tu cuenta, TikTok te desmonetiza, o Twitter cambia las reglas — tus fans tokenizados siguen contigo. Viven on-chain, no en un servidor ajeno. Son tuyos, no de una plataforma.",
    promise3Title: "La reserva no la puede tocar nadie.",
    promise3Body:
      "Cada peso que entra queda bloqueado en un contrato público. Ni nosotros, ni tú, ni un hacker pueden sacarlo. La única forma de que salga es que un fan venda su token. Matemáticamente. Verificable en dos clics.",

    // How it works
    howHeader: "Cómo funciona, en tres pasos",
    step1Title: "1. Lanza tu token.",
    step1Body:
      "Entra con Google. Pon un nombre, un símbolo, una foto. Define tu comisión de creador: entre 0% y 5%. La comisión de lanzamiento ($25) es un parámetro simulado en devnet — no se cobra dinero real. Listo: tienes un link para compartir.",
    step2Title: "2. Tu comunidad entra.",
    step2Body:
      "Cada persona que cree en ti toma una parte de tu economía con tokens de devnet. El precio de la curva sube con cada compra. Los primeros entran más abajo. Todo queda en una reserva pública que nadie puede vaciar.",
    step3Title: "3. Crecen contigo.",
    step3Body:
      "Mientras más gente se une, más sube el precio de la curva. Si alguien quiere salir, devuelve su parte al precio que dicta la curva y la reserva responde. El creador recibe un porcentaje de cada transacción. Todo con tokens sin valor monetario, en devnet.",
    plusOneTitle: "+1. Tú también puedes entrar.",
    plusOneBody:
      "Nada te impide tomar una parte de tu propio token: entrar temprano, respaldar a tu comunidad cuando haga falta, o regalarle una parte a quienes te apoyaron desde el día uno. Eres creator y también puedes ser parte.",
    curveCaptionShort: "Cuanto antes crees, más bajo pagas.",

    // Guarantee
    guaranteeTitle: "La promesa está en el código.",
    guaranteeBody1:
      "En otras plataformas tienes que confiar en la compañía. En Matiz confías en matemáticas públicas.",
    guaranteeBody2:
      "La función que permitiría retirar la reserva fue **físicamente borrada del código antes del lanzamiento**. No existe. Ni un hacker, ni un empleado deshonesto, ni nosotros mismos podemos tocarla. La única forma de que los fondos salgan es que un fan venda su token — y recibe lo que la curva dice.",
    guaranteeBody3: "Todo es público. Verificable. Auditable.",
    guaranteeCta: "Ver el contrato en Solana Explorer →",

    // Mosseri
    mosseriTitle: "El Head of Instagram ya lo dijo.",
    mosseriIntro:
      "En 2022, Adam Mosseri subió al escenario de TED. Describió un futuro donde los creators son dueños de su comunidad. Donde sus fans invierten en ellos como en startups. Donde si una plataforma desaparece, la relación con la audiencia sobrevive.",
    mosseriQuote:
      '"Ninguna compañía puede quitarle a Lisa su comunidad. Instagram podría desaparecer mañana, y ella mantendría su relación con sus suscriptores, y mantendría sus ingresos."',
    mosseriAttrib: "— Adam Mosseri, Head of Instagram",
    mosseriPunch:
      'Después admitió: "Meta no puede construir esto. Ninguna compañía sola puede."',
    mosseriWeDid: "Nosotros lo estamos investigando.",
    mosseriCta: "Ver el TED completo →",

    // For whom
    forWhomHeader: "Matiz es para ti si…",
    forWhom1Title: "Eres artista y tu carrera es tu obra.",
    forWhom1Body:
      "Músicos, ilustradores, escritores, diseñadores, muralistas. Personas cuyo trabajo tiene fans reales, no solo seguidores. Matiz te deja explorar tu carrera como una economía: quien llegó cuando eras emergente queda registrado, on-chain, como parte de tu historia.",
    forWhom2Title: "Construiste una comunidad y quieres que dure.",
    forWhom2Body:
      'Si levantaste un club, un fandom, un movimiento — Matiz le da permanencia. Tus miembros más activos pueden tener una parte real del proyecto, no solo un "gracias" cada tanto. Y si alguien se va, el valor queda en la comunidad.',
    forWhom3Title: "Crees en alguien y quieres acompañarlo de verdad.",
    forWhom3Body:
      "No como donación anónima. No como suscripción que se evapora. Como una señal de apoyo que queda registrada y que puedes retirar cuando quieras. En este prototipo la señal es simbólica: corre en devnet y los tokens no tienen valor monetario.",

    // Stories placeholder
    storiesTitle: "Historias, pronto.",
    storiesBody:
      "Estamos trabajando con los primeros artistas que van a lanzar su economía en Matiz. Cuando sus historias estén listas, aquí las contaremos.",
    storiesCta: "¿Eres artista y quieres ser de los primeros? Escríbenos →",

    // Featured
    featuredLabel: "En movimiento",
    featuredTitle: "Gente en la que creer",

    // FAQ
    faqHeader: "Preguntas frecuentes",
    faq1q: "¿En qué red corre Matiz hoy?",
    faq1a:
      "En Solana Devnet. Matiz es un prototipo de investigación: no está en producción, no acepta pagos y los tokens que se emiten no tienen valor monetario. Todo lo que ves en la plataforma corre con activos de prueba.",
    faq2q: "¿Necesito saber de tecnología?",
    faq2a:
      "No. Entras con Google y la billetera se crea sola debajo del capó. Si nunca quieres ver una wallet, no la ves.",
    faq3q: "¿Cómo funciona la curva?",
    faq3a:
      'El precio sigue una fórmula pública: sube cuando entran más tokens en circulación y baja cuando salen. La reserva del contrato siempre puede responder a una venta al precio que dicta la curva, sin "esperar a que haya liquidez". En devnet puedes probarlo tú mismo.',
    faq4q: "¿Qué parámetros usa el prototipo?",
    faq4a:
      "Comisión de plataforma 0.5% por transacción, comisión de creador entre 0% y 5%, y $25 al lanzar. Son parámetros simulados en devnet, no precios: no se cobra ni se paga dinero real, y pueden cambiar.",

    // CTA final
    ctaH1: "Tu marca ya es una economía.",
    ctaH2: "Solo falta abrirla.",

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
    holders: "Creyentes",
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
    believersWord: "creyentes",
    reservePool: "Fondo de reserva",
    contract: "Contrato",
    youOwn: "Tienes",
    tokensShort: "tokens",
    recentActivity: "Actividad reciente",
    bought: "compró",
    sold: "vendió",
    launchedWord: "lanzó",
    viewToken: "Ver token",
    searchPh: "Busca artistas, creadores, clubes…",

    // Launch wizard
    step1: "Tu historia",
    step2: "La curva",
    step3: "Lanzar",
    launchMine: "Lanzar mi token",
    shareMoment: "¡Lo lanzaste!",
    shareCopy: "Comparte tu enlace para que tu gente entre temprano.",
    shareWA: "Compartir por WhatsApp",
    copyLink: "Copiar enlace",
    receipt: "Comprobante",
    done: "Listo",
    launchYourToken: "Lanza tu token",
    launchName: "Nombre del token",
    launchSymbol: "Símbolo",
    launchBio: "Bio corta",
    launchStartPrice: "Precio inicial",
    next: "Siguiente",
    back: "Atrás",
    step1Sub: "Cuéntanos quién eres. Lo verán tus primeros creyentes.",
    step2Sub: "Elige cómo se mueve el precio cuando tu gente entra.",
    step3Sub: "Revisa y lanza. Se firma contigo en segundos.",

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
    noUsdcPrompt: "No USDC yet? Top up your wallet to buy.",
    guideTitle: "You've been invited to believe in someone",
    guideSub: "See how to start in under a minute, then connect to buy.",
    copied: "Copied!",
    shareToken: "Share token",
    dashboard: "Dashboard",
    launch: "Launch",
    creators: "Creators",
    portfolio: "Portfolio",
    home: "Home",
    langSwitch: "ES",

    // Hero
    eyebrow: "Your hue has a community",
    heroH1: "Your audience on Instagram is borrowed.",
    heroH2: "Your economy on Matiz is ",
    heroH2Accent: "yours.",
    heroSub:
      "Tokenize your personal brand. Let the people who believed in you early grow with you. Your community, on-chain, portable, and yours forever.",
    launchYourEconomy: "Launch your economy",
    seeWhoAlready: "See who already did",
    heroMeta1: "3 steps to launch",
    heroMeta2: "Just digital dollars",
    heroMeta3: "Sign in with Google",

    // Promises
    promisesHeader: "What we promise you",
    promise1Title: "When you grow, your community grows with you.",
    promise1Body:
      "Your fans don't follow you from the outside — they hold up your project from within. The ones who arrived first came in lower. This isn't a subscription — it's a shared economy where recognition is mutual. (In this prototype everything runs on devnet: the tokens have no monetary value.)",
    promise2Title: "Your community belongs to you.",
    promise2Body:
      "If Instagram shuts down your account tomorrow, TikTok demonetizes you, or Twitter changes the rules — your tokenized fans stay with you. They live on-chain, not on someone else's server. They're yours, not the platform's.",
    promise3Title: "No one can touch the reserve.",
    promise3Body:
      "Every dollar that comes in is locked inside a public contract. Not us, not you, not a hacker can withdraw it. The only way it leaves is when a fan sells their token. Mathematically. Verifiable in two clicks.",

    // How it works
    howHeader: "How it works, in three steps",
    step1Title: "1. Launch your token.",
    step1Body:
      "Sign in with Google. Add a name, a symbol, a photo. Set your creator fee: between 0% and 5%. The $25 launch fee is a simulated devnet parameter — no real money is charged. Done: you have a link to share.",
    step2Title: "2. Your community joins.",
    step2Body:
      "Every person who believes in you takes a share of your economy with devnet tokens. The curve price rises with each purchase. The first ones come in lower. Everything goes into a public reserve that no one can empty.",
    step3Title: "3. They grow with you.",
    step3Body:
      "The more people join, the higher the curve price goes. If anyone wants out, they return their share at the price the curve dictates and the reserve answers for it. The creator receives a percentage of every transaction. All of it with devnet tokens that have no monetary value.",
    plusOneTitle: "+1. You can take part too.",
    plusOneBody:
      "Nothing stops you from taking a share of your own token: come in early, back your community when it needs it, or gift a share to the people who supported you from day one. You're the creator, and you can also take part.",
    curveCaptionShort: "The earlier you believe, the lower you pay.",

    // Guarantee
    guaranteeTitle: "The promise lives in the code.",
    guaranteeBody1:
      "On other platforms, you have to trust the company. On Matiz, you trust public math.",
    guaranteeBody2:
      "The function that would allow withdrawing the reserve was **physically deleted from the code before launch**. It doesn't exist. Not a hacker, not a rogue employee, not us — no one can touch it. The only way funds leave is when a fan sells their token, and they receive exactly what the curve says.",
    guaranteeBody3: "All of it is public. Verifiable. Auditable.",
    guaranteeCta: "See the contract on Solana Explorer →",

    // Mosseri
    mosseriTitle: "The Head of Instagram already said it.",
    mosseriIntro:
      "In 2022, Adam Mosseri took the TED stage. He described a future where creators own their community. Where fans invest in them like startups. Where if a platform disappears, the relationship with the audience survives.",
    mosseriQuote:
      '"No company can ever take Lisa\'s community away from her. Instagram could disappear tomorrow, and she would maintain her relationship with her subscribers, and she would maintain her income."',
    mosseriAttrib: "— Adam Mosseri, Head of Instagram",
    mosseriPunch:
      'Then he admitted: "Meta can\'t build this. No single company can."',
    mosseriWeDid: "We're researching it.",
    mosseriCta: "Watch the TED →",

    // For whom
    forWhomHeader: "Matiz is for you if…",
    forWhom1Title: "You're an artist and your career is your work.",
    forWhom1Body:
      "Musicians, illustrators, writers, designers, muralists. People whose work has real fans, not just followers. Matiz lets you explore your career as an economy: whoever showed up when you were emerging is recorded on-chain as part of your story.",
    forWhom2Title: "You built a community and you want it to last.",
    forWhom2Body:
      'If you\'ve built a club, a fandom, a movement — Matiz gives it permanence. Your most active members can own a real piece of the project, not just get the occasional "thank you." And if someone leaves, the value stays in the community.',
    forWhom3Title: "You believe in someone and want to truly stand with them.",
    forWhom3Body:
      "Not as an anonymous donation. Not as a subscription that evaporates. As a signal of support that gets recorded and that you can withdraw whenever you want. In this prototype the signal is symbolic: it runs on devnet and the tokens have no monetary value.",

    // Stories placeholder
    storiesTitle: "Stories, coming soon.",
    storiesBody:
      "We're working with the first artists who will launch their economy on Matiz. When their stories are ready, we'll tell them here.",
    storiesCta:
      "Are you an artist and want to be one of the first? Write to us →",

    // Featured
    featuredLabel: "Moving now",
    featuredTitle: "People to believe in",

    // FAQ
    faqHeader: "Frequent questions",
    faq1q: "What network does Matiz run on today?",
    faq1a:
      "Solana Devnet. Matiz is a research prototype: it is not in production, it does not accept payments, and the tokens it mints have no monetary value. Everything you see on the platform runs on test assets.",
    faq2q: "Do I need to be tech-savvy?",
    faq2a:
      "No. You sign in with Google and the wallet is created for you under the hood. If you never want to see a wallet, you don't.",
    faq3q: "How does the curve work?",
    faq3a:
      'The price follows a public formula: it rises as more tokens enter circulation and falls as they leave. The contract\'s reserve can always answer a sale at the price the curve dictates — no "waiting for liquidity." On devnet you can try it yourself.',
    faq4q: "What parameters does the prototype use?",
    faq4a:
      "Platform fee 0.5% per transaction, creator fee between 0% and 5%, and $25 at launch. These are simulated devnet parameters, not prices: no real money is charged or paid out, and they may change.",

    // CTA final
    ctaH1: "Your brand is already an economy.",
    ctaH2: "It just needs to open.",

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
    holders: "Believers",
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
    believersWord: "believers",
    reservePool: "Reserve pool",
    contract: "Contract",
    youOwn: "You own",
    tokensShort: "tokens",
    recentActivity: "Recent activity",
    bought: "bought",
    sold: "sold",
    launchedWord: "launched",
    viewToken: "View token",
    searchPh: "Search artists, creators, clubs…",

    // Launch wizard
    step1: "Your story",
    step2: "The curve",
    step3: "Launch",
    launchMine: "Launch my token",
    shareMoment: "You launched!",
    shareCopy: "Share your link so your people get in early.",
    shareWA: "Share on WhatsApp",
    copyLink: "Copy link",
    receipt: "Receipt",
    done: "Done",
    launchYourToken: "Launch your token",
    launchName: "Token name",
    launchSymbol: "Symbol",
    launchBio: "Short bio",
    launchStartPrice: "Starting price",
    next: "Next",
    back: "Back",
    step1Sub: "Tell us who you are. Your first believers will see this.",
    step2Sub: "Pick how the price moves when your people arrive.",
    step3Sub: "Review and launch. Signed with you in seconds.",

    // Dashboard
    send: "Send",
    refresh: "Refresh",
    sendTitle: "Send",
    recipientAddress: "Recipient address",
    amount: "Amount",
    sendSuccess: "Sent successfully!",
  },
};
