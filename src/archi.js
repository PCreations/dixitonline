const getEventSource = (emitter, channelId, isAdmin = false) => {
  // admin event source
  firebaseDb.goOnline();

  let newBlockedUsers = false;
  const blockedUsersRef = firebaseDb.ref('/admin/blockedUsers');
  blockedUsersRef.on('child_added', (snapshot) => {
    if (newBlockedUsers) {
      emitter.emitBlockedUserAdded({
        type: 'BLOCKED_USER_RECEIVED',
        payload: {
          id: snapshot.key,
          isBlocked: snapshot.val(),
        },
      });
    }
  });
  blockedUsersRef.on('child_changed', (snapshot) => {
    if (newBlockedUsers) {
      emitter.emitBlockedUserChanged({
        type: 'BLOCKED_USER_CHANGED',
        payload: {
          id: snapshot.key,
          isBlocked: snapshot.val(),
        },
      });
    }
  });
  blockedUsersRef.once('value', () => {
    newBlockedUsers = true;
  });

  // channel config event source
  let configLoaded = false;
  firebaseDb.ref(`/channels/${channelId}/config`).on('value', (snapshot) => {
    const config = snapshot.val();
    emitter.emitChannelConfigChanged(
      channelId,
      actions.channel.config[configLoaded ? 'changed' : 'loaded']({
        id: channelId,
        ...snapshot.val(),
      })
    );
    configLoaded = true;
    if (
      config &&
      config.pinnedMessageId &&
      !listeners.messages[config.pinnedMessageId]
    ) {
      firebaseDb
        .ref(`/messages/${channelId}/${config.pinnedMessageId}`)
        .on('value', (messageSnapshot) => {
          emitter.emitMessageAdded(
            channelId,
            actions.message.received({
              id: messageSnapshot.id,
              ...messageSnapshot.val(),
            })
          );
        });
      listeners.messages[config.pinnedMessageId] = true;
    }
  });
  firebaseDb.ref(`/channels/${channelId}/nbReactions`).on('value', (snapshot) => {
    emitter.emitReactionUpdateCount(
      channelId,
      actions.reaction.updateCount(snapshot.val())
    );
  });

  // embed event source
  /* const embedsRef = firebaseDb.ref('/embeds').limitToLast(1);
  embedsRef.on('child_added', snapshot => {
    emitter.emitEmbedReceived(channelId, actions.embed.received({
      id: snapshot.key,
      ...snapshot.val(),
    }));
  }); */

  // likes event source
  /* let likesLoaded = false;
  const likesRef = firebaseDb.ref(`/likes/${channelId}`);
  likesRef.on('child_added', snapshot => {
    likesLoaded && emitter.emitLikeReceived(channelId, actions.like.received({
      id: snapshot.key,
      likes: snapshot.val(),
    }));
  });
  likesRef.on('child_changed', snapshot => {
    likesLoaded && emitter.emitLikeChanged(channelId, actions.like.changed({
      id: snapshot.key,
      likes: snapshot.val(),
    }));
  });
  likesRef.once('value', () => { likesLoaded = true; }); */

  // messages event source
  let messagesLoaded = false;
  const messagesRef = firebaseDb.ref(`/messages/${channelId}`);
  const resolveMessage = (message) => {
    if (!listeners.messages[message.id]) {
      firebaseDb
        .ref(`/messages/${channelId}/${message.id}`)
        .on('value', (messageSnapshot) => {
          // Permission denied snapshot is empty
          if (!messageSnapshot.val()) {
            return;
          }
          const embedId = messageSnapshot.val().embedId;
          if (embedId && !listeners.embeds[embedId]) {
            firebaseDb.ref(`/embeds/${embedId}`).on('value', (embedSnapshot) => {
              emitter.emitEmbedReceived(
                channelId,
                actions.embed.received({
                  id: embedSnapshot.key,
                  ...embedSnapshot.val(),
                })
              );
            });
            listeners.embeds[embedId] = true;
          }
          emitter.emitMessageAdded(
            channelId,
            actions.message.received({
              id: messageSnapshot.id,
              ...messageSnapshot.val(),
            })
          );
        });
      listeners.messages[message.id] = true;
    }

    if (!listeners.likes[message.id]) {
      firebaseDb
        .ref(`/likes/${channelId}/${message.id}`)
        .on('value', (messageLikesSnapshot) => {
          emitter.emitLikeReceived(
            channelId,
            actions.like.received({
              id: messageLikesSnapshot.key,
              likes: messageLikesSnapshot.val(),
            })
          );
        });
      listeners.likes[message.id] = true;
    }

    if (!listeners.users[message.userId]) {
      firebaseDb.ref(`/users/${message.userId}`).on('value', (userSnapshot) => {
        emitter.emitUserReceived(
          actions.user.received({
            id: userSnapshot.key,
            ...userSnapshot.val(),
          })
        );
      });
      listeners.users[message.userId] = true;
    }

    if (!listeners.embeds[message.embedId]) {
      firebaseDb
        .ref(`/embeds/${message.embedId}`)
        .on('value', (embedSnapshot) => {
          emitter.emitEmbedReceived(
            channelId,
            actions.embed.received({
              id: embedSnapshot.key,
              ...embedSnapshot.val(),
            })
          );
        });
      listeners.embeds[message.embedId] = true;
    }
  };
  messagesRef.on('child_removed', (snapshot) => {
    emitter.emitMessageRemoved(
      channelId,
      actions.message.removed(snapshot.val())
    );
  });
  messagesRef.on('child_added', (snapshot) => {
    const message = snapshot.val();
    if (messagesLoaded) {
      emitter.emitMessageAdded(
        channelId,
        actions.message.received({
          id: snapshot.key,
          ...message,
        })
      );
      resolveMessage(message);
    }
  });
  messagesRef.limitToLast(30).once('value', (snapshot) => {
    messagesLoaded = true;
    snapshot.forEach((messageSnapshot) => {
      const message = messageSnapshot.val();
      resolveMessage(message);
    });
  });

  // reactions event source
  let reactionsLoaded = false;
  const reactionsRef = firebaseDb.ref(`/reactions/${channelId}`).limitToLast(1);
  reactionsRef.on('child_added', (snapshot) => {
    if (reactionsLoaded) {
      emitter.emitReactionReceived(
        channelId,
        actions.reaction.received({
          id: snapshot.key,
          ...snapshot.val(),
        })
      );
    }
  });
  reactionsRef.once('value', () => {
    reactionsLoaded = true;
  });

  const unsubscribe = () => {
    firebaseDb.goOffline();
  };
  unsubscribe.resolveMessage = resolveMessage;
  return unsubscribe;
};

export default _memoize(getEventSource, (_, channelId) => channelId);
