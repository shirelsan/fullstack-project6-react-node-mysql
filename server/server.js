const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/admin', require('./routes/admin'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
