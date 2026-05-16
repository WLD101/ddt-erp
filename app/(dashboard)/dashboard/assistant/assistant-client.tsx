"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { executeAssistantCommandAction, parseAssistantCommandAction } from "@/modules/assistant/actions";
import type { AssistantCommand } from "@/modules/assistant/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  status?: "success" | "error";
  result?: Record<string, any>;
};

type CommandHistoryEntry = {
  id: string;
  text: string;
  status: "pending" | "success" | "error";
  timestamp: number;
};

type PromptChip = {
  label: string;
  text: string;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
  message?: string;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const sessionHistoryKey = "whatsquery-smart-assistant-history";

const quickActionChips: PromptChip[] = [
  { label: "Create customer", text: "Create customer Ali Traders" },
  { label: "Add stock", text: "Add 20 cartons Pepsi" },
  { label: "Create draft invoice", text: "Create invoice for Ali Traders for 5 Pepsi cartons at 3000 each" },
  { label: "Show unpaid invoices", text: "Show unpaid invoices this month" },
  { label: "Monthly sales report", text: "Generate monthly sales report" },
  { label: "Show low stock", text: "Show low stock" },
];

const examplePrompts = [
  "Create customer Ahmed Electronics",
  "Create invoice for Ali Traders for 5 laptops at 120000 each",
  "Add 20 cartons of Pepsi to inventory",
  "Show unpaid invoices this month",
  "Generate monthly sales report",
  "Mark invoice INV-004 as paid",
];

const unitTypeOptions = [
  "RETAIL_QUANTITY",
  "TEXTILE_MEASUREMENT",
  "WEIGHT",
  "LENGTH",
  "VOLUME",
  "CUSTOM",
] as const;

const unitOptionsByType: Record<string, string[]> = {
  RETAIL_QUANTITY: ["piece", "box", "carton", "pack"],
  TEXTILE_MEASUREMENT: ["meter", "yard", "roll"],
  WEIGHT: ["kg", "gram", "lb"],
  LENGTH: ["meter", "cm", "inch", "foot"],
  VOLUME: ["liter", "ml", "gallon"],
  CUSTOM: ["custom"],
};

function createMessage(role: Message["role"], text: string, status?: Message["status"], result?: Record<string, any>): Message {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    status,
    result,
  };
}

