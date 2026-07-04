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
    name: "create_tools",
    description:
      "Research multiple product URLs and create unpublished draft tool listings (max 5 per call).",
    parameters: {
      type: "object",
      properties: {
        urls: {
          type: "array",
          items: { type: "string" },
          description: "Website URLs to research (required)",
        },
      },
      required: ["urls"],
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
    name: "get_tool_issues",
    description:
      "Summarize catalog health issues: drafts, published tools missing affiliate URLs, zero-click published tools, active CRM without URL on tool.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "feature_tool",
    description:
      "Feature or unfeature a tool on the homepage. Call with confirm:false first; confirm:true only after user agrees.",
    parameters: {
      type: "object",
      properties: {
        tool_slug: { type: "string" },
        tool_name: { type: "string" },
        tool_id: { type: "string" },
        featured: {
          type: "boolean",
          description: "true to feature, false to unfeature (default true)",
        },
        confirm: {
          type: "boolean",
          description: "Must be true to execute. Use false first to preview.",
        },
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
    name: "list_categories",
    description: "List tool categories in the directory.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string" },
        limit: { type: "number" },
      },
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
    name: "list_blog_posts",
    description: "List blog posts (draft or published).",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string" },
        published: { type: "boolean" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "publish_blog",
    description:
      "Publish or unpublish a blog post. Call with confirm:false first; confirm:true only after user agrees.",
    parameters: {
      type: "object",
      properties: {
        post_id: { type: "string" },
        post_slug: { type: "string" },
        post_title: { type: "string" },
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
    name: "update_affiliate",
    description:
      "Update an affiliate CRM program: status, next follow-up date, notes, or assignment.",
    parameters: {
      type: "object",
      properties: {
        affiliate_id: { type: "string" },
        company_name: { type: "string", description: "Search by company if ID unknown" },
        status: {
          type: "string",
          description: "PENDING, IN_PROGRESS, ACTIVE, REJECTED, NOT_AVAILABLE",
        },
        next_follow_up: {
          type: "string",
          description: "ISO date YYYY-MM-DD for next follow-up",
        },
        notes: { type: "string" },
        assigned_to_me: {
          type: "boolean",
          description: "Assign this program to the current user",
        },
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
  {
    name: "get_my_work",
    description:
      "Personal work queue: assigned affiliates, overdue follow-ups, draft tools, and catalog issues counts.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_finance_summary",
    description: "Summary of earnings, expenses, and net from the finance ledger.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "search_audit_log",
    description: "Search recent admin audit log entries (admin only).",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search detail text" },
        entity: { type: "string", description: "tool, affiliate, blog_post, category, etc." },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_subscribers",
    description: "List newsletter mailing list subscribers (admin only).",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "ACTIVE or UNSUBSCRIBED" },
        limit: { type: "number" },
      },
    },
  },
] as const;

export type AgentToolName =
  | "create_tool"
  | "create_tools"
  | "update_tool"
  | "list_tools"
  | "get_tool_issues"
  | "feature_tool"
  | "create_category"
  | "list_categories"
  | "create_blog_draft"
  | "list_blog_posts"
  | "publish_blog"
  | "publish_tool"
  | "delete_tool"
  | "list_affiliates"
  | "update_affiliate"
  | "create_tool_from_affiliate"
  | "get_analytics"
  | "get_my_work"
  | "get_finance_summary"
  | "search_audit_log"
  | "list_subscribers";

export interface ChatLink {
  label: string;
  href: string;
}

export interface FollowUpPrompt {
  label: string;
  text: string;
}

export type { AssistantCard } from "./assistant-cards";

export interface AgentChatResult {
  reply: string;
  links?: ChatLink[];
  cards?: import("./assistant-cards").AssistantCard[];
  followUps?: FollowUpPrompt[];
  sessionId?: string;
}

export interface AgentExecutionContext {
  userId: string;
  role: string;
}
