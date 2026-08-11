import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EXPANDED_ACCOUNTS = [
  { name: "Aarav Sharma", username: "aarav_dev", email: "aarav@example.com", bio: "Full-stack engineer building AI micro-saas. Next.js 16 + React 19 enthusiast 🚀", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Full-Stack Engineer" },
  { name: "Priya Patel", username: "priya_design", email: "priya@example.com", bio: "Lead UI/UX Designer @ DesignLab. Crafting clean interfaces & glassmorphism 🎨", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "UI/UX Designer" },
  { name: "Vikram Malhotra", username: "vikram_founder", email: "vikram@example.com", bio: "Founder & CEO @ CloudPulse. Scaled apps from 0 to 1M users #indiehackers ⚡", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80", type: "BUSINESS", sub: "Tech Founder" },
  { name: "Ananya Roy", username: "ananya_fit", email: "ananya@example.com", bio: "Fitness coach & marathon runner 🏋️‍♀️ Clean eating, daily workouts & positive vibes ✨", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Fitness Coach" },
  { name: "Rohan Varma", username: "rohan_gaming", email: "rohan@example.com", bio: "Pro gamer & tech setup reviewer 🎮 Custom Mechanical Keyboards & RGB aesthetic 🕹️", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Gaming Creator" },
  { name: "Siddharth Rao", username: "sid_ai", email: "sid@example.com", bio: "AI Research Scientist @ DeepMind Labs. Exploring LLMs, Transformer models & Agents 🤖", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "AI Researcher" },
  { name: "Neha Kapoor", username: "neha_photo", email: "neha@example.com", bio: "Travel & street photographer 📸 Capturing raw human emotions & urban architecture 🌆", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Photographer" },
  { name: "Kabir Mehta", username: "kabir_crypto", email: "kabir@example.com", bio: "DeFi Developer & Web3 Architect 🔗 Decentralized protocols, Rust & Smart contracts 💻", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Web3 Developer" },
  { name: "Meera Joshi", username: "meera_finance", email: "meera@example.com", bio: "Financial advisor & stock market analyst 📊 Demystifying investing, SIPs & wealth building 💰", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Finance Analyst" },
  { name: "Devansh Nambiar", username: "dev_sound", email: "dev@example.com", bio: "Music producer & sound designer 🎧 Synthesizers, lo-fi beats & ambient soundscapes 🎵", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Music Producer" },
  { name: "Tanya Sen", username: "tanya_cooks", email: "tanya@example.com", bio: "Artisanal chef & coffee nerd ☕ Artisan sourdough, espresso shots & gourmet recipes 🥖", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Chef & Barista" },
  { name: "Arjun Singhania", username: "arjun_arch", email: "arjun@example.com", bio: "Architectural consultant 🏛️ Sustainable bamboo structures, brutalist spaces & urban planning 🌿", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Architect" },
  { name: "Kavya Bose", username: "kavya_fashion", email: "kavya@example.com", bio: "Fashion stylist & sustainable thrift advocate 👗 Vintage fits & streetwear culture 🌟", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Fashion Stylist" },
  { name: "Rahul Deshmukh", username: "rahul_devops", email: "rahul@example.com", bio: "DevOps & Cloud Engineer ☁️ Kubernetes, Terraform, CI/CD pipelines & zero downtime 🛠️", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "DevOps Engineer" },
  { name: "Ishita Saxena", username: "ishita_animator", email: "ishita@example.com", bio: "3D Motion Artist & Blender wizard 🎬 Anime loops, isometric room renders & VFX 🔮", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "3D Motion Artist" },
  { name: "Yash Chopra", username: "yash_cyber", email: "yash@example.com", bio: "Ethical Hacker & Cybersecurity Researcher 🛡️ Penetration testing, bug bounties & Linux 🐧", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Cybersecurity" },
  { name: "Riya Sundaram", username: "riya_content", email: "riya@example.com", bio: "Growth marketer & YouTube strategist 📈 Building organic brand moats with short video content 📽️", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Growth Marketer" },
  { name: "Aditya Hegde", username: "aditya_product", email: "aditya@example.com", bio: "Product Manager @ ScaleX 🧭 Roadmaps, user feedback loops & data-driven product analytics 📊", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Product Manager" },
  { name: "Simran Kulkarni", username: "simran_writer", email: "simran@example.com", bio: "Tech essayist & newsletter writer 📝 Deep dives into technology trends, philosophy & human culture ✍️", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Writer" },
  { name: "Nikhil Pandey", username: "nikhil_hardware", email: "nikhil@example.com", bio: "Robotics engineer & IoT tinkerer 🤖 Raspberry Pi, Arduino & autonomous drones 🛸", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Robotics Engineer" },
  { name: "Pooja Trivedi", username: "pooja_mobile", email: "pooja@example.com", bio: "iOS & React Native developer 📱 Crafting butter-smooth 120Hz mobile animations & offline sync ⚡", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Mobile Dev" },
  { name: "Varun Bajaj", username: "varun_vc", email: "varun@example.com", bio: "Early-stage VC Investor @ Apex Capital 💼 Backing ambitious founders building the future of Web3 & AI 🌐", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "VC Investor" },
  { name: "Meghna Nair", username: "meghna_data", email: "meghna@example.com", bio: "Data Scientist & Analytics Architect 📈 PyTorch, Pandas, SQL & predictive modeling 🔮", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80", type: "PERSON", sub: "Data Scientist" }
];

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80"
];

const SAMPLE_VIDEOS = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4"
];

const SAMPLE_POLLS = [
  { question: "What is your primary web framework choice in 2026?", options: ["Next.js 16", "Vite + React 19", "Nuxt 3", "SvelteKit"] },
  { question: "How often do you deploy updates to production?", options: ["Multiple times a day", "Daily", "Weekly", "Bi-weekly"] },
  { question: "Which design tool do you use daily?", options: ["Figma", "Framer", "Adobe XD", "Penpot"] },
  { question: "What is your favorite coffee brewing method?", options: ["Espresso", "Pour Over / V60", "French Press", "Cold Brew"] }
];

const TEMPLATE_POST_TEXTS = [
  "Just launched our brand new feature on DOST! Lightning fast response times, smooth glassmorphic UI, and instant notifications 🚀 #tech #dost #buildinpublic",
  "Design rule: Don't just make it look pretty, make it intuitive and seamless for the user 🎨✨ #design #uiux #creativity",
  "Scaling serverless databases can be tricky, but proper indexing and connection pooling changes everything ⚡💻 #database #postgres #tech",
  "Morning workout routine complete! 60 minutes of strength training followed by a 3K cool down run 🏃‍♂️💪 #fitness #gym #health",
  "Completed another 3D motion loop render in Blender! Check out the ambient lighting and refraction effects 🎬✨ #3d #blender #art",
  "What is the single most important habit that helped you level up your career this year? Drop your thoughts below 👇 #career #growth #mindset",
  "Decentralized storage + smart contract security is evolving rapidly. Here is my breakdown of the top protocols 🔗 #crypto #web3 #blockchain",
  "Artisan sourdough bread straight out of the oven! 🍞 Freshly baked with a golden crispy crust 😋 #baking #foodie #coffee",
  "Cybersecurity alert: Always double check your environment variables and never commit secret API keys to public repositories 🛡️ #security #tech #devops",
  "Keynote presentation slide preview for tomorrow's Tech Conference in San Francisco 🎤🍿 #startups #founders #tech",
  "Custom mechanical keyboard built! Lubed Holy Panda switches + GMK keycaps = absolute typing heaven ⌨️🎧 #setup #gaming #tech",
  "Remote work tip: Set strict boundaries between work hours and relaxation hours to prevent burnout 🧘‍♂️ #lifestyle #remotework #productivity"
];

async function main() {
  console.log("🌱 Starting 100+ Posts & 23+ Accounts Seeding...");

  const defaultPassword = await bcrypt.hash("password123", 10);

  // 1. Create or upsert 23+ Accounts
  const createdUsers: Record<string, any> = {};

  for (const u of EXPANDED_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        username: u.username,
        password: defaultPassword,
        bio: u.bio,
        avatar: u.avatar,
        coverImage: u.cover,
        accountType: u.type,
        accountSubType: u.sub
      },
      create: {
        email: u.email,
        username: u.username,
        password: defaultPassword,
        name: u.name,
        bio: u.bio,
        avatar: u.avatar,
        coverImage: u.cover,
        accountType: u.type,
        accountSubType: u.sub
      }
    });
    createdUsers[u.username] = user;
  }

  const userList = Object.values(createdUsers);
  console.log(`✅ Created/Updated ${userList.length} Accounts.`);

  // 2. Inter-connect Accounts with Follows
  for (let i = 0; i < userList.length; i++) {
    for (let j = 0; j < userList.length; j++) {
      if (i !== j && (i + j) % 2 === 0) {
        await prisma.follows
          .create({
            data: {
              followerId: userList[i].id,
              followingId: userList[j].id
            }
          })
          .catch(() => {});
      }
    }
  }
  console.log("✅ Follow network created.");

  // 3. Generate 110+ Posts
  console.log("⏳ Generating 110+ posts...");
  let totalPostsCreated = 0;

  for (let idx = 0; idx < 115; idx++) {
    const author = userList[idx % userList.length];
    const textTemplate = TEMPLATE_POST_TEXTS[idx % TEMPLATE_POST_TEXTS.length];
    const postData: any = {
      content: `${textTemplate} #${author.username.split("_")[0]} #${idx + 1}`,
      authorId: author.id,
      views: Math.floor(Math.random() * 8000) + 150,
      createdAt: new Date(Date.now() - idx * 1000 * 60 * 18) // Spaced out over time
    };

    // Attach diverse media types
    if (idx % 3 === 0) {
      postData.imageUrl = UNSPLASH_IMAGES[idx % UNSPLASH_IMAGES.length];
    } else if (idx % 11 === 0) {
      postData.videoUrl = SAMPLE_VIDEOS[idx % SAMPLE_VIDEOS.length];
    } else if (idx % 7 === 0) {
      const poll = SAMPLE_POLLS[idx % SAMPLE_POLLS.length];
      postData.pollData = JSON.stringify(poll);
    } else if (idx % 5 === 0) {
      postData.isCodeBlock = true;
    }

    const createdPost = await (prisma.post as any).create({
      data: postData
    });
    totalPostsCreated++;

    // Add Likes (between 5 and 18 per post)
    const likersCount = Math.floor(Math.random() * 12) + 4;
    for (let l = 0; l < likersCount; l++) {
      const liker = userList[(idx + l + 1) % userList.length];
      await prisma.like
        .create({
          data: {
            userId: liker.id,
            postId: createdPost.id
          }
        })
        .catch(() => {});
    }

    // Add Comments (1-3 comments per post)
    if (idx % 2 === 0) {
      const commenter = userList[(idx + 3) % userList.length];
      await prisma.comment.create({
        data: {
          content: "Great post! Totally agree with this point 🔥",
          userId: commenter.id,
          postId: createdPost.id
        }
      }).catch(() => {});
    }
  }

  console.log(`✅ Created ${totalPostsCreated} Posts with Likes & Comments.`);
  console.log("🎉 Seeding completed successfully! Test users & 110+ posts are ready.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