function formatCurrency(value: number | string | undefined) {
  const amount = Number(value || 0);
  return amount.toLocaleString();
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function operationLabel(command: AssistantCommand) {
  switch (command.operation) {
    case "create_customer":
      return "Create customer";
    case "update_customer_status":
      return "Update customer status";
    case "query_customer_search":
      return "Search customers";
    case "query_customer_history":
      return "View customer history";
    case "create_product":
      return "Add product";
    case "add_stock":
      return "Add stock";
    case "set_stock":
      return "Set stock level";
    case "query_stock":
      return "Check stock";
    case "query_low_stock":
      return "Show low stock";
    case "create_draft_invoice":
      return "Create draft invoice";
    case "mark_invoice_paid":
      return "Mark invoice paid";
    case "query_unpaid_invoices":
      return "List unpaid invoices";
    case "query_invoices_by_customer":
      return "Show invoices by customer";
    case "query_invoices_this_month":
      return "Show invoices this month";
    case "report_daily_sales":
      return "Daily sales summary";
    case "report_monthly_sales":
      return "Monthly sales summary";
    case "report_inventory":
      return "Inventory report";
    case "report_unpaid_invoices":
      return "Unpaid invoice report";
    default:
      return "Assistant action";
  }
}

function getMissingFields(command: AssistantCommand) {
  const missing = new Set<string>();
  switch (command.operation) {
    case "create_customer":
      if (!command.data.name?.trim()) missing.add("name");
      break;
    case "update_customer_status":
      if (!command.data.customerId) missing.add("customer");
      if (!command.data.status?.trim()) missing.add("status");
      break;
    case "query_customer_history":
    case "query_customer_search":
    case "query_invoices_by_customer":
      if (command.operation === "query_customer_search") {
        if (!command.data.customerName?.trim()) missing.add("customer search term");
      } else if (!command.data.customerId) {
        missing.add("customer");
      }
      break;
    case "create_product":
      if (!command.data.name?.trim()) missing.add("product name");
      if (command.data.unitPrice === "" || command.data.unitPrice === undefined) missing.add("unit price");
      if (command.data.costPrice === "" || command.data.costPrice === undefined) missing.add("cost price");
      if (!command.data.unit?.trim()) missing.add("unit");
      if (!command.data.unitType?.trim()) missing.add("unit type");
      break;
    case "add_stock":
    case "set_stock":
    case "query_stock":
      if (!command.data.productId) missing.add("product");
      if (command.operation !== "query_stock" && (command.data.quantity === "" || command.data.quantity === undefined)) {
        missing.add("quantity");
      }
      break;
    case "create_draft_invoice": {
      if (!command.data.customerId) missing.add("customer");
      const item = command.data.items?.[0];
      if (!item?.productId) missing.add("product");
      if (item?.quantity === "" || item?.quantity === undefined) missing.add("quantity");
      if (item?.unitPrice === "" || item?.unitPrice === undefined) missing.add("unit price");
      if (!command.data.invoiceNumber?.trim()) missing.add("invoice number");
      break;
    }
    case "mark_invoice_paid":
      if (!command.data.invoiceId) missing.add("invoice");
      break;
    default:
      break;
  }
  return Array.from(missing);
}

function renderResultList(items: Array<Record<string, any>>) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.id || item.invoiceNumber || item.productName || index}`} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 px-4 py-3">
          {Object.entries(item).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-0.5 text-sm">
              <span className="text-on-surface-variant capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              <span className="text-right font-semibold text-on-surface">
                {typeof value === "number" ? formatCurrency(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ResultBlock({ result }: { result?: Record<string, any> }) {
  if (!result) return null;

  if (Array.isArray(result.invoices)) {
    return renderResultList(result.invoices);
  }
  if (Array.isArray(result.lowStock)) {
    return renderResultList(result.lowStock);
  }
  if (Array.isArray(result.customers)) {
    return renderResultList(result.customers);
  }
  if (Array.isArray(result.items)) {
    return renderResultList(result.items);
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Object.entries(result).map(([key, value]) => (
        <div key={key} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{key.replace(/([A-Z])/g, " $1")}</p>
          <p className="mt-2 text-sm font-semibold text-on-surface">
            {typeof value === "number" ? formatCurrency(value) : String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function AssistantPreviewCard({
  command,
  editMode,
  onToggleEdit,
  onCancel,
  onConfirm,
  onUpdate,
  isExecuting,
}: {
  command: AssistantCommand;
  editMode: boolean;
  onToggleEdit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onUpdate: (next: AssistantCommand) => void;
  isExecuting: boolean;
}) {
  const missingFields = useMemo(() => getMissingFields(command), [command]);
  const customerOptions = command.options.customers || [];
  const productOptions = command.options.products || [];
  const invoiceOptions = command.options.invoices || [];

  const updateData = (patch: Record<string, any>) => {
    onUpdate({
      ...command,
      data: {
        ...command.data,
        ...patch,
      },
    });
  };

  const updateFirstItem = (patch: Record<string, any>) => {
    const currentItem = command.data.items?.[0] || {};
    updateData({
      items: [
        {
          ...currentItem,
          ...patch,
        },
      ],
    });
  };

  const isConfirmDisabled = missingFields.length > 0 || command.confidence < 0.55;

  return (
    <Card className="border-primary/20 bg-surface shadow-soft">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary text-on-primary">{operationLabel(command)}</Badge>
          <Badge variant="outline" className="border-outline-variant/40">
            Confidence {Math.round(command.confidence * 100)}%
          </Badge>
          {command.requiresConfirmation ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600">
              Confirmation required
            </Badge>
          ) : null}
        </div>
        <div className="space-y-3">
          <div>
            <CardTitle className="text-xl font-black text-on-surface">Assistant preview</CardTitle>
            <CardDescription className="mt-2 text-sm text-on-surface-variant">
              Review the structured action before anything runs. Nothing executes until you confirm.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Assistant understood this as</p>
            <p className="mt-2 text-sm font-medium leading-6 text-on-surface">{command.message}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
              <span>Confidence meter</span>
              <span>{Math.round(command.confidence * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className={`h-full rounded-full transition-all ${
                  command.confidence >= 0.8 ? "bg-emerald-500" : command.confidence >= 0.6 ? "bg-primary" : "bg-amber-500"
                }`}
                style={{ width: `${Math.max(command.confidence * 100, 8)}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {missingFields.length > 0 ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-on-surface">
            I still need: <span className="font-bold">{missingFields.join(", ")}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <PreviewField label="Intent" value={command.intent} />
          <PreviewField label="Entity" value={command.entity} />
          <PreviewField label="Action" value={command.action} />
          <PreviewField label="Operation" value={operationLabel(command)} />

          {command.operation === "create_customer" ? (
            <>
              <EditableField label="Customer name" editMode={editMode}>
                <Input
                  value={command.data.name || ""}
                  onChange={(event) => updateData({ name: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
              <EditableField label="Status" editMode={editMode}>
                <Input
                  value={command.data.status || "ACTIVE"}
                  onChange={(event) => updateData({ status: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
            </>
          ) : null}

          {["update_customer_status", "query_customer_history", "query_invoices_by_customer"].includes(command.operation) ? (
            <>
              <EditableField label="Customer" editMode={editMode}>
                <Select
                  value={command.data.customerId || undefined}
                  onValueChange={(value) => {
                    const selected = customerOptions.find((option) => option.id === value);
                    updateData({
                      customerId: value,
                      customerName: selected?.label || command.data.customerName,
                    });
                  }}
                  disabled={!editMode || customerOptions.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={customerOptions.length ? "Choose customer" : command.data.customerName || "No match yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditableField>
              {command.operation === "update_customer_status" ? (
                <EditableField label="Status" editMode={editMode}>
                  <Input
                    value={command.data.status || ""}
                    onChange={(event) => updateData({ status: event.target.value })}
                    disabled={!editMode}
                  />
                </EditableField>
              ) : null}
            </>
          ) : null}

          {command.operation === "query_customer_search" ? (
            <EditableField label="Search term" editMode={editMode}>
              <Input
                value={command.data.customerName || ""}
                onChange={(event) => updateData({ customerName: event.target.value })}
                disabled={!editMode}
              />
            </EditableField>
          ) : null}

          {command.operation === "create_product" ? (
            <>
              <EditableField label="Product name" editMode={editMode}>
                <Input value={command.data.name || ""} onChange={(event) => updateData({ name: event.target.value })} disabled={!editMode} />
              </EditableField>
              <EditableField label="Unit price" editMode={editMode}>
                <Input
                  type="number"
                  value={command.data.unitPrice ?? ""}
                  onChange={(event) => updateData({ unitPrice: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
              <EditableField label="Cost price" editMode={editMode}>
                <Input
                  type="number"
                  value={command.data.costPrice ?? ""}
                  onChange={(event) => updateData({ costPrice: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
              <EditableField label="Opening quantity" editMode={editMode}>
                <Input
                  type="number"
                  value={command.data.openingQuantity ?? 0}
                  onChange={(event) => updateData({ openingQuantity: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
              <EditableField label="Unit type" editMode={editMode}>
                <Select
                  value={command.data.unitType}
                  onValueChange={(value) => updateData({ unitType: value, unit: unitOptionsByType[value]?.[0] || "piece" })}
                  disabled={!editMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditableField>
              <EditableField label="Unit" editMode={editMode}>
                <Select
                  value={command.data.unit}
                  onValueChange={(value) => updateData({ unit: value })}
                  disabled={!editMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(unitOptionsByType[command.data.unitType] || ["piece"]).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditableField>
            </>
          ) : null}

          {["add_stock", "set_stock", "query_stock"].includes(command.operation) ? (
            <>
              <EditableField label="Product" editMode={editMode}>
                <Select
                  value={command.data.productId || undefined}
                  onValueChange={(value) => {
                    const selected = productOptions.find((option) => option.id === value);
                    updateData({ productId: value, productName: selected?.label || command.data.productName });
                  }}
                  disabled={!editMode || productOptions.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={productOptions.length ? "Choose product" : command.data.productName || "No match yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditableField>
              {command.operation !== "query_stock" ? (
                <EditableField label="Quantity" editMode={editMode}>
                  <Input
                    type="number"
                    value={command.data.quantity ?? ""}
                    onChange={(event) => updateData({ quantity: event.target.value })}
                    disabled={!editMode}
                  />
                </EditableField>
              ) : null}
            </>
          ) : null}

          {command.operation === "create_draft_invoice" ? (
            <>
              <EditableField label="Customer" editMode={editMode}>
                <Select
                  value={command.data.customerId || undefined}
                  onValueChange={(value) => {
                    const selected = customerOptions.find((option) => option.id === value);
                    updateData({ customerId: value, customerName: selected?.label || command.data.customerName });
                  }}
                  disabled={!editMode || customerOptions.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={customerOptions.length ? "Choose customer" : command.data.customerName || "No match yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditableField>
              <EditableField label="Invoice number" editMode={editMode}>
                <Input
                  value={command.data.invoiceNumber || ""}
                  onChange={(event) => updateData({ invoiceNumber: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
              <EditableField label="Product" editMode={editMode}>
                <Select
                  value={command.data.items?.[0]?.productId || undefined}
                  onValueChange={(value) => {
                    const selected = productOptions.find((option) => option.id === value);
                    updateFirstItem({ productId: value, productName: selected?.label || command.data.items?.[0]?.productName });
                  }}
                  disabled={!editMode || productOptions.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={productOptions.length ? "Choose product" : command.data.items?.[0]?.productName || "No match yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditableField>
              <EditableField label="Quantity" editMode={editMode}>
                <Input
                  type="number"
                  value={command.data.items?.[0]?.quantity ?? ""}
                  onChange={(event) => updateFirstItem({ quantity: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
              <EditableField label="Unit rate" editMode={editMode}>
                <Input
                  type="number"
                  value={command.data.items?.[0]?.unitPrice ?? ""}
                  onChange={(event) => updateFirstItem({ unitPrice: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
              <EditableField label="Notes" editMode={editMode} className="md:col-span-2">
                <Textarea
                  value={command.data.notes || ""}
                  onChange={(event) => updateData({ notes: event.target.value })}
                  disabled={!editMode}
                />
              </EditableField>
            </>
          ) : null}

          {command.operation === "mark_invoice_paid" ? (
            <EditableField label="Invoice" editMode={editMode}>
              <Select
                value={command.data.invoiceId || undefined}
                onValueChange={(value) => {
                  const selected = invoiceOptions.find((option) => option.id === value);
                  updateData({ invoiceId: value, invoiceNumber: selected?.label || command.data.invoiceNumber });
                }}
                disabled={!editMode || invoiceOptions.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={invoiceOptions.length ? "Choose invoice" : command.data.invoiceNumber || "No match yet"} />
                </SelectTrigger>
                <SelectContent>
                  {invoiceOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditableField>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onConfirm} disabled={isExecuting || isConfirmDisabled} className="text-on-primary">
            {isExecuting ? "Executing..." : "Confirm"}
          </Button>
          <Button variant="outline" onClick={onToggleEdit}>
            {editMode ? "Done Editing" : "Edit"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function EditableField({
  label,
  children,
  editMode,
  className,
}: {
  label: string;
  children: React.ReactNode;
  editMode: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
        {label} {editMode ? "" : "(read-only)"}
      </p>
      {children}
    </div>
  );
}

function MicOrb({ listening }: { listening: boolean }) {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <div className={`absolute inset-0 rounded-full bg-primary/10 ${listening ? "animate-ping" : ""}`} />
      <div className={`absolute inset-1 rounded-full bg-primary/15 ${listening ? "animate-pulse" : ""}`} />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/20">
        <span className="material-symbols-outlined text-[22px]">{listening ? "graphic_eq" : "smart_toy"}</span>
      </div>
    </div>
  );
}

export function AssistantClient() {
  const [messages, setMessages] = useState<Message[]>([
    createMessage(
      "assistant",
      "Type a request in plain language and I’ll convert it into a safe ERP action preview before anything runs."
    ),
  ]);
  const [input, setInput] = useState("");
  const [pendingCommand, setPendingCommand] = useState<AssistantCommand | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isParsing, startParseTransition] = useTransition();
  const [isExecuting, startExecuteTransition] = useTransition();
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const [voiceSupported, setVoiceSupported] = useState<boolean>(false);
  const [voiceSupportChecked, setVoiceSupportChecked] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [heardTranscript, setHeardTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [transcriptNeedsReview, setTranscriptNeedsReview] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.sessionStorage.getItem(sessionHistoryKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CommandHistoryEntry[];
        setCommandHistory(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
      } catch {
        window.sessionStorage.removeItem(sessionHistoryKey);
      }
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognitionCtor));
    setVoiceSupportChecked(true);

    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setVoiceError(null);
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let nextInterim = "";
      const confidences: number[] = [];

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result[0];
        if (!alternative) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript += `${alternative.transcript} `;
          if (alternative.confidence > 0) {
            confidences.push(alternative.confidence);
          }
        } else {
          nextInterim += `${alternative.transcript} `;
        }
      }

      const finalText = finalTranscript.trim();
      const interimText = nextInterim.trim();
      const combined = `${finalText} ${interimText}`.trim();

      if (combined) {
        setInput(combined);
      }
      setHeardTranscript(finalText || combined);
      setInterimTranscript(interimText);

      if (confidences.length > 0) {
        const avgConfidence = confidences.reduce((total, current) => total + current, 0) / confidences.length;
        setTranscriptNeedsReview(avgConfidence < 0.72);
      } else if (combined) {
        setTranscriptNeedsReview(combined.split(" ").length < 3);
      }
    };

    recognition.onerror = (event) => {
      const fallbackMessage =
        event.error === "not-allowed"
          ? "Microphone access was blocked. You can still type commands."
          : event.error === "no-speech"
            ? "I didn’t catch any speech. Please try again or type your command."
            : "Voice input ran into a browser issue. You can still type commands.";
      setVoiceError(fallbackMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(sessionHistoryKey, JSON.stringify(commandHistory.slice(0, 10)));
  }, [commandHistory]);

  const successfulCommands = useMemo(
    () => commandHistory.filter((entry) => entry.status === "success").slice(0, 4),
    [commandHistory]
  );

  const updateHistoryEntry = (id: string | null, status: CommandHistoryEntry["status"]) => {
    if (!id) {
      return;
    }

    setCommandHistory((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, status } : entry))
    );
  };

  const startListening = () => {
    if (!voiceSupported || !recognitionRef.current) {
      setVoiceError("Voice input is not supported in this browser. You can still type commands.");
      return;
    }

    try {
      setHeardTranscript("");
      setInterimTranscript("");
      setTranscriptNeedsReview(false);
      setVoiceError(null);
      recognitionRef.current.start();
    } catch {
      setVoiceError("Voice input is already active. Please stop it first or type your command.");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const fillPrompt = (text: string) => {
    setInput(text);
    setVoiceError(null);
    setTranscriptNeedsReview(false);
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("Type a request first.");
      return;
    }

    const historyId = `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setActiveHistoryId(historyId);
    setCommandHistory((current) => {
      const nextEntry: CommandHistoryEntry = {
        id: historyId,
        text: trimmed,
        status: "pending",
        timestamp: Date.now(),
      };
      return [nextEntry, ...current].slice(0, 10);
    });
    setMessages((current) => [...current, createMessage("user", trimmed)]);
    setPendingCommand(null);
    setEditMode(false);
    setHeardTranscript(trimmed);
    setInterimTranscript("");
    setInput("");

    startParseTransition(async () => {
      const result = await parseAssistantCommandAction(trimmed);
      if (result.command) {
        setPendingCommand(result.command);
        if (result.command.missingFields.length > 0 || result.command.confidence < 0.7) {
          setEditMode(true);
        }
      }

      setMessages((current) => [
        ...current,
        createMessage("assistant", result.response, result.success ? undefined : "error"),
      ]);

      if (!result.success) {
        updateHistoryEntry(historyId, "error");
        toast.error(result.response);
      }
    });
  };

  const handleConfirm = () => {
    if (!pendingCommand) {
      return;
    }

    const missingFields = getMissingFields(pendingCommand);
    if (missingFields.length > 0) {
      toast.error(`I still need: ${missingFields.join(", ")}`);
      return;
    }

    startExecuteTransition(async () => {
      const result = await executeAssistantCommandAction(pendingCommand);
      setMessages((current) => [
        ...current,
        createMessage("assistant", result.message, result.success ? "success" : "error", result.result),
      ]);
      updateHistoryEntry(activeHistoryId, result.success ? "success" : "error");

      if (result.success) {
        toast.success(result.message);
        setPendingCommand(null);
        setEditMode(false);
        setActiveHistoryId(null);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <PageShell
      title="Smart Assistant"
      description="Use natural-language commands, voice input, and a structured confirmation flow before the ERP executes anything."
      actions={
        <Badge className="bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-on-primary">
          Deterministic assistant
        </Badge>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(21,65,183,0.08),rgba(255,255,255,0.98)_42%,rgba(21,65,183,0.04))] shadow-soft">
            <CardContent className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <MicOrb listening={isListening || isParsing} />
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                    <span className="material-symbols-outlined text-[16px]">neurology</span>
                    AI-style command center
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-on-surface sm:text-[2rem]">
                      Ask anything to your agent here
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm font-medium text-on-surface-variant">
                      Speak or type a request, review exactly what the assistant understood, then confirm before any ERP action runs.
                    </p>
                  </div>
                </div>
              </div>
              <div className="min-w-[220px] rounded-2xl border border-primary/15 bg-surface/70 px-4 py-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Live status</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">
                  {isListening ? "Listening for your command" : isParsing ? "Understanding your request" : "Ready for your next task"}
                </p>
                <p className="mt-2 text-xs text-on-surface-variant">
                  Voice never executes directly. Every action still goes through preview, edit, confirm, or cancel.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-on-surface">Assistant console</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                The assistant parses your request, builds structured ERP action JSON, and waits for your confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {quickActionChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => fillPrompt(chip.text)}
                    className="rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4 rounded-3xl border border-outline-variant/20 bg-surface-container-low/30 p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "ml-auto max-w-[90%] bg-primary text-on-primary"
                        : message.status === "error"
                          ? "max-w-[95%] bg-error/10 text-on-surface"
                          : "max-w-[95%] bg-surface text-on-surface shadow-sm"
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
                      {message.role === "user" ? "You" : "Assistant"}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6">{message.text}</p>
                    {message.result ? (
                      <div className="mt-4">
                        <ResultBlock result={message.result} />
                        {message.result.invoiceId ? (
                          <Link
                            href={`/sales/${message.result.invoiceId}`}
                            className="mt-4 inline-flex items-center rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                          >
                            Open invoice
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
                {(isParsing || isExecuting) ? (
                  <div className="max-w-[95%] rounded-2xl bg-surface px-4 py-3 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                      {isParsing ? "Assistant is parsing" : "Assistant is executing"}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce" />
                    </div>
                  </div>
                ) : null}
              </div>

              {pendingCommand ? (
                <AssistantPreviewCard
                  command={pendingCommand}
                  editMode={editMode}
                  onToggleEdit={() => setEditMode((current) => !current)}
                  onCancel={() => {
                    setPendingCommand(null);
                    setEditMode(false);
                  }}
                  onConfirm={handleConfirm}
                  onUpdate={setPendingCommand}
                  isExecuting={isExecuting}
                />
              ) : null}

              <div className="space-y-4">
                <div className="rounded-3xl border border-outline-variant/30 bg-surface p-4 shadow-soft">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Try: Create invoice for Ali Traders for 5 laptops at 120000 each"
                        className="min-h-[120px] flex-1 resize-none rounded-3xl border-outline-variant/30 bg-surface px-5 py-4 text-sm"
                      />
                      <div className="flex w-full gap-3 sm:w-auto sm:flex-col">
                        <Button
                          type="button"
                          onClick={isListening ? stopListening : startListening}
                          disabled={!voiceSupported || isParsing || isExecuting}
                          className={`min-h-12 min-w-12 rounded-2xl px-4 text-on-primary ${
                            isListening ? "bg-primary shadow-lg shadow-primary/25" : ""
                          }`}
                          aria-label={isListening ? "Stop listening" : "Start voice input"}
                        >
                          <span className={`material-symbols-outlined text-[20px] ${isListening ? "animate-pulse" : ""}`}>
                            {isListening ? "radio_button_checked" : "mic"}
                          </span>
                        </Button>
                        {isListening ? (
                          <Button type="button" variant="outline" onClick={stopListening} className="rounded-2xl">
                            Stop listening
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {heardTranscript || interimTranscript ? (
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Assistant heard</p>
                        <p className="mt-2 text-sm font-medium leading-6 text-on-surface">
                          {heardTranscript || "Listening..."}{" "}
                          {interimTranscript ? <span className="text-on-surface-variant">{interimTranscript}</span> : null}
                        </p>
                        {transcriptNeedsReview ? (
                          <p className="mt-2 text-sm text-amber-700">
                            I’m not fully sure I heard that correctly. Please review before running.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {!voiceSupported && voiceSupportChecked ? (
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 px-4 py-3 text-sm text-on-surface-variant">
                        Voice input is not supported in this browser. You can still type commands.
                      </div>
                    ) : null}

                    {voiceError ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-on-surface">
                        {voiceError}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleSubmit} disabled={isParsing || isExecuting} className="text-on-primary">
                        {isParsing ? "Parsing..." : "Run Command"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setInput("");
                          setHeardTranscript("");
                          setInterimTranscript("");
                          setTranscriptNeedsReview(false);
                          setVoiceError(null);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-black text-on-surface">Example prompts</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Start with one of these and then confirm the preview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => fillPrompt(prompt)}
                  className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-black text-on-surface">Command history</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Recent commands stay in this browser session so you can reuse them quickly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {commandHistory.length ? (
                commandHistory.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => fillPrompt(entry.text)}
                    className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{entry.text}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{formatTimestamp(entry.timestamp)}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          entry.status === "success"
                            ? "border-emerald-500/40 text-emerald-600"
                            : entry.status === "error"
                              ? "border-error/40 text-error"
                              : "border-outline-variant/40 text-on-surface-variant"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/40 px-4 py-5 text-sm text-on-surface-variant">
                  No command history yet. Run your first typed or voice-assisted command to build a quick reuse list.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-black text-on-surface">Recent successful commands</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                These are the actions that completed successfully in this session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {successfulCommands.length ? (
                successfulCommands.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                    <p className="text-sm font-semibold text-on-surface">{entry.text}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{formatTimestamp(entry.timestamp)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/40 px-4 py-5 text-sm text-on-surface-variant">
                  Successful actions will appear here after you confirm and complete them.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-outline-variant/30 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-black text-on-surface">Safety rules</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                This assistant behaves like AI, but it stays deterministic and permission-aware.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-on-surface-variant">
              <p>It uses exact tenant-scoped matching first, then offers suggestions for ambiguous customers, products, or invoices.</p>
              <p>Voice input only prepares the transcript. It never bypasses preview, editing, or confirmation.</p>
              <p>Nothing destructive or financial runs silently. Every command still goes through explicit confirmation and existing RBAC checks.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
