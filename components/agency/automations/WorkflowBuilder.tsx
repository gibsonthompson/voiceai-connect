'use client';

// ============================================================================
// WORKFLOW BUILDER - managed visual canvas for one automation
//
// A top-down managed flow (not free-form): nodes auto-lay out, you click a node
// to configure it and click a connector line to insert a step. No drag-to-
// connect to break. Mirrors the backend node catalog and plan tiers; advanced
// nodes (AI SMS, webhook) are locked on Pro. The graph it edits is the exact
// shape the engine runs, plus a position on each node (which the engine ignores).
// ============================================================================

import { useMemo, useState, useCallback, memo } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '../../../hooks/useTheme';
import {
  Zap, MessageSquare, Clock, GitBranch, Tag, TagsIcon, UserCog, Globe, Flag,
  Square, Sparkles, Bell, Phone, CalendarCheck, X, Plus, Trash2, Lock, Check,
  ChevronDown, Save, Power, PauseCircle, ArrowLeft, Loader2, Building2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// node catalog (UI side; tiers must match the backend workflow-nodes.js)
// ---------------------------------------------------------------------------
type Tier = 'basic' | 'advanced';
interface CatalogEntry {
  label: string; group: 'Actions' | 'Logic' | 'Finish'; tier: Tier;
  icon: any; blurb: string; defaultData: () => Record<string, any>;
}
const CATALOG: Record<string, CatalogEntry> = {
  send_sms:     { label: 'Send SMS', group: 'Actions', tier: 'basic', icon: MessageSquare, blurb: 'Text the customer', defaultData: () => ({ message: 'Hi {{first_name}}, ' }) },
  ai_sms:       { label: 'AI SMS', group: 'Actions', tier: 'advanced', icon: Sparkles, blurb: 'AI writes the text from your business info', defaultData: () => ({ instruction: 'Write a brief, friendly follow-up to the customer.', fallback: 'Thanks for calling {{business_name}}!' }) },
  notify_owner: { label: 'Notify business', group: 'Actions', tier: 'basic', icon: Bell, blurb: 'Text the business owner', defaultData: () => ({ message: 'New follow-up for {{first_name}}.' }) },
  add_tag:      { label: 'Add tag', group: 'Actions', tier: 'basic', icon: Tag, blurb: 'Tag the contact', defaultData: () => ({ tag: '' }) },
  remove_tag:   { label: 'Remove tag', group: 'Actions', tier: 'basic', icon: TagsIcon, blurb: 'Remove a tag', defaultData: () => ({ tag: '' }) },
  set_status:   { label: 'Set status', group: 'Actions', tier: 'basic', icon: UserCog, blurb: 'Change the contact status', defaultData: () => ({ status: '' }) },
  webhook:      { label: 'Webhook', group: 'Actions', tier: 'advanced', icon: Globe, blurb: 'Send data to another system', defaultData: () => ({ url: '' }) },
  wait:         { label: 'Wait', group: 'Logic', tier: 'basic', icon: Clock, blurb: 'Pause before the next step', defaultData: () => ({ minutes: 1440 }) },
  condition:    { label: 'If / Else', group: 'Logic', tier: 'basic', icon: GitBranch, blurb: 'Branch on the call or contact', defaultData: () => ({ field: 'appointment_booked', op: 'eq', value: 'true' }) },
  end:          { label: 'End', group: 'Finish', tier: 'basic', icon: Square, blurb: 'Stop here', defaultData: () => ({}) },
};
const TRIGGER_META = { label: 'Trigger', icon: Zap };

const TRIGGER_TYPES = [
  { value: 'call.completed', label: 'After a call' },
  { value: 'appointment.booked', label: 'When an appointment is booked' },
];
const OUTCOME_OPTIONS = [
  { value: 'callback_requested', label: 'Asked for a callback' },
  { value: 'unanswered', label: 'Had an unresolved question' },
  { value: 'abandoned', label: 'Hung up mid-conversation' },
  { value: 'message', label: 'Left a message' },
];
const CONDITION_FIELDS = [
  { value: 'appointment_booked', label: 'Appointment booked' },
  { value: 'followup_outcome', label: 'Call outcome' },
  { value: 'sentiment', label: 'Sentiment' },
  { value: 'urgency_level', label: 'Urgency' },
  { value: 'status', label: 'Contact status' },
];
const CONDITION_OPS = [
  { value: 'eq', label: 'is' },
  { value: 'ne', label: 'is not' },
  { value: 'exists', label: 'has any value' },
  { value: 'not_exists', label: 'is empty' },
];
const TOKENS = ['first_name', 'customer_name', 'business_name', 'service', 'agent_name', 'appointment_time', 'city'];

// ---------------------------------------------------------------------------
// graph helpers
// ---------------------------------------------------------------------------
type GNode = { id: string; type: string; data: Record<string, any>; position?: { x: number; y: number } };
type GEdge = { source: string; target: string; branch?: string };
type Graph = { nodes: GNode[]; edges: GEdge[] };

let _seq = 0;
const uid = (t: string) => `${t}_${Date.now().toString(36)}${(_seq++).toString(36)}`;

function nodeSummary(n: GNode): string {
  const d = n.data || {};
  switch (n.type) {
    case 'send_sms': case 'notify_owner': return (d.message || '').slice(0, 60) || 'No message yet';
    case 'ai_sms': return 'AI-written message';
    case 'wait': { const m = Number(d.minutes) || 0; if (m % 1440 === 0) return `Wait ${m / 1440} day(s)`; if (m % 60 === 0) return `Wait ${m / 60} hour(s)`; return `Wait ${m} min`; }
    case 'condition': { const f = CONDITION_FIELDS.find((x) => x.value === d.field); const o = CONDITION_OPS.find((x) => x.value === d.op); return `${f ? f.label : d.field} ${o ? o.label : d.op}${d.op === 'eq' || d.op === 'ne' ? ' ' + d.value : ''}`; }
    case 'add_tag': return d.tag ? `Add "${d.tag}"` : 'Pick a tag';
    case 'remove_tag': return d.tag ? `Remove "${d.tag}"` : 'Pick a tag';
    case 'set_status': return d.status ? `Set to "${d.status}"` : 'Pick a status';
    case 'webhook': return d.url || 'Set a URL';
    case 'end': return 'Stops here';
    default: return '';
  }
}

// Insert a new node of `type` onto edge (source->target with optional branch).
function insertOnEdge(graph: Graph, edge: GEdge, type: string): Graph {
  const id = uid(type);
  const newNode: GNode = { id, type, data: CATALOG[type].defaultData() };
  const edges = graph.edges.filter((e) => !(e.source === edge.source && e.target === edge.target && e.branch === edge.branch));
  const nodes = [...graph.nodes, newNode];

  if (type === 'condition') {
    // Yes keeps going to the old target; No ends at a fresh End node.
    const endId = uid('end');
    nodes.push({ id: endId, type: 'end', data: {} });
    edges.push({ source: edge.source, target: id, branch: edge.branch });
    edges.push({ source: id, target: edge.target, branch: 'true' });
    edges.push({ source: id, target: endId, branch: 'false' });
    return { nodes, edges };
  }
  if (type === 'end') {
    // Terminate this path: source -> end, drop the tail to the old target.
    edges.push({ source: edge.source, target: id, branch: edge.branch });
    return { nodes, edges };
  }
  edges.push({ source: edge.source, target: id, branch: edge.branch });
  edges.push({ source: id, target: edge.target });
  return { nodes, edges };
}

// Delete a node, reconnecting its incoming edges to its first outgoing target.
function deleteNode(graph: Graph, nodeId: string): Graph {
  const incoming = graph.edges.filter((e) => e.target === nodeId);
  const outgoing = graph.edges.filter((e) => e.source === nodeId);
  const firstOut = outgoing[0];
  let edges = graph.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
  if (firstOut) {
    for (const inc of incoming) edges.push({ source: inc.source, target: firstOut.target, branch: inc.branch });
  }
  const nodes = graph.nodes.filter((n) => n.id !== nodeId);
  return { nodes, edges };
}

// Layered top-down layout (BFS depth from the trigger).
function layout(graph: Graph): Map<string, { x: number; y: number }> {
  const out = new Map<string, GEdge[]>();
  graph.edges.forEach((e) => { if (!out.has(e.source)) out.set(e.source, []); out.get(e.source)!.push(e); });
  const trigger = graph.nodes.find((n) => n.type === 'trigger') || graph.nodes[0];
  const depth = new Map<string, number>();
  if (trigger) { depth.set(trigger.id, 0); const q: string[] = [trigger.id]; while (q.length) { const id = q.shift()!; const d = depth.get(id)!; for (const e of out.get(id) || []) { if (!depth.has(e.target)) { depth.set(e.target, d + 1); q.push(e.target); } } } }
  const levels = new Map<number, string[]>();
  graph.nodes.forEach((n) => { const d = depth.has(n.id) ? depth.get(n.id)! : 0; if (!levels.has(d)) levels.set(d, []); levels.get(d)!.push(n.id); });
  const pos = new Map<string, { x: number; y: number }>();
  const GX = 300; const GY = 150;
  Array.from(levels.keys()).sort((a, b) => a - b).forEach((d) => { const ids = levels.get(d)!; const n = ids.length; ids.forEach((id, i) => pos.set(id, { x: (i - (n - 1) / 2) * GX, y: d * GY })); });
  return pos;
}

// ---------------------------------------------------------------------------
// themed primitives (no native select)
// ---------------------------------------------------------------------------
function Select({ value, options, onChange, theme }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; theme: any }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }}>
        <span className="truncate">{cur ? cur.label : 'Select'}</span>
        <ChevronDown className="h-4 w-4 shrink-0" style={{ color: theme.textMuted }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            {options.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center justify-between" style={{ color: theme.text, backgroundColor: o.value === value ? theme.hover : 'transparent' }}>
                {o.label}{o.value === value && <Check className="h-3.5 w-3.5" style={{ color: theme.primary }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// custom node (single type; renders by data.kind)
// ---------------------------------------------------------------------------
const WfNode = memo(({ data }: { data: any }) => {
  const t = data.theme;
  const Icon = data.icon || Square;
  const isTrigger = data.kind === 'trigger';
  const accent = isTrigger ? t.primary : (data.tier === 'advanced' ? (t.warning || t.primary) : t.primary);
  return (
    <div
      style={{
        width: 232, background: t.card, border: `2px solid ${data.selected ? accent : t.border}`,
        borderRadius: 16, padding: 12, boxShadow: data.selected ? `0 0 0 3px ${accent}22` : 'none',
      }}
    >
      {!isTrigger && <Handle type="target" position={Position.Top} style={{ background: t.border, width: 8, height: 8 }} />}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: isTrigger ? t.primary : t.hover }}>
          <Icon className="h-4 w-4" style={{ color: isTrigger ? t.primaryText : accent }} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: t.text }}>{data.title}</div>
          <div className="text-xs truncate" style={{ color: t.textMuted }}>{data.summary}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: t.border, width: 8, height: 8 }} />
    </div>
  );
});
WfNode.displayName = 'WfNode';
const nodeTypes = { wf: WfNode };

