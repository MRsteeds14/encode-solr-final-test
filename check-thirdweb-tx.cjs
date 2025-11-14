require('dotenv').config({ path: '.env.local' });

const TRANSACTION_IDS = [
  '06e2e4d3-dc9d-4252-ab79-c98d8a455bfb', // Approval
  '338cb45e-f59d-4e40-968b-00a6b21904dd'  // Fund Treasury
];

async function checkTransactionStatus() {
  console.log('🔍 Checking Thirdweb Transaction Status\n');

  for (const txId of TRANSACTION_IDS) {
    console.log(`Transaction ID: ${txId}`);

    try {
      const response = await fetch(`https://api.thirdweb.com/v1/transactions/${txId}`, {
        headers: {
          'x-secret-key': process.env.THIRDWEB_SECRET_KEY
        }
      });

      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
      console.log('---\n');

    } catch (error) {
      console.error(`Error checking ${txId}:`, error.message);
    }
  }
}

checkTransactionStatus();
