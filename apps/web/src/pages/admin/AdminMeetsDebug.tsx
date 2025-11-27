import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Button } from '@fanmeet/ui';
import { supabase } from '../../lib/supabaseClient';
import { formatDateTime, formatCurrency } from '@fanmeet/utils';

export function AdminMeetsDebug() {
    const [meets, setMeets] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);

        // Fetch all meets
        const { data: meetsData, error: meetsError } = await supabase
            .from('meets')
            .select('*')
            .order('created_at', { ascending: false });

        if (meetsError) {
            console.error('Error fetching meets:', meetsError);
        } else {
            setMeets(meetsData || []);

            // Fetch all profiles
            const creatorIds = [...new Set(meetsData?.map(m => m.creator_id) || [])];
            const fanIds = [...new Set(meetsData?.map(m => m.fan_id) || [])];
            const allUserIds = [...new Set([...creatorIds, ...fanIds])];

            if (allUserIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('user_id', allUserIds);

                const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
                setProfiles(profileMap);
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateMeetingLink = async (meetId: string) => {
        const { error } = await supabase
            .from('meets')
            .update({ meeting_link: 'https://meet.google.com/abc-defg-hij' })
            .eq('id', meetId);

        if (error) {
            console.error('Error updating meeting link:', error);
            alert('Failed to update meeting link');
        } else {
            alert('Meeting link updated successfully!');
            fetchData();
        }
    };

    const updateMeetStatus = async (meetId: string, status: string) => {
        const { error } = await supabase
            .from('meets')
            .update({ status })
            .eq('id', meetId);

        if (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } else {
            alert('Status updated successfully!');
            fetchData();
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="flex flex-col gap-8 p-8">
            <div>
                <h1 className="text-2xl font-semibold text-[#212529]">Admin: Meets Debug</h1>
                <p className="text-sm text-[#6C757D]">View and manage all meetings in the database</p>
            </div>

            <Card>
                <CardHeader title={`All Meets (${meets.length})`} />
                <CardContent className="gap-4">
                    {meets.length === 0 ? (
                        <p className="text-sm text-[#6C757D]">No meets found in database</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-[#E9ECEF]">
                                    <tr className="text-left">
                                        <th className="pb-2">ID</th>
                                        <th className="pb-2">Creator</th>
                                        <th className="pb-2">Fan</th>
                                        <th className="pb-2">Scheduled</th>
                                        <th className="pb-2">Duration</th>
                                        <th className="pb-2">Status</th>
                                        <th className="pb-2">Meeting Link</th>
                                        <th className="pb-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meets.map((meet) => {
                                        const creator = profiles.get(meet.creator_id);
                                        const fan = profiles.get(meet.fan_id);

                                        return (
                                            <tr key={meet.id} className="border-b border-[#E9ECEF]">
                                                <td className="py-3 text-xs">{meet.id.substring(0, 8)}...</td>
                                                <td className="py-3">
                                                    <div className="text-xs">
                                                        <div>{creator?.display_name || 'Unknown'}</div>
                                                        <div className="text-[#6C757D]">@{creator?.username || 'unknown'}</div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="text-xs">
                                                        <div>{fan?.display_name || 'Unknown'}</div>
                                                        <div className="text-[#6C757D]">@{fan?.username || 'unknown'}</div>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-xs">{formatDateTime(meet.scheduled_at)}</td>
                                                <td className="py-3 text-xs">{meet.duration_minutes} min</td>
                                                <td className="py-3">
                                                    <select
                                                        value={meet.status}
                                                        onChange={(e) => updateMeetStatus(meet.id, e.target.value)}
                                                        className="text-xs rounded border border-[#E9ECEF] px-2 py-1"
                                                    >
                                                        <option value="scheduled">scheduled</option>
                                                        <option value="completed">completed</option>
                                                        <option value="cancelled">cancelled</option>
                                                        <option value="no_show">no_show</option>
                                                    </select>
                                                </td>
                                                <td className="py-3">
                                                    <div className="text-xs break-all max-w-xs">
                                                        {meet.meeting_link || <span className="text-red-500">No link</span>}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {!meet.meeting_link && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => updateMeetingLink(meet.id)}
                                                        >
                                                            Add Link
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button onClick={fetchData}>Refresh Data</Button>
        </div>
    );
}
