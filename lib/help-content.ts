import { BookOpen, PackageOpen, LayoutGrid, Users, CreditCard, ShieldCheck } from "lucide-react";

export const HELP_CATEGORIES = [
  { id: "getting-started", title: "Getting Started", icon: BookOpen, description: "Basic setup instructions and onboarding tutorials." },
  { id: "inventory", title: "Inventory & Warehousing", icon: PackageOpen, description: "Managing products, stock limits, and physical counts." },
  { id: "branches", title: "Branches & Operations", icon: LayoutGrid, description: "Setting up multi-store and distinct branch locations." },
  { id: "users", title: "Users & Team", icon: Users, description: "Inviting team members and handling role assignments." },
  { id: "billing", title: "Billing & Plans", icon: CreditCard, description: "Managing your subscription, invoicing, and limitations." },
  { id: "security", title: "Security & Audit", icon: ShieldCheck, description: "Understanding the audit trail and RBAC boundaries." },
];

export const QUICK_GUIDES = [
  {
    id: "first-product",
    categoryId: "inventory",
    title: "How to add your first product",
    readTime: "2 min",
    content: "Navigate to the Products module via the sidebar. Click 'Add Product'. Enter the essential details including the exact SKU and internal Category. Save the product. Next, navigate to 'Receive Stock' to add active quantities into your branches.",
  },
  {
    id: "add-branch",
    categoryId: "branches",
    title: "Adding a new retail/warehouse location",
    readTime: "3 min",
    content: "Open Workspace Settings and navigate to 'Branch Locations'. Click 'Establish New Site'. You will need to provide a unique Branch Code alongside physical address details. Upon creation, you can begin storing stock directly inside this new branch independently.",
  },
  {
    id: "invite-team",
    categoryId: "users",
    title: "Inviting team members",
    readTime: "1 min",
    content: "Go to Settings > Users & Teams. Click the 'Invite Member' button (Ensure your subscription has available seats). Assign them an exact Role limit. They will be sent an onboarding instruction packet.",
  },
];

export const FAQS = [
  {
    categoryId: "billing",
    question: "Can I manage multiple businesses under one account?",
    answer: "No. For strict security constraints and cryptographic isolation, every business requires a dedicated Organization workspace and its own corresponding subscription."
  },
  {
    categoryId: "security",
    question: "Can I edit an audit log?",
    answer: "Never. The Audit Trail is strictly immutable by design to comply with international accounting and software compliance standards."
  },
  {
    categoryId: "inventory",
    question: "How is my moving average price calculated?",
    answer: "Every time you Intake standard stock via the Purchasing invoice module, the system averages the new intake price against exactly what exists in your database to update the Cost of Goods Sold (COGS) dynamically."
  }
];
