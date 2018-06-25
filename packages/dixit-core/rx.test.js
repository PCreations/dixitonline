/*global jest*/

const _ = require('lodash');
const fs = require('fs');
const util = require('util');
const createState = require('./createState');

const trace = label => data => debug(label, data);

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}

const TEN_MINUTES = 10 * 60 * 1000;
const TWENTY_MINUTES = 2 * TEN_MINUTES;
const THIRTY_MINUTES = 3 * TEN_MINUTES;

const videos = [{
  name: 'v1',
  duration: TEN_MINUTES,
  id: 'v1',
}, {
  name: 'v2',
  duration: TWENTY_MINUTES,
  id: 'v2',
}, {
  name: 'v3',
  duration: THIRTY_MINUTES,
  id: 'v3',
}];

const oneHourFillDurationVideosFixture = Promise.resolve(videos);

//jest.useFakeTimers();

describe('given a list of videos with total duration filling exactly the fill duration period', () => {
  const Rx = require('rxjs');
  describe.only('rx', () => {
    test.only('new state mgmt', done => {
      /* action and reducers */
      const initialState = {
        currentVideo: null,
        currentVideoStartedAt: null,
        playlist: [],
        playlistCursor: null,
      };

      const updatePlaylist = playlist => function updatePlaylist(state) {
        return {
          ...state,
          playlist,
          playlistCursor: 0,
        };
      };

      const startVideo = video => function startVideo(state) {
        return {
          ...state,
          currentVideo: video,
        };
      };

      const videoStarted = startedAt => function videoStarted(state) {
        return {
          ...state,
          currentVideoStartedAt: startedAt,
        };
      };

      const videoEnded = () => function videoEnded(state) {
        return state;
      };

      const state = createState(initialState);

      const now = +new Date();

      const playlistFetchInterval$ = Rx.Observable
        .timer(0, 2 * THIRTY_MINUTES)
        .mergeMapTo(oneHourFillDurationVideosFixture)
        .concatMap(playlist => {
          const updates = [updatePlaylist(playlist)];
          if (state.value.currentVideo === null) {
            updates.push(startVideo({ video: playlist[0] }));
          }
          return Rx.Observable.from(updates);
        });

      const startVideoTimer$ = state.select$('currentVideo')
        .do(() => console.log(state.value))
        .mergeMap(({ payload }) => Rx.Observable.merge(
          Rx.Observable.of(videoStarted(now)),
          Rx.Observable.timer(1000).mapTo(videoEnded())
        ));

      state.combineWorkflows(
        playlistFetchInterval$,
        startVideoTimer$,
      );


      /*const updates$ = new Rx.BehaviorSubject(initialState);

      const state$ = updates$
        .scan((state, action) => action(state))
        .map((state, i) => {
          console.log(`[${i}]`, state);
          return state;
        })
        .shareReplay(1);

      const actions = {
        updatePlaylist$: new Rx.Subject(),
        currentVideoHasEnded$: new Rx.Subject(),
        startCurrentVideo$: new Rx.Subject(),
        moveCursor$: new Rx.Subject(),
      }

      actions.updatePlaylist$
        .map(playlist => state => ({
          ...state,
          playlist,
          playlistCursor: 0,
        }))
        .subscribe(updates$);

      actions.startCurrentVideo$
        .map(startDate => state => {
          const currentVideo = state.playlist[state.playlistCursor];
          const newState = {
            ...state,
            currentVideo,
            currentVideoStartedAt: startDate,
          };
          //logics.startVideoTimer.next(currentVideo.duration);
          return newState;
        })
        .subscribe(updates$)

      actions.moveCursor$
        .map(() => state => {
          console.log('moving cursor')
          const playlistCursor = state.playlistCursor + 1 === state.playlist.length ? 0 : state.playlistCursor + 1;
          return {
            ...state,
            playlistCursor,
          };
        })
        .subscribe(updates$);

      const logic$ = state$
        .pluck('currentVideo')
        .skipWhile(cv => cv === null)
        .distinctUntilChanged(_.isEqual)
        .do(() => console.log('dispatch moving cursor'))
        .do(() => actions$.moveCursor$.next())
        .exhaustMap(currentVideo => {
          console.log('setting timer', currentVideo.duration);
          return Rx.Observable.timer(currentVideo.duration)
        })
        .do(() => actions$.startCurrentVideo$.next(+new Date()))

      const now = + new Date();

      logic$.subscribe();

      Rx.Observable
        .merge(
          state$
            .bufferCount(4)
            .do(states => {
              expect(states[0]).toEqual(initialState);
              expect(states[1]).toEqual({
                ...initialState,
                playlist: videos,
                playlistCursor: 0,
              });
              expect(states[2]).toEqual({
                ...initialState,
                currentVideo: videos[0],
                currentVideoStartedAt: now,
                playlist: videos,
                playlistCursor: 0,
              });
              expect(states[3]).toEqual({
                ...initialState,
                currentVideo: videos[0],
                currentVideoStartedAt: now,
                playlist: videos,
                playlistCursor: 1,
              });
            })
            .do(() => console.log('advance time by', videos[0].duration))
            .do(() => jest.advanceTimersByTime(videos[0].duration))
            .take(1),
        )
        .subscribe({
          complete: done,
          error: done.fail.bind(done),
        });


      Rx.Observable
        .timer(0, 6000000)
        .delayWhen(() => state$
          .pluck('currentVideo')
          .do(cv => console.log('current video', cv, cv === null ? null : 'waiting for new startCurrentVideos$ action'))
          .mergeMap(currentVideo => currentVideo === null ? Rx.Observable.of(currentVideo) : actions$.startCurrentVideo$)
          .do(() => console.log('CAN TRIGGER REQ'))
          .take(1)
        )
        .mergeMapTo(oneHourFillDurationVideosFixture)
        .do(_videos => actions.updatePlaylist$.next(_videos))
        .map((_, i) => {
          if (i === 0) {
            actions.startCurrentVideo$.next(now);
          }
        })
        .subscribe();

      jest.advanceTimersByTime(0);*/
    });
  });
  describe('when the loop starts', () => {
    test('then the first video should be played', done => {
      const { state$, start } = createLoop({
        getVideos: () => oneHourFillDurationVideosFixture,
      });
      const currentVideo$ = state$
        .skip(1)
        .map(state => state.currentVideo)
        .distinctUntilChanged(_.isEqual)
        .take(1)
        .do(currentVideo => {
          expect(currentVideo).toEqual({
            name: 'v1',
            duration: 10,
            id: 'v1',
          })
        })
        .subscribe({
          complete: done,
          error: done.fail.bind(done),
        });
      start();
      //jest.advanceTimersByTime(0);
    });
  });
  describe('when the first video ends', () => {
    test('then the second video should starts', done => {
      const { state$, start } = createLoop({
        getVideos: () => oneHourFillDurationVideosFixture,
      });
      const currentVideo$ = state$
        .map(state => state.currentVideo)
        .skipWhile(v => v === null)
        .distinctUntilChanged(_.isEqual)
        .bufferCount(2)
        .take(1)
        .map(videos => videos[1])
        .do(video => expect(video).toEqual({
          name: 'v2',
          duration: 20,
          id: 'v2',
        }))

      const currentStartedAt$ = state$
        .map(state => state.currentVideoStartedAt)
        .skipWhile(currentVideoStartedAt => currentVideoStartedAt === null)
        .distinctUntilChanged()
        .take(1)
        .do(() => jest.advanceTimersByTime(TEN_MINUTES))

      Rx.Observable.merge(currentVideo$, currentStartedAt$)
        .subscribe({
          complete: done,
          error: done.fail.bind(done),
        });
      start();
      jest.advanceTimersByTime(0);
    });
  });
});
