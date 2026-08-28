// Gera um arquivo DICOM (Part 10) de teste por paciente cadastrado (initialPatients).
// Uncompressed Explicit VR LE, MONOCHROME2 8-bit.
// PatientID = id do paciente ("pat_N") e PatientName = nome em caixa alta →
// o importador vincula automaticamente ao paciente na aba PACS.
// Uso: node scripts/generate_test_dicom.mjs
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(fileURLToPath(import.meta.url), '../../test-data');
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

let uidCounter = 0;
function makeUID(prefix = '1.2.826.0.1.3680043.10.5434.99') {
  uidCounter += 1;
  return `${prefix}.${uidCounter}.${Date.now().toString(36)}`;
}

function ie16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n, 0); return b; }
function ie32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n, 0); return b; }
function tag(g, e) { return Buffer.concat([ie16(g), ie16(e)]); }

function padEven(buf, padByte = 0x20) {
  return buf.length % 2 === 1 ? Buffer.concat([buf, Buffer.from([padByte])]) : buf;
}

const LONG_VRS = new Set(['OB', 'OW', 'OF', 'SQ', 'UT', 'UN']);

function explicit(g, e, vr, value) {
  const raw = Buffer.isBuffer(value) ? value : Buffer.from(value, 'ascii');
  const pad = vr === 'UI' || LONG_VRS.has(vr) ? 0x00 : 0x20;
  const val = padEven(raw, pad);
  const header = LONG_VRS.has(vr)
    ? Buffer.concat([tag(g, e), Buffer.from(vr), ie16(0), ie32(val.length)])
    : Buffer.concat([tag(g, e), Buffer.from(vr), ie16(val.length)]);
  return Buffer.concat([header, val]);
}

function us(g, e, v) { return explicit(g, e, 'US', ie16(v)); }

const clamp = (v) => Math.max(0, Math.min(255, v));

function pixelRX(w, h) {
  const out = new Uint8Array(w * h);
  const cx = w * 0.5, cy = h * 0.52, bodyR = h * 0.38;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / bodyR, dy = (y - cy) / bodyR;
      const d = Math.sqrt(dx * dx + dy * dy);
      let v = 220;
      const ldx = (x - cx * 0.9) / (bodyR * 0.62);
      const ldy = (y - cy * 1.02) / (bodyR * 0.72);
      const ld = Math.sqrt(ldx * ldx + ldy * ldy);
      if (d < 1) {
        v = Math.round(120 + Math.sin(dx * 8) * 20 + Math.sin(dy * 6) * 10);
      }
      if (ld < 1) v = Math.round(70 + 40 * ld);
      const dy2 = (y - (cy + bodyR * 0.55)) / (bodyR * 0.22);
      if (Math.abs(dy2) < 1 && Math.abs(dx) < 0.9 && d < 1) v = 95;
      out[y * w + x] = clamp(v);
    }
  }
  return out;
}

function pixelUS(w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const frac = y / h;
    const halfW = w * 0.42 * (0.12 + 0.88 * frac);
    for (let x = 0; x < w; x++) {
      let v = 0;
      if (Math.abs(x - w / 2) < halfW) {
        v = Math.round(110 + 100 * (0.5 + 0.5 * Math.sin((x * 0.7 + y) * 0.31)));
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

function pixelHead(w, h, brainBase, ventricles) {
  const out = new Uint8Array(w * h);
  const cx = w / 2, cy = h / 2, R = w * 0.3;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / R, dy = (y - cy) / R;
      const d = Math.hypot(dx, dy);
      let v = 12;
      if (d < 0.96) {
        v = brainBase + Math.round(10 * Math.sin(dx * 11) * Math.cos(dy * 7));
        const vdx = (x - cx) / (R * 0.28), vdy = (y - cy) / (R * 0.17);
        if (Math.hypot(vdx, vdy) < 1) v = ventricles;
      } else if (d < 1.03) {
        v = 205;
      }
      out[y * w + x] = clamp(v);
    }
  }
  return out;
}

const pixelCT = (w, h) => pixelHead(w, h, 118, 22);
const pixelMRI = (w, h) => pixelHead(w, h, 142, 58);

function drawCircle(out, w, h, cx, cy, r, val) {
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(h - 1, Math.ceil(cy + r)); y++) {
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x++) {
      if (Math.hypot(x - cx, y - cy) <= r) out[y * w + x] = val;
    }
  }
}

