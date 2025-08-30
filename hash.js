const bcrypt = require('bcrypt');
const passwordToHash = 'TEST123';
const saltRounds = 10;

bcrypt.hash(passwordToHash, saltRounds, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(hash);
});