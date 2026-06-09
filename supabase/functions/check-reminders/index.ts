// Supabase Edge Function: check-reminders
// Creates reminder notifications for unfinished tasks and upcoming exams.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReminderPreferences = {
    timezone: string;
    task_reminder_hours: number[];
    exam_reminder_hours: number[];
};

type NotificationCandidate = {
    user_id: string;
    type: "task_reminder" | "exam_reminder";
    title: string;
    body: string;
    url: string;
    icon: string;
    scheduled_for: string;
    dedupe_key: string;
    metadata: Record<string, unknown>;
};

const DEFAULT_PREFERENCES: ReminderPreferences = {
    timezone: "Asia/Jakarta",
    task_reminder_hours: [24],
    exam_reminder_hours: [168, 72, 24],
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
};

function normalizeHourList(value: unknown, fallback: number[]) {
    if (!Array.isArray(value)) return fallback;

    const hours = value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item > 0)
        .map((item) => Math.round(item));

    return hours.length > 0 ? Array.from(new Set(hours)).sort((a, b) => b - a) : fallback;
}

function normalizePreferences(preferences?: Partial<ReminderPreferences> | null): ReminderPreferences {
    return {
        timezone: preferences?.timezone || DEFAULT_PREFERENCES.timezone,
        task_reminder_hours: normalizeHourList(
            preferences?.task_reminder_hours,
            DEFAULT_PREFERENCES.task_reminder_hours
        ),
        exam_reminder_hours: normalizeHourList(
            preferences?.exam_reminder_hours,
            DEFAULT_PREFERENCES.exam_reminder_hours
        ),
    };
}

