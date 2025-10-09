"use client";

import React from 'react';
import { Timeline } from 'primereact/timeline';

interface TimelineEvent {
    status: string;
    date: string;
    details: string;
}

interface ItemHistoryTimelineProps {
    events: TimelineEvent[];
}

export default function ItemHistoryTimeline({ events }: ItemHistoryTimelineProps) {
    return (
        <div className="card">
            <Timeline
                value={events}
                opposite={(item) => item.status}
                content={(item) => 
                    <small className="text-color-secondary">
                        {item.date}<p>{item.details}</p>
                    </small>
                }
            />
        </div>
    );
}