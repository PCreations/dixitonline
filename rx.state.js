/* action and reducers */
      const initialState = {
        currentVideo: null,
        currentVideoStartedAt: null,
        playlist: [],
        playlistCursor: null,
      };

      let _state = initialState;

      const actions$ = new Rx.Subject().subscribeOn(Rx.Scheduler.queue)

      const reducer = (state, action, i) => {
        let newState;
        console.log('ACTION', action, i);
        switch (action.type) {
        case 'PLAYLIST_UPDATED':
          newState = {
            ...state,
            playlist: action.payload,
            playlistCursor: 0,
          };
          break;
        case 'START_VIDEO':
          newState = {
            ...state,
            currentVideo: action.payload.video,
            currentVideoStartedAt: action.payload.startedAt,
          };
          break;
        default:
          newState = state;
          break;
        }
        _state = newState;
        return newState;
      };

      const store$ = actions$
        .startWith(initialState)
        .scan(reducer)
        .distinctUntilChanged(_.isEqual)
        .shareReplay(1)

      const getState$ = () => Rx.Observable.fromPromise(new Promise(resolve => store$.take(1).subscribe(resolve)))

      const now = +new Date();

      const fetchPlaylist$ = actions$
        .filter(({ type }) => type === 'FETCH_VIDEOS')
        .mergeMapTo(oneHourFillDurationVideosFixture)
        .concatMap(playlist => getState$()
          .concatMap(state => {
            const actions = [{ type: 'PLAYLIST_UPDATED', payload: playlist }];
            if (state.currentVideo === null) {
              actions.push({
                type: 'START_VIDEO',
                payload: {
                  video: playlist[0],
                  startedAt: now,
                }
              });
            }
            return Rx.Observable.from(actions);
          })
        );

      const playlistFetchInterval$ = Rx.Observable
        .timer(0, 2 * THIRTY_MINUTES)
        .mapTo({ type: 'FETCH_VIDEOS' })

      const startVideoTimer$ = actions$
        .filter(({ type }) => type === 'START_VIDEO')
        .do(() => console.log(_state))
        .concatMap(getState$)
        .do((state) => console.log(_state))
        .mergeMap(({ payload }) => Rx.Observable.merge(
          Rx.Observable.of({ type: 'VIDEO_STARTED' }),
          Rx.Observable.timer(1000).mapTo({ type: 'VIDEO_ENDED' })
        )).subscribeOn(Rx.Scheduler.queue);

      store$.subscribe();

      Rx.Observable
        .merge(
          playlistFetchInterval$,
          fetchPlaylist$,
          startVideoTimer$,
        )
        .observeOn(Rx.Scheduler.queue)
        .subscribe(actions$);