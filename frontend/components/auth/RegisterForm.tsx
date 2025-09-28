"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Icons } from "../ui/icons";
import { cn, isValidEmail, isValidPassword } from "../../lib/utils";

interface RegisterFormProps {
  className?: string;
  onToggleMode?: () => void;
}

export function RegisterForm({ className, onToggleMode }: RegisterFormProps) {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await register(
      formData.name.trim(),
      formData.email,
      formData.password
    );

    if (result.success) {
      router.push("/user/projects");
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  return (
    <Card className={cn("w-full max-w-lg mx-auto", className)}>
      <CardHeader className="space-y-1 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center">
            <Icons.logo className="w-7 h-7 text-white" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">
          Create Account
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Join VisionDesk to manage your projects efficiently
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange("name")}
                className={cn(
                  "h-11",
                  errors.name && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange("email")}
                className={cn(
                  "h-11",
                  errors.email && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange("password")}
                className={cn(
                  "h-11",
                  errors.password && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                className={cn(
                  "h-11",
                  errors.confirmPassword &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onToggleMode}
              className="font-medium text-primary hover:text-primary/90 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Secure Registration
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy.
        </div>
      </CardContent>
    </Card>
  );
}
