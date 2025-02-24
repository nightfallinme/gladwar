const fs = require('fs');
const path = require('path');

const CONTRACTS = [
  'Gonad',
  'GladiatorArena'
];

const ABI_DIR = path.join(__dirname, '../src/abis');
const ARTIFACTS_DIR = path.join(__dirname, '../artifacts/contracts');

// ABI klasörünü oluştur
if (!fs.existsSync(ABI_DIR)) {
  fs.mkdirSync(ABI_DIR, { recursive: true });
}

// Her kontrat için ABI'yi kopyala
CONTRACTS.forEach(contract => {
  const artifactPath = path.join(ARTIFACTS_DIR, `${contract}.sol/${contract}.json`);
  const abiPath = path.join(ABI_DIR, `${contract}.json`);

  const artifact = require(artifactPath);
  
  // Sadece ABI'yi kaydet
  fs.writeFileSync(
    abiPath,
    JSON.stringify({
      abi: artifact.abi
    }, null, 2)
  );

  console.log(`Updated ABI for ${contract}`);
}); 