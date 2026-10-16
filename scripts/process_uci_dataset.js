const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function processCSV() {
  const csvPath = path.join(__dirname, '..', 'backend', 'data', 'energydata_complete.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found at:', csvPath);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isHeader = true;
  const records = [];
  let minDate = '';
  let maxDate = '';

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (isHeader) {
      isHeader = false;
      continue;
    }

    const parts = line.split(',').map(s => s.replace(/"/g, '').trim());
    if (parts.length < 29) continue;

    const date = parts[0];
    if (!minDate) minDate = date;
    maxDate = date;

    const appliancesWh = parseFloat(parts[1]) || 0;
    const lightsWh = parseFloat(parts[2]) || 0;
    
    // Temperatures T1 to T9
    const temps = [
      parseFloat(parts[3]) || 0,
      parseFloat(parts[5]) || 0,
      parseFloat(parts[7]) || 0,
      parseFloat(parts[9]) || 0,
      parseFloat(parts[11]) || 0,
      parseFloat(parts[13]) || 0,
      parseFloat(parts[15]) || 0,
      parseFloat(parts[17]) || 0,
      parseFloat(parts[19]) || 0
    ].map(v => Math.round(v * 10) / 10);

    // Humidities RH_1 to RH_9
    const rhs = [
      parseFloat(parts[4]) || 0,
      parseFloat(parts[6]) || 0,
      parseFloat(parts[8]) || 0,
      parseFloat(parts[10]) || 0,
      parseFloat(parts[12]) || 0,
      parseFloat(parts[14]) || 0,
      parseFloat(parts[16]) || 0,
      parseFloat(parts[18]) || 0,
      parseFloat(parts[20]) || 0
    ].map(v => Math.round(v * 10) / 10);

    const tOut = Math.round((parseFloat(parts[21]) || 0) * 10) / 10;
    const press = Math.round((parseFloat(parts[22]) || 0) * 10) / 10;
    const rhOut = Math.round((parseFloat(parts[23]) || 0) * 10) / 10;
    const wind = Math.round((parseFloat(parts[24]) || 0) * 10) / 10;
    const vis = Math.round((parseFloat(parts[25]) || 0) * 10) / 10;
    const tdew = Math.round((parseFloat(parts[26]) || 0) * 10) / 10;

    // Power in kW: Wh * 6 / 1000 = Wh * 0.006
    const appKw = Math.round(appliancesWh * 0.006 * 1000) / 1000;
    const lgtKw = Math.round(lightsWh * 0.006 * 1000) / 1000;
    const totalKw = Math.round((appKw + lgtKw) * 1000) / 1000;

    records.push({
      date,
      appWh: appliancesWh,
      lgtWh: lightsWh,
      appKw,
      lgtKw,
      totalKw,
      t: temps,
      rh: rhs,
      tOut,
      press,
      rhOut,
      wind,
      vis,
      tdew
    });
  }

  console.log('Total processed records:', records.length);
  console.log('Timestamp range:', minDate, 'to', maxDate);

  const outDir1 = path.join(__dirname, '..', 'public', 'data');
  const outDir2 = path.join(__dirname, '..', 'web', 'public', 'data');
  if (!fs.existsSync(outDir1)) fs.mkdirSync(outDir1, { recursive: true });
  if (!fs.existsSync(outDir2)) fs.mkdirSync(outDir2, { recursive: true });

  const targetFile1 = path.join(outDir1, 'uci_energy_data.json');
  const targetFile2 = path.join(outDir2, 'uci_energy_data.json');

  fs.writeFileSync(targetFile1, JSON.stringify(records));
  fs.writeFileSync(targetFile2, JSON.stringify(records));
  console.log('Wrote processed JSON to:', targetFile1);
  console.log('File size (bytes):', fs.statSync(targetFile1).size);
}

processCSV().catch(err => {
  console.error('Error processing CSV:', err);
  process.exit(1);
});
