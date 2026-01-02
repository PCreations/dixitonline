import { Brand, Data, Effect, Option } from "effect";

export type PlayerId = string & Brand.Brand<"PlayerId">;

export const PlayerId = Brand.nominal<PlayerId>();

// Erreurs métier typées
export class EmailAlreadyLinkedError extends Data.TaggedError(
  "EmailAlreadyLinkedError",
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
      readonly createdAt: Date;
      readonly updatedAt: Date;
    },
  ) {}

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
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  static fromSnapshot(
    snapshot: ReturnType<PlayerEntity["toSnapshot"]>,
  ): PlayerEntity {
    return new PlayerEntity({
      id: PlayerId(snapshot.id),
      username: snapshot.username,
      email: Option.fromNullable(snapshot.email),
      isAnonymous: snapshot.isAnonymous,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }
}
