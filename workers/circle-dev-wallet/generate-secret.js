const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');

const client = initiateDeveloperControlledWalletsClient({
  apiKey: 'd6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf',
  entitySecret: ''
});

client.createEntitySecretCiphertext()
  .then(response => {
    console.log('\n✅ Entity Secret Generated!\n');
    console.log('SAVE THIS VALUE:');
    console.log('CIRCLE_ENTITY_SECRET=' + response.data.entitySecret);
    console.log('\nBackup (ciphertext):');
    console.log(response.data.entitySecretCiphertext);
    console.log('\n⚠️ Add the CIRCLE_ENTITY_SECRET to your .env.local file!\n');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
