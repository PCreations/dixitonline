import { describe } from "vitest";
import { makeGameDriverTestLayer } from "../../../game.driver.js";
import { createGameTestSuite } from "../../test-suites/create-game.test-suite.js";

describe("Acceptance (In-Memory): CreateGameTestSuite", () => {
  createGameTestSuite(makeGameDriverTestLayer);
});