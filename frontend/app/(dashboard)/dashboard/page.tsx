"use client";
import { useAuth } from "@/hooks/useAuth";
import React from "react";

const Dashboard = () => {
  const { logout } = useAuth();

  return (
    <div>
      <button onClick={logout}>logout</button>
    </div>
  );
};

export default Dashboard;
