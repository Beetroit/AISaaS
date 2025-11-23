"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCredential, getCredentials } from "@/lib/api/credentials";
import { Credential } from "@/types/credential";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CredentialList() {
  const queryClient = useQueryClient();
  const { data: credentials, isLoading, error } = useQuery<Credential[]>({
    queryKey: ["credentials"],
    queryFn: getCredentials,
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: (credentialId: string) => deleteCredential(credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential deleted successfully!");
    },
    onError: (err) => {
      toast.error("Failed to delete credential: " + err.message);
    },
  });

  if (isLoading) {
    return <div>Loading credentials...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Identifier</TableHead>
            <TableHead>Concurrent Use</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials?.map((credential) => (
            <TableRow key={credential.id}>
              <TableCell className="font-medium">{credential.id}</TableCell>
              <TableCell>{credential.credential_type}</TableCell>
              <TableCell>
                <Badge variant="outline">{credential.channel || "whatsapp"}</Badge>
              </TableCell>
              <TableCell>{credential.identifier || "N/A"}</TableCell>
              <TableCell>
                {credential.allow_concurrent_use ? (
                  <Badge variant="outline">Yes</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>
              <TableCell>{new Date(credential.created_at).toLocaleString()}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCredentialMutation.mutate(credential.id)}
                  disabled={deleteCredentialMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
