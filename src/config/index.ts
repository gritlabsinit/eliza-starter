import { Character, ModelProviderName, settings, validateCharacterConfig } from "@elizaos/core";
import fs from "fs";
import path from "path";
import yargs from "yargs";
import jsYaml from "js-yaml";
import { v4 as uuidv4 } from "uuid";

export function parseArguments(): {
  character?: string;
  characters?: string;
  agents?: string;
} {
  try {
    return yargs(process.argv.slice(2))
      .option("character", {
        type: "string",
        description: "Path to the character JSON file",
      })
      .option("characters", {
        type: "string",
        description: "Comma separated list of paths to character JSON files",
      })
      .option("agents", {
        type: "string",
        description: "Path to the agents YAML file (default: config/agents.yml)",
      })
      .parseSync();
  } catch (error) {
    console.error("Error parsing arguments:", error);
    return {};
  }
}

export async function loadCharacters(
  charactersArg: string
): Promise<Character[]> {
  let characterPaths = charactersArg?.split(",").map((filePath) => {
    if (path.basename(filePath) === filePath) {
      filePath = "../characters/" + filePath;
    }
    return path.resolve(process.cwd(), filePath.trim());
  });

  const loadedCharacters = [];

  if (characterPaths?.length > 0) {
    for (const path of characterPaths) {
      try {
        const character = JSON.parse(fs.readFileSync(path, "utf8"));

        validateCharacterConfig(character);

        loadedCharacters.push(character);
      } catch (e) {
        console.error(`Error loading character from ${path}: ${e}`);
        // don't continue to load if a specified file is not found
        process.exit(1);
      }
    }
  }

  return loadedCharacters;
}

export function getTokenForProvider(
  provider: ModelProviderName,
  character: Character
) {
  switch (provider) {
    case ModelProviderName.OPENAI:
      return (
        character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY
      );
    case ModelProviderName.LLAMACLOUD:
      return (
        character.settings?.secrets?.LLAMACLOUD_API_KEY ||
        settings.LLAMACLOUD_API_KEY ||
        character.settings?.secrets?.TOGETHER_API_KEY ||
        settings.TOGETHER_API_KEY ||
        character.settings?.secrets?.XAI_API_KEY ||
        settings.XAI_API_KEY ||
        character.settings?.secrets?.OPENAI_API_KEY ||
        settings.OPENAI_API_KEY
      );
    case ModelProviderName.ANTHROPIC:
      return (
        character.settings?.secrets?.ANTHROPIC_API_KEY ||
        character.settings?.secrets?.CLAUDE_API_KEY ||
        settings.ANTHROPIC_API_KEY ||
        settings.CLAUDE_API_KEY
      );
    case ModelProviderName.REDPILL:
      return (
        character.settings?.secrets?.REDPILL_API_KEY || settings.REDPILL_API_KEY
      );
    case ModelProviderName.OPENROUTER:
      return (
        character.settings?.secrets?.OPENROUTER || settings.OPENROUTER_API_KEY
      );
    case ModelProviderName.GROK:
      return character.settings?.secrets?.GROK_API_KEY || settings.GROK_API_KEY;
    case ModelProviderName.HEURIST:
      return (
        character.settings?.secrets?.HEURIST_API_KEY || settings.HEURIST_API_KEY
      );
    case ModelProviderName.GROQ:
      return character.settings?.secrets?.GROQ_API_KEY || settings.GROQ_API_KEY;
    case ModelProviderName.PORTKEY:
      return (
        character.settings?.secrets?.PORTKEY_API_KEY || settings.PORTKEY_API_KEY
      );
  }
}

/**
 * Represents an agent configuration from the YAML file
 */
export interface AgentConfig {
  name: string;
  personality: string;
  strategy: string;
  background: string;
  goals: string[];
  llm_gateway?: string;
  config?: string;
  llm_model?: string;
  llm_provider?: string;
  temperature?: number;
  tone?: string;
}

/**
 * Extended agent configuration with a unique ID
 */
export interface Agent extends AgentConfig {
  // No need to add an agent_id here, we'll use the runtime-generated one
}

/**
 * Load agent configurations from the agents.yml file
 * @param agentsPath - Path to the agents.yml file (optional)
 * @returns Array of agent configurations
 */
export function loadAgentsFromYaml(agentsPath?: string): AgentConfig[] {
  const defaultPath = path.resolve(process.cwd(), "config/agents.yml");
  const filePath = agentsPath ? path.resolve(process.cwd(), agentsPath) : defaultPath;
  
  try {
    // Read the YAML file
    const fileContent = fs.readFileSync(filePath, "utf8");
    const parsedYaml = jsYaml.load(fileContent) as { agents: AgentConfig[] };
    
    if (!parsedYaml || !parsedYaml.agents || !Array.isArray(parsedYaml.agents)) {
      console.error("Invalid agents.yml format. Expected an 'agents' array.");
      return [];
    }
    
    return parsedYaml.agents;
  } catch (error) {
    console.error(`Error loading agents from ${filePath}:`, error);
    return [];
  }
}

/**
 * Convert an agent configuration to a character configuration
 * @param agent - Agent configuration
 * @returns Character configuration
 */
export function agentToCharacter(agent: AgentConfig): Character {
  const modelProvider = agent.llm_gateway?.toLowerCase() as ModelProviderName || ModelProviderName.PORTKEY;
  
  // Create a character configuration from the agent data
  const character: Character = {
    name: agent.name,
    modelProvider,
    system: `You are ${agent.name}. ${agent.personality}\n\nBackground: ${agent.background}\n\nStrategy: ${agent.strategy}\n\nGoals:\n${agent.goals.map(goal => `- ${goal}`).join('\n')}\n\nTone: ${agent.tone || 'Professional and helpful'}`,
    plugins: [],
    settings: {
      secrets: {},
    },
    clientConfig: {},
    // Required fields for Character type
    bio: [agent.personality.substring(0, 100)], // Use part of the personality as the bio
    lore: [agent.background],
    messageExamples: [],
    postExamples: [],
    topics: agent.goals.map(goal => goal.split(" ")[0]), // Extract some topics from goals
    adjectives: [],
    style: {
      all: [],
      chat: [],
      post: []
    }
  };

  // Add provider-specific configuration if available
  if (agent.llm_gateway === "portkey" && agent.config) {
    character.clientConfig = {
      portkey: {
        config: agent.config
      }
    };
  }
  
  // Set temperature if provided
  if (agent.temperature !== undefined) {
    character.settings.modelConfig = {
      temperature: agent.temperature
    };
  }
  
  return character;
}
