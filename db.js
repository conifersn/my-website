const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, function(err, result) {
      if (err) reject(err);
      else resolve({ lastID: result.rows[0]?.id, changes: result.rowCount });
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result.rows);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result.rows[0]);
    });
  });
}

module.exports = { runQuery, allQuery, getQuery, pool };