function drawBezier(out, w, h, x1, y1, x2, y2, cx, cy, thick, val) {
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * x1 + 2 * u * t * cx + t * t * x2;
    const y = u * u * y1 + 2 * u * t * cy + t * t * y2;
    for (let dy = -thick; dy <= thick; dy++) {
      for (let dx = -thick; dx <= thick; dx++) {
        if (dx * dx + dy * dy > thick * thick) continue;
        const px = Math.round(x + dx), py = Math.round(y + dy);
        if (px >= 0 && py >= 0 && px < w && py < h) out[py * w + px] = val;
      }
    }
  }
}

function pixelPET(w, h) {
  const out = new Uint8Array(w * h);
  const cx = w / 2;
  drawCircle(out, w, h, cx, h * 0.14, w * 0.07, 95);
  const torsoW = w * 0.17, torsoTop = h * 0.28, torsoBot = h * 0.72;
  for (let y = torsoTop; y <= torsoBot; y++) {
    for (let x = cx - torsoW; x <= cx + torsoW; x++) out[y * w + x] = 68;
  }
  for (let y = h * 0.3; y <= h * 0.58; y++) {
    for (let x = cx - w * 0.3; x <= cx - torsoW; x++) out[y * w + x] = 55;
    for (let x = cx + torsoW; x <= cx + w * 0.3; x++) out[y * w + x] = 55;
  }
  drawCircle(out, w, h, cx - w * 0.05, h * 0.32, w * 0.035, 230);
  drawCircle(out, w, h, cx + w * 0.07, h * 0.48, w * 0.028, 205);
  drawCircle(out, w, h, cx, h * 0.42, w * 0.022, 185);
  drawCircle(out, w, h, cx, h * 0.68, w * 0.045, 120);
  return out;
}

function pixelXA(w, h) {
  const out = new Uint8Array(w * h);
  const ox = w * 0.2, oy = h * 0.16;
  const branches = [
    [ox, oy, w * 0.42, h * 0.5, w * 0.42, oy, 3, 235],
    [ox, oy, w * 0.7, h * 0.22, w * 0.5, oy, 2, 225],
    [ox, oy, w * 0.34, h * 0.66, w * 0.3, h * 0.38, 3, 220],
    [ox, oy, w * 0.78, h * 0.5, w * 0.6, h * 0.3, 2, 210],
    [ox, oy, w * 0.5, h * 0.82, w * 0.44, h * 0.5, 2, 200],
    [ox, oy, w * 0.9, h * 0.36, w * 0.72, h * 0.24, 1, 195],
    [ox, oy, w * 0.3, h * 0.9, w * 0.28, h * 0.6, 1, 185],
  ];
  for (const [x1, y1, x2, y2, cx, cy, thick, val] of branches) {
    drawBezier(out, w, h, x1, y1, x2, y2, cx, cy, thick, val);
  }
  drawCircle(out, w, h, ox, oy, w * 0.02, 245);
  return out;
}

function buildDicom({ rows, cols, modality, patientId, patientName, accession, description, bodyPart, pixel }) {
  const sopClassUid = '1.2.840.10008.5.1.4.1.1.7'; // Secondary Capture Image Storage
  const sopInstanceUid = makeUID();
  const studyUid = makeUID();
  const seriesUid = makeUID();

  const metaBody = Buffer.concat([
    explicit(0x0002, 0x0001, 'OB', Buffer.from([0, 1])),
    explicit(0x0002, 0x0002, 'UI', sopClassUid),
    explicit(0x0002, 0x0003, 'UI', sopInstanceUid),
    explicit(0x0002, 0x0010, 'UI', '1.2.840.10008.1.2.1'),
    explicit(0x0002, 0x0012, 'UI', '1.2.826.0.1.3680043.10.5434.9.1.1'),
    explicit(0x0002, 0x0013, 'SH', 'IAMED-TESTGEN-1'),
  ]);
  const metaGroup = Buffer.concat([tag(0x0002, 0x0000), ie32(metaBody.length), metaBody]);

  const ds = Buffer.concat([
    explicit(0x0008, 0x0016, 'UI', sopClassUid),
    explicit(0x0008, 0x0018, 'UI', sopInstanceUid),
    explicit(0x0008, 0x0020, 'DA', '20260827'),
    explicit(0x0008, 0x0030, 'TM', '093000'),
    explicit(0x0008, 0x0050, 'SH', accession),
    explicit(0x0008, 0x0060, 'CS', modality),
    explicit(0x0008, 0x0070, 'LO', 'IAMED TEST DICOM'),
    explicit(0x0008, 0x0080, 'LO', 'IAMED Centro Medico'),
    explicit(0x0008, 0x0090, 'PN', 'DR^TESTE^RADIO'),
    explicit(0x0008, 0x1030, 'LO', description),
    explicit(0x0010, 0x0010, 'PN', patientName),
    explicit(0x0010, 0x0020, 'LO', patientId),
    explicit(0x0018, 0x0015, 'CS', bodyPart),
    explicit(0x0020, 0x000D, 'UI', studyUid),
    explicit(0x0020, 0x000E, 'UI', seriesUid),
    explicit(0x0020, 0x0011, 'IS', '1'),
    explicit(0x0020, 0x0013, 'IS', '1'),
    explicit(0x0020, 0x1206, 'IS', '1'),
    explicit(0x0020, 0x1208, 'IS', '1'),
    us(0x0028, 0x0002, 1),
    explicit(0x0028, 0x0004, 'CS', 'MONOCHROME2'),
    us(0x0028, 0x0010, rows),
    us(0x0028, 0x0011, cols),
    us(0x0028, 0x0100, 8),
    us(0x0028, 0x0101, 8),
    us(0x0028, 0x0102, 7),
    us(0x0028, 0x0103, 0),
    explicit(0x0028, 0x1050, 'DS', '128'),
    explicit(0x0028, 0x1051, 'DS', '256'),
    explicit(0x7FE0, 0x0010, 'OB', Buffer.from(pixel)),
  ]);

  return Buffer.concat([Buffer.alloc(128), Buffer.from('DICM', 'ascii'), metaGroup, ds]);
}

