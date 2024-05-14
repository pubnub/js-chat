import { Injectable } from '@nestjs/common';
import { ChatSdkService } from './chatsdk.service';

@Injectable()
export class AppService {
  constructor(private readonly chatsdkService: ChatSdkService) {}

  async getAuthKey(userId: string) {
    const chat = await this.chatsdkService.getChatSdkInstance();
    const user = await chat.getUser(userId);
    const allChannels = await chat.getChannels();
    const allChannelsDefaultPermissions = allChannels.channels.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.id]: {
          read: true,
          write: true,
          get: true,
        },
        [`${curr.id}-pnpres`]: {
          read: true,
          write: true,
          get: true,
        },
      }),
      {},
    );

    if (!user) {
      return {
        authKey: await chat.sdk.grantToken({
          ttl: 15,
          authorized_uuid: userId,
          resources: {
            channels: allChannelsDefaultPermissions,
            uuids: {
              [userId]: {
                get: true,
                update: true,
              },
            },
          },
        }),
      };
    }

    const userRestrictions = await user.getChannelsRestrictions();

    const reducedChannels = userRestrictions.restrictions.reduce(
      (acc, curr) => {
        return {
          ...acc,
          [curr.channelId]: {
            read: !curr.ban,
            write: !curr.mute && !curr.ban,
            get: true,
          },
          [`${curr.channelId}-pnpres`]: {
            read: !curr.ban,
            write: !curr.mute && !curr.ban,
            get: true,
          },
        };
      },
      {},
    );

    const grantTokenParams = {
      ttl: 15,
      authorized_uuid: userId,
      resources: {
        channels: {
          ...allChannelsDefaultPermissions,
          ...reducedChannels,
          [userId]: {
            read: true,
            write: true,
            manage: true,
            delete: true,
            get: true,
            join: true,
            update: true,
          },
          [`${userId}-pnpres`]: {
            read: true,
            write: true,
            manage: true,
            delete: true,
            get: true,
            join: true,
            update: true,
          },
        },
        uuids: {
          [userId]: {
            read: true,
            write: true,
            manage: true,
            delete: true,
            get: true,
            join: true,
            update: true,
          },
          [`${userId}-pnpres`]: {
            read: true,
            write: true,
            manage: true,
            delete: true,
            get: true,
            join: true,
            update: true,
          },
        },
      },
    };

    return {
      authKey: await chat.sdk.grantToken(grantTokenParams),
    };
  }
}
