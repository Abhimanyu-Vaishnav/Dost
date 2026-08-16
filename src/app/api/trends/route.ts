import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── All supported categories ──────────────────────────────────────────────────
export const CATEGORIES: { id: string; label: string; keywords: string[] }[] = [
  {
    id: "technology",
    label: "Technology",
    keywords: ["ai","machine","learning","neural","model","gpt","openai","llm","deepmind","robot","react","nextjs","javascript","typescript","python","coding","developer","github","software","frontend","backend","blockchain","crypto","web3","cloud","server","database","api","flutter","android","ios","mobile","app","tech","digital","code","programming","computer","internet","cyber","hack","chip","semiconductor"],
  },
  {
    id: "politics",
    label: "Politics",
    keywords: ["election","parliament","government","minister","president","prime","vote","party","bjp","congress","senate","democratic","republican","policy","bill","law","constitution","cabinet","assembly","democracy","opposition","protest","rally","manifesto","campaign","modi","gandhi","trump","biden","macron","political","politician","governance","law","reform","parliament","budget"],
  },
  {
    id: "sports",
    label: "Sports",
    keywords: ["cricket","football","ipl","match","player","team","score","sports","tennis","kabaddi","hockey","soccer","nba","nfl","fifa","olympic","gold","medal","championship","league","tournament","wicket","goal","runs","batting","bowling","rohit","virat","messi","ronaldo","federer","nadal","game","stadium","coach","referee","penalty","world cup"],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    keywords: ["movie","film","bollywood","netflix","series","actor","actress","music","song","trailer","oscar","grammy","celebrity","singer","dancer","director","producer","box office","streaming","show","episode","season","album","concert","tour","fashion","design","style","award","red carpet","hollywood","tollywood","kollywood","ott","web series","podcast"],
  },
  {
    id: "business",
    label: "Business",
    keywords: ["startup","funding","investment","ipo","market","stocks","economy","business","company","revenue","profit","loss","merger","acquisition","unicorn","valuation","venture","capital","entrepreneur","ceo","founder","product","launch","brand","marketing","sales","customer","growth","fintech","ecommerce","bank","finance","tax","gdp","inflation"],
  },
  {
    id: "health",
    label: "Health",
    keywords: ["health","hospital","doctor","medicine","vaccine","mental","fitness","yoga","covid","disease","treatment","surgery","research","clinical","patient","pharmacy","diet","nutrition","wellness","exercise","gym","meditation","stress","anxiety","depression","cancer","diabetes","blood","heart","virus","bacteria","immune","therapy"],
  },
  {
    id: "science",
    label: "Science & Space",
    keywords: ["science","space","isro","nasa","planet","research","discovery","biology","chemistry","physics","quantum","rocket","satellite","mars","moon","galaxy","universe","telescope","experiment","laboratory","genome","dna","evolution","climate","environment","carbon","solar","energy","nuclear","fusion","particle","proton","electron","theory"],
  },
  {
    id: "power",
    label: "Power & Energy",
    keywords: ["power","energy","electricity","solar","wind","nuclear","oil","gas","petroleum","coal","renewable","clean","green","hydro","grid","fuel","battery","electric","ev","vehicle","emission","carbon","thermal","geothermal","biomass","hydrogen","pipeline","refinery","watt","megawatt","gigawatt","power plant","transmission","distribution"],
  },
  {
    id: "india",
    label: "India",
    keywords: ["india","bharat","delhi","mumbai","bengaluru","kolkata","hyderabad","chennai","pune","ahmedabad","jaipur","lucknow","rupee","inr","modi","bjp","congress","bcci","ipl","isro","bollywood","nifty","sensex","startup","msme","sme","gst","upi","paytm","aadhaar","swachh","namami","atmanirbar"],
  },
  {
    id: "world",
    label: "World",
    keywords: ["usa","america","uk","europe","china","russia","ukraine","war","peace","un","nato","g20","g7","imf","worldbank","sanction","trade","tariff","border","immigration","refugee","global","international","foreign","diplomacy","embassy","treaty","summit","climate","paris","cop","geneva"],
  },
];

