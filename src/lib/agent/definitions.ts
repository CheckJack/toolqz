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
        listing_type: {
          type: "string",
          description: "AFFILIATE (partner) or EDITORIAL (pick without affiliate link)",
        },
        featured: { type: "boolean", description: "Filter homepage featured tools" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "set_tool_listing_type",
    description:
      "Set whether a tool is an AFFILIATE partner (uses tracking URL on /go) or an EDITORIAL pick (no affiliate disclosure).",
    parameters: {
      type: "object",
      properties: {
        tool_slug: { type: "string" },
        tool_name: { type: "string" },
        tool_id: { type: "string" },
        listing_type: {
          type: "string",
          description: "AFFILIATE or EDITORIAL (required)",
        },
        affiliate_url: {
          type: "string",
          description: "Tracking URL — required when setting AFFILIATE",
        },
      },
      required: ["listing_type"],
    },
  },
  {
    name: "get_tool_issues",
    description:
      "Summarize catalog health: drafts, affiliate partners missing tracking URLs (editorial picks excluded), zero-click published tools, active CRM without URL on tool.",
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
    name: "update_blog_post",
    description:
      "Update an existing blog post's title, slug, excerpt, content, or cover image. Identify by post_id, post_slug, or post_title.",
    parameters: {
      type: "object",
      properties: {
        post_id: { type: "string" },
        post_slug: { type: "string" },
        post_title: { type: "string" },
        title: { type: "string" },
        slug: { type: "string" },
        excerpt: { type: "string" },
        content: { type: "string", description: "Markdown body" },
        cover_image: { type: "string", description: "Cover image URL or empty to clear" },
      },
    },
  },
  {
    name: "delete_blog_post",
    description:
      "Permanently delete a blog post (admin only). Call with confirm:false first; confirm:true only after user agrees.",
    parameters: {
      type: "object",
      properties: {
        post_id: { type: "string" },
        post_slug: { type: "string" },
        post_title: { type: "string" },
        confirm: { type: "boolean" },
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
      "Update an affiliate CRM program: status, follow-up, notes, assignment, portal_url, signup_url, affiliate_url.",
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
        portal_url: { type: "string", description: "Affiliate dashboard login URL" },
        signup_url: { type: "string", description: "Program signup / application URL" },
        affiliate_url: { type: "string", description: "Tracking link for the tool listing" },
      },
    },
  },
  {
    name: "create_affiliate",
    description:
      "Add a new affiliate program to the CRM. Requires company_name. Optional: website, status, signup_url, portal_url, affiliate_url, notes, next_follow_up, assigned_to_me.",
    parameters: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "Company or program name (required)" },
        website: { type: "string" },
        status: {
          type: "string",
          description: "PENDING (default), IN_PROGRESS, ACTIVE, APPLIED, REJECTED, NOT_AVAILABLE",
        },
        signup_url: { type: "string" },
        portal_url: { type: "string", description: "Dashboard login URL" },
        affiliate_url: { type: "string", description: "Tracking link" },
        notes: { type: "string" },
        next_follow_up: { type: "string", description: "YYYY-MM-DD" },
        assigned_to_me: { type: "boolean" },
      },
      required: ["company_name"],
    },
  },
  {
    name: "list_affiliate_directory",
    description:
      "List ACTIVE affiliate partner programs in the directory (dashboard links, not full CRM pipeline).",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Company name search" },
        missing_portal: {
          type: "boolean",
          description: "Only active programs missing a dashboard (portal) URL",
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
  {
    name: "get_my_work",
    description:
      "Personal work queue: CRM assignments, overdue follow-ups, admin tasks assigned to you, draft tools, and catalog issues counts.",
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
  {
    name: "list_tasks",
    description:
      "List admin tasks from the Tasks board. Filter by section (general, content, affiliates, catalog, ops), status (TODO, IN_PROGRESS, DONE), assignee (me or unassigned), search, or overdue_only.",
    parameters: {
      type: "object",
      properties: {
        section: { type: "string", description: "general, content, affiliates, catalog, ops" },
        status: { type: "string", description: "TODO, IN_PROGRESS, or DONE" },
        assignee: { type: "string", description: "me or unassigned" },
        search: { type: "string" },
        overdue_only: { type: "boolean" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "create_task",
    description:
      "Create a task on the Tasks board. Requires title. Optional: section, status, priority, due_at (YYYY-MM-DD), description, assign_to_me, assignee_name.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        section: { type: "string", description: "general, content, affiliates, catalog, ops" },
        status: { type: "string", description: "TODO, IN_PROGRESS, DONE" },
        priority: { type: "string", description: "LOW, MEDIUM, HIGH, URGENT" },
        due_at: { type: "string", description: "YYYY-MM-DD" },
        assign_to_me: { type: "boolean" },
        assignee_name: { type: "string", description: "Team member name" },
        link_url: { type: "string", description: "Optional admin link e.g. /admin/tools" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description:
      "Update a task by task_id or task_title. Can change title, description, section, status, priority, due_at, assignee, mark_done.",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        task_title: { type: "string", description: "Search by title if ID unknown" },
        title: { type: "string" },
        description: { type: "string" },
        section: { type: "string" },
        status: { type: "string" },
        priority: { type: "string" },
        due_at: { type: "string" },
        assign_to_me: { type: "boolean" },
        assignee_name: { type: "string" },
        mark_done: { type: "boolean" },
        link_url: { type: "string" },
      },
    },
  },
  {
    name: "delete_task",
    description: "Permanently delete a task (admin only, requires confirmation).",
    parameters: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        task_title: { type: "string" },
        confirm: { type: "boolean" },
      },
    },
  },
  {
    name: "create_finance_entry",
    description: "Add an earning or expense to the finance ledger.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "EARNING or EXPENSE" },
        amount: { type: "number" },
        description: { type: "string" },
        source: { type: "string", description: "Optional source label" },
        occurred_at: { type: "string", description: "YYYY-MM-DD" },
        notes: { type: "string" },
      },
      required: ["type", "amount", "description"],
    },
  },
  {
    name: "list_finance_entries",
    description: "List recent finance ledger entries (earnings and expenses).",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "EARNING or EXPENSE" },
        search: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "update_finance_entry",
    description: "Update a finance ledger entry by entry_id or match_description. Can change type, amount, description, source, notes, occurred_at.",
    parameters: {
      type: "object",
      properties: {
        entry_id: { type: "string" },
        match_description: {
          type: "string",
          description: "Find entry by description if ID unknown",
        },
        type: { type: "string", description: "EARNING or EXPENSE" },
        amount: { type: "number" },
        description: { type: "string", description: "New description text" },
        source: { type: "string" },
        notes: { type: "string" },
        occurred_at: { type: "string", description: "YYYY-MM-DD" },
      },
    },
  },
  {
    name: "delete_finance_entry",
    description:
      "Permanently delete a finance ledger entry (admin only). Call with confirm:false first.",
    parameters: {
      type: "object",
      properties: {
        entry_id: { type: "string" },
        match_description: {
          type: "string",
          description: "Find entry by description if ID unknown",
        },
        confirm: { type: "boolean" },
      },
    },
  },
  {
    name: "list_team_members",
    description: "List admin team members (for assigning tasks or affiliates).",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "search_playbook",
    description:
      "Search the Playbook (/admin/playbook) for reusable Q&A snippets — affiliate form answers, email templates, company info, addresses. Uses intelligent matching on questions, aliases, and keywords. Use when the user asks what to write, paste, or answer on a form (e.g. 'why should you promote us', 'company about', 'traffic').",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language search — form question or keywords (required for search)",
        },
        category: {
          type: "string",
          description:
            "affiliate_forms, email, company_info, legal, social, or other",
        },
        limit: { type: "number" },
      },
      required: ["query"],
    },
  },
  {
    name: "create_playbook_snippet",
    description:
      "Add a new Playbook snippet. Requires question and answer. Optional: category, aliases (newline-separated alternate search phrases), tags, pinned.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "Form label or question" },
        answer: { type: "string", description: "Copy-paste ready text" },
        category: {
          type: "string",
          description: "affiliate_forms, email, company_info, legal, social, other",
        },
        aliases: {
          type: "string",
          description: "Alternate search phrases, one per line",
        },
        tags: { type: "string" },
        pinned: { type: "boolean" },
        sensitive: {
          type: "boolean",
          description: "Encrypt and hide answer (passwords, API keys, logins)",
        },
      },
      required: ["question", "answer"],
    },
  },
  {
    name: "update_playbook_snippet",
    description:
      "Update a Playbook snippet by snippet_id or snippet_question. Can change question, answer, category, aliases, tags, pinned, sensitive.",
    parameters: {
      type: "object",
      properties: {
        snippet_id: { type: "string" },
        snippet_question: { type: "string", description: "Find by question if ID unknown" },
        question: { type: "string" },
        answer: { type: "string" },
        category: { type: "string" },
        aliases: { type: "string" },
        tags: { type: "string" },
        pinned: { type: "boolean" },
        sensitive: { type: "boolean" },
      },
    },
  },
  {
    name: "delete_playbook_snippet",
    description: "Permanently delete a Playbook snippet (admin only, requires confirmation).",
    parameters: {
      type: "object",
      properties: {
        snippet_id: { type: "string" },
        snippet_question: { type: "string" },
        confirm: { type: "boolean" },
      },
    },
  },
] as const;

export type AgentToolName =
  | "create_tool"
  | "create_tools"
  | "update_tool"
  | "list_tools"
  | "set_tool_listing_type"
  | "get_tool_issues"
  | "feature_tool"
  | "create_category"
  | "list_categories"
  | "create_blog_draft"
  | "list_blog_posts"
  | "publish_blog"
  | "update_blog_post"
  | "delete_blog_post"
  | "publish_tool"
  | "delete_tool"
  | "list_affiliates"
  | "list_affiliate_directory"
  | "update_affiliate"
  | "create_affiliate"
  | "create_tool_from_affiliate"
  | "get_analytics"
  | "get_my_work"
  | "get_finance_summary"
  | "search_audit_log"
  | "list_subscribers"
  | "list_tasks"
  | "create_task"
  | "update_task"
  | "delete_task"
  | "create_finance_entry"
  | "list_finance_entries"
  | "update_finance_entry"
  | "delete_finance_entry"
  | "list_team_members"
  | "search_playbook"
  | "create_playbook_snippet"
  | "update_playbook_snippet"
  | "delete_playbook_snippet";

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
  receipts?: string[];
  sessionId?: string;
}

export interface AgentExecutionContext {
  userId: string;
  role: string;
}
