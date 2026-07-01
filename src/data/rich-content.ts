import { WebsiteRichContent } from "@/types";
import { logoFor, screenshotsFor } from "./tool-helpers";

export const richContent: Record<string, WebsiteRichContent> = {
  notion: {
    logoUrl: logoFor("https://notion.so"),
    screenshots: ["/images/tools/notion.png"],
    whoIsItFor:
      "Notion suits people who want one flexible workspace for notes, tasks, wikis, and lightweight databases—solo creators, startups, and teams tired of juggling Google Docs, Trello, and spreadsheets.",
    notForYouIf:
      "You need heavy project management with Gantt charts, time tracking, or strict enterprise compliance out of the box.",
    howItWorks: [
      {
        step: 1,
        title: "Create your workspace",
        description:
          "Sign up, pick a template (personal dashboard, wiki, or project tracker), or start from a blank page. Notion organizes everything into pages you can nest infinitely.",
      },
      {
        step: 2,
        title: "Build pages with blocks",
        description:
          "Add text, to-do lists, databases, embeds, and synced blocks. Drag blocks to reorder; turn any page into a table, board, calendar, or gallery view.",
      },
      {
        step: 3,
        title: "Share and collaborate",
        description:
          "Invite teammates with view or edit access, publish pages to the web, or sync across desktop, mobile, and browser. Changes save automatically in real time.",
      },
    ],
    pricing: [
      { label: "Free", price: "$0", note: "Unlimited pages for individuals; limited file uploads and guests" },
      { label: "Plus", price: "$10/user/mo", note: "Unlimited uploads, 30-day version history" },
      { label: "Business", price: "$18/user/mo", note: "SAML SSO, private teamspaces, advanced permissions" },
      { label: "Enterprise", price: "Custom", note: "Audit log, advanced security, dedicated support" },
    ],
    pros: [
      "Extremely flexible—one tool replaces notes, docs, tasks, and light CRM",
      "Generous free tier for solo use with cross-platform sync",
      "Database views (board, calendar, gallery) without extra apps",
      "Strong template gallery and active community",
      "Real-time collaboration with comments and mentions",
    ],
    cons: [
      "Steep learning curve if you over-customize early",
      "Offline mode is limited compared to native note apps",
      "Large workspaces can feel slow on older hardware",
      "Not ideal as a dedicated PM or spreadsheet replacement",
    ],
    faq: [
      {
        question: "Is Notion free for personal use?",
        answer:
          "Yes. The free plan includes unlimited pages and blocks for individuals. Paid plans add team features, longer version history, and higher upload limits.",
      },
      {
        question: "Can I use Notion offline?",
        answer:
          "Notion supports limited offline access on desktop and mobile—you can view and edit cached pages, but full sync requires an internet connection.",
      },
      {
        question: "How do I cancel a Notion subscription?",
        answer:
          "Go to Settings → Billing → Change plan and downgrade to Free. You keep your workspace; paid features stop at the end of the billing period.",
      },
      {
        question: "Does Notion work on iPhone and Android?",
        answer:
          "Yes. Native apps for iOS and Android support most features, including quick capture, widgets, and camera uploads.",
      },
      {
        question: "Can I import from Evernote or Confluence?",
        answer:
          "Notion offers import tools for Evernote, Confluence, Asana, Trello, and more via Settings → Import.",
      },
      {
        question: "Is my data private on Notion?",
        answer:
          "Notion encrypts data in transit and at rest. Business and Enterprise plans add SAML SSO and advanced admin controls.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  hellofresh: {
    logoUrl: logoFor("https://hellofresh.com"),
    screenshots: ["/images/tools/hellofresh.png"],
    whoIsItFor:
      "HelloFresh is for busy households that want home-cooked dinners without meal planning or grocery runs—especially beginners who appreciate pre-portioned ingredients and step-by-step cards.",
    notForYouIf:
      "You already meal prep in bulk on Sundays or need strict keto, vegan, or allergy-safe menus without cross-contamination risk.",
    howItWorks: [
      {
        step: 1,
        title: "Pick your plan",
        description:
          "Choose meals per week (2–6), servings per meal (2 or 4), and dietary preferences like Veggie, Calorie Smart, or Quick & Easy.",
      },
      {
        step: 2,
        title: "Select recipes",
        description:
          "Browse the weekly menu and swap dishes before the cutoff. Recipes include prep time, difficulty, and nutrition info.",
      },
      {
        step: 3,
        title: "Cook and enjoy",
        description:
          "A chilled box arrives with labeled ingredients and recipe cards. Most meals take 25–40 minutes from box to table.",
      },
    ],
    pricing: [
      { label: "2 meals / 2 servings", price: "~$9.99/serving", note: "Varies by plan and promotions" },
      { label: "3 meals / 2 servings", price: "~$8.99/serving", note: "Most popular for couples" },
      { label: "4–6 meals / 4 servings", price: "~$7.99–8.49/serving", note: "Better per-serving value for families" },
      { label: "Shipping", price: "~$9.99/box", note: "Often waived on first box or larger plans" },
    ],
    pros: [
      "Eliminates meal planning and reduces impulse grocery buys",
      "Pre-portioned ingredients cut food waste",
      "Recipes are genuinely beginner-friendly with clear photos",
      "Flexible skip/pause—no long-term contract required",
      "Wide menu rotation with seasonal options",
    ],
    cons: [
      "Per-serving cost is higher than shopping yourself",
      "Packaging creates noticeable cardboard and plastic waste",
      "Limited control over exact brands and ingredient quality",
      "Delivery windows can be inflexible in some zip codes",
    ],
    faq: [
      {
        question: "How do I skip a week or cancel HelloFresh?",
        answer:
          "Log in before the weekly cutoff (usually 11:59 PM PST several days before delivery), go to Plan Settings, and skip or cancel. No phone call required.",
      },
      {
        question: "Does HelloFresh accommodate allergies?",
        answer:
          "HelloFresh labels major allergens but processes all meals in shared facilities. It is not suitable for severe allergies; contact support for specific concerns.",
      },
      {
        question: "What if ingredients are missing or damaged?",
        answer:
          "Use the app or website to report issues under Help. HelloFresh typically credits your account or sends replacements quickly.",
      },
      {
        question: "Can I choose delivery day?",
        answer:
          "Available delivery days depend on your zip code. You pick a preferred day during signup and can often change it in account settings.",
      },
      {
        question: "Do I need to be home for delivery?",
        answer:
          "No. Boxes are insulated with ice packs and safe for several hours. You can add delivery instructions for your driver.",
      },
      {
        question: "Is there a vegetarian option?",
        answer:
          "Yes. Select the Veggie preference or choose plant-based recipes from the weekly menu each week.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  canva: {
    logoUrl: logoFor("https://canva.com"),
    screenshots: ["/images/tools/canva.png"],
    whoIsItFor:
      "Canva is built for marketers, small business owners, teachers, and creators who need polished graphics, presentations, and social posts without learning Photoshop.",
    notForYouIf:
      "You need pixel-perfect print production, advanced photo retouching, or professional vector illustration tools.",
    howItWorks: [
      {
        step: 1,
        title: "Start from a template",
        description:
          "Search thousands of templates for Instagram posts, pitch decks, flyers, resumes, and more—or set custom dimensions.",
      },
      {
        step: 2,
        title: "Customize with drag-and-drop",
        description:
          "Swap text, colors, fonts, and images. Use Brand Kit (Pro) to lock brand colors and logos across designs.",
      },
      {
        step: 3,
        title: "Export or publish",
        description:
          "Download as PNG, PDF, or MP4; schedule to social channels; or share an edit link with teammates for feedback.",
      },
    ],
    pricing: [
      { label: "Free", price: "$0", note: "250,000+ templates, 5GB storage, basic export" },
      { label: "Pro", price: "$15/mo", note: "Brand Kit, background remover, premium assets" },
      { label: "Teams", price: "$10/user/mo", note: "3+ users, brand controls, approval workflows" },
      { label: "Enterprise", price: "Custom", note: "SSO, advanced admin, dedicated success" },
    ],
    pros: [
      "Lowest learning curve of any major design tool",
      "Massive template library for every format and occasion",
      "Built-in AI tools (Magic Write, background remover) on Pro",
      "Real-time collaboration and commenting",
      "Generous free tier for casual use",
    ],
    cons: [
      "Not a replacement for Adobe Illustrator or InDesign for pro print",
      "Free tier locks many premium elements behind paywalls",
      "Complex designs can feel sluggish in the browser",
      "Limited fine control over typography and kerning",
    ],
    faq: [
      {
        question: "Can I use Canva for commercial work?",
        answer:
          "Yes, with Pro or paid elements. Free assets have licensing terms—check each element's license. Pro includes commercial use rights for premium content.",
      },
      {
        question: "How do I cancel Canva Pro?",
        answer:
          "Account Settings → Billing & plans → Cancel subscription. You keep Pro until the period ends, then revert to Free.",
      },
      {
        question: "Does Canva have a mobile app?",
        answer:
          "Yes. iOS and Android apps support most editing features, quick social posts, and camera-to-design workflows.",
      },
      {
        question: "Can I upload my own fonts?",
        answer:
          "Brand Kit on Canva Pro lets you upload custom fonts for your brand. Free users are limited to Canva's font library.",
      },
      {
        question: "What file formats can I export?",
        answer:
          "PNG, JPG, PDF (standard and print), SVG (Pro), MP4/GIF for video and animation, and PPTX for presentations.",
      },
      {
        question: "Is Canva available outside the US?",
        answer:
          "Yes. Canva works globally in 100+ countries with localized templates and pricing in many regions.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  hubspot: {
    logoUrl: logoFor("https://hubspot.com"),
    screenshots: ["/images/tools/hubspot.png"],
    whoIsItFor:
      "HubSpot fits growing businesses that want CRM, email marketing, and sales pipelines in one platform—especially inbound-focused teams moving off spreadsheets.",
    notForYouIf:
      "You only need a simple email newsletter tool or a lightweight CRM with no plans to scale marketing automation.",
    howItWorks: [
      {
        step: 1,
        title: "Set up your CRM",
        description:
          "Import contacts, define deal stages, and connect your inbox. HubSpot auto-logs emails and tracks every touchpoint.",
      },
      {
        step: 2,
        title: "Launch campaigns",
        description:
          "Build emails, landing pages, and forms with drag-and-drop editors. Segment audiences and trigger workflows on behavior.",
      },
      {
        step: 3,
        title: "Measure and optimize",
        description:
          "Dashboards show traffic, conversions, and pipeline velocity. Attribution reports tie revenue back to campaigns.",
      },
    ],
    pricing: [
      { label: "Free CRM", price: "$0", note: "Unlimited contacts, basic email, meeting scheduler" },
      { label: "Starter", price: "From $20/mo", note: "Removes branding, adds simple automation" },
      { label: "Professional", price: "From $890/mo", note: "Full marketing & sales hubs, workflows" },
      { label: "Enterprise", price: "From $3,600/mo", note: "Custom objects, advanced reporting, SSO" },
    ],
    pros: [
      "Best-in-class free CRM with no contact limits",
      "Unified view of marketing, sales, and service data",
      "Excellent educational content (HubSpot Academy)",
      "Powerful automation at Professional tier and above",
      "Large integration marketplace (1,000+ apps)",
    ],
    cons: [
      "Pricing jumps sharply from Starter to Professional",
      "Can feel overwhelming for solo operators",
      "Advanced features require onboarding and training",
      "Contract terms on higher tiers can be rigid",
    ],
    faq: [
      {
        question: "Is HubSpot CRM really free?",
        answer:
          "Yes. The free CRM includes unlimited contacts, deal tracking, email logging, and basic tools. Paid hubs add marketing automation, sequences, and advanced reporting.",
      },
      {
        question: "Can I migrate from Salesforce or Pipedrive?",
        answer:
          "HubSpot provides import tools and migration guides. Many agencies specialize in HubSpot migrations for larger datasets.",
      },
      {
        question: "Does HubSpot work for e-commerce?",
        answer:
          "Yes, with Shopify and WooCommerce integrations. You can trigger abandoned-cart emails and segment customers by purchase behavior.",
      },
      {
        question: "How do I cancel a paid HubSpot plan?",
        answer:
          "Contact your account rep or use in-app billing settings. Downgrading may require removing contacts above free-tier limits.",
      },
      {
        question: "Is there a mobile CRM app?",
        answer:
          "Yes. HubSpot's iOS and Android apps support contact lookup, call logging, task management, and deal updates on the go.",
      },
      {
        question: "What regions does HubSpot support?",
        answer:
          "HubSpot serves customers globally with data centers in the US and EU. GDPR tools and EU hosting are available on paid plans.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  revolut: {
    logoUrl: logoFor("https://revolut.com"),
    screenshots: ["/images/tools/revolut.png"],
    whoIsItFor:
      "Revolut suits travelers, expats, and digital natives who want multi-currency spending, instant transfers, and budgeting in one app—without a traditional bank branch.",
    notForYouIf:
      "You need full FDIC-style deposit insurance as your primary checking account or want in-person branch support.",
    howItWorks: [
      {
        step: 1,
        title: "Open an account in minutes",
        description:
          "Download the app, verify your identity with a photo ID, and get a virtual card instantly. Physical cards ship within days.",
      },
      {
        step: 2,
        title: "Spend and exchange globally",
        description:
          "Hold 30+ currencies, exchange at interbank rates (within plan limits), and pay abroad without hidden markup fees.",
      },
      {
        step: 3,
        title: "Track and save",
        description:
          "Use Vaults for round-ups and savings goals. Analytics categorize spending; notifications flag unusual activity.",
      },
    ],
    pricing: [
      { label: "Standard", price: "$0/mo", note: "Basic exchange limits, virtual card" },
      { label: "Plus", price: "~$3.99/mo", note: "Higher ATM limits, disposable cards" },
      { label: "Premium", price: "~$9.99/mo", note: "Travel insurance, lounge passes, metal card" },
      { label: "Metal", price: "~$16.99/mo", note: "Cashback, premium support, exclusive perks" },
    ],
    pros: [
      "Excellent exchange rates for travel and freelance income",
      "Instant peer-to-peer transfers and bill splitting",
      "Clean UI with real-time spending analytics",
      "Virtual and disposable cards for online security",
      "Crypto, stocks, and commodities in the same app",
    ],
    cons: [
      "Not a full replacement bank in every country",
      "Customer support can be slow for complex issues",
      "Free-tier exchange and ATM limits are tight",
      "Feature availability varies significantly by region",
    ],
    faq: [
      {
        question: "Is Revolut safe to use?",
        answer:
          "Revolut is regulated as an e-money institution in the UK and holds licenses in multiple countries. Funds are safeguarded, but deposit insurance rules differ from traditional banks.",
      },
      {
        question: "Can I use Revolut in the US?",
        answer:
          "Yes. US customers get USD accounts, ACH transfers, and direct deposit. Feature set differs from UK/EU versions.",
      },
      {
        question: "How do I close my Revolut account?",
        answer:
          "Withdraw remaining balances, then go to Profile → Account → Close account in the app. Resolve any pending transactions first.",
      },
      {
        question: "Are there fees for currency exchange?",
        answer:
          "Weekday interbank rates apply within your plan's monthly limit. A small markup applies on weekends and above free-tier caps.",
      },
      {
        question: "Does Revolut support Apple Pay and Google Pay?",
        answer:
          "Yes. Add your Revolut card to Apple Wallet or Google Pay for contactless payments worldwide.",
      },
      {
        question: "Can I receive my salary on Revolut?",
        answer:
          "In supported regions, yes—share your account details for direct deposit. US users can set up ACH direct deposit.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  bet365: {
    logoUrl: logoFor("https://bet365.com"),
    screenshots: screenshotsFor("Bet365", 3),
    whoIsItFor:
      "Bet365 is for adults in legal jurisdictions who want deep sports markets, in-play betting, and live streaming on major events—all from a mature, feature-rich platform.",
    notForYouIf:
      "You are in a restricted region, struggle with gambling limits, or want a simple occasional bet without market complexity.",
    howItWorks: [
      {
        step: 1,
        title: "Register and verify",
        description:
          "Create an account, confirm your age and identity, and deposit via card, e-wallet, or bank transfer depending on your region.",
      },
      {
        step: 2,
        title: "Browse markets",
        description:
          "Navigate sports, in-play, and casino sections. Build singles, accumulators, or same-game parlays with live odds updates.",
      },
      {
        step: 3,
        title: "Bet and cash out",
        description:
          "Place bets with stake limits you set. Use Cash Out to settle early; watch selected events via live stream when funded.",
      },
    ],
    pricing: [
      { label: "Account", price: "Free", note: "No subscription; deposit only what you bet" },
      { label: "Minimum deposit", price: "~$5–10", note: "Varies by payment method and region" },
      { label: "Withdrawals", price: "Free", note: "Most methods; processing times vary" },
      { label: "Odds format", price: "N/A", note: "Decimal, fractional, or American—your choice" },
    ],
    pros: [
      "Industry-leading depth of in-play markets",
      "Live streaming on many sports with funded account",
      "Fast bet placement on mobile during live events",
      "Cash Out and partial Cash Out on eligible bets",
      "Established reputation with 20+ years in market",
    ],
    cons: [
      "Interface can overwhelm casual bettors",
      "Restricted or blocked in several countries and US states",
      "Winning accounts may face stake limitations",
      "Responsible gambling tools require self-discipline to use",
    ],
    faq: [
      {
        question: "Is Bet365 legal where I live?",
        answer:
          "Availability depends on local law. Bet365 holds licenses in the UK, parts of Europe, and select US states. Check bet365.com for your region.",
      },
      {
        question: "How do I set deposit limits?",
        answer:
          "Go to Responsible Gambling settings to set daily, weekly, or monthly deposit and loss limits. Changes may have a cooling-off period.",
      },
      {
        question: "Can I bet on mobile?",
        answer:
          "Yes. Bet365's iOS and Android apps mirror the full site—live betting, streaming, and Cash Out included.",
      },
      {
        question: "How long do withdrawals take?",
        answer:
          "E-wallets often process within 24 hours; debit cards and bank transfers can take 1–5 business days after verification.",
      },
      {
        question: "Does Bet365 offer a welcome bonus?",
        answer:
          "Promotions vary by region and change frequently. Check the Promotions page after signup; always read wagering requirements.",
      },
      {
        question: "How do I self-exclude?",
        answer:
          "Use Responsible Gambling tools for timeouts or self-exclusion from 6 months to permanent. Contact support or use GamStop in the UK.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  myfitnesspal: {
    logoUrl: logoFor("https://myfitnesspal.com"),
    screenshots: screenshotsFor("MyFitnessPal", 3),
    whoIsItFor:
      "MyFitnessPal is for anyone tracking calories, macros, or weight loss who wants the largest food database and barcode scanning to log meals in seconds.",
    notForYouIf:
      "You find calorie counting stressful or want guided meal plans and coaching without logging every bite.",
    howItWorks: [
      {
        step: 1,
        title: "Set your goals",
        description:
          "Enter age, weight, activity level, and target (lose, maintain, or gain). MFP calculates daily calorie and macro targets.",
      },
      {
        step: 2,
        title: "Log food and exercise",
        description:
          "Search 14M+ foods, scan barcodes, or use restaurant entries. Sync workouts from Apple Health, Fitbit, or Garmin.",
      },
      {
        step: 3,
        title: "Track progress",
        description:
          "Review daily totals, weekly reports, and weight trends. Adjust targets as you hit plateaus or change goals.",
      },
    ],
    pricing: [
      { label: "Free", price: "$0", note: "Food logging, barcode scan, basic diary" },
      { label: "Premium", price: "$19.99/mo", note: "Macro goals by meal, ad-free, insights" },
      { label: "Premium Annual", price: "$79.99/yr", note: "~$6.67/mo; best value" },
    ],
    pros: [
      "Unmatched food database with crowd-sourced entries",
      "Barcode scanner makes logging packaged food instant",
      "Integrates with virtually every fitness tracker",
      "Recipe importer pulls nutrition from URLs",
      "Free tier is fully functional for basic tracking",
    ],
    cons: [
      "Crowd-sourced data can be inaccurate—always verify",
      "Premium price increased significantly in recent years",
      "Ads on free tier are intrusive",
      "No built-in meal planning or coaching on base app",
    ],
    faq: [
      {
        question: "Is MyFitnessPal still free?",
        answer:
          "Yes. Core food logging, barcode scanning, and weight tracking remain free. Premium adds macro-by-meal goals, ad-free experience, and deeper analytics.",
      },
      {
        question: "How accurate is the food database?",
        answer:
          "Verified entries are reliable, but user-submitted data varies. Cross-check suspicious entries against package labels.",
      },
      {
        question: "Can I cancel Premium?",
        answer:
          "Cancel via App Store/Google Play subscriptions or myfitnesspal.com account settings. Access continues until the period ends.",
      },
      {
        question: "Does it work with Apple Watch?",
        answer:
          "Yes. Sync steps and workouts via Apple Health. The watch app shows quick calorie glance but full logging is on iPhone.",
      },
      {
        question: "Can I track macros on the free plan?",
        answer:
          "Yes, but only daily totals. Premium lets you set per-meal macro targets and see macro-focused insights.",
      },
      {
        question: "Is MyFitnessPal available outside the US?",
        answer:
          "Yes. The database includes international brands, though coverage is strongest in US, UK, and Canada.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  duolingo: {
    logoUrl: logoFor("https://duolingo.com"),
    screenshots: ["/images/tools/duolingo.png"],
    whoIsItFor:
      "Duolingo is for casual learners who want bite-sized daily practice in 40+ languages—commuters, travelers, and students building vocabulary without a classroom schedule.",
    notForYouIf:
      "You need conversational fluency fast or formal certification prep without supplemental tutoring.",
    howItWorks: [
      {
        step: 1,
        title: "Pick a language and goal",
        description:
          "Choose from Spanish, French, Japanese, and more. Set a daily XP goal (5–20 minutes) to match your schedule.",
      },
      {
        step: 2,
        title: "Complete lessons",
        description:
          "Work through skill trees with reading, listening, speaking, and matching exercises. Mistakes cost hearts on the free plan.",
      },
      {
        step: 3,
        title: "Build your streak",
        description:
          "Daily practice earns XP and maintains streaks. Leaderboards and friends add accountability; review weak words automatically.",
      },
    ],
    pricing: [
      { label: "Free", price: "$0", note: "All lessons with ads and limited hearts" },
      { label: "Super Duolingo", price: "$12.99/mo", note: "No ads, unlimited hearts, personalized practice" },
      { label: "Super Annual", price: "$83.99/yr", note: "~$7/mo" },
      { label: "Family Plan", price: "$119.99/yr", note: "Up to 6 accounts" },
    ],
    pros: [
      "Genuinely free core curriculum for every language",
      "Gamification (streaks, leagues) drives daily consistency",
      "Short lessons fit into any schedule",
      "Speaking and listening exercises on mobile",
      "40+ languages including less common options",
    ],
    cons: [
      "Won't make you fluent without real conversation practice",
      "Heart system on free tier interrupts learning flow",
      "Sentence examples can feel artificial or quirky",
      "Advanced grammar explanations are thin",
    ],
    faq: [
      {
        question: "Can you really learn a language with Duolingo?",
        answer:
          "Duolingo builds vocabulary and basic grammar well. Pair it with conversation practice, podcasts, or tutoring for real fluency.",
      },
      {
        question: "How do I cancel Super Duolingo?",
        answer:
          "Cancel through Apple/Google subscription settings or duolingo.com. Super features remain until the billing period ends.",
      },
      {
        question: "What are hearts?",
        answer:
          "Hearts are lives on the free plan—you lose one per mistake. At zero hearts, practice a lesson to refill or wait, or upgrade to Super.",
      },
      {
        question: "Does Duolingo work offline?",
        answer:
          "Super subscribers can download lessons for offline use. Free users need an internet connection.",
      },
      {
        question: "Is Duolingo good for kids?",
        answer:
          "Duolingo has a separate Duolingo ABC for reading and a family-friendly main app. Super Family Plan covers up to 6 profiles.",
      },
      {
        question: "Which languages are most complete?",
        answer:
          "Spanish, French, and German have the deepest content. Newer or smaller languages may have shorter trees.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  netflix: {
    logoUrl: logoFor("https://netflix.com"),
    screenshots: ["/images/tools/netflix.png"],
    whoIsItFor:
      "Netflix is for households that want on-demand movies and series without ads (on paid plans), with strong originals and a recommendation engine that improves over time.",
    notForYouIf:
      "You primarily watch live sports or want the latest theatrical releases the week they leave cinemas.",
    howItWorks: [
      {
        step: 1,
        title: "Choose a plan",
        description:
          "Pick Standard with ads, Standard, or Premium based on resolution, simultaneous screens, and download needs.",
      },
      {
        step: 2,
        title: "Set up profiles",
        description:
          "Create profiles for each viewer with kid-safe options. Netflix tailors recommendations per profile.",
      },
      {
        step: 3,
        title: "Stream anywhere",
        description:
          "Watch on TV, laptop, phone, or tablet. Download episodes on mobile for offline viewing on supported plans.",
      },
    ],
    pricing: [
      { label: "Standard with ads", price: "$6.99/mo", note: "1080p, 2 streams, ad breaks" },
      { label: "Standard", price: "$15.49/mo", note: "1080p, 2 streams, no ads, downloads" },
      { label: "Premium", price: "$22.99/mo", note: "4K, 4 streams, spatial audio" },
    ],
    pros: [
      "Massive library with acclaimed originals (Stranger Things, Squid Game)",
      "Excellent recommendation algorithm and Continue Watching",
      "Download for offline on mobile and tablet",
      "Up to 4 profiles with kids mode and PIN locks",
      "Works on virtually every device and smart TV",
    ],
    cons: [
      "Password-sharing crackdown adds household verification friction",
      "Catalog rotates—titles leave without warning",
      "Ad tier has unskippable commercials",
      "4K locked behind the most expensive plan",
    ],
    faq: [
      {
        question: "How do I cancel Netflix?",
        answer:
          "Account → Membership → Cancel membership. You keep access until the billing period ends. No cancellation fees.",
      },
      {
        question: "Can I share Netflix outside my household?",
        answer:
          "Netflix restricts sharing to your household. Extra member slots can be added for a monthly fee in supported regions.",
      },
      {
        question: "Does Netflix work offline?",
        answer:
          "Yes on Standard and Premium. Tap the download icon on supported titles in the mobile app.",
      },
      {
        question: "What countries is Netflix available in?",
        answer:
          "Netflix operates in 190+ countries. Catalog varies by region due to licensing deals.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Netflix no longer offers a standard free trial in most markets. Promotional offers appear occasionally for new or returning members.",
      },
      {
        question: "How many devices can stream at once?",
        answer:
          "Standard with ads and Standard allow 2 simultaneous streams. Premium allows 4.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  amazon: {
    logoUrl: logoFor("https://amazon.com"),
    screenshots: screenshotsFor("Amazon", 3),
    whoIsItFor:
      "Amazon is the default for shoppers who want vast selection, fast delivery, and easy returns—from daily essentials to electronics—especially Prime members.",
    notForYouIf:
      "You prefer supporting local shops or want the lowest price on every single item without comparing sellers.",
    howItWorks: [
      {
        step: 1,
        title: "Search or browse",
        description:
          "Find products via search, categories, or recommendations. Check seller ratings, reviews, and Buy Box eligibility.",
      },
      {
        step: 2,
        title: "Checkout with 1-Click",
        description:
          "Add to cart or buy instantly. Choose delivery speed—Prime gets free same-day or next-day on millions of items.",
      },
      {
        step: 3,
        title: "Track and return",
        description:
          "Monitor shipments in real time. Most items return free within 30 days via drop-off or pickup.",
      },
    ],
    pricing: [
      { label: "Shopping account", price: "Free", note: "Pay per order plus shipping" },
      { label: "Prime", price: "$14.99/mo", note: "Free delivery, Prime Video, photos" },
      { label: "Prime Annual", price: "$139/yr", note: "Best value for frequent shoppers" },
      { label: "Prime Student", price: "$7.49/mo", note: "50% off with .edu verification" },
    ],
    pros: [
      "Unbeatable selection across virtually every category",
      "Prime delivery is genuinely fast in major metros",
      "Easy returns on most items with prepaid labels",
      "Verified reviews and Q&A help decision-making",
      "Subscribe & Save discounts on recurring essentials",
    ],
    cons: [
      "Counterfeit and fake review problems on some listings",
      "Prime price increased; value depends on order frequency",
      "Overwhelming third-party seller marketplace",
      "Customer service quality varies by issue type",
    ],
    faq: [
      {
        question: "How do I cancel Amazon Prime?",
        answer:
          "Account → Prime membership → End membership. Benefits continue until the period ends; partial refunds may apply for annual plans.",
      },
      {
        question: "Is Amazon Prime worth it?",
        answer:
          "Worth it if you order multiple times per month and use Prime Video. Occasional shoppers may pay less without it.",
      },
      {
        question: "How do returns work?",
        answer:
          "Orders → Return items → select reason → print label or drop off at Whole Foods, Kohl's, or UPS. Refund typically processes in 3–5 days.",
      },
      {
        question: "Does Amazon ship internationally?",
        answer:
          "Amazon ships to many countries. Amazon Global lists eligible items; duties and shipping vary by destination.",
      },
      {
        question: "What is Amazon Subscribe & Save?",
        answer:
          "Schedule recurring deliveries on eligible products for 5–15% off. Skip or cancel anytime before shipment.",
      },
      {
        question: "Is there an Amazon mobile app?",
        answer:
          "Yes. iOS and Android apps support scanning barcodes in-store, AR preview, and real-time delivery tracking.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  todoist: {
    logoUrl: logoFor("https://todoist.com"),
    screenshots: screenshotsFor("Todoist", 3),
    whoIsItFor:
      "Todoist is for people who want a fast, focused task manager—capturing to-dos in natural language, organizing with projects and filters, without Notion-level complexity.",
    notForYouIf:
      "You need deep note-taking, wikis, or full team project management with Gantt charts and resource planning.",
    howItWorks: [
      {
        step: 1,
        title: "Capture tasks instantly",
        description:
          "Type \"Call dentist tomorrow at 3pm p1\" and Todoist parses due date, time, and priority automatically.",
      },
      {
        step: 2,
        title: "Organize with projects and labels",
        description:
          "Group tasks into projects (#Work, #Personal), add labels (@email, @errands), and set filters for custom views.",
      },
      {
        step: 3,
        title: "Review and complete",
        description:
          "Use Today, Upcoming, and Karma views to stay on track. Sync across all devices; get reminders before deadlines.",
      },
    ],
    pricing: [
      { label: "Beginner", price: "$0", note: "5 projects, 5MB uploads" },
      { label: "Pro", price: "$4/mo", note: "300 projects, reminders, calendar layout" },
      { label: "Business", price: "$6/user/mo", note: "Team workspace, admin controls" },
    ],
    pros: [
      "Best-in-class natural language task input",
      "Clean, fast UI that stays out of your way",
      "Powerful filters and custom views for GTD workflows",
      "Excellent cross-platform sync and integrations (Zapier, Gmail)",
      "Karma gamification motivates consistent use",
    ],
    cons: [
      "Free plan limits projects to five",
      "No built-in docs or knowledge base",
      "Team features lag behind Asana or Linear for complex PM",
      "Comments and file attachments require Pro",
    ],
    faq: [
      {
        question: "Is Todoist free?",
        answer:
          "Yes. Beginner plan includes unlimited tasks and collaborators on up to 5 active projects. Pro unlocks reminders, more projects, and calendar views.",
      },
      {
        question: "How do I cancel Todoist Pro?",
        answer:
          "Settings → Subscription → Cancel. Pro features remain until the billing period ends.",
      },
      {
        question: "Does Todoist sync with Google Calendar?",
        answer:
          "Pro users can sync tasks to Google Calendar bidirectionally. Free users see a one-way feed.",
      },
      {
        question: "Is there a Todoist desktop app?",
        answer:
          "Yes for macOS, Windows, and Linux, plus web, iOS, Android, Apple Watch, and browser extensions.",
      },
      {
        question: "Can I import from Things or OmniFocus?",
        answer:
          "Todoist supports CSV import and direct migration guides for most major task apps.",
      },
      {
        question: "Does Todoist work offline?",
        answer:
          "Mobile and desktop apps cache tasks for offline viewing and editing; changes sync when you reconnect.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  doordash: {
    logoUrl: logoFor("https://doordash.com"),
    screenshots: screenshotsFor("DoorDash", 3),
    whoIsItFor:
      "DoorDash is for anyone who wants restaurant food delivered or ready for pickup without calling—especially in suburban areas with wide merchant coverage.",
    notForYouIf:
      "You're cost-conscious about fees and tips, or your favorite restaurants aren't on the platform.",
    howItWorks: [
      {
        step: 1,
        title: "Browse restaurants",
        description:
          "Search by cuisine, rating, or delivery time. Filter for DashPass partners, deals, and pickup options.",
      },
      {
        step: 2,
        title: "Customize and checkout",
        description:
          "Add items, modifiers, and special instructions. See upfront fees, tax, tip, and estimated delivery time before paying.",
      },
      {
        step: 3,
        title: "Track your order",
        description:
          "Live map shows prep and driver location. Get notifications at each stage; rate the experience after delivery.",
      },
    ],
    pricing: [
      { label: "Pay per order", price: "Varies", note: "Food + delivery + service + tip" },
      { label: "DashPass", price: "$9.99/mo", note: "$0 delivery on eligible orders $12+" },
      { label: "DashPass Annual", price: "$96/yr", note: "20% savings vs monthly" },
    ],
    pros: [
      "Largest restaurant network in many US markets",
      "Real-time tracking is reliable and accurate",
      "DashPass pays for itself with 2–3 orders per month",
      "Pickup option skips delivery fees entirely",
      "Group orders simplify office and family meals",
    ],
    cons: [
      "Fees, service charges, and tips add up quickly",
      "Food quality depends on restaurant packaging and driver care",
      "Surge pricing during peak hours",
      "Customer support can be slow for missing items",
    ],
    faq: [
      {
        question: "How do I cancel DashPass?",
        answer:
          "Account → Manage DashPass → Cancel. Benefits continue until the period ends. No partial refunds on monthly plans.",
      },
      {
        question: "What if my order is wrong or missing items?",
        answer:
          "Report issues in the app under Help → Order Issue. DoorDash typically issues credits or refunds within 24–48 hours.",
      },
      {
        question: "Can I schedule delivery in advance?",
        answer:
          "Yes. Select \"Schedule\" at checkout to pick a delivery window up to several days ahead.",
      },
      {
        question: "Is DoorDash available in my area?",
        answer:
          "DoorDash operates in 7,000+ cities across the US, Canada, Australia, and New Zealand. Enter your address on the homepage to check.",
      },
      {
        question: "How much should I tip?",
        answer:
          "DoorDash suggests tips based on order size and distance. 15–20% is standard; you can adjust before or after delivery.",
      },
      {
        question: "Does DoorDash have a student discount?",
        answer:
          "DashPass offers student pricing in eligible areas via SheerID verification—check Promotions in the app.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  figma: {
    logoUrl: logoFor("https://figma.com"),
    screenshots: ["/images/tools/figma.png"],
    whoIsItFor:
      "Figma is essential for product designers, design systems teams, and founders who need collaborative UI design, prototyping, and developer handoff in the browser.",
    notForYouIf:
      "You only need raster photo editing or print layout—Adobe Photoshop and InDesign are better fits.",
    howItWorks: [
      {
        step: 1,
        title: "Design in the canvas",
        description:
          "Create frames, components, and auto-layout structures. Use constraints and variants for responsive, reusable UI elements.",
      },
      {
        step: 2,
        title: "Prototype and collaborate",
        description:
          "Link frames into interactive prototypes. Teammates edit simultaneously with live cursors and threaded comments.",
      },
      {
        step: 3,
        title: "Hand off to developers",
        description:
          "Dev Mode gives engineers CSS, iOS, and Android specs. Export assets at 1x, 2x, or SVG directly from the file.",
      },
    ],
    pricing: [
      { label: "Starter", price: "$0", note: "3 files, unlimited personal drafts" },
      { label: "Professional", price: "$15/editor/mo", note: "Unlimited files, team libraries" },
      { label: "Organization", price: "$45/editor/mo", note: "Design systems, analytics, SSO" },
      { label: "Enterprise", price: "$75/editor/mo", note: "Advanced security, dedicated support" },
    ],
    pros: [
      "Real-time multiplayer editing is industry-leading",
      "Components, variants, and auto-layout are best-in-class",
      "Browser-based—no installs, works on any OS",
      "Dev Mode streamlines design-to-code handoff",
      "Huge plugin ecosystem (Icons, Unsplash, accessibility)",
    ],
    cons: [
      "Performance degrades on very large files with hundreds of pages",
      "Offline editing is limited",
      "Free tier restricts active team files to three",
      "FigJam and Figma are separate products with separate billing",
    ],
    faq: [
      {
        question: "Is Figma free?",
        answer:
          "Starter is free with 3 design files and unlimited personal drafts. Professional unlocks unlimited team files and shared libraries.",
      },
      {
        question: "How do I cancel Figma Professional?",
        answer:
          "Admin → Billing → Cancel plan. Editors keep access until the period ends; files downgrade to Starter limits.",
      },
      {
        question: "Does Figma work offline?",
        answer:
          "Desktop apps cache open files for limited offline editing. Sync requires reconnection.",
      },
      {
        question: "What is Dev Mode?",
        answer:
          "Dev Mode is a developer-focused view showing specs, measurements, and code snippets. Included in paid plans.",
      },
      {
        question: "Can I import Sketch or Adobe XD files?",
        answer:
          "Yes. Figma imports .sketch and .xd files with good fidelity. Complex symbols may need cleanup.",
      },
      {
        question: "Is Figma available in China?",
        answer:
          "Figma operates globally but access in China can be inconsistent. Many teams use VPNs or localized alternatives.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  mailchimp: {
    logoUrl: logoFor("https://mailchimp.com"),
    screenshots: screenshotsFor("Mailchimp", 3),
    whoIsItFor:
      "Mailchimp suits small businesses, creators, and nonprofits sending newsletters and basic automation without hiring a marketing ops person.",
    notForYouIf:
      "You need enterprise-grade CRM integration, complex multi-channel journeys, or send millions of emails monthly on a tight budget.",
    howItWorks: [
      {
        step: 1,
        title: "Build your audience",
        description:
          "Import contacts or grow via signup forms and landing pages. Segment by tags, behavior, or purchase history.",
      },
      {
        step: 2,
        title: "Create campaigns",
        description:
          "Use the drag-and-drop email builder, templates, and AI content assist. Set up welcome series and abandoned-cart flows.",
      },
      {
        step: 3,
        title: "Send and analyze",
        description:
          "Schedule sends for optimal times. Track opens, clicks, bounces, and revenue attribution in one dashboard.",
      },
    ],
    pricing: [
      { label: "Free", price: "$0", note: "500 contacts, 1,000 sends/mo, Mailchimp branding" },
      { label: "Essentials", price: "From $13/mo", note: "5,000 sends, A/B tests, 3 audiences" },
      { label: "Standard", price: "From $20/mo", note: "Automation, retargeting ads, enhanced analytics" },
      { label: "Premium", price: "From $350/mo", note: "Advanced segmentation, phone support" },
    ],
    pros: [
      "Approachable for first-time email marketers",
      "Solid free tier for lists under 500 contacts",
      "Built-in landing pages and signup forms",
      "Pre-built automation templates (welcome, birthday, re-engage)",
      "Integrates with Shopify, WooCommerce, and Square",
    ],
    cons: [
      "Pricing scales steeply as your list grows",
      "Automation is basic compared to Klaviyo or ActiveCampaign",
      "Free plan adds Mailchimp footer branding",
      "UI redesign confused some long-time users",
    ],
    faq: [
      {
        question: "Is Mailchimp still free?",
        answer:
          "Yes for up to 500 contacts and 1,000 emails per month. Paid plans remove branding and add automation, A/B testing, and more sends.",
      },
      {
        question: "How do I cancel Mailchimp?",
        answer:
          "Account → Settings → Billing → Cancel. Downgrade to Free or export contacts before deletion.",
      },
      {
        question: "Can I send transactional emails?",
        answer:
          "Mailchimp focuses on marketing email. For transactional (receipts, password resets), use Mandrill (Mailchimp add-on) or a dedicated service.",
      },
      {
        question: "Does Mailchimp comply with GDPR?",
        answer:
          "Yes. Consent tools, double opt-in, and data processing agreements are available. You are responsible for lawful list collection.",
      },
      {
        question: "Is there a Mailchimp mobile app?",
        answer:
          "Yes. Monitor campaign performance and manage audiences on iOS and Android; full editing is best on desktop.",
      },
      {
        question: "What happens if I exceed my contact limit?",
        answer:
          "Mailchimp pauses sending until you upgrade or remove contacts. Set alerts to avoid surprise overages.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  robinhood: {
    logoUrl: logoFor("https://robinhood.com"),
    screenshots: screenshotsFor("Robinhood", 3),
    whoIsItFor:
      "Robinhood is for beginner investors who want commission-free stock and ETF trading with a simple mobile-first interface and fractional shares.",
    notForYouIf:
      "You need advanced charting, research tools, retirement planning depth, or prefer established full-service brokerages.",
    howItWorks: [
      {
        step: 1,
        title: "Open and fund your account",
        description:
          "Sign up in minutes, verify identity, and link a bank account. No minimum deposit required to start.",
      },
      {
        step: 2,
        title: "Research and trade",
        description:
          "Browse stocks, ETFs, options, and crypto. Buy fractional shares from $1. Market and limit orders available.",
      },
      {
        step: 3,
        title: "Track your portfolio",
        description:
          "Real-time portfolio value, dividend tracking, and performance charts. Enable recurring investments for dollar-cost averaging.",
      },
    ],
    pricing: [
      { label: "Standard", price: "$0 commission", note: "Stocks, ETFs, options (regulatory fees apply)" },
      { label: "Gold", price: "$5/mo", note: "Margin, bigger instant deposits, research" },
      { label: "Crypto", price: "Spread-based", note: "No commission but spread markup on trades" },
    ],
    pros: [
      "Pioneered commission-free trading for retail investors",
      "Fractional shares lower the barrier to expensive stocks",
      "Clean, intuitive mobile app for beginners",
      "Instant deposits (with Gold) and recurring buys",
      "IRA accounts with matching contributions (promotional)",
    ],
    cons: [
      "Limited research and analysis vs Fidelity or Schwab",
      "Payment for order flow raises best-execution questions",
      "Customer support was notoriously slow during meme-stock surges",
      "Crypto spreads can be wider than dedicated exchanges",
    ],
    faq: [
      {
        question: "Is Robinhood really commission-free?",
        answer:
          "Stock and ETF trades have $0 commission. Regulatory fees (SEC, FINRA) apply on sells. Robinhood earns from payment for order flow and subscriptions.",
      },
      {
        question: "Is my money safe with Robinhood?",
        answer:
          "Securities are SIPC-insured up to $500,000. Cash balances may have FDIC pass-through insurance via partner banks.",
      },
      {
        question: "How do I close my Robinhood account?",
        answer:
          "Sell positions, withdraw cash, then Account → Settings → Account → Deactivate. Download tax documents first.",
      },
      {
        question: "Does Robinhood offer IRAs?",
        answer:
          "Yes. Robinhood offers Traditional and Roth IRAs with a 1% match on contributions (terms apply).",
      },
      {
        question: "Can I trade options on Robinhood?",
        answer:
          "Yes after enabling options trading and passing suitability checks. Multi-leg strategies available on mobile.",
      },
      {
        question: "Is Robinhood available outside the US?",
        answer:
          "Robinhood primarily serves US residents. UK crypto trading launched separately; stock trading remains US-focused.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  draftkings: {
    logoUrl: logoFor("https://draftkings.com"),
    screenshots: screenshotsFor("DraftKings", 3),
    whoIsItFor:
      "DraftKings is for fantasy sports players and bettors in legal states who want daily fantasy contests, sportsbook betting, and same-game parlays in one app.",
    notForYouIf:
      "You're outside a legal state, dislike daily lineup research, or want to avoid gambling entirely.",
    howItWorks: [
      {
        step: 1,
        title: "Create your lineup or bet slip",
        description:
          "In DFS, draft a lineup under a salary cap. In Sportsbook, pick spreads, totals, props, or SGPs from thousands of markets.",
      },
      {
        step: 2,
        title: "Enter contests or place bets",
        description:
          "Join fantasy contests from $1 to high-stakes. Fund your sportsbook wallet and confirm bets with live odds locks.",
      },
      {
        step: 3,
        title: "Track live results",
        description:
          "Fantasy scores update play-by-play. Sportsbook bets settle automatically; withdraw winnings to your bank.",
      },
    ],
    pricing: [
      { label: "DFS contests", price: "From $1", note: "Entry fees vary by contest size and sport" },
      { label: "Sportsbook", price: "Min bet ~$0.10", note: "Deposit only what you wager" },
      { label: "Deposit bonus", price: "Varies", note: "Promos for new users; read playthrough terms" },
    ],
    pros: [
      "Best-in-class DFS platform with huge contest variety",
      "Sportsbook integrated in one app in legal states",
      "Same-game parlay builder is intuitive and deep",
      "Live betting and cash-out options on many markets",
      "Clean mobile experience during live games",
    ],
    cons: [
      "Only available in specific US states for sportsbook",
      "DFS edges go to sharp players—casual users face long odds",
      "Promotional terms can be confusing",
      "Highly addictive format—set limits proactively",
    ],
    faq: [
      {
        question: "Is DraftKings legal in my state?",
        answer:
          "DFS is legal in most US states. Sportsbook is legal in 25+ states. Check draftkings.com/legal for your location.",
      },
      {
        question: "What's the difference between DFS and Sportsbook?",
        answer:
          "DFS is skill-based fantasy contests against other players. Sportsbook is traditional sports betting against the house.",
      },
      {
        question: "How do I withdraw winnings?",
        answer:
          "Account → Withdraw → choose PayPal, bank transfer, or check. First withdrawal may require identity verification.",
      },
      {
        question: "Can I set gambling limits?",
        answer:
          "Yes. Responsible Gaming tools include deposit limits, time limits, and self-exclusion in account settings.",
      },
      {
        question: "Does DraftKings have a mobile app?",
        answer:
          "Yes. Separate apps for DFS and Sportsbook in some states; unified app in others. iOS and Android supported.",
      },
      {
        question: "How do welcome bonuses work?",
        answer:
          "New users often get deposit matches or bonus bets. Wagering requirements apply—read terms before opting in.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  headspace: {
    logoUrl: logoFor("https://headspace.com"),
    screenshots: ["/images/tools/headspace.png"],
    whoIsItFor:
      "Headspace is for beginners and busy professionals who want guided meditation, sleep aids, and focus exercises in short, structured sessions.",
    notForYouIf:
      "You want a fully free meditation app or prefer unguided, silent practice without narration.",
    howItWorks: [
      {
        step: 1,
        title: "Choose your focus",
        description:
          "Pick meditation, sleep, focus, or movement. Headspace recommends courses based on your goals (stress, anxiety, sleep).",
      },
      {
        step: 2,
        title: "Start a session",
        description:
          "Sessions range from 3 to 20 minutes with Andy Puddicombe's guided narration. Animations explain techniques for beginners.",
      },
      {
        step: 3,
        title: "Build a habit",
        description:
          "Track streaks and minutes meditated. Unlock courses as you progress; use Sleepcasts and soundscapes at bedtime.",
      },
    ],
    pricing: [
      { label: "Free trial", price: "7–14 days", note: "Full access during trial period" },
      { label: "Monthly", price: "$12.99/mo", note: "Full library, offline downloads" },
      { label: "Annual", price: "$69.99/yr", note: "~$5.83/mo; best value" },
      { label: "Family", price: "$99.99/yr", note: "Up to 6 accounts" },
    ],
    pros: [
      "Best onboarding for meditation beginners",
      "Sleepcasts and sleep music are genuinely effective",
      "Structured courses build skills progressively",
      "Clean, calming UI without clutter",
      "Focus music and SOS sessions for anxious moments",
    ],
    cons: [
      "Little free content after trial—subscription required",
      "Guided style may not suit experienced meditators",
      "Fewer niche topics than Insight Timer's free library",
      "Annual plan auto-renews; easy to forget",
    ],
    faq: [
      {
        question: "Is Headspace free?",
        answer:
          "A limited free library exists, but most content requires subscription. Free trials (7–14 days) give full access.",
      },
      {
        question: "How do I cancel Headspace?",
        answer:
          "Cancel via App Store/Google Play or headspace.com billing. Access continues until the period ends.",
      },
      {
        question: "Does Headspace help with sleep?",
        answer:
          "Yes. Sleepcasts (audio stories), sleep music, and wind-down meditations are among Headspace's strongest features.",
      },
      {
        question: "Can I download sessions offline?",
        answer:
          "Subscribers can download meditations and Sleepcasts for offline use on mobile.",
      },
      {
        question: "Is Headspace good for anxiety?",
        answer:
          "Headspace offers SOS sessions and courses on stress and anxiety. It complements but doesn't replace therapy.",
      },
      {
        question: "Does Headspace offer student or family pricing?",
        answer:
          "Students get ~85% off via SheerID verification. Family Plan covers up to 6 accounts for $99.99/year.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  coursera: {
    logoUrl: logoFor("https://coursera.org"),
    screenshots: screenshotsFor("Coursera", 3),
    whoIsItFor:
      "Coursera is for professionals upskilling in tech, business, and data who want university-backed courses, certificates, and online degrees employers recognize.",
    notForYouIf:
      "You want casual hobby learning without assignments, deadlines, or certificate costs.",
    howItWorks: [
      {
        step: 1,
        title: "Browse and enroll",
        description:
          "Search 7,000+ courses from Stanford, Google, IBM, and more. Audit free or enroll for certificates.",
      },
      {
        step: 2,
        title: "Learn on your schedule",
        description:
          "Watch video lectures, complete quizzes, and submit assignments. Peer-reviewed projects on Professional Certificates.",
      },
      {
        step: 3,
        title: "Earn credentials",
        description:
          "Pass assessments to earn shareable certificates or stack courses toward Specializations and online degrees.",
      },
    ],
    pricing: [
      { label: "Audit", price: "Free", note: "Watch lectures; no certificate or graded work" },
      { label: "Single course", price: "$49–$79", note: "One-time fee for certificate" },
      { label: "Coursera Plus", price: "$59/mo", note: "Unlimited certificates from 7,000+ courses" },
      { label: "Degrees", price: "$9,000–$45,000", note: "Full online bachelor's and master's programs" },
    ],
    pros: [
      "Courses from top universities and companies (Google, Meta)",
      "Financial aid available for individual certificates",
      "Flexible pacing on most courses",
      "Professional Certificates designed for job readiness",
      "Coursera Plus is strong value for serial learners",
    ],
    cons: [
      "Certificate costs add up without Plus subscription",
      "Peer-graded assignments can be inconsistent",
      "Course quality varies by instructor and university",
      "Degree programs are expensive despite being online",
    ],
    faq: [
      {
        question: "Can I take Coursera courses for free?",
        answer:
          "Yes. Audit most courses for free with access to lectures. Pay for graded assignments and certificates.",
      },
      {
        question: "How do I cancel Coursera Plus?",
        answer:
          "Account → My Purchases → Coursera Plus → Cancel. Access continues until the billing period ends.",
      },
      {
        question: "Is financial aid available?",
        answer:
          "Yes. Apply on the course page for up to 100% fee waiver. Approval typically takes 15 days.",
      },
      {
        question: "Do employers value Coursera certificates?",
        answer:
          "Google and IBM Professional Certificates are widely recognized. University certificates carry more weight than unknown providers.",
      },
      {
        question: "Is there a Coursera mobile app?",
        answer:
          "Yes. iOS and Android apps support video downloads for offline viewing and quiz completion.",
      },
      {
        question: "What regions does Coursera serve?",
        answer:
          "Coursera is available worldwide. Some degree programs and payment methods are region-restricted.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  spotify: {
    logoUrl: logoFor("https://spotify.com"),
    screenshots: ["/images/tools/spotify.png"],
    whoIsItFor:
      "Spotify is for music and podcast listeners who want a huge catalog, personalized playlists, and seamless listening across phone, desktop, and smart speakers.",
    notForYouIf:
      "You want lossless audiophile quality without paying extra, or prefer owning music files outright.",
    howItWorks: [
      {
        step: 1,
        title: "Create your account",
        description:
          "Sign up free or go Premium. Connect Facebook or Apple to find friends and shared tastes.",
      },
      {
        step: 2,
        title: "Discover and save music",
        description:
          "Browse Discover Weekly, Release Radar, and genre hubs. Save songs to Liked Songs or custom playlists.",
      },
      {
        step: 3,
        title: "Listen everywhere",
        description:
          "Stream on any device; download for offline on Premium. Control playback from watch, car, or smart speaker.",
      },
    ],
    pricing: [
      { label: "Free", price: "$0", note: "Ads, shuffle-only on mobile, limited skips" },
      { label: "Premium", price: "$10.99/mo", note: "Ad-free, offline, on-demand playback" },
      { label: "Family", price: "$16.99/mo", note: "Up to 6 accounts" },
      { label: "Student", price: "$5.99/mo", note: "Premium + Hulu (US, limited time offers)" },
    ],
    pros: [
      "Best-in-class music discovery (Discover Weekly, Daylist)",
      "Massive podcast library including exclusives",
      "Works on every device and integrates with Alexa, Google, CarPlay",
      "Collaborative playlists for parties and road trips",
      "UI is fast and search is excellent",
    ],
    cons: [
      "Free tier is crippled on mobile (shuffle-only)",
      "Artists criticize low per-stream payouts",
      "Audiophile quality requires Premium tier; lossless is extra",
      "Podcast video and audiobook push clutters the music focus",
    ],
    faq: [
      {
        question: "How do I cancel Spotify Premium?",
        answer:
          "Account → Manage plan → Cancel Premium. You revert to Free at the end of the billing cycle.",
      },
      {
        question: "Can I download music for offline?",
        answer:
          "Premium only. Tap the download icon on playlists or albums. Downloads expire if you cancel Premium.",
      },
      {
        question: "Is Spotify available worldwide?",
        answer:
          "Spotify operates in 180+ markets. Catalog and pricing vary by country.",
      },
      {
        question: "What's the difference between Free and Premium?",
        answer:
          "Premium removes ads, enables on-demand playback, offline downloads, and higher audio quality. Free has shuffle mode on mobile.",
      },
      {
        question: "Can I share a Spotify Family plan?",
        answer:
          "Family Plan requires all members to live at the same address. Spotify periodically verifies via GPS.",
      },
      {
        question: "Does Spotify have lossless audio?",
        answer:
          "Spotify HiFi was announced but delayed. Currently, Premium maxes at 320 kbps Ogg Vorbis.",
      },
    ],
    lastReviewed: "2026-07-01",
  },

  asos: {
    logoUrl: logoFor("https://asos.com"),
    screenshots: screenshotsFor("ASOS", 3),
    whoIsItFor:
      "ASOS is for fashion-forward shoppers aged 18–35 who want thousands of brands, own-label trends, and frequent sales without visiting a mall.",
    notForYouIf:
      "You need consistent sizing across brands or want to try on locally before buying.",
    howItWorks: [
      {
        step: 1,
        title: "Browse and filter",
        description:
          "Shop by category, brand, size, or trend. ASOS Design (own label) sits alongside Nike, Levi's, and 850+ brands.",
      },
      {
        step: 2,
        title: "Check fit guidance",
        description:
          "Read reviews for fit notes, use the fit assistant, and check size charts—sizing varies by brand.",
      },
      {
        step: 3,
        title: "Order and return",
        description:
          "Checkout with standard or express delivery. Free returns within 28 days in most regions via drop-off or pickup.",
      },
    ],
    pricing: [
      { label: "Standard shipping", price: "Free over threshold", note: "Varies by region; ~$60+ in US" },
      { label: "Express", price: "~$12.99", note: "Next-day in eligible areas" },
      { label: "ASOS Premier", price: "~$19.99/yr", note: "Unlimited next-day delivery" },
      { label: "Student discount", price: "10% off", note: "Via UNiDAYS or Student Beans verification" },
    ],
    pros: [
      "Incredible brand variety in one checkout",
      "ASOS Design offers on-trend pieces at accessible prices",
      "Free returns on most items reduce fit risk",
      "Frequent sales (up to 70% off) and outlet section",
      "Strong app with saved sizes and wish lists",
    ],
    cons: [
      "Sizing inconsistency across brands requires trial and error",
      "Quality on cheapest own-label items is hit-or-miss",
      "Delivery times can stretch during sale periods",
      "Customer service wait times spike during peak season",
    ],
    faq: [
      {
        question: "How do ASOS returns work?",
        answer:
          "Return within 28 days for a full refund. Print a label or use drop-off points. Exclusions apply to swimwear, pierced jewelry, and face masks.",
      },
      {
        question: "Does ASOS ship to the US?",
        answer:
          "Yes. ASOS ships to the US with duties often included in the price. Delivery typically takes 5–10 business days standard.",
      },
      {
        question: "How do I get the student discount?",
        answer:
          "Verify via UNiDAYS or Student Beans for 10% off. Combine with sale items for deeper savings.",
      },
      {
        question: "What is ASOS Premier?",
        answer:
          "Annual membership (~$19.99) for unlimited next-day delivery for a year. Pays off with 2+ express orders.",
      },
      {
        question: "Can I track my ASOS order?",
        answer:
          "Yes. Order confirmation includes tracking. The app shows real-time status from warehouse to delivery.",
      },
      {
        question: "Does ASOS have a mobile app?",
        answer:
          "Yes. iOS and Android apps support wish lists, visual search, and push alerts for price drops on saved items.",
      },
    ],
    lastReviewed: "2026-07-01",
  },
};
