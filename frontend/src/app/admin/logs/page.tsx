'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminLogs } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function LogsPage() {
    const [actionFilter, setActionFilter] = useState<string | undefined>();

    const { data: logs, isLoading } = useQuery({
        queryKey: ['admin-logs', actionFilter],
        queryFn: () => fetchAdminLogs({ action_type: actionFilter, limit: 100 }),
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
                <p className="text-gray-500 mt-1">Admin action audit trail</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Admin Actions</CardTitle>
                        <Select value={actionFilter || 'all'} onValueChange={(value) => setActionFilter(value === 'all' ? undefined : value)}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="suspend_user">Suspend User</SelectItem>
                                <SelectItem value="unsuspend_user">Unsuspend User</SelectItem>
                                <SelectItem value="delete_user">Delete User</SelectItem>
                                <SelectItem value="adjust_credits">Adjust Credits</SelectItem>
                                <SelectItem value="update_pricing_plan">Update Pricing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs?.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{log.admin_id}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{log.action_type}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{log.target_resource}</TableCell>
                                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                            {JSON.stringify(log.details)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
