import {
  defaultEndingConditionStrategy,
  xTimesStorytellerEndingConditionsStrategy,
  scoreLimitEndingCondition,
  getEndingConditionStrategy,
} from '../end-condition-strategies';
import { buildTestGame } from '../../__tests__/dataBuilders/game';

describe('ending condition strategies', () => {
  describe('default strategy is to end game when there is no more cards to draw', () => {
    test('game not ended', () => {
      // act
      const game = buildTestGame()
        .withCards(48)
        .withXPlayers(5)
        .build();
      const { remainingTurns, isGameEnded } = defaultEndingConditionStrategy(game);

      // assert
      expect(remainingTurns).toEqual(8);
      expect(isGameEnded).toBe(false);
    });
    test('game ended', () => {
      // act
      const game = buildTestGame()
        .withCards(0)
        .withXPlayers(5)
        .build();
      const { remainingTurns, isGameEnded } = defaultEndingConditionStrategy(game);

      // assert
      expect(remainingTurns).toEqual(-1);
      expect(isGameEnded).toBe(true);
    });
    test('it floors the remaining turns', () => {
      // act
      const game = buildTestGame()
        .withCards(54)
        .withXPlayers(4)
        .build();
      const { remainingTurns } = defaultEndingConditionStrategy(game);

      // assert
      expect(remainingTurns).toEqual(10);
    });
  });

  describe('x times storyteller strategy', () => {
    test('it computes the correct number of remaining turns and the game ended status', () => {
      // act & assert
      let game = buildTestGame()
        .withXPlayers(3)
        .withCurrentTurnNumber(1)
        .withXtimesStorytellerLimit(1)
        .build();
      expect(xTimesStorytellerEndingConditionsStrategy(game)).toEqual({
        remainingTurns: 3,
        isGameEnded: false,
      });

      game = buildTestGame()
        .withXPlayers(3)
        .withCurrentTurnNumber(5)
        .withXtimesStorytellerLimit(1)
        .build();
      expect(xTimesStorytellerEndingConditionsStrategy(game)).toEqual({
        remainingTurns: -1,
        isGameEnded: true,
      });

      game = buildTestGame()
        .withXPlayers(3)
        .withCurrentTurnNumber(1)
        .withXtimesStorytellerLimit(2)
        .build();
      expect(xTimesStorytellerEndingConditionsStrategy(game)).toEqual({
        remainingTurns: 7,
        isGameEnded: false,
      });

      game = buildTestGame()
        .withXPlayers(3)
        .withCurrentTurnNumber(5)
        .withXtimesStorytellerLimit(2)
        .build();
      expect(xTimesStorytellerEndingConditionsStrategy(game)).toEqual({
        remainingTurns: 3,
        isGameEnded: false,
      });
    });
  });

  test('score limit', () => {
    const baseGame = () =>
      buildTestGame()
        .withScoreLimit(30)
        .withXPlayers(3);

    let game = baseGame()
      .withScore([10, 20, 25, 12])
      .build();
    expect(scoreLimitEndingCondition(game)).toEqual({
      isGameEnded: false,
    });

    game = baseGame()
      .withScore([10, 30, 25, 12])
      .build();
    expect(scoreLimitEndingCondition(game)).toEqual({
      isGameEnded: true,
    });

    game = baseGame()
      .withScore([10, 20, 32, 12])
      .build();
    expect(scoreLimitEndingCondition(game)).toEqual({
      isGameEnded: true,
    });
  });

  describe('get ending condition strategy', () => {
    it('gets the default conditions strategy when the endCondition is default', () => {
      // arrange
      const game = buildTestGame().build();

      // act
      const strategy = getEndingConditionStrategy(game);

      // assert
      expect(strategy).toBe(defaultEndingConditionStrategy);
    });

    it('gets the score limit strategy when the endCondition is scoreLimit', () => {
      // arrange
      const game = buildTestGame()
        .withScoreLimit(30)
        .build();

      // act
      const strategy = getEndingConditionStrategy(game);

      // assert
      expect(strategy).toBe(scoreLimitEndingCondition);
    });

    it('gets the xTimesStoryteller strategy when the endCondition is xTimesStorytellerLimit', () => {
      // arrange
      const game = buildTestGame()
        .withXtimesStorytellerLimit(2)
        .build();

      // act
      const strategy = getEndingConditionStrategy(game);

      // assert
      expect(strategy).toBe(xTimesStorytellerEndingConditionsStrategy);
    });
  });
});