const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Um exame por paciente cadastrado (initialPatients): PatientID = id, PatientName = nome.
// pat_3 e pat_5 têm um segundo estudo (PET e XA) para as métricas ficarem mais ricas.
const PATIENTS = [
  { id: 'pat_1', name: 'Carlos Eduardo Almeida', modality: 'RX', desc: 'Rx Torax PA', bodyPart: 'TORAX', size: [256, 256], pixel: pixelRX },
  { id: 'pat_2', name: 'Mariana Rosa Santos', modality: 'US', desc: 'US Obstetrico 1o Trimestre', bodyPart: 'OBSTETRICO', size: [320, 240], pixel: pixelUS },
  { id: 'pat_3', name: 'Joaquim Bento Pereira', modality: 'RM', desc: 'RM de Cranio', bodyPart: 'ENCEFALO', size: [256, 256], pixel: pixelMRI },
  { id: 'pat_4', name: 'Ana Julia de Souza', modality: 'MG', desc: 'Mamografia Bilateral', bodyPart: 'MAMAS', size: [320, 320], pixel: pixelRX },
  { id: 'pat_5', name: 'Fis. Camila Torres', modality: 'TC', desc: 'TC de Cranio sem Contraste', bodyPart: 'CRANIO', size: [256, 256], pixel: pixelCT },
  { id: 'pat_3', name: 'Joaquim Bento Pereira', modality: 'PET', desc: 'PET-CT Corpo Inteiro com FDG', bodyPart: 'CORPO INTEIRO', size: [256, 256], pixel: pixelPET },
  { id: 'pat_5', name: 'Fis. Camila Torres', modality: 'XA', desc: 'Angiografia Coronariana', bodyPart: 'CORONARIAS', size: [256, 256], pixel: pixelXA },
];

const dicomParser = (await import('dicom-parser')).default;

let idx = 0;
for (const p of PATIENTS) {
  idx += 1;
  const [cols, rows] = p.size;
  const patientName = stripAccents(p.name).toUpperCase();
  const accession = `ACC-${idx.toString().padStart(3, '0')}-${p.modality}`;
  const fileName = `${p.modality}_${p.id.toUpperCase()}.dcm`;
  const dcm = buildDicom({
    rows, cols, modality: p.modality,
    patientId: p.id, patientName, accession,
    description: p.desc, bodyPart: p.bodyPart,
    pixel: p.pixel(cols, rows),
  });
  writeFileSync(resolve(OUT_DIR, fileName), dcm);

  const ds = dicomParser.parseDicom(new Uint8Array(dcm));
  const px = ds.elements.x7fe00010;
  const pxLen = px ? px.length : -1;
  console.log(
    `OK  ${fileName.padEnd(20)} ${dcm.length} bytes  | ${ds.string('x00080060')}  ${patientName.padEnd(22)} PatientID=${ds.string('x00100020')}  pixel=${pxLen}B`
  );
}
console.log(`\n${PATIENTS.length} arquivos em: ${OUT_DIR}`);