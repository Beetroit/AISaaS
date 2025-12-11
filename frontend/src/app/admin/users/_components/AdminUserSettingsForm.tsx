'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminCommandInfo, fetchAvailableAdminCommands, updateUserAdminSettings } from '@/lib/api/admin'; // Consolidated admin imports
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // Add useQuery
import { useState } from 'react'; // Keep useState
import { toast } from 'sonner';

// Shadcn UI components for multi-select
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, X } from 'lucide-react'; // Icons

interface AdminUserSettingsFormProps {
    userId: string;
    initialWhitelistedPhoneNumbers: string[] | null | undefined;
    initialAllowedAdminEndpoints: string[] | null | undefined;
    initialIsAdmin: boolean;
    initialIsSuperAdmin: boolean;
    onClose: () => void;
}

export function AdminUserSettingsForm({
    userId,
    initialWhitelistedPhoneNumbers,
    initialAllowedAdminEndpoints,
    initialIsAdmin,
    initialIsSuperAdmin,
    onClose,
}: AdminUserSettingsFormProps) {
    const [whitelistedPhoneNumbers, setWhitelistedPhoneNumbers] = useState(
        initialWhitelistedPhoneNumbers?.join('\n') || ''
    );
    const [selectedAdminEndpoints, setSelectedAdminEndpoints] = useState<string[]>(
        initialAllowedAdminEndpoints || []
    );
    const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
    const [isSuperAdmin, setIsSuperAdmin] = useState(initialIsSuperAdmin);
    const [openPopover, setOpenPopover] = useState(false);


    const queryClient = useQueryClient();

    const { data: availableCommands, isLoading: isLoadingCommands } = useQuery<AdminCommandInfo[]>({
        queryKey: ['available-admin-commands'],
        queryFn: fetchAvailableAdminCommands,
    });

    const mutation = useMutation({
        mutationFn: updateUserAdminSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
            toast.success('User admin settings updated successfully');
            onClose();
        },
        onError: (error: Error) => {
            toast.error(`Error updating settings: ${error.message || 'Unknown error'}`);
        },
    });

    const handleSubmit = () => {
        const phoneNumbersArray = whitelistedPhoneNumbers
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);

        mutation.mutate({
            userId,
            settings: {
                whitelisted_phone_numbers: phoneNumbersArray,
                allowed_admin_endpoints: selectedAdminEndpoints,
                is_admin: isAdmin,
                is_super_admin: isSuperAdmin,
            },
        });
    };

    const handleSelectEndpoint = (commandUrl: string) => {
        setSelectedAdminEndpoints((prev) =>
            prev.includes(commandUrl)
                ? prev.filter((url) => url !== commandUrl)
                : [...prev, commandUrl]
        );
    };

    const getCommandDescription = (url: string) => {
        return availableCommands?.find(cmd => cmd.url === url)?.description || url;
    };


    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="whitelisted-phones">Whitelisted Phone Numbers (one per line)</Label>
                <Textarea
                    id="whitelisted-phones"
                    value={whitelistedPhoneNumbers}
                    onChange={(e) => setWhitelistedPhoneNumbers(e.target.value)}
                    placeholder="e.g., +1234567890"
                    rows={5}
                />
            </div>
            <div>
                <Label htmlFor="allowed-endpoints">Allowed Admin Endpoints</Label>
                {isLoadingCommands ? (
                    <div>Loading available commands...</div>
                ) : (
                    <Popover open={openPopover} onOpenChange={setOpenPopover}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openPopover}
                                className="w-full justify-between"
                            >
                                <div className="flex flex-wrap gap-1">
                                    {selectedAdminEndpoints.length > 0 ? (
                                        selectedAdminEndpoints.map((url) => (
                                            <Badge key={url} variant="secondary" className="pr-1">
                                                {getCommandDescription(url)}
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    className="inline-flex items-center justify-center h-4 w-4 ml-1 rounded-full text-foreground bg-background/50 hover:bg-background cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectEndpoint(url);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.stopPropagation();
                                                            handleSelectEndpoint(url);
                                                        }
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </span>
                                            </Badge>
                                        ))
                                    ) : (
                                        <span>Select endpoints...</span>
                                    )}
                                </div>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search commands..." />
                                <CommandList>
                                    <CommandEmpty>No command found.</CommandEmpty>
                                    <CommandGroup>
                                        {availableCommands?.map((command) => (
                                            <CommandItem
                                                key={command.url}
                                                value={command.description}
                                                onSelect={() => handleSelectEndpoint(command.url)}
                                            >
                                                <Checkbox
                                                    checked={selectedAdminEndpoints.includes(command.url)}
                                                    onCheckedChange={() => handleSelectEndpoint(command.url)}
                                                    className="mr-2"
                                                />
                                                {command.description}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="is-admin"
                    checked={isAdmin}
                    onCheckedChange={(checked) => setIsAdmin(checked === true)}
                />
                <Label htmlFor="is-admin">Is Admin</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="is-super-admin"
                    checked={isSuperAdmin}
                    onCheckedChange={(checked) => setIsSuperAdmin(checked === true)}
                />
                <Label htmlFor="is-super-admin">Is Super Admin</Label>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
