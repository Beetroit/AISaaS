"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCredential } from "@/lib/api/credentials";
import { CredentialCreate } from "@/types/credential";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TwilioCredentialFormProps {
  onClose: () => void;
}

export function TwilioCredentialForm({ onClose }: TwilioCredentialFormProps) {
  const queryClient = useQueryClient();
  const [sid, setSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [allowConcurrentUse, setAllowConcurrentUse] = useState(false);

  const createCredentialMutation = useMutation({
    mutationFn: (newCredential: CredentialCreate) => createCredential(newCredential),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Twilio Credential added successfully!");
      onClose();
    },
    onError: (err) => {
      toast.error("Failed to add Twilio Credential: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCredential: CredentialCreate = {
      credential_type: "twilio",
      credentials_data: {
        twilio_sid: sid,
        twilio_auth_token: authToken,
        phone_number: phoneNumber,
      },
      allow_concurrent_use: allowConcurrentUse,
    };

    createCredentialMutation.mutate(newCredential);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="sid">Account SID</Label>
        <Input
          id="sid"
          value={sid}
          onChange={(e) => setSid(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="authToken">Auth Token</Label>
        <Input
          id="authToken"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="phoneNumber">Phone Number (e.g., +1234567890)</Label>
        <Input
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="allowConcurrentUse"
          checked={allowConcurrentUse}
          onCheckedChange={setAllowConcurrentUse}
        />
        <Label htmlFor="allowConcurrentUse">Allow Concurrent Use (Admin Override)</Label>
      </div>
      <Button type="submit" disabled={createCredentialMutation.isPending}>
        {createCredentialMutation.isPending ? "Adding..." : "Add Credential"}
      </Button>
    </form>
  );
}