function parseTimestamp(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    if (value instanceof Date) {
        const parsed = value.getTime();
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function isReminderWindow(targetTimestamp: number, nowTimestamp: number, lookbackMs: number) {
    return targetTimestamp <= nowTimestamp && targetTimestamp > nowTimestamp - lookbackMs;
}

function formatDateTime(timestamp: number, timezone: string) {
    return new Intl.DateTimeFormat("id-ID", {
        timeZone: timezone,
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(timestamp));
}

function buildTaskCandidates(
    row: { user_id: string; data: unknown },
    preferences: ReminderPreferences,
    nowTimestamp: number,
    lookbackMs: number
) {
    if (!Array.isArray(row.data)) return [];

    const candidates: NotificationCandidate[] = [];

    for (const task of row.data as Record<string, unknown>[]) {
        if (task?.isCompleted) continue;

        const taskId = String(task?.id || "");
        const dueTimestamp = parseTimestamp(task?.dueDateTimestamp);
        if (!taskId || !dueTimestamp || dueTimestamp <= nowTimestamp) continue;

        for (const hoursBefore of preferences.task_reminder_hours) {
            const scheduledTimestamp = dueTimestamp - (hoursBefore * 60 * 60 * 1000);
            if (!isReminderWindow(scheduledTimestamp, nowTimestamp, lookbackMs)) continue;

            const title = "Deadline Tugas";
            const course = String(task?.course || "Mata kuliah");
            const taskTitle = String(task?.title || "Tugas");
            const formattedDue = formatDateTime(dueTimestamp, preferences.timezone);

            candidates.push({
                user_id: row.user_id,
                type: "task_reminder",
                title,
                body: `${taskTitle} (${course}) deadline ${formattedDue}`,
                url: "/assignments",
                icon: "assignment_late",
                scheduled_for: new Date(scheduledTimestamp).toISOString(),
                dedupe_key: `task:${taskId}:before_${hoursBefore}h`,
                metadata: {
                    taskId,
                    taskTitle,
                    course,
                    dueTimestamp,
                    hoursBefore,
                    timezone: preferences.timezone,
                },
            });
        }
    }

    return candidates;
}

function buildExamCandidates(
    row: { user_id: string; data: unknown },
    preferences: ReminderPreferences,
    nowTimestamp: number,
    lookbackMs: number
) {
    if (!Array.isArray(row.data)) return [];

    const candidates: NotificationCandidate[] = [];

    for (const exam of row.data as Record<string, unknown>[]) {
        const examId = String(exam?.id || "");
        const examTimestamp = parseTimestamp(exam?.targetDate);
        if (!examId || !examTimestamp || examTimestamp <= nowTimestamp) continue;

        for (const hoursBefore of preferences.exam_reminder_hours) {
            const scheduledTimestamp = examTimestamp - (hoursBefore * 60 * 60 * 1000);
            if (!isReminderWindow(scheduledTimestamp, nowTimestamp, lookbackMs)) continue;

            const examName = String(exam?.name || "Ujian");
            const examType = String(exam?.type || "Ujian");
            const formattedExam = formatDateTime(examTimestamp, preferences.timezone);

            candidates.push({
                user_id: row.user_id,
                type: "exam_reminder",
                title: "Pengingat Ujian",
                body: `${examType} ${examName} pada ${formattedExam}`,
                url: "/exams",
                icon: "event_note",
                scheduled_for: new Date(scheduledTimestamp).toISOString(),
                dedupe_key: `exam:${examId}:before_${hoursBefore}h`,
                metadata: {
                    examId,
                    examName,
                    examType,
                    examTimestamp,
                    hoursBefore,
                    timezone: preferences.timezone,
                },
            });
        }
    }

    return candidates;
}

async function createNotification(supabase: ReturnType<typeof createClient>, candidate: NotificationCandidate) {
    const { data, error } = await supabase
        .from("notifications")
        .insert(candidate)
        .select("id,user_id,title,body,url,icon,dedupe_key")
        .single();

    if (error?.code === "23505") return null;
    if (error) throw new Error(`Failed to create notification: ${error.message}`);

    return data;
}

async function sendNotification(
    supabase: ReturnType<typeof createClient>,
    supabaseUrl: string,
    internalSecret: string | undefined,
    notification: {
        id: string;
        user_id: string;
        title: string;
        body: string;
        url: string;
        icon: string;
        dedupe_key: string;
    }
) {
    if (!internalSecret) {
        await supabase.from("notification_delivery_logs").insert({
            notification_id: notification.id,
            user_id: notification.user_id,
            status: "skipped_no_internal_secret",
            error: "PUSH_INTERNAL_SECRET is not configured",
        });
        return { sent: 0, skipped: true };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-push-secret": internalSecret,
        },
        body: JSON.stringify({
            userId: notification.user_id,
            title: notification.title,
            body: notification.body,
            url: notification.url,
            iconName: notification.icon,
            notificationId: notification.id,
            dedupeKey: notification.dedupe_key,
        }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        await supabase.from("notification_delivery_logs").insert({
            notification_id: notification.id,
            user_id: notification.user_id,
            status: "send_function_error",
            error: result?.error || response.statusText,
        });
        return { sent: 0, error: result?.error || response.statusText };
    }

    return { sent: Number(result?.sent) || 0, result };
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (!["GET", "POST"].includes(req.method)) {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const internalSecret = Deno.env.get("PUSH_INTERNAL_SECRET");

        if (!supabaseUrl || !supabaseServiceKey) {
            return new Response(
                JSON.stringify({ error: "Supabase function environment is not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (internalSecret && req.headers.get("x-push-secret") !== internalSecret) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const nowTimestamp = Date.now();
        const lookbackMinutes = Number(Deno.env.get("REMINDER_LOOKBACK_MINUTES")) || 20;
        const lookbackMs = Math.max(1, lookbackMinutes) * 60 * 1000;

        const [taskResult, examResult, preferencesResult] = await Promise.all([
            supabase.from("tasks").select("user_id,data"),
            supabase.from("exams").select("user_id,data"),
            supabase.from("notification_preferences").select("*"),
        ]);

        if (taskResult.error) throw new Error(`Failed to load tasks: ${taskResult.error.message}`);
        if (examResult.error) throw new Error(`Failed to load exams: ${examResult.error.message}`);
        if (preferencesResult.error) {
            throw new Error(`Failed to load preferences: ${preferencesResult.error.message}`);
        }

        const preferencesByUser = new Map(
            (preferencesResult.data || []).map((preferences) => [
                preferences.user_id,
                normalizePreferences(preferences),
            ])
        );

        const candidates = [
            ...(taskResult.data || []).flatMap((row) => buildTaskCandidates(
                row,
                preferencesByUser.get(row.user_id) || DEFAULT_PREFERENCES,
                nowTimestamp,
                lookbackMs
            )),
            ...(examResult.data || []).flatMap((row) => buildExamCandidates(
                row,
                preferencesByUser.get(row.user_id) || DEFAULT_PREFERENCES,
                nowTimestamp,
                lookbackMs
            )),
        ];

        let created = 0;
        let duplicate = 0;
        let pushed = 0;

        for (const candidate of candidates) {
            const notification = await createNotification(supabase, candidate);
            if (!notification) {
                duplicate += 1;
                continue;
            }

            created += 1;
            const result = await sendNotification(supabase, supabaseUrl, internalSecret, notification);
            pushed += result.sent;
        }

        return new Response(
            JSON.stringify({
                checkedAt: new Date(nowTimestamp).toISOString(),
                candidates: candidates.length,
                created,
                duplicate,
                pushed,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
