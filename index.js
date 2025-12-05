// ============================
// COST CONSTANTS
// ============================
const CEMENT_PRICE_PER_BAG = {
  "UltraTech": 400, "ACC": 395, "Ambuja": 398, "Shree Cement": 390,
  "Dalmia": 420, "Birla Gold": 385, "Ramco": 405, "JK Lakshmi": 392,
  "JK Cement": 410, "Penna": 380
};

const STEEL_PRICE_PER_KG = 56.5;
const SAND_PRICE_PER_TON = 2000;
const ROCK_PRICE_PER_TON = 2500;

const LABOR_RATE_PER_CUBIC_METER = 2000;
const FORMWORK_RATE_PER_CUBIC_METER = 1500;
const WATERPROOF_RATE_PER_SQM = 50;

const MIX_RATIOS = {
  "M15": { cement: 1, sand: 2, aggregate: 4 },
  "M20": { cement: 1, sand: 1.5, aggregate: 3 },
  "M25": { cement: 1, sand: 1, aggregate: 2 },
  "M30": { cement: 1, sand: 0.75, aggregate: 1.5 }
};

const BAGS_PER_CUBIC_METER = 8;
const STEEL_RATE_PER_CUBIC_METER = 60;

// ============================
// UNIT CONVERSIONS
// ============================
const sqftToSqm = ft => ft * 0.092903;
const inchToMeter = inch => inch * 0.0254;
const feetToMeter = ft => ft * 0.3048;
const toLakh = amount => (amount / 100000).toFixed(2) + " L";

// ============================
// MAIN CALCULATION
// ============================
function calculateFoundationCost(inputs) {
  const { plotSize, slabThickness, footingThickness,
    excavationDepth, floors, cementBrand, concreteGrade,
    includeLabor, includeFormwork, includeWaterproofing,
    contingencyPercent } = inputs;

  if (plotSize <= 0 || slabThickness <= 0 || footingThickness <= 0 || floors <= 0)
    return { error: "All dimensions must be greater than zero." };

  const areaSqm = sqftToSqm(plotSize);
  const slabM = inchToMeter(slabThickness);
  const footingM = inchToMeter(footingThickness);

  const slabVolume = areaSqm * slabM * floors;
  const footingVolume = areaSqm * footingM;

  const totalConcreteVolume = slabVolume + footingVolume;

  const mix = MIX_RATIOS[concreteGrade];
  const totalParts = mix.cement + mix.sand + mix.aggregate;

  const sandVolume = (totalConcreteVolume * mix.sand) / totalParts;
  const rockVolume = (totalConcreteVolume * mix.aggregate) / totalParts;

  const sandTons = sandVolume * 1.5;
  const rockTons = rockVolume * 1.6;

  const cementBags = totalConcreteVolume * BAGS_PER_CUBIC_METER;
  const cementCost = cementBags * CEMENT_PRICE_PER_BAG[cementBrand];

  const steelKg = totalConcreteVolume * STEEL_RATE_PER_CUBIC_METER;
  const steelCost = steelKg * STEEL_PRICE_PER_KG;

  const sandCost = sandTons * SAND_PRICE_PER_TON;
  const rockCost = rockTons * ROCK_PRICE_PER_TON;

  const laborCost = includeLabor === "yes" ? totalConcreteVolume * LABOR_RATE_PER_CUBIC_METER : 0;
  const formworkCost = includeFormwork === "yes" ? totalConcreteVolume * FORMWORK_RATE_PER_CUBIC_METER : 0;
  const waterproofCost = includeWaterproofing === "yes" ? areaSqm * WATERPROOF_RATE_PER_SQM : 0;

  let totalCost = cementCost + steelCost + sandCost + rockCost + laborCost + formworkCost + waterproofCost;
  totalCost *= 1 + contingencyPercent / 100;

  return {
    totalConcreteVolume, cementBags, cementCost, sandTons, sandCost,
    rockTons, rockCost, steelKg, steelCost, laborCost,
    formworkCost, waterproofCost, totalCost
  };
}

// ============================
// HANDLE CALCULATE BUTTON
// ============================
document.getElementById("calcBtn").addEventListener("click", () => {
  const inputs = {
    plotSize: Number(plotSize.value),
    slabThickness: Number(slabThickness.value),
    footingThickness: Number(footingThickness.value),
    excavationDepth: Number(excavationDepth.value),
    floors: Number(floors.value),
    cementBrand: cementBrand.value,
    concreteGrade: concreteGrade.value,
    includeLabor: includeLabor.value,
    includeFormwork: includeFormwork.value,
    includeWaterproofing: includeWaterproofing.value,
    contingencyPercent: Number(contingency.value)
  };

  const r = calculateFoundationCost(inputs);
  const resultDiv = document.getElementById("result");

  if (r.error) {
    resultDiv.textContent = r.error;
    return;
  }

  const resultText = `
Concrete Volume: ${r.totalConcreteVolume.toFixed(2)} m³
Cement: ${r.cementBags.toFixed(1)} bags → ₹${toLakh(r.cementCost)}
Sand: ${r.sandTons.toFixed(2)} tons → ₹${toLakh(r.sandCost)}
Aggregate: ${r.rockTons.toFixed(2)} tons → ₹${toLakh(r.rockCost)}
Steel: ${r.steelKg.toFixed(1)} kg → ₹${toLakh(r.steelCost)}
Labor: ₹${toLakh(r.laborCost)}
Formwork: ₹${toLakh(r.formworkCost)}
Waterproofing: ₹${toLakh(r.waterproofCost)}

TOTAL COST: ₹${toLakh(r.totalCost)}
  `;

  resultDiv.textContent = resultText;

  const pdfBtn = document.getElementById("downloadPdfBtn");
  pdfBtn.style.display = "block";
  pdfBtn.onclick = () => downloadPDF(resultText);
});

// ============================
// PDF GENERATOR (NO IMPORTS)
// ============================
async function downloadPDF(text) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Load a Unicode TTF font from local folder
  const fontUrl = "fonts/NotoSans-Regular.ttf"; // make sure this exists
  const fontData = await fetch(fontUrl).then(res => res.arrayBuffer());
  const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontData)));

  doc.addFileToVFS("NotoSans-Regular.ttf", fontBase64);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(12);

  const lines = text.split("\n").filter(line => line.trim().length > 0);
  let y = 12;

  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 12;
    }
    doc.text(line, 10, y);
    y += 8;
  }

  doc.save("Foundation_Budget.pdf");
}
