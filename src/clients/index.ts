import { AutoClientInterface } from "@elizaos/client-auto";
import { DiscordClientInterface } from "@elizaos/client-discord";
import { TelegramClientInterface } from "@elizaos/client-telegram";
import { TwitterClientInterface } from "@elizaos/client-twitter";
import { Character, IAgentRuntime } from "@elizaos/core";

export async function initializeClients(
  character: Character,
  runtime: IAgentRuntime
) {
  const clients = [];
  
  // Handle clients in a type-safe way
  // We'll check for clientConfig properties instead of using the clients array
  // since the interface is different between versions
  
  // Auto client
  const autoClient = await AutoClientInterface.start(runtime as any);
  if (autoClient) clients.push(autoClient);

  // Discord client - check if Discord config exists
  if (character.clientConfig?.discord) {
    clients.push(await DiscordClientInterface.start(runtime as any));
  }

  // Telegram client - check if Telegram config exists
  if (character.clientConfig?.telegram) {
    const telegramClient = await TelegramClientInterface.start(runtime as any);
    if (telegramClient) clients.push(telegramClient);
  }

  // Twitter client
  if (character.twitterProfile) {
    const twitterClients = await TwitterClientInterface.start(runtime as any);
    if (twitterClients) clients.push(twitterClients);
  }

  // Initialize plugins
  if (character.plugins?.length > 0) {
    for (const plugin of character.plugins) {
      if (plugin.clients) {
        for (const client of plugin.clients) {
          clients.push(await client.start(runtime as any));
        }
      }
    }
  }

  return clients;
}
