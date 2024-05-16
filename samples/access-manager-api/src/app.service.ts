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
          manage: false,
          delete: false,
          get: true,
          join: true,
          update: true,
        },
        [`${curr.id}-pnpres`]: {
          read: true,
          write: true,
          manage: false,
          delete: false,
          get: true,
          join: true,
          update: true,
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
        }),
      };
    }

    const userMemberships = await user.getMemberships();
    const userRestrictions = await user.getChannelsRestrictions();

    const reducedRestrictedChannels = userRestrictions.restrictions.reduce(
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
    const reducedMemberships = userMemberships.memberships.reduce(
      (acc, curr) => {
        return {
          ...acc,
          [curr.channel.id]: {
            read: true,
            write: true,
            manage: false,
            delete: false,
            get: true,
            join: true,
            update: true,
          },
          [`${curr.channel.id}-pnpres`]: {
            read: true,
            write: true,
            manage: false,
            delete: false,
            get: true,
            join: true,
            update: true,
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
          ...reducedMemberships,
          ...reducedRestrictedChannels,
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
