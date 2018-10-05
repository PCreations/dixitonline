const { WriteModel } = require('./writeModel');
const { ReadModel } = require('./readModel');
const { Client } = require('./writeModel/client');

const DixitCore = {
  WriteModel,
  ReadModel,
  Client,
};

module.exports = {
  DixitCore,
};
