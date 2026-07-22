const express = require('express');
const buildRouter = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/v1', buildRouter());

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Astro Orbit Platform-Backend listening on port ${PORT}`);
  });
}

module.exports = app;
