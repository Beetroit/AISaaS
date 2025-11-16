"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveTwilioCredentials } from "@/lib/api/credentials";
import { TwilioCredentials } from "@/types/agent";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

interface TwilioCredentialFormProps {
  onClose: () => void;
}

export function TwilioCredentialForm({ onClose }: TwilioCredentialFormProps) {
  const queryClient = useQueryClient();
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [allowConcurrentUse, setAllowConcurrentUse] = useState(false);

  const saveCredentialMutation = useMutation({
    mutationFn: (credentials: TwilioCredentials) => saveTwilioCredentials(credentials),
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

    const credentials: TwilioCredentials = {
      twilio_account_sid: accountSid,
      twilio_auth_token: authToken,
      twilio_phone_number: phoneNumber,
    };

    saveCredentialMutation.mutate(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="accountSid">Account SID</Label>
        <Input
          id="accountSid"
          value={accountSid}
          onChange={(e) => setAccountSid(e.target.value)}
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
      <Button type="submit" disabled={saveCredentialMutation.isPending}>
        {saveCredentialMutation.isPending ? "Adding..." : "Add Credential"}
      </Button>
    </form>
  );
}
