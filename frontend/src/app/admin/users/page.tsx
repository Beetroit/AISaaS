'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, suspendUser, unsuspendUser, deleteUser, adjustUserCredits, promoteUser, demoteUser } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AdminUserSettingsForm } from './_components/AdminUserSettingsForm'; // Import the new component
import { User } from '@/lib/api/admin'; // Import User interface


export default function UsersPage() {
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [action, setAction] = useState<'suspend' | 'delete' | 'credits' | 'promote' | 'demote' | 'adminSettings' | null>(null); // Added 'adminSettings'
    const [reason, setReason] = useState('');
    const [creditAmount, setCreditAmount] = useState('');

    // State for Admin Settings dialog
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [userToEditAdminSettings, setUserToEditAdminSettings] = useState<User | null>(null);

    const queryClient = useQueryClient();


    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search],
        queryFn: () => fetchUsers({ search, limit: 50 }),
    });

    const suspendMutation = useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
            suspendUser(userId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User suspended successfully');
            closeDialog();
        },
        onError: () => {
            toast.error('Error suspending user');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User deleted successfully');
            closeDialog();
        },
        onError: () => {
            toast.error('Error deleting user');
        },
    });

    const creditsMutation = useMutation({
        mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
            adjustUserCredits(userId, amount, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Credits adjusted successfully');
            closeDialog();
        },
        onError: () => {
            toast.error('Error adjusting credits');
        },
    });

    const promoteMutation = useMutation({
        mutationFn: promoteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User promoted to Admin successfully');
            closeDialog();
        },
        onError: () => {
            toast.error('Error promoting user');
        },
    });

    const demoteMutation = useMutation({
        mutationFn: demoteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User demoted from Admin successfully');
            closeDialog();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error demoting user');
        },
    });

    const closeDialog = () => {
        setSelectedUser(null);
        setAction(null);
        setReason('');
        setCreditAmount('');
        setIsSettingsDialogOpen(false); // Close settings dialog as well
        setUserToEditAdminSettings(null); // Clear selected user for settings
    };

    const handleAction = () => {
        if (!selectedUser) return;

        if (action === 'suspend') {
            suspendMutation.mutate({ userId: selectedUser, reason });
        } else if (action === 'delete') {
            deleteMutation.mutate(selectedUser);
        } else if (action === 'credits') {
            const amount = parseInt(creditAmount);
            if (!isNaN(amount)) {
                creditsMutation.mutate({ userId: selectedUser, amount, reason });
            }
        } else if (action === 'promote') {
            promoteMutation.mutate(selectedUser);
        } else if (action === 'demote') {
            demoteMutation.mutate(selectedUser);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage user accounts and access</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <div className="mt-4">
                        <Input
                            placeholder="Search by email or user ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-md"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Credits</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-mono text-sm">{user.id}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                                {user.is_active ? 'Active' : 'Suspended'}
                                            </Badge>
                                            {user.is_admin && (
                                                <Badge variant="secondary" className="ml-2">
                                                    {user.is_super_admin ? 'Super Admin' : 'Admin'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{user.message_credits}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2"> {/* Changed to flex-wrap */}
                                                {user.is_active ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedUser(user.id);
                                                            setAction('suspend');
                                                        }}
                                                    >
                                                        Suspend
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => unsuspendUser(user.id).then(() => queryClient.invalidateQueries({ queryKey: ['admin-users'] }))}
                                                    >
                                                        Unsuspend
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedUser(user.id);
                                                        setAction('credits');
                                                    }}
                                                >
                                                    Credits
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setSelectedUser(user.id);
                                                        setAction('delete');
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                                {!user.is_admin && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedUser(user.id);
                                                            setAction('promote');
                                                        }}
                                                    >
                                                        Make Admin
                                                    </Button>
                                                )}
                                                {user.is_admin && !user.is_super_admin && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedUser(user.id);
                                                            setAction('demote');
                                                        }}
                                                    >
                                                        Remove Admin
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setUserToEditAdminSettings(user);
                                                        setIsSettingsDialogOpen(true);
                                                    }}
                                                >
                                                    Admin Settings
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Admin Settings Dialog */}
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Admin Settings for {userToEditAdminSettings?.email}</DialogTitle>
                        <DialogDescription>
                            Manage whitelisted phone numbers and allowed admin endpoints for this user.
                        </DialogDescription>
                    </DialogHeader>
                    {userToEditAdminSettings && (
                        <AdminUserSettingsForm
                            userId={userToEditAdminSettings.id}
                            initialWhitelistedPhoneNumbers={userToEditAdminSettings.whitelisted_phone_numbers}
                            initialAllowedAdminEndpoints={userToEditAdminSettings.allowed_admin_endpoints}
                            initialIsAdmin={userToEditAdminSettings.is_admin}
                            initialIsSuperAdmin={userToEditAdminSettings.is_super_admin}
                            onClose={closeDialog}
                        />
                    )}
                </DialogContent>
            </Dialog>


            {/* Action Dialogs */}
            <Dialog open={action === 'suspend'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend User</DialogTitle>
                        <DialogDescription>
                            Provide a reason for suspending this user account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Reason</Label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for suspension..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                        <Button onClick={handleAction} disabled={!reason}>Suspend User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={action === 'delete'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                        <Button variant="destructive" onClick={handleAction}>Delete User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={action === 'credits'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Credits</DialogTitle>
                        <DialogDescription>
                            Add or remove credits from this user account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Amount (use negative to remove)</Label>
                            <Input
                                type="number"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                placeholder="e.g., 1000 or -500"
                            />
                        </div>
                        <div>
                            <Label>Reason</Label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for adjustment..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                        <Button onClick={handleAction} disabled={!creditAmount || !reason}>Adjust Credits</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={action === 'promote'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Promote to Admin</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to promote this user to Admin? They will have full access to the admin dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                        <Button onClick={handleAction}>Promote User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={action === 'demote'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Admin Access</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove admin access from this user?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                        <Button variant="destructive" onClick={handleAction}>Remove Admin</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
