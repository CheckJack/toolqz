import { CategoryInfo, Website, WebsiteBase } from "@/types";
import { mergeWebsite } from "./tool-helpers";
import { richContent } from "./rich-content";

export const categories: CategoryInfo[] = [
  { id: "all", label: "All" },
  { id: "productivity", label: "Productivity" },
  { id: "food", label: "Food" },
  { id: "digital", label: "Digital" },
  { id: "marketing", label: "Marketing" },
  { id: "finance", label: "Finance" },
  { id: "gambling", label: "Gambling" },
  { id: "health", label: "Health" },
  { id: "education", label: "Education" },
  { id: "entertainment", label: "Entertainment" },
  { id: "shopping", label: "Shopping" },
];

export const websites: Website[] = (
  [
  {
    id: "1",
    slug: "notion",
    name: "Notion",
    description:
      "All-in-one workspace for notes, tasks, wikis, and databases. Organize your entire life in one place.",
    overview:
      "Notion replaces scattered docs, spreadsheets, and task apps with one flexible workspace. You can build personal dashboards, team wikis, project trackers, and habit systems without switching tools. It works especially well if you want one place to plan your life and your work.",
    highlights: [
      "Combine notes, tasks, databases, and docs in one workspace",
      "Highly customizable templates for personal and team use",
      "Syncs across desktop, mobile, and web",
    ],
    url: "https://notion.so",
    category: "productivity",
    tags: ["notes", "organization", "workspace"],
    featured: true,
    rating: 4.8,
  },
  {
    id: "2",
    slug: "hellofresh",
    name: "HelloFresh",
    description:
      "Meal kit delivery with chef-designed recipes. Fresh ingredients delivered to your door every week.",
    overview:
      "HelloFresh removes the guesswork from weeknight cooking by shipping pre-portioned ingredients and step-by-step recipes. It is a strong option if you want to eat at home more often without meal planning or grocery runs. Plans scale for singles, couples, and families.",
    highlights: [
      "Pre-portioned ingredients cut food waste and prep time",
      "Rotating weekly menus with flexible delivery schedules",
      "Beginner-friendly recipes with clear instructions",
    ],
    url: "https://hellofresh.com",
    category: "food",
    tags: ["meals", "delivery", "cooking"],
    featured: true,
    rating: 4.5,
  },
  {
    id: "3",
    slug: "canva",
    name: "Canva",
    description:
      "Design anything with drag-and-drop simplicity. Create social posts, presentations, and more.",
    overview:
      "Canva makes professional-looking design accessible without Photoshop skills. It is ideal for social content, pitch decks, thumbnails, and quick brand assets. The template library and drag-and-drop editor let you ship visuals fast.",
    highlights: [
      "Thousands of templates for social, print, and presentations",
      "Simple editor with brand kit and team collaboration",
      "Free tier available with affordable Pro upgrades",
    ],
    url: "https://canva.com",
    category: "digital",
    tags: ["design", "graphics", "templates"],
    featured: true,
    rating: 4.7,
  },
  {
    id: "4",
    slug: "hubspot",
    name: "HubSpot",
    description:
      "CRM and marketing automation platform. Grow your business with inbound marketing tools.",
    overview:
      "HubSpot centralizes your contacts, email campaigns, landing pages, and sales pipeline in one platform. It is built for businesses that want to attract leads, nurture them, and track conversions without juggling multiple tools.",
    highlights: [
      "Free CRM with scalable marketing and sales hubs",
      "Email automation, forms, and landing page builder",
      "Detailed analytics across the full customer journey",
    ],
    url: "https://hubspot.com",
    category: "marketing",
    tags: ["crm", "email", "automation"],
    rating: 4.6,
  },
  {
    id: "5",
    slug: "revolut",
    name: "Revolut",
    description:
      "Digital banking app with multi-currency accounts, crypto trading, and budgeting tools.",
    overview:
      "Revolut is a mobile-first finance app for spending, saving, and exchanging money globally. It suits travelers, freelancers, and anyone who wants real-time spending insights. Budgeting and vault features help you track where your money goes.",
    highlights: [
      "Multi-currency accounts with competitive exchange rates",
      "Built-in budgeting, vaults, and spending analytics",
      "Cards, transfers, crypto, and investing in one app",
    ],
    url: "https://revolut.com",
    category: "finance",
    tags: ["banking", "crypto", "budgeting"],
    featured: true,
    rating: 4.4,
  },
  {
    id: "6",
    slug: "bet365",
    name: "Bet365",
    description:
      "Leading online sports betting and casino platform with live streaming and in-play betting.",
    overview:
      "Bet365 is one of the largest online betting platforms, covering sports, live in-play markets, and casino games. It is known for deep market coverage and live streaming on selected events. Always gamble responsibly and only where legally permitted.",
    highlights: [
      "Wide range of sports and in-play betting markets",
      "Live streaming on selected events",
      "Mobile app optimized for quick bet placement",
    ],
    url: "https://bet365.com",
    category: "gambling",
    tags: ["sports", "casino", "betting"],
    rating: 4.3,
  },
  {
    id: "7",
    slug: "myfitnesspal",
    name: "MyFitnessPal",
    description:
      "Track calories, macros, and workouts. The world's largest food and exercise database.",
    overview:
      "MyFitnessPal helps you log meals, track macros, and monitor progress toward fitness goals. Its massive food database makes calorie tracking faster than manual spreadsheets. Pair it with wearables or workout logs for a complete health picture.",
    highlights: [
      "Largest food database for fast meal logging",
      "Macro and calorie targets with progress charts",
      "Integrates with fitness trackers and workout apps",
    ],
    url: "https://myfitnesspal.com",
    category: "health",
    tags: ["fitness", "nutrition", "tracking"],
    rating: 4.5,
  },
  {
    id: "8",
    slug: "duolingo",
    name: "Duolingo",
    description:
      "Learn languages for free with bite-sized lessons. Gamified learning that actually sticks.",
    overview:
      "Duolingo turns language learning into short daily sessions with streaks, levels, and bite-sized exercises. It is a low-friction way to build vocabulary and basic grammar in dozens of languages. The free tier is generous for casual learners.",
    highlights: [
      "Free core lessons across 40+ languages",
      "Gamified streaks and daily goals build consistency",
      "Short sessions designed for mobile learning",
    ],
    url: "https://duolingo.com",
    category: "education",
    tags: ["languages", "learning", "free"],
    featured: true,
    rating: 4.7,
  },
  {
    id: "9",
    slug: "netflix",
    name: "Netflix",
    description:
      "Stream unlimited movies and TV shows. Original content, documentaries, and more.",
    overview:
      "Netflix is the go-to streaming service for on-demand movies, series, and documentaries. Its recommendation engine and original content library make it easy to find something to watch without renting or buying individual titles.",
    highlights: [
      "Large library of films, series, and documentaries",
      "Strong original content and global catalog",
      "Multiple profiles and offline downloads on mobile",
    ],
    url: "https://netflix.com",
    category: "entertainment",
    tags: ["streaming", "movies", "tv"],
    rating: 4.6,
  },
  {
    id: "10",
    slug: "amazon",
    name: "Amazon",
    description:
      "Everything store with fast delivery. Shop millions of products with Prime benefits.",
    overview:
      "Amazon is the default online marketplace for everything from daily essentials to electronics. Prime members get fast shipping, streaming perks, and exclusive deals. It is hard to beat for convenience and selection.",
    highlights: [
      "Massive product catalog across every category",
      "Prime shipping, deals, and member perks",
      "Reliable checkout with easy returns on most items",
    ],
    url: "https://amazon.com",
    category: "shopping",
    tags: ["ecommerce", "delivery", "prime"],
    rating: 4.5,
  },
  {
    id: "11",
    slug: "todoist",
    name: "Todoist",
    description:
      "Task manager that organizes work and life. Capture tasks, set priorities, and hit deadlines.",
    overview:
      "Todoist is a focused task manager for capturing to-dos, setting priorities, and organizing projects with labels and filters. It stays lightweight compared to full workspace tools, which makes it ideal for pure productivity.",
    highlights: [
      "Natural language input for quick task capture",
      "Projects, labels, filters, and priority levels",
      "Cross-platform sync with reminders and due dates",
    ],
    url: "https://todoist.com",
    category: "productivity",
    tags: ["tasks", "todo", "planning"],
    rating: 4.6,
  },
  {
    id: "12",
    slug: "doordash",
    name: "DoorDash",
    description:
      "Food delivery from your favorite restaurants. Order in seconds, delivered in minutes.",
    overview:
      "DoorDash connects you with local restaurants for on-demand delivery and pickup. It is useful when you want restaurant food without leaving home. Real-time tracking and a wide merchant network make it a reliable default for food delivery.",
    highlights: [
      "Large selection of local restaurants and chains",
      "Live order tracking from kitchen to doorstep",
      "DashPass subscription for reduced fees on frequent orders",
    ],
    url: "https://doordash.com",
    category: "food",
    tags: ["delivery", "restaurants", "fast"],
    rating: 4.4,
  },
  {
    id: "13",
    slug: "figma",
    name: "Figma",
    description:
      "Collaborative interface design tool. Design, prototype, and gather feedback in one place.",
    overview:
      "Figma is the industry standard for UI design, prototyping, and design-system work. Teams collaborate in real time in the browser, which removes file-version headaches. It is essential for product designers and increasingly popular with founders and marketers.",
    highlights: [
      "Real-time collaborative design in the browser",
      "Prototyping, components, and design systems built in",
      "Developer handoff with inspect and export tools",
    ],
    url: "https://figma.com",
    category: "digital",
    tags: ["design", "ui", "collaboration"],
    rating: 4.8,
  },
  {
    id: "14",
    slug: "mailchimp",
    name: "Mailchimp",
    description:
      "Email marketing and automation platform. Build audiences and grow your business.",
    overview:
      "Mailchimp helps small businesses and creators send newsletters, automate email flows, and grow their audience. Its drag-and-drop editor and audience segmentation make email marketing approachable without technical setup.",
    highlights: [
      "Email campaigns with templates and automation flows",
      "Audience segmentation and performance analytics",
      "Landing pages and signup forms to grow your list",
    ],
    url: "https://mailchimp.com",
    category: "marketing",
    tags: ["email", "newsletters", "automation"],
    rating: 4.3,
  },
  {
    id: "15",
    slug: "robinhood",
    name: "Robinhood",
    description:
      "Commission-free stock trading and investing. Buy and sell stocks, ETFs, and crypto.",
    overview:
      "Robinhood made stock and ETF investing accessible with a simple mobile-first experience and commission-free trades. It suits beginners who want a low-friction entry into investing, though all investing carries risk.",
    highlights: [
      "Commission-free trading for stocks and ETFs",
      "Clean mobile app with fractional shares",
      "Crypto and retirement account options available",
    ],
    url: "https://robinhood.com",
    category: "finance",
    tags: ["stocks", "investing", "trading"],
    rating: 4.2,
  },
  {
    id: "16",
    slug: "draftkings",
    name: "DraftKings",
    description:
      "Daily fantasy sports and sportsbook. Compete for cash prizes in fantasy contests.",
    overview:
      "DraftKings combines daily fantasy sports contests with a full sportsbook in supported regions. It is popular for fantasy lineups and live betting during games. Play responsibly and verify local regulations before signing up.",
    highlights: [
      "Daily fantasy contests across major sports",
      "Integrated sportsbook in eligible states",
      "Promotions and same-game parlay options",
    ],
    url: "https://draftkings.com",
    category: "gambling",
    tags: ["fantasy", "sports", "contests"],
    rating: 4.4,
  },
  {
    id: "17",
    slug: "headspace",
    name: "Headspace",
    description:
      "Meditation and mindfulness app. Reduce stress, improve sleep, and boost focus.",
    overview:
      "Headspace offers guided meditations, sleep sounds, and focus exercises for stress relief and better rest. Short sessions make it easy to build a daily mindfulness habit without a steep learning curve.",
    highlights: [
      "Guided meditations for stress, sleep, and focus",
      "Structured courses for beginners and advanced users",
      "Sleepcasts, music, and breathing exercises",
    ],
    url: "https://headspace.com",
    category: "health",
    tags: ["meditation", "sleep", "mindfulness"],
    rating: 4.6,
  },
  {
    id: "18",
    slug: "coursera",
    name: "Coursera",
    description:
      "Online courses from top universities. Earn certificates and degrees online.",
    overview:
      "Coursera partners with universities and companies to offer courses, certificates, and online degrees. It is a strong platform for upskilling in tech, business, and data with credentials employers recognize.",
    highlights: [
      "Courses from top universities and industry partners",
      "Professional certificates and online degree programs",
      "Flexible pacing with financial aid on many courses",
    ],
    url: "https://coursera.org",
    category: "education",
    tags: ["courses", "certificates", "university"],
    rating: 4.5,
  },
  {
    id: "19",
    slug: "spotify",
    name: "Spotify",
    description:
      "Music streaming with millions of songs and podcasts. Discover new music daily.",
    overview:
      "Spotify is the leading music and podcast streaming platform with personalized playlists and a vast catalog. Discover Weekly and collaborative playlists make it easy to find and share music across devices.",
    highlights: [
      "Huge music and podcast library with personalized playlists",
      "Cross-device listening with offline downloads",
      "Free tier available with Premium ad-free option",
    ],
    url: "https://spotify.com",
    category: "entertainment",
    tags: ["music", "podcasts", "streaming"],
    rating: 4.7,
  },
  {
    id: "20",
    slug: "asos",
    name: "ASOS",
    description:
      "Fashion destination with thousands of brands. Free delivery and easy returns.",
    overview:
      "ASOS is an online fashion retailer with thousands of brands, own-label styles, and frequent sales. It is a one-stop shop for clothing, shoes, and accessories with student discounts and easy returns.",
    highlights: [
      "Wide range of brands and own-label fashion",
      "Frequent sales and student discount programs",
      "Free returns on most orders in supported regions",
    ],
    url: "https://asos.com",
    category: "shopping",
    tags: ["fashion", "clothing", "trends"],
    rating: 4.3,
  },
] as WebsiteBase[]).map((base) => mergeWebsite(base, richContent[base.slug]));
