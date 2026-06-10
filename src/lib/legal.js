// Legal content (Terms of Service + Privacy Policy) for the GembaBlockchain dApps,
// operated by GEMBA EOOD. Testnet, non-custodial, valueless test assets.
// Rendered by the Terms / Privacy pages in EN / BG / ES. This is the canonical source.
export const LEGAL_UPDATED = "12 June 2026";
export const LEGAL_ENTITY = "GEMBA EOOD";
export const LEGAL_EMAIL = "contacts@gembait.com";

export const LEGAL = {
  en: {
    termsTitle: "Terms of Service",
    privacyTitle: "Privacy Policy",
    updatedLabel: "Last updated",
    intro:
      "Please read these terms carefully. By connecting a wallet to, or otherwise using, this application you accept them in full. If you do not agree, do not use the application.",
    terms: [
      { h: "1. Who we are", p: [
        "This application (the “App”) is operated by GEMBA EOOD, a company registered in Bulgaria (“we”, “us”, “the Operator”). The App is a non-custodial interface to open-source smart contracts deployed on GembaBlockchain.",
        "Contact: contacts@gembait.com.",
      ] },
      { h: "2. Acceptance of these Terms", p: [
        "By connecting a blockchain wallet to the App, signing the consent message, or otherwise using the App, you confirm that you have read, understood and agree to be bound by these Terms of Service and the Privacy Policy.",
        "You must be at least 18 years old and legally capable of entering into a contract. You are responsible for ensuring that your use of the App is lawful in your jurisdiction.",
      ] },
      { h: "3. Testnet — valueless test assets", p: [
        "The App currently operates on a public test network (GembaBlockchain Testnet, EVM chainId 821207). The native coin GMB and any test stablecoins (USDT/USDC/EURC test tokens) made available are experimental, valueless test assets. They are not money, securities, e-money, or investments, carry no monetary value, and must not be bought, sold or treated as having value.",
        "GembaBlockchain provides no liquidity for GMB, operates no exchange, and does not redeem any token for fiat currency.",
      ] },
      { h: "4. Non-custodial service", p: [
        "The App is a non-custodial interface. We never take custody or control of your wallet, your private keys or your assets. All transactions are initiated and signed by you and executed by smart contracts according to their published code.",
        "Funds placed into an escrow or contest are held by the relevant smart contract, not by us, and are released strictly in accordance with that contract’s logic. We cannot reverse, freeze, recover or modify any on-chain transaction.",
      ] },
      { h: "5. Fees", p: [
        "A fixed creation fee may be charged in fiat currency through GembaPay, an independent third-party payment processor, when you create a contract through the App. That fee is collected by the Operator for providing and maintaining the service and is separate from on-chain network gas fees, which are paid by you in GMB.",
        "Amounts deposited into escrow or as contest prizes are not fees — they remain under the control of the relevant smart contract and are released to the parties per its code.",
      ] },
      { h: "6. Your responsibilities", p: [
        "You are solely responsible for: securing your wallet and keys; the accuracy and legality of every parameter you submit (addresses, amounts, descriptions, documents, beneficiaries); verifying counterparties; and the tax and legal consequences of your activity.",
        "Transactions on a blockchain are final and irreversible. Always double-check addresses and amounts before signing. We cannot help you recover assets sent in error or to an incorrect address.",
      ] },
      { h: "7. Documents & IPFS", p: [
        "Any document, file or content you attach is pinned to IPFS, a public, distributed storage network, and referenced on a public blockchain. Such content is public, may be copied by third parties and cannot be guaranteed to be deleted. Do not upload sensitive personal data, secrets or anything you are not authorised to make public.",
      ] },
      { h: "8. No warranties", p: [
        "The App and the underlying smart contracts are provided “as is” and “as available”, without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, availability, accuracy or non-infringement. The software is experimental and may contain bugs.",
      ] },
      { h: "9. Assumption of risk", p: [
        "You understand and accept the risks of blockchain technology, including smart-contract vulnerabilities, network failures or congestion, validator misbehaviour, wallet or key compromise, and changes to the protocol. You use the App at your own risk.",
      ] },
      { h: "10. Limitation of liability", p: [
        "To the maximum extent permitted by applicable law, the Operator and its team shall not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of assets, profits, data or goodwill, arising out of or in connection with your use of (or inability to use) the App or the smart contracts.",
      ] },
      { h: "11. Prohibited use", p: [
        "You must not use the App for any unlawful purpose, including money laundering, terrorist financing, fraud, sanctions evasion, or to infringe the rights of others, and you must not interfere with or attack the App or the network.",
      ] },
      { h: "12. Intellectual property & open source", p: [
        "The smart contracts are released as open source under the Apache-2.0 licence. The App’s user interface, branding and content are owned by the Operator. Nothing here grants you rights to our trademarks.",
      ] },
      { h: "13. Changes", p: [
        "We may update these Terms from time to time. The “last updated” date shows the current version. Continued use of the App after a change constitutes acceptance of the updated Terms.",
      ] },
      { h: "14. Governing law", p: [
        "These Terms are governed by the laws of the Republic of Bulgaria and applicable European Union law. Disputes are subject to the competent courts of Bulgaria, without prejudice to any mandatory consumer-protection rights you may have.",
      ] },
    ],
    privacy: [
      { h: "1. Data controller", p: [
        "The data controller is GEMBA EOOD, Bulgaria. For any privacy request, contact contacts@gembait.com.",
      ] },
      { h: "2. Our privacy-first design", p: [
        "The App is designed to process as little personal data as possible. We do not require you to create an account or provide your name to use it. We do not use tracking or advertising cookies.",
      ] },
      { h: "3. What we process", p: [
        "Public blockchain data: your wallet address and on-chain transactions are inherently public and processed by the network, not by us. Local storage: your browser stores app preferences, form drafts and your Terms-of-Service consent on your device. Payment metadata: when you pay a creation fee, GembaPay processes the payment; we receive an order reference and status, not your card details. Contact form: if you email us or use a contact form, we process the email address and message you provide. Documents: files you upload are placed on public IPFS (see the Terms).",
      ] },
      { h: "4. On-chain data is public and immutable", p: [
        "Information written to the blockchain (addresses, amounts, contract parameters, IPFS references) is public, replicated worldwide and cannot be erased or altered. Do not put personal data on-chain. The right to erasure cannot apply to immutable on-chain records; it applies only to off-chain data we hold.",
      ] },
      { h: "5. Legal basis (GDPR)", p: [
        "We process data on the basis of your consent (which you may withdraw), the performance of the service you request, and our legitimate interest in operating and securing the App.",
      ] },
      { h: "6. Third parties", p: [
        "GembaPay (payment processing) and the public IPFS network and blockchain act independently and have their own terms and policies. We do not sell your data.",
      ] },
      { h: "7. Retention", p: [
        "Off-chain order and contact records are kept only as long as needed for the purpose collected and applicable legal requirements, then deleted. On-chain data persists by the nature of the blockchain.",
      ] },
      { h: "8. Your rights", p: [
        "Subject to applicable law, you may request access to, correction or deletion of the off-chain personal data we hold, object to or restrict processing, and lodge a complaint with the Bulgarian Commission for Personal Data Protection (CPDP). Contact contacts@gembait.com to exercise these rights.",
      ] },
      { h: "9. Changes", p: [
        "We may update this Policy; the “last updated” date reflects the current version.",
      ] },
    ],
  },

  bg: {
    termsTitle: "Общи условия",
    privacyTitle: "Политика за поверителност",
    updatedLabel: "Последно обновено",
    intro:
      "Моля, прочетете внимателно тези условия. Като свържете портфейл или използвате това приложение, ги приемате изцяло. Ако не сте съгласни, не използвайте приложението.",
    terms: [
      { h: "1. Кои сме ние", p: [
        "Това приложение („Приложението“) се управлява от GEMBA EOOD, дружество, регистрирано в България („ние“, „Операторът“). Приложението е некустодиален интерфейс към отворенокодови смарт контракти върху GembaBlockchain.",
        "Контакт: contacts@gembait.com.",
      ] },
      { h: "2. Приемане на условията", p: [
        "Като свържете портфейл, подпишете съобщението за съгласие или използвате Приложението, вие потвърждавате, че сте прочели и приемате тези Общи условия и Политиката за поверителност.",
        "Трябва да сте пълнолетни и дееспособни. Вие отговаряте употребата да е законна във вашата юрисдикция.",
      ] },
      { h: "3. Тестова мрежа — активи без стойност", p: [
        "Приложението работи върху публична тестова мрежа (GembaBlockchain Testnet, EVM chainId 821207). Родната монета GMB и всички тестови стейбълкоини (USDT/USDC/EURC) са експериментални активи без стойност. Те не са пари, ценни книжа или инвестиция и не бива да се купуват или продават.",
        "GembaBlockchain не предоставя ликвидност за GMB, не оперира борса и не обменя токени срещу фиат.",
      ] },
      { h: "4. Некустодиална услуга", p: [
        "Приложението е некустодиален интерфейс. Ние никога не държим и не контролираме вашия портфейл, ключове или активи. Всички транзакции се подписват от вас и се изпълняват от смарт контракти според кода им.",
        "Средствата в escrow или конкурс се държат от съответния смарт контракт, не от нас, и се освобождават строго според логиката му. Не можем да обръщаме или променяме on-chain транзакция.",
      ] },
      { h: "5. Такси", p: [
        "При създаване на договор може да бъде начислена фиксирана фиат такса през GembaPay — независим платёжен оператор. Тази такса е за предоставяне на услугата и е отделна от мрежовата газ такса, която плащате в GMB.",
        "Сумите, внесени в escrow или като награди, не са такси — те остават под контрола на смарт контракта.",
      ] },
      { h: "6. Ваши отговорности", p: [
        "Вие отговаряте изцяло за: сигурността на портфейла и ключовете си; точността и законосъобразността на всеки параметър (адреси, суми, описания, документи); проверката на контрагенти; и данъчните и правни последици.",
        "Транзакциите са окончателни и необратими. Винаги проверявайте адреси и суми преди подпис. Не можем да възстановим активи, изпратени по грешка.",
      ] },
      { h: "7. Документи и IPFS", p: [
        "Всеки документ или файл, който прикачите, се закача към IPFS — публична, разпределена мрежа — и се реферира на публичен блокчейн. Такова съдържание е публично и не може да се гарантира, че ще бъде изтрито. Не качвайте чувствителни лични данни.",
      ] },
      { h: "8. Без гаранции", p: [
        "Приложението и смарт контрактите се предоставят „както са“ и „както са налични“, без каквито и да било гаранции. Софтуерът е експериментален и може да съдържа грешки.",
      ] },
      { h: "9. Поемане на риск", p: [
        "Вие разбирате и приемате рисковете на блокчейн технологията, вкл. уязвимости в смарт контракти, мрежови проблеми и компрометиране на ключове. Използвате Приложението на собствен риск.",
      ] },
      { h: "10. Ограничаване на отговорност", p: [
        "До максималната степен, разрешена от закона, Операторът не отговаря за косвени, случайни или последващи вреди, нито за загуба на активи, печалба или данни, свързани с употребата на Приложението.",
      ] },
      { h: "11. Забранена употреба", p: [
        "Не бива да използвате Приложението за незаконни цели, вкл. изпиране на пари, измама или заобикаляне на санкции, нито да атакувате Приложението или мрежата.",
      ] },
      { h: "12. Интелектуална собственост", p: [
        "Смарт контрактите са отворен код под лиценз Apache-2.0. Потребителският интерфейс и марката са собственост на Оператора.",
      ] },
      { h: "13. Промени", p: [
        "Можем да актуализираме тези условия. Продължаващата употреба означава приемане на обновените условия.",
      ] },
      { h: "14. Приложимо право", p: [
        "Тези условия се регулират от законите на Република България и правото на ЕС. Споровете са подсъдни на компетентните български съдилища.",
      ] },
    ],
    privacy: [
      { h: "1. Администратор на данни", p: [
        "Администратор на личните данни е GEMBA EOOD, България. За всякакво искане: contacts@gembait.com.",
      ] },
      { h: "2. Дизайн с приоритет на поверителността", p: [
        "Приложението е проектирано да обработва минимум лични данни. Не изискваме регистрация или име. Не използваме рекламни или следящи бисквитки.",
      ] },
      { h: "3. Какво обработваме", p: [
        "Публични блокчейн данни: адресът на портфейла и транзакциите са публични и се обработват от мрежата. Локално хранилище: браузърът ви запазва настройки, чернови на форми и съгласието ви с условията. Платёжни данни: при плащане GembaPay обработва транзакцията; ние получаваме референция и статус, не данните на картата ви. Форма за контакт: имейл и съобщението, които предоставяте. Документи: файловете се качват на публичен IPFS.",
      ] },
      { h: "4. On-chain данните са публични и непроменливи", p: [
        "Информацията, записана на блокчейна (адреси, суми, параметри, IPFS референции) е публична и не може да бъде изтрита. Не поставяйте лични данни on-chain. Правото „да бъдеш забравен“ важи само за off-chain данните, които държим.",
      ] },
      { h: "5. Правно основание (GDPR)", p: [
        "Обработваме данни на основание вашето съгласие (което можете да оттеглите), изпълнение на услугата и наш легитимен интерес да оперираме и защитим Приложението.",
      ] },
      { h: "6. Трети страни", p: [
        "GembaPay (плащания) и публичните IPFS и блокчейн мрежи действат независимо и имат собствени политики. Не продаваме вашите данни.",
      ] },
      { h: "7. Съхранение", p: [
        "Off-chain записите се пазят само колкото е необходимо и според закона, след което се изтриват. On-chain данните остават по природата на блокчейна.",
      ] },
      { h: "8. Вашите права", p: [
        "Съгласно закона можете да поискате достъп, корекция или изтриване на off-chain личните данни, да възразите срещу обработката и да подадете жалба до КЗЛД. Пишете на contacts@gembait.com.",
      ] },
      { h: "9. Промени", p: [
        "Можем да актуализираме тази политика; датата „последно обновено“ показва текущата версия.",
      ] },
    ],
  },

  es: {
    termsTitle: "Términos de servicio",
    privacyTitle: "Política de privacidad",
    updatedLabel: "Última actualización",
    intro:
      "Lee estos términos con atención. Al conectar una billetera o usar esta aplicación, los aceptas en su totalidad. Si no estás de acuerdo, no uses la aplicación.",
    terms: [
      { h: "1. Quiénes somos", p: [
        "Esta aplicación (la “App”) es operada por GEMBA EOOD, una empresa registrada en Bulgaria (“nosotros”, “el Operador”). La App es una interfaz no custodial para contratos inteligentes de código abierto desplegados en GembaBlockchain.",
        "Contacto: contacts@gembait.com.",
      ] },
      { h: "2. Aceptación de los términos", p: [
        "Al conectar una billetera, firmar el mensaje de consentimiento o usar la App, confirmas que has leído y aceptas estos Términos de servicio y la Política de privacidad.",
        "Debes ser mayor de 18 años y tener capacidad legal. Eres responsable de que tu uso sea lícito en tu jurisdicción.",
      ] },
      { h: "3. Red de prueba — activos sin valor", p: [
        "La App opera en una red de prueba pública (GembaBlockchain Testnet, EVM chainId 821207). La moneda nativa GMB y las stablecoins de prueba (USDT/USDC/EURC) son activos experimentales sin valor. No son dinero, valores ni inversión, y no deben comprarse ni venderse.",
        "GembaBlockchain no proporciona liquidez para GMB, no opera ningún exchange y no canjea tokens por dinero fiat.",
      ] },
      { h: "4. Servicio no custodial", p: [
        "La App es una interfaz no custodial. Nunca tomamos custodia ni control de tu billetera, tus claves o tus activos. Todas las transacciones las firmas tú y las ejecutan contratos inteligentes según su código.",
        "Los fondos en un depósito en garantía (escrow) o concurso los retiene el contrato inteligente, no nosotros, y se liberan estrictamente según su lógica. No podemos revertir ni modificar una transacción on-chain.",
      ] },
      { h: "5. Tarifas", p: [
        "Al crear un contrato puede cobrarse una tarifa fija en fiat mediante GembaPay, un procesador de pagos externo independiente. Esa tarifa es por prestar el servicio y es distinta del gas de red, que pagas en GMB.",
        "Los importes depositados en escrow o como premios no son tarifas — permanecen bajo el control del contrato inteligente.",
      ] },
      { h: "6. Tus responsabilidades", p: [
        "Eres el único responsable de: la seguridad de tu billetera y claves; la exactitud y legalidad de cada parámetro (direcciones, importes, descripciones, documentos); verificar a las contrapartes; y las consecuencias fiscales y legales.",
        "Las transacciones son finales e irreversibles. Verifica siempre direcciones e importes antes de firmar. No podemos recuperar activos enviados por error.",
      ] },
      { h: "7. Documentos e IPFS", p: [
        "Cualquier documento o archivo que adjuntes se fija en IPFS, una red de almacenamiento pública y distribuida, y se referencia en una blockchain pública. Ese contenido es público y no se garantiza su eliminación. No subas datos personales sensibles.",
      ] },
      { h: "8. Sin garantías", p: [
        "La App y los contratos se ofrecen “tal cual” y “según disponibilidad”, sin garantías de ningún tipo. El software es experimental y puede contener errores.",
      ] },
      { h: "9. Asunción de riesgos", p: [
        "Entiendes y aceptas los riesgos de la tecnología blockchain, incluidas vulnerabilidades de contratos, fallos de red y compromiso de claves. Usas la App bajo tu propio riesgo.",
      ] },
      { h: "10. Limitación de responsabilidad", p: [
        "En la máxima medida permitida por la ley, el Operador no será responsable de daños indirectos, incidentales o consecuentes, ni de pérdida de activos, beneficios o datos derivados del uso de la App.",
      ] },
      { h: "11. Uso prohibido", p: [
        "No debes usar la App para fines ilícitos, incluidos blanqueo de capitales, fraude o elusión de sanciones, ni atacar la App o la red.",
      ] },
      { h: "12. Propiedad intelectual", p: [
        "Los contratos inteligentes son de código abierto bajo licencia Apache-2.0. La interfaz y la marca son propiedad del Operador.",
      ] },
      { h: "13. Cambios", p: [
        "Podemos actualizar estos términos. El uso continuado tras un cambio constituye aceptación.",
      ] },
      { h: "14. Ley aplicable", p: [
        "Estos términos se rigen por las leyes de la República de Bulgaria y el Derecho de la UE. Las disputas se someten a los tribunales competentes de Bulgaria.",
      ] },
    ],
    privacy: [
      { h: "1. Responsable del tratamiento", p: [
        "El responsable es GEMBA EOOD, Bulgaria. Para cualquier solicitud: contacts@gembait.com.",
      ] },
      { h: "2. Diseño centrado en la privacidad", p: [
        "La App procesa los mínimos datos personales posibles. No requiere cuenta ni nombre. No usamos cookies de seguimiento ni publicidad.",
      ] },
      { h: "3. Qué procesamos", p: [
        "Datos públicos de blockchain: tu dirección y transacciones son públicas y las procesa la red. Almacenamiento local: tu navegador guarda preferencias, borradores y tu consentimiento. Datos de pago: GembaPay procesa el pago; recibimos una referencia y estado, no los datos de tu tarjeta. Formulario de contacto: el correo y mensaje que aportes. Documentos: los archivos se publican en IPFS.",
      ] },
      { h: "4. Los datos on-chain son públicos e inmutables", p: [
        "La información escrita en la blockchain es pública y no puede borrarse. No pongas datos personales on-chain. El derecho de supresión solo aplica a los datos off-chain que conservamos.",
      ] },
      { h: "5. Base jurídica (RGPD)", p: [
        "Tratamos los datos sobre la base de tu consentimiento (revocable), la ejecución del servicio y nuestro interés legítimo en operar y proteger la App.",
      ] },
      { h: "6. Terceros", p: [
        "GembaPay (pagos) y las redes públicas IPFS y blockchain actúan de forma independiente con sus propias políticas. No vendemos tus datos.",
      ] },
      { h: "7. Conservación", p: [
        "Los registros off-chain se conservan solo el tiempo necesario y según la ley, y luego se eliminan. Los datos on-chain persisten por la naturaleza de la blockchain.",
      ] },
      { h: "8. Tus derechos", p: [
        "Conforme a la ley, puedes solicitar acceso, rectificación o supresión de los datos off-chain, oponerte al tratamiento y presentar una reclamación ante la autoridad de control. Escribe a contacts@gembait.com.",
      ] },
      { h: "9. Cambios", p: [
        "Podemos actualizar esta política; la fecha de “última actualización” refleja la versión vigente.",
      ] },
    ],
  },
};
