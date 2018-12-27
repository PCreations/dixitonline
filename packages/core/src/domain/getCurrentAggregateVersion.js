const getCurrentAggregateVersion = ({
  getCurrentAggregateVersion = async () => {
    throw new Error('not implemented');
  },
}) => getCurrentAggregateVersion;

module.exports = {
  getCurrentAggregateVersion,
};
