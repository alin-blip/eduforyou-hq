import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Cadence = "daily" | "weekly" | "monthly" | "quarterly";
export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type ItemKind = "agenda" | "decision" | "action" | "blocker" | "note";
export type ItemStatus = "open" | "in_progress" | "done" | "cancelled";
export type ParticipantStatus = "invited" | "confirmed" | "attended" | "missed";

export type Meeting = {
  id: string;
  entity_id: string | null;
  department_id: string | null;
  title: string;
  cadence: Cadence;
  status: MeetingStatus;
  scheduled_at: string;
  duration_minutes: number;
  facilitator_id: string | null;
  agenda: string | null;
  notes: string | null;
  decisions: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingItem = {
  id: string;
  meeting_id: string;
  kind: ItemKind;
  title: string;
  description: string | null;
  status: ItemStatus;
  owner_id: string | null;
  due_date: string | null;
  position: number;
  objective_id: string | null;
  key_result_id: string | null;
  task_id: string | null;
  completed_at: string | null;
};

export type MeetingParticipant = {
  id: string;
  meeting_id: string;
  user_id: string;
  status: ParticipantStatus;
  notes: string | null;
};

export function useCicles() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .order("scheduled_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setMeetings((data as Meeting[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createMeeting = async (payload: Partial<Meeting>) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("meetings").insert({
      title: payload.title ?? "Meeting nou",
      cadence: payload.cadence ?? "weekly",
      scheduled_at: payload.scheduled_at ?? new Date().toISOString(),
      duration_minutes: payload.duration_minutes ?? 60,
      agenda: payload.agenda ?? null,
      department_id: payload.department_id ?? null,
      facilitator_id: payload.facilitator_id ?? u.user?.id ?? null,
      created_by: u.user?.id ?? null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Meeting creat");
    await refresh();
  };

  const updateMeeting = async (id: string, payload: Partial<Meeting>) => {
    const { error } = await supabase.from("meetings").update(payload as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Actualizat");
    await refresh();
  };

  const deleteMeeting = async (id: string) => {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Șters");
    await refresh();
  };

  return { meetings, loading, refresh, createMeeting, updateMeeting, deleteMeeting };
}

export function useMeetingDetail(meetingId: string | null) {
  const [items, setItems] = useState<MeetingItem[]>([]);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!meetingId) {
      setItems([]);
      setParticipants([]);
      return;
    }
    setLoading(true);
    const [it, pa] = await Promise.all([
      supabase.from("meeting_items").select("*").eq("meeting_id", meetingId).order("position", { ascending: true }),
      supabase.from("meeting_participants").select("*").eq("meeting_id", meetingId),
    ]);
    if (it.data) setItems(it.data as MeetingItem[]);
    if (pa.data) setParticipants(pa.data as MeetingParticipant[]);
    setLoading(false);
  }, [meetingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (payload: Partial<MeetingItem>) => {
    if (!meetingId) return;
    const { error } = await supabase.from("meeting_items").insert({
      meeting_id: meetingId,
      title: payload.title ?? "Item nou",
      kind: payload.kind ?? "agenda",
      description: payload.description ?? null,
      owner_id: payload.owner_id ?? null,
      due_date: payload.due_date ?? null,
      objective_id: payload.objective_id ?? null,
      key_result_id: payload.key_result_id ?? null,
      position: items.length,
    } as any);
    if (error) return toast.error(error.message);
    await refresh();
  };

  const updateItem = async (id: string, payload: Partial<MeetingItem>) => {
    const { error } = await supabase.from("meeting_items").update(payload as any).eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("meeting_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
  };

  const addParticipant = async (user_id: string) => {
    if (!meetingId) return;
    const { error } = await supabase.from("meeting_participants").insert({ meeting_id: meetingId, user_id } as any);
    if (error) return toast.error(error.message);
    await refresh();
  };

  const removeParticipant = async (id: string) => {
    const { error } = await supabase.from("meeting_participants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
  };

  const updateParticipantStatus = async (id: string, status: ParticipantStatus) => {
    const { error } = await supabase.from("meeting_participants").update({ status } as any).eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
  };

  return { items, participants, loading, refresh, addItem, updateItem, deleteItem, addParticipant, removeParticipant, updateParticipantStatus };
}