// ── Region config ─────────────────────────────────────────────────────────────
export const REGIONS: { code: string; name: string; keywords: string[] }[] = [
  { code: "IN", name: "India", keywords: ["india","bharat","delhi","mumbai","bengaluru","ipl","rupee","modi","bjp","bollywood","isro"] },
  { code: "US", name: "United States", keywords: ["usa","america","trump","biden","nyc","dollar","nfl","nba","silicon valley","federal","nasa","hollywood"] },
  { code: "GB", name: "United Kingdom", keywords: ["uk","london","england","premier league","bbc","pound","nhs","westminster"] },
  { code: "AU", name: "Australia", keywords: ["australia","sydney","melbourne","afl","ato","anzac"] },
  { code: "PK", name: "Pakistan", keywords: ["pakistan","karachi","lahore","islamabad","pcb","psl","imran","sharif"] },
  { code: "BD", name: "Bangladesh", keywords: ["bangladesh","dhaka","chittagong","taka","bcb"] },
  { code: "CA", name: "Canada", keywords: ["canada","toronto","vancouver","montreal","cad","nhl","trudeau"] },
  { code: "DE", name: "Germany", keywords: ["germany","berlin","munich","bundesliga","euro","scholz"] },
  { code: "FR", name: "France", keywords: ["france","paris","ligue1","macron","euro","elysee"] },
  { code: "JP", name: "Japan", keywords: ["japan","tokyo","osaka","yen","nintendo","sony","toyota"] },
  { code: "SG", name: "Singapore", keywords: ["singapore","sgd","mrt","jurong","changi"] },
  { code: "AE", name: "UAE", keywords: ["uae","dubai","abudhabi","dirham","expo","difc"] },
  { code: "WW", name: "Worldwide", keywords: [] },
];

const COUNTRY_TO_CODE: Record<string, string> = {
  IN: "IN", US: "US", GB: "GB", AU: "AU", PK: "PK", BD: "BD",
  CA: "CA", DE: "DE", FR: "FR", JP: "JP", SG: "SG", AE: "AE",
};

const STOP = new Set([
  "the","a","an","is","it","in","on","at","to","of","and","or","but","for",
  "with","from","have","been","will","were","they","what","when","then","than",
  "their","there","here","also","just","some","more","your","into","over","only",
  "about","after","before","very","much","such","many","like","would","could",
  "should","really","going","being","which","these","those","doing","anyone",
  "this","that","has","had","not","are","was","i","you","we","he","she","its",
  "can","do","did","get","got","let","out","all","new","now","our","how","yes","no",
  "via","per","re","so","as","by","my","me","us","be","am","if","up","am",
  "performance","test","post","check","completed","exploring","exciting","times","another",
  "great","good","best","first","last","next","using","used","make","made","take",
  "come","came","give","given","look","looking","need","want","work","working",
  "think","know","think","well","every","each","still","even","back","while",
  "high","high","actually","already","always","around","again",
]);

