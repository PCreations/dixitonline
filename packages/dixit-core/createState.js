const { Subject, Scheduler, Observable } = require('rxjs');
const { get: _get, isEqual: _isEqual } = require('lodash');

const createState = initialState => {
  let value;

  const updates$ = new Subject().subscribeOn(Scheduler.queue);

  const $ = updates$
    .startWith(initialState)
    .scan((state, updateFn, i) => {
      const newState = updateFn(state);
      console.log(updateFn.name, i);
      return newState;
    })
    .distinctUntilChanged(_isEqual)
    .shareReplay(1);

  $.subscribe(state => {
    value = state;
  });

  const select$ = (...path) => $
    .pluck(...path)
    .skipWhile(val => _get(value, path) === _get(initialState, path))
    .distinctUntilChanged(_isEqual);

  const combineWorkflows = (...workflows) => Observable
    .merge(...workflows)
    .observeOn(Scheduler.queue)
    .subscribe(updates$);

  return {
    $,
    select$,
    get value() {
      return value;
    },
    combineWorkflows,
  };
};

module.exports = createState;
