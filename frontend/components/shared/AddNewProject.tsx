import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useCreateProject } from "@/hooks/useCreateProject";
import toast from "react-hot-toast";

const priorities: Array<{
  label: string;
  value: "low" | "medium" | "high" | "urgent";
}> = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const MIN_DESC = 10;
const MAX_DESC = 1000;

const AddNewProject: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");

  const { mutate, isPending } = useCreateProject({
    onSuccess: (proj) => {
      toast.success(`Project "${proj.title}" created`);
      setOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create project");
    },
  });

  const formValid =
    title.trim().length > 0 && description.trim().length >= MIN_DESC;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add New Project</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Provide the essential details to create a new project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="project-title">Title</Label>
            <Input
              id="project-title"
              placeholder="e.g. Marketing Website Revamp"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Briefly describe the project's goals, scope, or initial objectives..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              minLength={MIN_DESC}
              maxLength={MAX_DESC}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground flex justify-between">
              <span>
                {description.length < MIN_DESC
                  ? `${MIN_DESC - description.length} more characters needed`
                  : "Looks good"}
              </span>
              <span>
                {description.length}/{MAX_DESC}
              </span>
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
          <DialogFooter className="flex gap-2 justify-end pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!formValid || isPending}>
              {isPending ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewProject;
