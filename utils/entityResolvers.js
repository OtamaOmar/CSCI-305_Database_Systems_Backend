const { db } = require('../db/connection');

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

async function resolvePatient(payload = {}) {
  const lookupValue = pickFirstNonEmpty(payload.patient_id, payload.patient, payload.patient_name);

  if (!lookupValue) {
    return null;
  }

  const [rows] = await db.query(
    'SELECT id, name FROM patients WHERE id = ? OR name = ? LIMIT 1',
    [lookupValue, lookupValue]
  );

  return rows[0] || null;
}

async function resolveDoctor(payload = {}) {
  const lookupValue = pickFirstNonEmpty(payload.doctor_id, payload.doctor, payload.doctor_name);

  if (!lookupValue) {
    return null;
  }

  const [rows] = await db.query(
    'SELECT id, name, department FROM doctors WHERE id = ? OR name = ? LIMIT 1',
    [lookupValue, lookupValue]
  );

  return rows[0] || null;
}

const roomTypeMap = {
  ICU: 'ICU',
  Emergency: 'Emergency',
  General: 'General',
  Surgery: 'Surgery',
  'Operation Room': 'Surgery',
  'Treatment Room': 'General',
};

function normalizeRoomType(value) {
  const normalized = pickFirstNonEmpty(value);
  return roomTypeMap[normalized] || '';
}

async function resolveRoom(payload = {}) {
  const roomId = pickFirstNonEmpty(payload.room_id);
  if (roomId) {
    const [rows] = await db.query(
      'SELECT id, room_number, room_type, status FROM rooms WHERE id = ? LIMIT 1',
      [roomId]
    );
    return rows[0] || null;
  }

  const roomNumber = pickFirstNonEmpty(payload.room_number, payload.room);
  if (roomNumber) {
    const [rows] = await db.query(
      'SELECT id, room_number, room_type, status FROM rooms WHERE room_number = ? LIMIT 1',
      [roomNumber]
    );
    return rows[0] || null;
  }

  const roomType = normalizeRoomType(payload.room_type || payload.roomType);
  if (!roomType) {
    return null;
  }

  const [rows] = await db.query(
    "SELECT id, room_number, room_type, status FROM rooms WHERE room_type = ? AND status = 'Available' ORDER BY room_number ASC LIMIT 1",
    [roomType]
  );

  return rows[0] || null;
}

async function generatePrefixedId(tableName, prefix) {
  const allowedTables = new Set(['doctors', 'patients', 'emergency_cases']);
  if (!allowedTables.has(tableName)) {
    throw new Error(`ID generation is not allowed for table: ${tableName}`);
  }

  const [rows] = await db.query(`SELECT id FROM ${tableName} WHERE id LIKE ?`, [`${prefix}-%`]);

  let maxNumber = 0;
  for (const row of rows) {
    const match = String(row.id || '').match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) continue;

    const numericPart = Number(match[1]);
    if (Number.isFinite(numericPart)) {
      maxNumber = Math.max(maxNumber, numericPart);
    }
  }

  return `${prefix}-${String(maxNumber + 1).padStart(4, '0')}`;
}

module.exports = {
  generatePrefixedId,
  normalizeRoomType,
  pickFirstNonEmpty,
  resolveDoctor,
  resolvePatient,
  resolveRoom,
};
