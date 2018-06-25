const { BehaviorSubject } = require('rxjs');

const createDixitStore = require('./createDixitStore');

const defaultStore = createDixitStore();

const stateSubject = new BehaviorSubject();

const state$ = stateSubject
  .scan((store, updater) => createDixitStore(updater(store)), defaultStore)
  .distinctUntilChanged();

module.exports = {
  $: state$,
  update: updater => stateSubject.next(updater),
};
