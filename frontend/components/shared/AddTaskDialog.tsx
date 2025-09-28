"use client";
import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useCreateTask from "@/hooks/useCreateTask";
import toast from "react-hot-toast";
import { Project } from "@/lib/api/projects";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface AddTaskDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const priorities: Array<{
  label: string;
  value: "low" | "medium" | "high" | "urgent";
}> = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const categories: Array<{
  label: string;
  value: "bug" | "feature" | "enhancement" | "maintenance" | "documentation";
}> = [
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature" },
  { label: "Enhancement", value: "enhancement" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Docs", value: "documentation" },
];

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  project,
  open,
  onOpenChange,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [category, setCategory] = useState<
    "bug" | "feature" | "enhancement" | "maintenance" | "documentation"
  >("feature");
  const [search, setSearch] = useState("");

  // Allowed assignees: project creator + team members (by backend rule also admin). We'll list creator + teamMembers.
  const members = useMemo(() => {
    const base = [...(project.teamMembers || []).map((tm) => tm.user)];
    // unique by _id
    const seen = new Set<string>();
    return base.filter((u) => {
      if (seen.has(u._id)) return false;
      seen.add(u._id);
      return true;
    });
  }, [project]);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const { mutate, isPending } = useCreateTask(project._id, {
    onSuccess: () => {
      toast.success("Task created");
      // reset minimal fields; keep dialog open? We'll close.
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      setPriority("medium");
      setCategory("feature");
      setSearch("");
    },
    onError: (e) => toast.error(e.message),
  });

  const formValid =
    title.trim().length >= 3 &&
    description.trim().length >= 5 &&
    assignedTo &&
    dueDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    mutate({
      title,
      description,
      projectId: project._id,
      assignedTo,
      dueDate: new Date(dueDate).toISOString(),
      priority,
      category,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-1">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short task title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Input
              placeholder="Search member"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
            <div className="rounded border divide-y max-h-40 overflow-auto">
              {filteredMembers.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground">
                  No members
                </div>
              )}
              {filteredMembers.map((m) => (
                <button
                  type="button"
                  key={m._id}
                  onClick={() => setAssignedTo(m._id)}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between hover:bg-muted ${
                    assignedTo === m._id ? "bg-primary/10" : ""
                  }`}
                >
                  <span>{m.name}</span>
                  {assignedTo === m._id && (
                    <span className="text-xs text-primary">Selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due">Due Date</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as typeof priority)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as typeof category)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!formValid || isPending}>
              {isPending ? "Creating…" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
