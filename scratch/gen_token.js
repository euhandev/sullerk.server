const jwt = require('jsonwebtoken');

const secret =
  '8f00e7daebfd49415cf3744a7f1f5b2ce98b639d9cdf63b977c14adb2df97135d558a7c1ef2936cdbc19d84a9ed0bde6d57e5f2bb69b0b239b8462478aad53d0';
const payload = {
  id: '69faccc5cd5bf6bc52a479e5',
  email: 'test_listing@example.com',
  role: 'CUSTOMER',
};

const token = jwt.sign(payload, secret, { expiresIn: '1d' });
console.log(token);
