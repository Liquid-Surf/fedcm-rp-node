const low = require('lowdb');
const fs = require('fs');

if (!fs.existsSync('./.data')) {
  fs.mkdirSync('./.data');
}

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('.data/db.json');
const db = low(adapter);

const csrfCheck = (req, res, next) => {
  console.log('Sec-FedCM-CSRF:', req.header('Sec-FedCM-CSRF'));
  if (req.header('X-Requested-With') === 'XMLHttpRequest' ||
      req.header('Sec-FedCM-CSRF') === '?1') {
    next();
  } else {
    return res.status(400).json({ error: 'Invalid access.' });
  }
};

/**
 * Checks CSRF protection using custom header `X-Requested-With`
 * If the session doesn't contain `signed-in`, consider the user is not authenticated.
 **/
const sessionCheck = (req, res, next) => {
  if (!req.session.user_id) {
    res.status(401).json({ error: 'not signed in.' });
    return;
  }
  const user = db.get('users').find({ username: req.session.username }).value();
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }
  res.locals.user = user;

  next();
};

module.exports = { csrfCheck, sessionCheck };
