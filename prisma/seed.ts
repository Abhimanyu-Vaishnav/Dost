import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding started...');

  // Clear existing data (optional, but good for a clean 100-user set)
  await prisma.notification.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.hiddenPost.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.findMany().then(async (users) => {
    for (const u of users) {
      await prisma.user.update({
        where: { id: u.id },
        data: { followers: { deleteMany: {} }, following: { deleteMany: {} } }
      });
    }
  });
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  // Generate 100 Users
  const users = [];
  for (let i = 0; i < 100; i++) {
    const name = faker.person.fullName();
    const cleanUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '') || `user${i}`;
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        username: cleanUsername,
        password,
        name,
        bio: faker.lorem.sentence(),
        avatar: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
        coverImage: `https://picsum.photos/seed/${faker.string.uuid()}/800/400`,
      },
    });
    users.push(user);
  }

  console.log(`Created ${users.length} users.`);

  // Generate Posts for each user
  const mediaPool = [
    { type: 'image', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05' },
    { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4' },
    { type: 'link', url: 'https://nextjs.org' },
    { type: 'link', url: 'https://google.com' },
  ];

  for (const user of users) {
    const postCount = faker.number.int({ min: 3, max: 6 });
    for (let j = 0; j < postCount; j++) {
      const media = faker.helpers.arrayElement(mediaPool);
      const post = await prisma.post.create({
        data: {
          content: `${faker.lorem.paragraph()} #dost #${faker.lorem.word()} **${faker.lorem.word()}** *${faker.lorem.word()}*`,
          authorId: user.id,
          imageUrl: media.type === 'image' ? `${media.url}?sig=${faker.string.uuid()}` : null,
          videoUrl: media.type === 'video' ? media.url : null,
          linkUrl: media.type === 'link' ? media.url : null,
          views: faker.number.int({ min: 10, max: 5000 }),
        },
      });

      // Add Random Likes (0-40)
      const likeCount = faker.number.int({ min: 0, max: 40 });
      const likers = faker.helpers.arrayElements(users, likeCount);
      for (const liker of likers) {
        await prisma.like.create({
          data: { userId: liker.id, postId: post.id }
        }).catch(() => {});
      }

      // Add Random Comments (0-15)
      const commentCount = faker.number.int({ min: 0, max: 15 });
      for (let k = 0; k < commentCount; k++) {
        const commenter = faker.helpers.arrayElement(users);
        await prisma.comment.create({
          data: {
            content: faker.lorem.sentence(),
            userId: commenter.id,
            postId: post.id,
            createdAt: faker.date.recent({ days: 7 })
          }
        });
      }
    }
  }

  console.log('Generating follows...');
  for (const user of users) {
    // Each user follows 5-10 random people
    const followCount = faker.number.int({ min: 5, max: 15 });
    const toFollow = faker.helpers.arrayElements(users.filter(u => u.id !== user.id), followCount);
    
    for (const target of toFollow) {
      await prisma.follows.create({
        data: {
          followerId: user.id,
          followingId: target.id,
        },
      }).catch(() => {}); // Ignore duplicates

      // Create notification for some follows (e.g. 30% chance) to populate the list
      if (Math.random() > 0.7) {
        await prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: target.id,
            actorId: user.id,
          }
        }).catch(() => {});
      }
    }
  }

  console.log('Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
