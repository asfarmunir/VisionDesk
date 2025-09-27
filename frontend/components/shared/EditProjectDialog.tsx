import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type Project } from "@/lib/api/projects";
import useUpdateProject from "@/hooks/useUpdateProject";
import toast from "react-hot-toast";

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorities: Array<{ label: string; value: Project["priority"] }> = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const statuses: Array<{ label: string; value: Project["status"] }> = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  project,
  open,
  onOpenChange,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Project["priority"]>("medium");
  const [status, setStatus] = useState<Project["status"]>("active");

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      setPriority(project.priority);
      setStatus(project.status);
    }
  }, [project]);

  const { mutate, isPending } = useUpdateProject(project?._id || "", {
    onSuccess: () => {
      toast.success("Project updated");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const formValid = title.trim().length > 0 && description.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !formValid) return;
    console.log("Submitting update with:", {
      title,
      description,
      priority,
      status,
    });
    mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the projects core details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              minLength={10}
              maxLength={1000}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground flex justify-between">
              <span>
                {description.length < 10
                  ? `${10 - description.length} more characters needed`
                  : "Looks good"}
              </span>
              <span>{description.length}/1000</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`text-sm rounded-md border px-2 py-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${
                    priority === p.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`text-sm rounded-md border px-2 py-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${
                    status === s.value
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!formValid || isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
