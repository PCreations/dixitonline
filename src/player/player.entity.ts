import { Brand, Data, Effect, Option } from 'effect';

export type PlayerId = string & Brand.Brand<'PlayerId'>;

export const PlayerId = Brand.nominal<PlayerId>();

// Erreurs métier typées
export class EmailAlreadyLinkedError extends Data.TaggedError(
  'EmailAlreadyLinkedError',
)<{
  readonly playerId: PlayerId;
  readonly existingEmail: string;
}> {}

export class PlayerEntity {
  private constructor(
    private readonly props: {
      readonly id: PlayerId;
      readonly username: string;
      readonly email: Option.Option<string>;
      readonly isAnonymous: boolean;
      readonly version: number;
      readonly createdAt: Date;
      readonly updatedAt: Date;
    },
  ) {}

  get id(): PlayerId {
    return this.props.id;
  }

  get version(): number {
    return this.props.version;
  }

  // === Factory ===
  static createFromAuth(authUser: {
    id: string;
    username: string;
    email?: string;
    isAnonymous: boolean;
  }): PlayerEntity {
    const now = new Date();
    return new PlayerEntity({
      id: PlayerId(authUser.id),
      username: authUser.username,
      email: Option.fromNullable(authUser.email),
      isAnonymous: authUser.isAnonymous,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  // === Méthodes métier ===

  /**
   * Change le username
   */
  updateUsername(newUsername: string): PlayerEntity {
    if (newUsername === this.props.username) {
      return this; // No change needed
    }

    return new PlayerEntity({
      ...this.props,
      username: newUsername,
      version: this.props.version + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Marque le joueur comme authentifié (non-anonyme)
   * Utilisé quand un joueur anonyme confirme son email via magic link
   */
  markAsAuthenticated(): PlayerEntity {
    if (!this.props.isAnonymous) {
      return this; // Already authenticated
    }

    return new PlayerEntity({
      ...this.props,
      isAnonymous: false,
      version: this.props.version + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Lie un email au joueur → le rend non-anonyme
   */
  linkEmail(
    email: string,
  ): Effect.Effect<PlayerEntity, EmailAlreadyLinkedError> {
    return Option.match(this.props.email, {
      onNone: () =>
        Effect.succeed(
          new PlayerEntity({
            ...this.props,
            email: Option.some(email),
            isAnonymous: false,
            version: this.props.version + 1,
            updatedAt: new Date(),
          }),
        ),
      onSome: (existingEmail) =>
        Effect.fail(
          new EmailAlreadyLinkedError({
            playerId: this.props.id,
            existingEmail,
          }),
        ),
    });
  }

  // === Persistence ===

  toSnapshot() {
    return {
      id: this.props.id as string,
      username: this.props.username,
      email: Option.getOrNull(this.props.email),
      isAnonymous: this.props.isAnonymous,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  static fromSnapshot(snapshot: {
    id: string;
    username: string;
    email: string | null;
    isAnonymous: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): PlayerEntity {
    return new PlayerEntity({
      id: PlayerId(snapshot.id),
      username: snapshot.username,
      email: Option.fromNullable(snapshot.email),
      isAnonymous: snapshot.isAnonymous,
      version: snapshot.version,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }
}
