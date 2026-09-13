// supabaseClient.js
// Script clásico (no ES module): el SDK de Supabase se carga antes que este
// archivo vía CDN (ver index.html) y expone window.supabase.createClient.
// Usamos "supabaseClient" como nombre de variable para no pisar ese global.

const SUPABASE_URL = "https://ppmzgzarxvxnjibomwyr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbXpnemFyeHZ4bmppYm9td3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNTg1MDQsImV4cCI6MjEwNDgzNDUwNH0.YnzT895dBnVEnx-jCI3tKp2qMpT0qOYDLWijWOa1Aww";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
