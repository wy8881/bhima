/**
* Data Collector Management Controller
*
* This controller exposes an API to the client for reading and writing Data Collector Management
*/

const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');
const FilterParser = require('../../lib/filter');

// GET /data_collector_management
function lookupDataCollectorManagement(id) {
  const sql = `
    SELECT id, label, description, version_number, color, is_related_patient FROM data_collector_management
    WHERE data_collector_management.id = ?
  `;

  return db.one(sql, [id]);
}


// List
function list(req, res, next) {
  const filters = new FilterParser(req.query);

  const sql = `SELECT id, label, description, version_number, color, is_related_patient
    FROM data_collector_management`;

  filters.equals('label');
  filters.equals('description');
  filters.equals('version_number');
  filters.equals('is_related_patient');
  filters.setOrder('ORDER BY label ASC');
  filters.setOrder('ORDER BY version_number');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  db.exec(query, parameters)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    .done();
}

/**
* GET /data_collector_management/:ID
*
* Returns the detail of a single data_collector_management
*/
function detail(req, res, next) {
  const { id } = req.params;

  lookupDataCollectorManagement(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    .done();
}


// POST /data_collector_management
function create(req, res, next) {
  const sql = `INSERT INTO data_collector_management SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next)
    .done();
}


// PUT /data_collector_management /:id
function update(req, res, next) {
  const sql = `UPDATE data_collector_management SET ? WHERE id = ?;`;

  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      return lookupDataCollectorManagement(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next)
    .done();
}

// DELETE /data_collector_management/:id
function remove(req, res, next) {
  const sql = `DELETE FROM data_collector_management WHERE id = ?;`;

  db.exec(sql, [req.params.id])
    .then((row) => {
    // if nothing happened, let the client know via a 404 error
      if (row.affectedRows === 0) {
        throw new NotFound(`Could not find a function with id ${req.params.id}`);
      }

      res.status(204).json();
    })
    .catch(next)
    .done();
}

// get list of dataCollectorManagement
exports.list = list;

// get details of a dataCollectorManagement
exports.detail = detail;

// create a new dataCollectorManagement
exports.create = create;

// update dataCollectorManagement informations
exports.update = update;

// Delete a dataCollectorManagement
exports.delete = remove;

// lookup Data Collector Management
exports.lookupDataCollectorManagement = lookupDataCollectorManagement;
