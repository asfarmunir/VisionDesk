"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useUsers from "@/hooks/useUsers";
import useAddTeamMember from "@/hooks/useAddTeamMember";
import toast from "react-hot-toast";

interface AddTeamMemberProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

const roles: Array<{
  label: string;
  value: "lead" | "developer" | "tester" | "designer";
}> = [
  { label: "Lead", value: "lead" },
  { label: "Developer", value: "developer" },
  { label: "Tester", value: "tester" },
  { label: "Designer", value: "designer" },
];

const AddTeamMember: React.FC<AddTeamMemberProps> = ({
  projectId,
  open,
  onOpenChange,
  disabled,
}) => {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<
    "lead" | "developer" | "tester" | "designer"
  >("developer");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { data, isLoading, refetch } = useUsers({
    search: search || undefined,
    limit: 8,
    role: "user",
  });
  const addMutation = useAddTeamMember(projectId, {
    onSuccess: () => {
      toast.success("Team member added");
      onOpenChange(false);
      setSelectedUserId("");
      setSearch("");
      setRole("developer");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const users = data?.users || [];
  const submitDisabled = !selectedUserId || addMutation.isPending;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    addMutation.mutate({ userId: selectedUserId, role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Select a user and assign a role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="space-y-2">
            <Input
              placeholder="Search users by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={addMutation.isPending || disabled}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Users
            </p>
            <div className="border rounded-md h-52 overflow-auto divide-y">
              {isLoading ? (
                <div className="p-4 text-xs text-muted-foreground">
                  Loading...
                </div>
              ) : users.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">
                  No users found
                </div>
              ) : (
                users.map((u) => (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => setSelectedUserId(u._id)}
                    className={`w-full text-left px-3 py-2 text-sm flex flex-col gap-0.5 transition ${
                      selectedUserId === u._id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    disabled={addMutation.isPending}
                  >
                    <span className="font-medium truncate">{u.name}</span>
                    <span className="text-xs opacity-80 truncate">
                      {u.email}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Role
            </p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium transition ${
                    role === r.value
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "bg-background hover:bg-muted"
                  }`}
                  disabled={addMutation.isPending}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {addMutation.isPending ? "Adding…" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMember;
