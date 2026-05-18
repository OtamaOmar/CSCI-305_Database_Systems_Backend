const { db } = require('../db/connection');

async function emitNotification({
  hospitalId,
  actorUserId = null,
  title,
  message,
  level = 'Info',
  type = 'system',
  entity_type = null,
  entity_id = null,
}) {
  if (!hospitalId) return;
  if (!title || !message) return;

  await db.query(
    'INSERT INTO notifications (hospital_id, actor_user_id, title, message, `level`, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [hospitalId, actorUserId, title, message, level, type, entity_type, entity_id]
  );
}

module.exports = { emitNotification };