// ---------------------------------------------------------------------------
// add-step menu (opens on edge click)
// ---------------------------------------------------------------------------
function AddStepMenu({ plan, theme, onPick, onClose }: { plan: string; theme: any; onPick: (type: string) => void; onClose: () => void }) {
  const groups: Array<'Actions' | 'Logic' | 'Finish'> = ['Actions', 'Logic', 'Finish'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#0008' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-4 max-h-[80vh] overflow-y-auto" style={{ background: theme.card, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: theme.text }}>Add a step</h3>
          <button type="button" onClick={onClose}><X className="h-5 w-5" style={{ color: theme.textMuted }} /></button>
        </div>
        {groups.map((g) => (
          <div key={g} className="mb-3">
            <div className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>{g}</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATALOG).filter(([, c]) => c.group === g).map(([type, c]) => {
                const locked = c.tier === 'advanced' && plan !== 'scale';
                const Icon = c.icon;
                return (
                  <button key={type} type="button" disabled={locked} onClick={() => { if (!locked) onPick(type); }}
                    className="text-left p-2.5 rounded-xl flex items-start gap-2" style={{ background: theme.hover, opacity: locked ? 0.55 : 1, cursor: locked ? 'not-allowed' : 'pointer' }}>
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: theme.primary }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium flex items-center gap-1" style={{ color: theme.text }}>{c.label}{locked && <Lock className="h-3 w-3" style={{ color: theme.textMuted }} />}</div>
                      <div className="text-xs" style={{ color: theme.textMuted }}>{locked ? 'Scale only' : c.blurb}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// config drawer
// ---------------------------------------------------------------------------
function ConfigDrawer({ node, workflow, theme, plan, onPatchNode, onDeleteNode, onPatchWorkflow, onClose }: any) {
  const d = node.type === 'trigger' ? {} : (node.data || {});
  const set = (patch: Record<string, any>) => onPatchNode(node.id, patch);
  const msgRef = (val: string) => set({ message: val });

  const insertToken = (field: string, tok: string) => {
    const cur = (node.data && node.data[field]) || '';
    set({ [field]: `${cur}{{${tok}}}` });
  };

  const header = node.type === 'trigger' ? 'Trigger' : (CATALOG[node.type]?.label || node.type);

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 z-30 overflow-y-auto" style={{ background: theme.card, borderLeft: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between p-4 sticky top-0" style={{ background: theme.card, borderBottom: `1px solid ${theme.border}` }}>
        <h3 className="font-semibold" style={{ color: theme.text }}>{header}</h3>
        <button type="button" onClick={onClose}><X className="h-5 w-5" style={{ color: theme.textMuted }} /></button>
      </div>
      <div className="p-4 space-y-4">
        {node.type === 'trigger' && (
          <>
            <Field label="Starts" theme={theme}>
              <Select theme={theme} value={workflow.trigger_type} options={TRIGGER_TYPES} onChange={(v) => onPatchWorkflow({ trigger_type: v, trigger_config: {} })} />
            </Field>
            {workflow.trigger_type === 'call.completed' && (
              <Field label="Only for calls where the caller" theme={theme}>
                <div className="space-y-1.5">
                  {OUTCOME_OPTIONS.map((o) => {
                    const arr: string[] = workflow.trigger_config?.followup_outcome_in || [];
                    const on = arr.includes(o.value);
                    return (
                      <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: theme.text }}>
                        <Checkbox on={on} theme={theme} onClick={() => { const next = on ? arr.filter((x) => x !== o.value) : [...arr, o.value]; onPatchWorkflow({ trigger_config: { ...workflow.trigger_config, followup_outcome_in: next } }); }} />
                        {o.label}
                      </label>
                    );
                  })}
                  <p className="text-xs pt-1" style={{ color: theme.textMuted }}>Leave all unchecked to run after every real call.</p>
                </div>
              </Field>
            )}
            <Field label="Stop automatically when the customer" theme={theme}>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-1.5" style={{ color: theme.text }}>
                <Checkbox on={!!workflow.stop_on?.reply} theme={theme} onClick={() => onPatchWorkflow({ stop_on: { ...workflow.stop_on, reply: !workflow.stop_on?.reply } })} /> Replies to a text
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: theme.text }}>
                <Checkbox on={!!workflow.stop_on?.booked} theme={theme} onClick={() => onPatchWorkflow({ stop_on: { ...workflow.stop_on, booked: !workflow.stop_on?.booked } })} /> Books an appointment
              </label>
            </Field>
          </>
        )}

        {(node.type === 'send_sms' || node.type === 'notify_owner') && (
          <Field label="Message" theme={theme}>
            <textarea value={d.message || ''} onChange={(e) => msgRef(e.target.value)} rows={5} className="w-full px-3 py-2 rounded-xl text-sm resize-y" style={{ background: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }} />
            <div className="flex flex-wrap gap-1 mt-2">
              {TOKENS.map((tk) => <button key={tk} type="button" onClick={() => insertToken('message', tk)} className="text-xs px-2 py-0.5 rounded-full" style={{ background: theme.hover, color: theme.textMuted }}>{`{{${tk}}}`}</button>)}
            </div>
          </Field>
        )}

        {node.type === 'ai_sms' && (
          <>
            <Field label="What should the AI say?" theme={theme}>
              <textarea value={d.instruction || ''} onChange={(e) => set({ instruction: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl text-sm resize-y" style={{ background: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }} />
            </Field>
            <Field label="Fallback message (if AI is unavailable)" theme={theme}>
              <textarea value={d.fallback || ''} onChange={(e) => set({ fallback: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl text-sm resize-y" style={{ background: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }} />
            </Field>
          </>
        )}

        {node.type === 'wait' && <WaitEditor d={d} set={set} theme={theme} />}

        {node.type === 'condition' && (
          <>
            <Field label="If the" theme={theme}><Select theme={theme} value={d.field} options={CONDITION_FIELDS} onChange={(v) => set({ field: v })} /></Field>
            <Field label="Comparison" theme={theme}><Select theme={theme} value={d.op} options={CONDITION_OPS} onChange={(v) => set({ op: v })} /></Field>
            {(d.op === 'eq' || d.op === 'ne') && (
              <Field label="Value" theme={theme}><input value={d.value || ''} onChange={(e) => set({ value: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }} placeholder="e.g. true" /></Field>
            )}
            <p className="text-xs" style={{ color: theme.textMuted }}>The Yes branch continues; the No branch ends. Click a connector line to add steps to either branch.</p>
          </>
        )}

        {(node.type === 'add_tag' || node.type === 'remove_tag') && (
          <Field label="Tag" theme={theme}><input value={d.tag || ''} onChange={(e) => set({ tag: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }} /></Field>
        )}
        {node.type === 'set_status' && (
          <Field label="Status" theme={theme}><input value={d.status || ''} onChange={(e) => set({ status: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }} placeholder="e.g. contacted" /></Field>
        )}
        {node.type === 'webhook' && (
          <Field label="URL" theme={theme}><input value={d.url || ''} onChange={(e) => set({ url: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }} placeholder="https://" /></Field>
        )}

        {node.type !== 'trigger' && (
          <button type="button" onClick={() => onDeleteNode(node.id)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium mt-2" style={{ color: theme.error, border: `1px solid ${theme.errorBorder || theme.border}` }}>
            <Trash2 className="h-4 w-4" /> Delete step
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, theme, children }: any) {
  return <div><label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>{label}</label>{children}</div>;
}
function Checkbox({ on, theme, onClick }: any) {
  return <button type="button" onClick={onClick} className="h-4 w-4 rounded flex items-center justify-center shrink-0" style={{ background: on ? theme.primary : 'transparent', border: `1px solid ${on ? theme.primary : theme.border}` }}>{on && <Check className="h-3 w-3" style={{ color: theme.primaryText }} />}</button>;
}
function WaitEditor({ d, set, theme }: any) {
  const minutes = Number(d.minutes) || 0;
  let unit = 'minutes'; let amount = minutes;
  if (minutes % 1440 === 0 && minutes > 0) { unit = 'days'; amount = minutes / 1440; }
  else if (minutes % 60 === 0 && minutes > 0) { unit = 'hours'; amount = minutes / 60; }
  const apply = (a: number, u: string) => { const mult = u === 'days' ? 1440 : u === 'hours' ? 60 : 1; set({ minutes: Math.max(1, Math.round(a * mult)) }); };
  return (
    <div className="flex gap-2">
      <input type="number" min={1} value={amount} onChange={(e) => apply(Number(e.target.value), unit)} className="w-24 px-3 py-2 rounded-xl text-sm" style={{ background: theme.inputBg || theme.card, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }} />
      <div className="flex-1"><Select theme={theme} value={unit} options={[{ value: 'minutes', label: 'minutes' }, { value: 'hours', label: 'hours' }, { value: 'days', label: 'days' }]} onChange={(u) => apply(amount, u)} /></div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// main builder
// ---------------------------------------------------------------------------
function Inner({ workflow, plan, saving, onSaveDraft, onActivate, onPause, onBack }: any) {
  const theme = useTheme();
  const [graph, setGraph] = useState<Graph>(() => ({
    nodes: workflow.graph?.nodes?.length ? workflow.graph.nodes : [{ id: 'trigger', type: 'trigger', data: {} }],
    edges: workflow.graph?.edges || [],
  }));
  const [wf, setWf] = useState({ trigger_type: workflow.trigger_type, trigger_config: workflow.trigger_config || {}, stop_on: workflow.stop_on || {}, name: workflow.name });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addEdge, setAddEdge] = useState<GEdge | null>(null);
  const [dirty, setDirty] = useState(false);

  const mutate = (g: Graph) => { setGraph(g); setDirty(true); };
  const patchWorkflow = (patch: any) => { setWf((p) => ({ ...p, ...patch })); setDirty(true); };

  const patchNode = (id: string, patch: Record<string, any>) => mutate({ ...graph, nodes: graph.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n) });
  const removeNode = (id: string) => { mutate(deleteNode(graph, id)); setSelectedId(null); };

  const pos = useMemo(() => layout(graph), [graph]);
  const rfNodes = useMemo(() => graph.nodes.map((n) => {
    const isTrig = n.type === 'trigger';
    const meta = isTrig ? TRIGGER_META : CATALOG[n.type];
    return {
      id: n.id, type: 'wf', position: n.position || pos.get(n.id) || { x: 0, y: 0 },
      data: {
        theme, kind: isTrig ? 'trigger' : n.type, icon: triggerIcon(isTrig, n, wf), tier: meta ? (meta as any).tier : 'basic',
        title: isTrig ? triggerTitle(wf) : (meta ? meta.label : n.type),
        summary: isTrig ? triggerSummary(wf) : nodeSummary(n), selected: selectedId === n.id,
      },
    };
  }), [graph, pos, theme, selectedId, wf]);

  const rfEdges = useMemo(() => graph.edges.map((e) => ({
    id: `${e.source}-${e.target}-${e.branch || 'x'}`, source: e.source, target: e.target,
    label: e.branch === 'true' ? 'Yes' : e.branch === 'false' ? 'No' : undefined,
    type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: theme.border, strokeWidth: 2 },
    labelStyle: { fill: theme.textMuted, fontSize: 11 }, labelBgStyle: { fill: theme.card },
  })), [graph, theme]);

  const selectedNode = selectedId ? graph.nodes.find((n) => n.id === selectedId) : null;

  const doSave = useCallback(async () => {
    await onSaveDraft({ graph, trigger_type: wf.trigger_type, trigger_config: wf.trigger_config, stop_on: wf.stop_on, name: wf.name });
    setDirty(false);
  }, [graph, wf, onSaveDraft]);

  const saveAndActivate = useCallback(async () => { await doSave(); await onActivate(); }, [doSave, onActivate]);

  const isActive = workflow.status === 'active';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onBack} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><ArrowLeft className="h-5 w-5" /></button>
          <input value={wf.name} onChange={(e) => patchWorkflow({ name: e.target.value })} className="font-semibold text-lg bg-transparent outline-none min-w-0" style={{ color: theme.text }} />
          <span className="text-xs px-2 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1" style={{ background: theme.hover, color: theme.textMuted }}>
            <Building2 className="h-3 w-3" /> {workflow.client_name || 'All clients'}
          </span>
          {dirty && <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: theme.hover, color: theme.textMuted }}>Unsaved</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={doSave} disabled={saving || !dirty} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ color: theme.text, border: `1px solid ${theme.border}`, opacity: saving || !dirty ? 0.5 : 1 }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          {isActive ? (
            <button type="button" onClick={onPause} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ color: theme.text, border: `1px solid ${theme.border}` }}><PauseCircle className="h-4 w-4" /> Pause</button>
          ) : (
            <button type="button" onClick={saveAndActivate} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: theme.primary, color: theme.primaryText, opacity: saving ? 0.6 : 1 }}><Power className="h-4 w-4" /> Save & turn on</button>
          )}
        </div>
      </div>

      {/* canvas */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={rfNodes} edges={rfEdges} nodeTypes={nodeTypes}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable
          onNodeClick={(_: any, n: any) => { setSelectedId(n.id); setAddEdge(null); }}
          onEdgeClick={(_: any, e: any) => { const [source, target, b] = [e.source, e.target, e.id.split('-').pop()]; setAddEdge({ source, target, branch: b === 'x' ? undefined : (b as string) }); }}
          onPaneClick={() => { setSelectedId(null); }}
          fitView proOptions={{ hideAttribution: true }} minZoom={0.3}
        >
          <Background color={theme.border} gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full pointer-events-none" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
          Click a step to edit it, or a connector line to add one
        </div>

        {selectedNode && (
          <ConfigDrawer node={selectedNode} workflow={wf} theme={theme} plan={plan} onPatchNode={patchNode} onDeleteNode={removeNode} onPatchWorkflow={patchWorkflow} onClose={() => setSelectedId(null)} />
        )}
        {addEdge && (
          <AddStepMenu plan={plan} theme={theme} onClose={() => setAddEdge(null)} onPick={(type) => { mutate(insertOnEdge(graph, addEdge, type)); setAddEdge(null); }} />
        )}
      </div>
    </div>
  );
}

function triggerIcon(isTrig: boolean, n: GNode, wf: any) {
  if (!isTrig) return CATALOG[n.type]?.icon || Square;
  return wf.trigger_type === 'appointment.booked' ? CalendarCheck : Phone;
}
function triggerTitle(wf: any) { return wf.trigger_type === 'appointment.booked' ? 'Appointment booked' : 'Call finished'; }
function triggerSummary(wf: any) {
  if (wf.trigger_type === 'appointment.booked') return 'When a customer books';
  const arr = wf.trigger_config?.followup_outcome_in || [];
  return arr.length ? `${arr.length} outcome(s)` : 'Any real call';
}

export default function WorkflowBuilder(props: any) {
  return <ReactFlowProvider><Inner {...props} /></ReactFlowProvider>;
}
