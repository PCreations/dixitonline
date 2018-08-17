import { World } from 'cucumber';
import { createAuthService, AuthService } from '../auth';

class AuthWorld {
  authUser: null | string = null;
  authService: AuthService = createAuthService();
  async logInUser(userName: string) {
    await this.authService.login(userName, 'test-password');
    this.authUser = this.authService.getAuthUser();
  }
}

class GameWorld {
  createGameHostedBy(playerName: string) {}
  getCurrentGamePlayersList() {}
  addPlayerInCurrentGame(playerName: string) {}
  getAvailableActionsAsHostForCurrentGame() {}
}

export class DixitWorld implements World {
  auth?: AuthWorld = new AuthWorld();
  game?: GameWorld = new GameWorld();
}
