import { DEFAULT_TOOL_CATEGORY_SLUGS } from "@/lib/default-tool-categories";

export const AGENT_FUNCTION_DECLARATIONS = [
  {
    name: "create_tool",
    description:
      "Research a product website and create a new unpublished draft tool listing on TOOLQZ.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Product name (optional)" },
        url: { type: "string", description: "Website URL to research (required)" },
      },
      required: ["url"],
    },
  },
  {
    name: "update_tool",
    description:
      "Re-research a product website and refresh an existing tool listing (keeps slug and publish status).",
    parameters: {
      type: "object",
      properties: {
        tool_slug: { type: "string", description: "Tool slug to update" },
        tool_name: { type: "string", description: "Tool name to search if slug unknown" },
        tool_id: { type: "string", description: "Tool ID if known" },
        url: { type: "string", description: "Optional URL override (defaults to tool's current URL)" },
      },
    },
  },
  {
    name: "list_tools",
    description: "List or count tools in the TOOLQZ directory.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string" },
        category: {
          type: "string",
          description: `Category slug: ${DEFAULT_TOOL_CATEGORY_SLUGS.join(", ")}`,
        },
        published: { type: "boolean" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "create_category",
    description: "Create a new tool category in the admin directory.",
    parameters: {
      type: "object",
      properties: {
        label: { type: "string", description: "Display name (required)" },
        slug: { type: "string", description: "URL slug (optional, derived from label)" },
        description: { type: "string", description: "Optional description" },
      },
      required: ["label"],
    },
  },
  {
    name: "create_blog_draft",
    description: "Write a new unpublished blog post draft on a given topic.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Blog topic or title idea (required)",
        },
      },
      required: ["topic"],
    },
  },
] as const;

export type AgentToolName =
  | "create_tool"
  | "update_tool"
  | "list_tools"
  | "create_category"
  | "create_blog_draft";

export interface ChatLink {
  label: string;
  href: string;
}

export interface AgentChatResult {
  reply: string;
  links?: ChatLink[];
}
