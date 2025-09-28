"use client";
import React from "react";
import useUsers from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useAssignUserRole from "@/hooks/useAssignUserRole";
import { Loader2, ShieldCheck, ArrowUpCircle, Users } from "lucide-react";

export default function UserManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } = useUsers({
    role: "user",
    limit: 100,
  });
  const { mutate: assignRole, isPending } = useAssignUserRole();
  const [promotingId, setPromotingId] = React.useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card className="p-8">
          <p className="text-sm">Please login.</p>
        </Card>
      </div>
    );
  }
  if (user?.role !== "admin") {
    return (
      <div className="p-6">
        <Card className="p-8 space-y-2">
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            Only administrators can manage user roles.
          </p>
        </Card>
      </div>
    );
  }

  const promote = (id: string) => {
    setPromotingId(id);
    assignRole(
      { id, role: "moderator" },
      { onSettled: () => setPromotingId(null) }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Promote eligible users to moderators.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpCircle className="h-4 w-4" />
            )}{" "}
            Refresh
          </Button>
        </div>
      </header>

      <Card className="p-5 space-y-4 border border-border/60 bg-gradient-to-br from-background to-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Users (role: user)
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Total {data?.pagination.totalItems ?? 0}
          </span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-md bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-sm font-medium">Failed to load users</p>
            <p className="text-xs text-muted-foreground">{error?.message}</p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !data?.users.length ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No users found.
          </div>
        ) : (
          <ul className="divide-y divide-border/40 rounded-md border border-border/40 overflow-hidden bg-background/60 backdrop-blur-sm">
            {data.users.map((u) => (
              <li
                key={u._id}
                className="flex items-center justify-between gap-4 p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-sm truncate max-w-[200px]">
                    {u.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                    {u.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-medium">
                    {u.role}
                  </span>
                  <Button
                    size="sm"
                    disabled={isPending || promotingId === u._id}
                    onClick={() => promote(u._id)}
                    className="inline-flex items-center gap-1 h-8 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-500"
                  >
                    {promotingId === u._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                    Promote
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-muted-foreground pt-2">
          Promotion instantly updates role; page will auto-refresh cache.
        </p>
      </Card>
    </div>
  );
}
