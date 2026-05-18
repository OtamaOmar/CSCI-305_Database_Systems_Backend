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

async function resolvePatient(payload = {}, hospitalId) {
  const lookupValue = pickFirstNonEmpty(payload.patient_id, payload.patient, payload.patient_name);

  if (!lookupValue) {
    return null;
  }

  if (!hospitalId) {
    throw new Error('resolvePatient requires hospitalId');
  }

  const [rows] = await db.query(
    'SELECT id, name FROM patients WHERE hospital_id = ? AND (id = ? OR name = ?) LIMIT 1',
    [hospitalId, lookupValue, lookupValue]
  );

  return rows[0] || null;
}

async function resolveDoctor(payload = {}, hospitalId) {
  const lookupValue = pickFirstNonEmpty(payload.doctor_id, payload.doctor, payload.doctor_name);

  if (!lookupValue) {
    return null;
  }

  if (!hospitalId) {
    throw new Error('resolveDoctor requires hospitalId');
  }

  const [rows] = await db.query(
    `
      SELECT d.id, d.name, dep.name AS department
      FROM doctors d
      LEFT JOIN departments dep ON dep.id = d.department_id
      WHERE d.hospital_id = ? AND (d.id = ? OR d.name = ?)
      LIMIT 1
    `,
    [hospitalId, lookupValue, lookupValue]
  );

  return rows[0] || null;
}

async function resolveDepartment(payload = {}, hospitalId) {
  if (!hospitalId) {
    throw new Error('resolveDepartment requires hospitalId');
  }

  const lookupValue = pickFirstNonEmpty(payload.department_id, payload.department, payload.department_name);
  if (!lookupValue) return null;

  const [rows] = await db.query(
    'SELECT id, name, code FROM departments WHERE hospital_id = ? AND (id = ? OR name = ? OR code = ?) LIMIT 1',
    [hospitalId, lookupValue, lookupValue, lookupValue]
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

async function resolveRoom(payload = {}, hospitalId) {
  if (!hospitalId) {
    throw new Error('resolveRoom requires hospitalId');
  }

  const roomId = pickFirstNonEmpty(payload.room_id);
  if (roomId) {
    const [rows] = await db.query(
      'SELECT id, room_number, room_type, status FROM rooms WHERE hospital_id = ? AND id = ? LIMIT 1',
      [hospitalId, roomId]
    );
    return rows[0] || null;
  }

  const roomNumber = pickFirstNonEmpty(payload.room_number, payload.room);
  if (roomNumber) {
    const [rows] = await db.query(
      'SELECT id, room_number, room_type, status FROM rooms WHERE hospital_id = ? AND room_number = ? LIMIT 1',
      [hospitalId, roomNumber]
    );
    return rows[0] || null;
  }

  const roomType = normalizeRoomType(payload.room_type || payload.roomType);
  if (!roomType) {
    return null;
  }

  const [rows] = await db.query(
    "SELECT id, room_number, room_type, status FROM rooms WHERE hospital_id = ? AND room_type = ? AND status = 'Available' ORDER BY room_number ASC LIMIT 1",
    [hospitalId, roomType]
  );

  return rows[0] || null;
}

async function generatePrefixedId(tableName, prefix, hospitalId) {
  const allowedTables = new Set(['doctors', 'patients', 'emergency_cases']);
  if (!allowedTables.has(tableName)) {
    throw new Error(`ID generation is not allowed for table: ${tableName}`);
  }

  if (!hospitalId) {
    throw new Error('generatePrefixedId requires hospitalId');
  }

  const [rows] = await db.query(
    `SELECT id FROM ${tableName} WHERE hospital_id = ? AND id LIKE ?`,
    [hospitalId, `${prefix}-%`]
  );

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
  resolveDepartment,
  resolveDoctor,
  resolvePatient,
  resolveRoom,
};
