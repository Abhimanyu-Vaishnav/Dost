import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SAMPLE_USERS = [
  {
    name: "Aarav Sharma",
    username: "aarav_dev",
    email: "aarav@example.com",
    bio: "Full-stack engineer building AI micro-saas. Next.js 16 + React 19 enthusiast 🚀",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    accountType: "PERSON",
    accountSubType: "Full-Stack Engineer"
  },
  {
    name: "Priya Patel",
    username: "priya_design",
    email: "priya@example.com",
    bio: "Lead UI/UX Designer @ DesignLab. Crafting clean interfaces, glassmorphism & dark mode 🎨",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
    accountType: "PERSON",
    accountSubType: "UI/UX Designer"
  },
  {
    name: "Vikram Malhotra",
    username: "vikram_founder",
    email: "vikram@example.com",
    bio: "Founder & CEO @ CloudPulse. Scaled apps from 0 to 1M users. #indiehackers #startups ⚡",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    accountType: "BUSINESS",
    accountSubType: "Tech Founder"
  },
  {
    name: "Ananya Roy",
    username: "ananya_fit",
    email: "ananya@example.com",
    bio: "Fitness coach & marathon runner 🏋️‍♀️ Clean eating, daily workouts & positive vibes ✨",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    accountType: "PERSON",
    accountSubType: "Fitness Coach"
  },
  {
    name: "Rohan Varma",
    username: "rohan_gaming",
    email: "rohan@example.com",
    bio: "Pro gamer & tech setup reviewer 🎮 Custom Mechanical Keyboards & RGB aesthetic 🕹️",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    accountType: "PERSON",
    accountSubType: "Gaming Creator"
  }
];

const TOPIC_POSTS = [
  // TECH & CODE
  {
    authorUsername: "aarav_dev",
    content: "Just migrated our entire backend to Next.js 16 Server Actions + Prisma ORM! The query performance is 3x faster with zero bundle bloat ⚡💻 #tech #coding #nextjs #javascript",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
    isCodeBlock: true,
    views: 1420
  },
  {
    authorUsername: "aarav_dev",
    content: "Quick poll for developers: What's your primary choice for state management in React 19? 📊 #tech #react",
    pollData: JSON.stringify({
      question: "What's your primary state management choice in 2026?",
      options: ["Zustand", "Redux Toolkit", "React Context", "Jotai / Recoil"]
    }),
    views: 890
  },
  {
    authorUsername: "aarav_dev",
    content: "Check out this 4K time-lapse of my desk setup build! Custom dual monitor arm + cable management magic 🖥️🎥 #setup #tech",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    views: 3200
  },

  // UI/UX DESIGN
  {
    authorUsername: "priya_design",
    content: "Minimalist dark theme design exploration for our new DOST social mobile app layout. Glassmorphism + subtle neon glow accents 🎨✨ What do you think? #design #uiux #figma #darkmode",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    views: 2150
  },
  {
    authorUsername: "priya_design",
    content: "Design Rule #1: Good typography isn't just about picking nice fonts; it's about hierarchy, line-height & spatial harmony 📐 #uiux #design",
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80",
    views: 1780
  },

  // STARTUP & BUSINESS
  {
    authorUsername: "vikram_founder",
    content: "We just hit 100,000 monthly active users on CloudPulse! 🚀 Here are the top 3 lessons from scaling our infrastructure under heavy traffic spikes 📈 #startup #business #indiehackers #growth",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
    views: 4500
  },
  {
    authorUsername: "vikram_founder",
    content: "Video snippet from our Annual Tech Summit Keynote on building resilient teams & serverless architectures 🎤🍿 #startups #founders",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    views: 2900
  },

  // FITNESS & LIFESTYLE
  {
    authorUsername: "ananya_fit",
    content: "Morning 10K run around the lake! 🏃‍♀️ High energy, fresh morning air & 600 calories burned. Start your day with movement 💪 #fitness #health #workout #running",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80",
    views: 1890
  },
  {
    authorUsername: "ananya_fit",
    content: "Healthy post-workout smoothie bowl: acai, organic blueberries, chia seeds & almond butter 🍓🥣 #fitness #lifestyle #clean-eating",
    imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=1200&auto=format&fit=crop&q=80",
    views: 1240
  },

  // GAMING & SETUPS
  {
    authorUsername: "rohan_gaming",
    content: "Completed my dream cyber-themed gaming setup! OLED 240Hz monitor, custom lube switches & ambient nanoleaf panels 🎮🔥 #gaming #setup #rgb #custompc",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80",
    views: 5400
  }
];

