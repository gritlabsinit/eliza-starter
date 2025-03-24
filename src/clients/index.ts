import { Character, IAgentRuntime } from "@gritlab/core";
import { DiscordClientInterface } from "@elizaos/client-discord";
import { TelegramClientInterface } from "@elizaos/client-telegram";
import { TwitterClientInterface } from "@elizaos/client-twitter";

export async function initializeClients(
  character: Character,
  runtime: IAgentRuntime
) {
  const clients = [];
  
  // Discord client - check if Discord config exists
  if (character.clientConfig?.discord) {
    const discordClient = await DiscordClientInterface.start(runtime as any);
    if (discordClient) clients.push(discordClient);
  }

  // Telegram client - check if Telegram config exists
  if (character.clientConfig?.telegram) {
    const telegramClient = await TelegramClientInterface.start(runtime as any);
    if (telegramClient) clients.push(telegramClient);
  }

  // Twitter client - check if Twitter config exists
  if (character.twitterProfile) {
    const twitterClient = await TwitterClientInterface.start(runtime as any);
    if (twitterClient) clients.push(twitterClient);
  }

  return clients;
}
