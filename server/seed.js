// Seed script - wipes all data and populates the database with sample data.
// Run with: node seed.js
const bcrypt = require('bcrypt');
const pool = require('./db');

const users = [
  { name: 'Leanne Graham', username: 'leanne', email: 'leanne@example.com', phone: '770-736-8031', website: 'hildegard.org', password: 'leanne123', role: 'user' },
  { name: 'Ervin Howell', username: 'ervin', email: 'ervin@example.com', phone: '010-692-6593', website: 'anastasia.net', password: 'ervin123', role: 'user' },
  { name: 'Clementine Bauch', username: 'clementine', email: 'clementine@example.com', phone: '463-123-4447', website: 'ramiro.info', password: 'clementine123', role: 'user' },
  { name: 'Site Admin', username: 'admin', email: 'admin@example.com', phone: '000-000-0000', website: 'admin.local', password: 'admin123', role: 'admin' }
];

const todosPerUser = [
  ['Buy groceries', 'Finish homework', 'Call the bank', 'Clean the house'],
  ['Prepare presentation', 'Review pull requests', 'Schedule dentist appointment', 'Water the plants'],
  ['Read a book chapter', 'Go for a run', 'Pay electricity bill', 'Plan weekend trip'],
  []
];

const postsPerUser = [
  [
    { title: 'Getting started with React', body: 'React makes it painless to create interactive UIs. Design simple views for each state in your application.' },
    { title: 'Why I love MySQL', body: 'MySQL is a reliable relational database that powers many of the largest websites in the world.' }
  ],
  [
    { title: 'Express routing tips', body: 'Express routers let you organize your API endpoints into clean, modular files.' },
    { title: 'REST API best practices', body: 'Use the right HTTP verbs: GET to read, POST to create, PUT to update, DELETE to remove.' }
  ],
  [
    { title: 'Thoughts on full-stack development', body: 'Working across the client, server, and database gives you a complete picture of how an application works.' },
    { title: 'Debugging with Postman', body: 'Postman is a great tool for testing your API endpoints before wiring up the client.' }
  ],
  []
];

const albumsPerUser = [
  ['Vacation 2025', 'Family Moments'],
  ['Nature Shots'],
  ['City Life', 'Food Diary'],
  []
];

// Each album gets a few placeholder photos (picsum.photos provides stable placeholder images)
const photosPerAlbum = 3;

const commentBodies = [
  'Great post, thanks for sharing!',
  'Very helpful, I learned a lot.',
  'Interesting perspective, I will try this out.'
];

async function seed() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Wipe existing data (order matters because of foreign keys)
    await connection.query('DELETE FROM photos');
    await connection.query('DELETE FROM albums');
    await connection.query('DELETE FROM comments');
    await connection.query('DELETE FROM todos');
    await connection.query('DELETE FROM posts');
    await connection.query('DELETE FROM passwords');
    await connection.query('DELETE FROM users');
    await connection.query('ALTER TABLE photos AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE albums AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE comments AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE todos AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE posts AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE users AUTO_INCREMENT = 1');

    const userIds = [];

    // Users + passwords
    for (const u of users) {
      const [result] = await connection.query(
        'INSERT INTO users (name, username, email, phone, website, role) VALUES (?, ?, ?, ?, ?, ?)',
        [u.name, u.username, u.email, u.phone, u.website, u.role]
      );
      const hash = await bcrypt.hash(u.password, 10);
      await connection.query('INSERT INTO passwords (user_id, password_hash) VALUES (?, ?)', [result.insertId, hash]);
      userIds.push(result.insertId);
    }

    // Todos
    for (let i = 0; i < userIds.length; i++) {
      for (let j = 0; j < todosPerUser[i].length; j++) {
        await connection.query(
          'INSERT INTO todos (user_id, title, completed) VALUES (?, ?, ?)',
          [userIds[i], todosPerUser[i][j], j % 2 === 0]
        );
      }
    }

    // Posts + comments (each post gets a comment from every other user)
    for (let i = 0; i < userIds.length; i++) {
      for (const p of postsPerUser[i]) {
        const [postResult] = await connection.query(
          'INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)',
          [userIds[i], p.title, p.body]
        );
        let c = 0;
        for (let k = 0; k < userIds.length; k++) {
          if (k === i) continue;
          await connection.query(
            'INSERT INTO comments (post_id, user_id, name, email, body) VALUES (?, ?, ?, ?, ?)',
            [postResult.insertId, userIds[k], users[k].name, users[k].email, commentBodies[c % commentBodies.length]]
          );
          c++;
        }
      }
    }

    // Albums + photos
    let photoCounter = 1;
    for (let i = 0; i < userIds.length; i++) {
      for (const albumTitle of albumsPerUser[i]) {
        const [albumResult] = await connection.query(
          'INSERT INTO albums (user_id, title) VALUES (?, ?)',
          [userIds[i], albumTitle]
        );
        for (let p = 0; p < photosPerAlbum; p++) {
          const seedId = photoCounter++;
          await connection.query(
            'INSERT INTO photos (album_id, title, url, thumbnail_url) VALUES (?, ?, ?, ?)',
            [
              albumResult.insertId,
              `${albumTitle} photo ${p + 1}`,
              `https://picsum.photos/seed/${seedId}/600/600`,
              `https://picsum.photos/seed/${seedId}/150/150`
            ]
          );
        }
      }
    }

    await connection.commit();

    const [[{ userCount }]] = await connection.query('SELECT COUNT(*) AS userCount FROM users');
    const [[{ todoCount }]] = await connection.query('SELECT COUNT(*) AS todoCount FROM todos');
    const [[{ postCount }]] = await connection.query('SELECT COUNT(*) AS postCount FROM posts');
    const [[{ commentCount }]] = await connection.query('SELECT COUNT(*) AS commentCount FROM comments');
    const [[{ albumCount }]] = await connection.query('SELECT COUNT(*) AS albumCount FROM albums');
    const [[{ photoCount }]] = await connection.query('SELECT COUNT(*) AS photoCount FROM photos');
    console.log(`Seeded: ${userCount} users, ${todoCount} todos, ${postCount} posts, ${commentCount} comments, ${albumCount} albums, ${photoCount} photos`);
    console.log('Login credentials:');
    users.forEach(u => console.log(`  ${u.username} / ${u.password}${u.role === 'admin' ? ' (admin)' : ''}`));
  } catch (err) {
    await connection.rollback();
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed();