function detectCategory(phrase: string): string {
  const lower = phrase.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((k) => lower.includes(k))) return cat.label;
  }
  return "Trending";
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractBigrams(texts: string[]): Record<string, { count: number; sample: string }> {
  const bigramCounts: Record<string, { count: number; sample: string }> = {};
  texts.forEach((text) => {
    const clean = text
      .replace(/[#@]\w+/g, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    const words = clean.split(" ").filter((w) => w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w));
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!bigramCounts[bigram]) bigramCounts[bigram] = { count: 0, sample: text.trim().slice(0, 120) };
      bigramCounts[bigram].count++;
    }

    // Also count single meaningful words (trigrams fall back to bigrams)
    words.forEach((w) => {
      if (w.length >= 5) {
        const key = `__single__${w}`;
        if (!bigramCounts[key]) bigramCounts[key] = { count: 0, sample: text.trim().slice(0, 120) };
        bigramCounts[key].count++;
      }
    });
  });
  return bigramCounts;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Region param: use ?region=IN or auto-detect from IP
    const regionParam = searchParams.get("region");
    const categoryParam = searchParams.get("category"); // e.g. "technology", "sports"

    const ipCountry =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code");

    const countryCode = regionParam || (ipCountry ? COUNTRY_TO_CODE[ipCountry] || "IN" : "IN");
    const regionConfig = REGIONS.find((r) => r.code === countryCode) || REGIONS.find((r) => r.code === "IN")!;

    // Category filter
    const catConfig = categoryParam
      ? CATEGORIES.find((c) => c.id === categoryParam)
      : null;

    // ── Fetch posts ────────────────────────────────────────────────────────
    const recentPosts = await prisma.post.findMany({
      where: { parentId: null },
      select: { content: true, _count: { select: { likes: true, comments: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // If category filter, only use posts that contain category keywords
    const filteredPosts = catConfig
      ? recentPosts.filter((p) => catConfig.keywords.some((k) => p.content.toLowerCase().includes(k)))
      : recentPosts;

    const allContent = filteredPosts.map((p) => p.content);

    // ── Extract bigrams ────────────────────────────────────────────────────
    const bigramMap = extractBigrams(allContent);

    // Boost region-relevant bigrams
    Object.keys(bigramMap).forEach((key) => {
      const phrase = key.replace("__single__", "");
      if (regionConfig.keywords.some((k) => phrase.includes(k))) {
        bigramMap[key].count = Math.ceil(bigramMap[key].count * 2);
      }
    });

    // Filter by category if requested
    const topBigrams = Object.entries(bigramMap)
      .filter(([key, v]) => {
        if (v.count < 1) return false;
        if (catConfig) {
          const phrase = key.replace("__single__", "");
          return catConfig.keywords.some((k) => phrase.includes(k) || v.sample.toLowerCase().includes(k));
        }
        return true;
      })
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 12);

    const trendingTopics = topBigrams
      .filter(([key]) => !key.startsWith("__single__"))
      .slice(0, 8)
      .map(([phrase, data], idx) => {
        const isRegional = regionConfig.keywords.some((k) => phrase.includes(k));
        const detectedCat = catConfig ? catConfig.label : detectCategory(phrase + " " + data.sample);
        return {
          id: `t_${idx}`,
          category: isRegional && regionConfig.code !== "WW" ? `${regionConfig.name} · ${detectedCat}` : detectedCat,
          title: titleCase(phrase),
          postCount: data.count,
          isBreaking: idx === 0 && data.count >= 3,
          searchQuery: phrase,
        };
      });

    // ── Trending hashtags ──────────────────────────────────────────────────
    const dbHashtags = await prisma.hashtag.findMany({
      orderBy: { count: "desc" },
      take: 20,
    });
    const hashtagCounts: Record<string, number> = {};
    dbHashtags.forEach((h) => { hashtagCounts[h.name.toLowerCase()] = h.count; });
    allContent.forEach((content) => {
      const tags = content.match(/#(\w+)/g);
      if (tags) {
        tags.forEach((tag) => {
          const cleaned = tag.substring(1).toLowerCase();
          // If category filter, only include hashtags related to category
          if (catConfig && !catConfig.keywords.some((k) => cleaned.includes(k))) return;
          hashtagCounts[cleaned] = (hashtagCounts[cleaned] || 0) + 1;
        });
      }
    });

    const sortedHashtags = Object.entries(hashtagCounts)
      .map(([tag, count]) => {
        const isRegional = regionConfig.keywords.some((k) => tag.includes(k));
        const detectedCat = detectCategory(tag);
        return {
          tag,
          count: count,
          category: detectedCat,
          isRegional,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({
      region: regionConfig.name,
      countryCode,
      topics: trendingTopics,
      hashtags: sortedHashtags,
      categories: CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
      regions: REGIONS.map((r) => ({ code: r.code, name: r.name })),
      totalPosts: recentPosts.length,
      filteredPosts: filteredPosts.length,
    });
  } catch (error) {
    console.error("Trends error:", error);
    return NextResponse.json({ region: "India", topics: [], hashtags: [], categories: [], regions: [], totalPosts: 0 });
  }
}
