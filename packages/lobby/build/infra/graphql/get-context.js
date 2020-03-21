"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeGetContext = void 0;

const makeGetContext = ({
  dispatchDomainEvents,
  authorizationService
} = {}) => async () => ({
  dispatchDomainEvents,
  currentUser: await authorizationService.getCurrentUser()
});

exports.makeGetContext = makeGetContext;