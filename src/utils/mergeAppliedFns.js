import * as R from 'ramda';

const mergeAppliedFns = fns => R.pipe(R.applyTo, R.map(R.__, fns), R.pipe(R.mergeAll));

export default mergeAppliedFns;
