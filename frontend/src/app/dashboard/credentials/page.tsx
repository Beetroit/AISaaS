"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CredentialList } from "@/components/credentials/CredentialList";
import { useState } from "react";
import { TwilioCredentialForm } from "@/components/credentials/TwilioCredentialForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CredentialsPage() {
  const [isTwilioFormOpen, setIsTwilioFormOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Credentials</h1>
        <Dialog open={isTwilioFormOpen} onOpenChange={setIsTwilioFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Twilio Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Twilio Credential</DialogTitle>
            </DialogHeader>
            <TwilioCredentialForm onClose={() => setIsTwilioFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <CredentialList />
    </div>
  );
}
