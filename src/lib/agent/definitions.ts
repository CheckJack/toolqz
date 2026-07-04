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
  {
    name: "publish_tool",
    description:
      "Publish or unpublish a tool listing. Always call first with confirm:false to preview; only set confirm:true after the user explicitly agrees.",
    parameters: {
      type: "object",
      properties: {
        tool_slug: { type: "string" },
        tool_name: { type: "string" },
        tool_id: { type: "string" },
        published: {
          type: "boolean",
          description: "true to publish, false to unpublish (default true)",
        },
        confirm: {
          type: "boolean",
          description: "Must be true to execute. Use false first to preview.",
        },
      },
    },
  },
  {
    name: "delete_tool",
    description:
      "Permanently delete a tool. Always call first with confirm:false to preview; only set confirm:true after the user explicitly agrees.",
    parameters: {
      type: "object",
      properties: {
        tool_slug: { type: "string" },
        tool_name: { type: "string" },
        tool_id: { type: "string" },
        confirm: {
          type: "boolean",
          description: "Must be true to execute. Use false first to preview.",
        },
      },
    },
  },
  {
    name: "list_affiliates",
    description: "List affiliate programs in the CRM.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Company name search" },
        status: {
          type: "string",
          description: "PENDING, IN_PROGRESS, ACTIVE, REJECTED, NOT_AVAILABLE",
        },
        without_tool: {
          type: "boolean",
          description: "Only programs not yet linked to a tool",
        },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "create_tool_from_affiliate",
    description:
      "Create a draft tool listing from an affiliate CRM program and link them.",
    parameters: {
      type: "object",
      properties: {
        affiliate_id: { type: "string", description: "Affiliate program ID" },
        company_name: {
          type: "string",
          description: "Company name if ID unknown (searches CRM)",
        },
      },
    },
  },
  {
    name: "get_analytics",
    description: "Get click analytics summary for the TOOLQZ directory.",
    parameters: {
      type: "object",
      properties: {
        range: {
          type: "string",
          description: "7d, 30d, 90d, or all (default 30d)",
        },
        tool_slug: {
          type: "string",
          description: "Optional — stats for one tool",
        },
      },
    },
  },
] as const;

export type AgentToolName =
  | "create_tool"
  | "update_tool"
  | "list_tools"
  | "create_category"
  | "create_blog_draft"
  | "publish_tool"
  | "delete_tool"
  | "list_affiliates"
  | "create_tool_from_affiliate"
  | "get_analytics";

export interface ChatLink {
  label: string;
  href: string;
}

export type { AssistantCard } from "./assistant-cards";

export interface AgentChatResult {
  reply: string;
  links?: ChatLink[];
  cards?: import("./assistant-cards").AssistantCard[];
}
