const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = url && key ? createClient(url, key) : null;

if (!supabase) {
  console.log("Supabase is not configured: running without a database.");
}

async function saveRoom(room, currentTime) {
  if (!supabase) return;
  const { error } = await supabase.from("rooms").upsert({
    id: room.id,
    video_id: room.videoId,
    play_state: room.playState,
    current_time_sec: currentTime,
    updated_at: new Date().toISOString(),
  });
  if (error) console.log("saveRoom error:", error.message);
}

// Saves who is the Host and the names of everyone who joined the room.
async function savePeople(room) {
  if (!supabase) return;

  const host = Object.values(room.users).find((u) => u.role === "Host");
  const row = { id: room.id, participants: room.joinedNames };
  if (host) row.host_name = host.username; // keep the last host if room is empty

  const { error } = await supabase.from("rooms").upsert(row);
  if (error) console.log("savePeople error:", error.message);
}

async function loadRoom(id) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.log("loadRoom error:", error.message);
    return null;
  }
  return data;
}

async function saveMessage(roomId, username, text) {
  if (!supabase) return;
  const { error } = await supabase
    .from("messages")
    .insert({ room_id: roomId, username, text });
  if (error) console.log("saveMessage error:", error.message);
}

async function loadMessages(roomId, limit = 50) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("id, username, text")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.log("loadMessages error:", error.message);
    return [];
  }
  return data.reverse(); // oldest first
}

module.exports = { saveRoom, savePeople, loadRoom, saveMessage, loadMessages };