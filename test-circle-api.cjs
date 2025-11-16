const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');

const client = initiateDeveloperControlledWalletsClient({
  apiKey: 'd6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf',
  entitySecret: 'e8b75a9f5a37ae5b54d7da0a10f272cfe979a370bb9eab7867aa31acab137785'
});

console.log('Available methods:', Object.keys(client));

client.createWalletSet({ name: 'Test Wallet Set' })
  .then(response => {
    console.log('Success:', JSON.stringify(response.data, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.response?.data || err.message);
  });
