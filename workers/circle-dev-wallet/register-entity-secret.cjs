const { registerEntitySecretCiphertext } = require('@circle-fin/developer-controlled-wallets');

registerEntitySecretCiphertext({
  apiKey: 'd6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf',
  entitySecret: 'e8b75a9f5a37ae5b54d7da0a10f272cfe979a370bb9eab7867aa31acab137785',
  recoveryFileDownloadPath: './entity-secret-recovery.json',
})
.then(() => {
  console.log('\n✅ Entity Secret registered successfully!\n');
  console.log('Recovery file saved to: ./entity-secret-recovery.json');
  console.log('\n⚠️  BACKUP THIS RECOVERY FILE! It\'s your only way to reset the Entity Secret.\n');
})
.catch(err => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
