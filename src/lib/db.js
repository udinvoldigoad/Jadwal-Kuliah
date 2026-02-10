import { supabase } from './supabase';

/**
 * Helper to get current user ID from session.
 */
async function getUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
}

// ========================
// SCHEDULE
// ========================

export async function loadSchedule() {
    const userId = await getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('schedules')
        .select('data')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine for new users
        console.error('Error loading schedule:', error.message);
    }

    return data?.data ?? null;
}

export async function saveSchedule(scheduleData) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase
        .from('schedules')
        .upsert(
            { user_id: userId, data: scheduleData, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error('Error saving schedule:', error.message);
    }
}

// ========================
// TASKS (Assignments)
// ========================

export async function loadTasks() {
    const userId = await getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('tasks')
        .select('data')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error loading tasks:', error.message);
    }

    return data?.data ?? null;
}

export async function saveTasks(tasksData) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase
        .from('tasks')
        .upsert(
            { user_id: userId, data: tasksData, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error('Error saving tasks:', error.message);
    }
}

// ========================
// EXAMS
// ========================

export async function loadExams() {
    const userId = await getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('exams')
        .select('data')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error loading exams:', error.message);
    }

    return data?.data ?? null;
}

export async function saveExams(examsData) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase
        .from('exams')
        .upsert(
            { user_id: userId, data: examsData, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error('Error saving exams:', error.message);
    }
}

// ========================
// RESET ALL DATA
// ========================

export async function resetAllData() {
    const userId = await getUserId();
    if (!userId) return;

    const [scheduleResult, tasksResult, examsResult] = await Promise.all([
        supabase.from('schedules').delete().eq('user_id', userId),
        supabase.from('tasks').delete().eq('user_id', userId),
        supabase.from('exams').delete().eq('user_id', userId),
    ]);

    if (scheduleResult.error) console.error('Error deleting schedule:', scheduleResult.error.message);
    if (tasksResult.error) console.error('Error deleting tasks:', tasksResult.error.message);
    if (examsResult.error) console.error('Error deleting exams:', examsResult.error.message);
}
