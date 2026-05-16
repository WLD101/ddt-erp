"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseAssistantCommandAction, executeAssistantCommandAction } from "@/modules/assistant/actions";
import type { AssistantCommand } from "@/modules/assistant/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  status?: "success" | "error";
  result?: Record<string, any>;
};

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
              <span className="font-semibold text-on-surface text-right">
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
      <CardHeader className="space-y-3">
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
        <div>
          <CardTitle className="text-xl font-black text-on-surface">Assistant preview</CardTitle>
          <CardDescription className="mt-2 text-sm text-on-surface-variant">
            Review the structured action before anything runs. Nothing executes until you confirm.
          </CardDescription>
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

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("Type a request first.");
      return;
    }

    setMessages((current) => [...current, createMessage("user", trimmed)]);
    setInput("");
    setPendingCommand(null);
    setEditMode(false);

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
        toast.error(result.response);
      }
    });
  };

  const handleConfirm = () => {
    if (!pendingCommand) return;
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
      if (result.success) {
        toast.success(result.message);
        setPendingCommand(null);
        setEditMode(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <PageShell
      title="Smart Assistant"
      description="Use natural-language commands, review a structured preview, then confirm before the ERP executes anything."
      actions={
        <Badge className="bg-primary text-on-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]">
          Rule-based assistant
        </Badge>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-on-surface">Assistant console</CardTitle>
            <CardDescription className="text-sm text-on-surface-variant">
              The assistant parses your request, builds structured ERP action JSON, and waits for your confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Try: Create invoice for Ali Traders for 5 laptops at 120000 each"
                className="min-h-[120px] resize-none rounded-3xl border-outline-variant/30 bg-surface px-5 py-4 text-sm"
              />
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSubmit} disabled={isParsing || isExecuting} className="text-on-primary">
                  {isParsing ? "Parsing..." : "Preview action"}
                </Button>
                <Button variant="outline" onClick={() => setInput("")}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  onClick={() => setInput(prompt)}
                  className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  {prompt}
                </button>
              ))}
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
              <p>Nothing destructive or financial runs silently. Every command requires an explicit confirmation preview.</p>
              <p>Restricted users still hit normal RBAC checks. The assistant never bypasses your workspace permissions.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
