const Query = ({ getQuery, addOnQueryChangeListener }) => ({
  async subscribe(notifyChange) {
    addOnQueryChangeListener(notifyChange);
    notifyChange(await getQuery());
  },
});

module.exports = {
  Query,
};