const COMMUNITIES_DATA = [
  {
    name: "Full-Stack Software Engineers",
    description: "Hub for Web Developers, React/Next.js engineers & backend architects.",
    icon: "💻",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "UI/UX Designers & Creators",
    description: "Share Figma designs, motion graphics, and UI feedback.",
    icon: "🎨",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Indie Hackers & Founders",
    description: "Building, launching and scaling digital products & startups.",
    icon: "🚀",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
  }
];

async function main() {
  console.log("🌱 Starting database seeding...");

  const defaultPassword = await bcrypt.hash("password123", 10);

  // 1. Create or upsert users
  const createdUsers: Record<string, any> = {};

  for (const u of SAMPLE_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        username: u.username,
        bio: u.bio,
        avatar: u.avatar,
        coverImage: u.coverImage,
        accountType: u.accountType,
        accountSubType: u.accountSubType
      },
      create: {
        email: u.email,
        username: u.username,
        password: defaultPassword,
        name: u.name,
        bio: u.bio,
        avatar: u.avatar,
        coverImage: u.coverImage,
        accountType: u.accountType,
        accountSubType: u.accountSubType
      }
    });
    createdUsers[u.username] = user;
    console.log(`User created/updated: @${user.username}`);
  }

  // 2. Create Follows between users
  const userList = Object.values(createdUsers);
  for (let i = 0; i < userList.length; i++) {
    for (let j = 0; j < userList.length; j++) {
      if (i !== j) {
        await prisma.follows
          .create({
            data: {
              followerId: userList[i].id,
              followingId: userList[j].id
            }
          })
          .catch(() => {}); // Ignore if relation exists
      }
    }
  }

  // 3. Create Posts
  for (const item of TOPIC_POSTS) {
    const author = createdUsers[item.authorUsername];
    if (!author) continue;

    const postData: any = {
      content: item.content,
      authorId: author.id,
      views: item.views || 100,
    };

    if (item.imageUrl) postData.imageUrl = item.imageUrl;
    if (item.videoUrl) postData.videoUrl = item.videoUrl;
    if (item.pollData) postData.pollData = item.pollData;
    if (item.isCodeBlock) postData.isCodeBlock = item.isCodeBlock;

    const createdPost = await (prisma.post as any).create({
      data: postData
    });

    // Add sample likes
    for (const u of userList) {
      if (Math.random() > 0.3) {
        await prisma.like
          .create({
            data: {
              userId: u.id,
              postId: createdPost.id
            }
          })
          .catch(() => {});
      }
    }

    // Add sample comments
    await prisma.comment.create({
      data: {
        content: "Awesome update! Thanks for sharing 🔥",
        userId: userList[Math.floor(Math.random() * userList.length)].id,
        postId: createdPost.id
      }
    }).catch(() => {});
  }

  // 4. Create Communities
  for (const c of COMMUNITIES_DATA) {
    const creator = userList[0];
    const comm = await prisma.community.create({
      data: {
        name: c.name,
        description: c.description,
        icon: c.icon,
        coverImage: c.coverImage,
        creatorId: creator.id
      }
    }).catch(() => {});

    if (comm) {
      for (const u of userList) {
        await prisma.communityMember
          .create({
            data: {
              communityId: comm.id,
              userId: u.id,
              role: u.id === creator.id ? "ADMIN" : "MEMBER"
            }
          })
          .catch(() => {});
      }
    }
  }

  // 5. Create 24h Stories
  const stories = [
    {
      author: createdUsers["aarav_dev"],
      content: "Building DOST Social App 🚀 #buildinginpublic",
      mediaUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
      mediaType: "IMAGE",
      bgColor: "#1d9bf0"
    },
    {
      author: createdUsers["priya_design"],
      content: "Late night Figma dark mode tweaks ✨🎨",
      mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      mediaType: "IMAGE",
      bgColor: "#ec4899"
    }
  ];

  for (const s of stories) {
    if (!s.author) continue;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.story.create({
      data: {
        authorId: s.author.id,
        content: s.content,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        bgColor: s.bgColor,
        expiresAt
      }
    }).catch(() => {});
  }

  console.log("✅ Seed completed successfully! Test users & posts are ready.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
