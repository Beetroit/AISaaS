"use client";

import { useState } from 'react';
import { useSessionsReport, useSessionMessages } from '../../../../hooks/useReports';
import { format } from 'date-fns';

export default function SessionsReportPage() {
    const [page, setPage] = useState(0);
    const limit = 20;
    const { data, isLoading, isError, error } = useSessionsReport(page * limit, limit);
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

    const toggleExpand = (sessionId: string) => {
        if (expandedSessionId === sessionId) {
            setExpandedSessionId(null);
        } else {
            setExpandedSessionId(sessionId);
        }
    };

    const handleNextPage = () => {
        if (data && (page + 1) * limit < data.total) {
            setPage(page + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 0) {
            setPage(page - 1);
        }
    };

    if (isLoading) {
        return <div className="p-4">Loading sessions...</div>;
    }

    if (isError) {
        return <div className="p-4 text-red-500">Error loading sessions: {error?.message}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-6">Chat Sessions</h1>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-gray-700 text-left text-gray-600 dark:text-gray-300 uppercase text-sm">
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">Agent</th>
                            <th className="py-3 px-4">Workflow</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Step</th>
                            <th className="py-3 px-4">Messages</th>
                            <th className="py-3 px-4">Last Active</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.sessions.map((session) => (
                            <>
                                <tr key={session.chat_session_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <td className="py-3 px-4 font-medium">{session.external_id || 'Unknown'}</td>
                                    <td className="py-3 px-4">{session.agent_name}</td>
                                    <td className="py-3 px-4">
                                        <div>{session.workflow_name || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{session.workflow_status}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">{session.current_step || '-'}</td>
                                    <td className="py-3 px-4">{session.message_count}</td>
                                    <td className="py-3 px-4 text-sm">
                                        {session.last_message_at ? format(new Date(session.last_message_at), 'MMM d, HH:mm') : '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => toggleExpand(session.chat_session_id)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            {expandedSessionId === session.chat_session_id ? 'Hide' : 'View'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedSessionId === session.chat_session_id && (
                                    <tr>
                                        <td colSpan={8} className="bg-gray-50 dark:bg-gray-900 p-4">
                                            <SessionMessages sessionId={session.chat_session_id} />
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                        {data?.sessions.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-8 text-center text-gray-500">No sessions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, data?.total || 0)} of {data?.total} sessions
                </div>
                <div className="space-x-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={page === 0}
                        className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={!data || (page + 1) * limit >= data.total}
                        className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

function SessionMessages({ sessionId }: { sessionId: string }) {
    const { data: messages, isLoading, isError } = useSessionMessages(sessionId);

    if (isLoading) return <div className="text-center py-4">Loading messages...</div>;
    if (isError) return <div className="text-red-500 py-4">Error loading messages.</div>;
    if (!messages || messages.length === 0) return <div className="text-center py-4">No messages in this session.</div>;

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            <h3 className="font-bold text-lg mb-4">Conversation History</h3>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                        <div className="text-xs opacity-75 mb-1 flex justify-between gap-4">
                            <span className="capitalize font-bold">{msg.role}</span>
                            <span>{format(new Date(msg.created_at), 'HH:mm:ss')}</span>
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
