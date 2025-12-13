import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to parse routine text
function parseRoutineText(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const schedule = {};
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let currentDay = null;
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    // Check if line contains a day
    const dayFound = days.find(day => lowerLine.includes(day));
    if (dayFound) {
      currentDay = dayFound;
      schedule[currentDay] = [];
      return;
    }
    
    // If we have a current day, add this as a class
    if (currentDay && line.trim()) {
      // Try to extract time and class info
      // Extract time from "(time: 10:30-01:00)" format
      const timeMatch = line.match(/\(time:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*\)/i);
      schedule[currentDay].push({
        raw: line.trim(),
        time: timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : null,
        text: line.trim()
      });
    }
  });
  
  return schedule;
}

export async function POST(request) {
  try {
    const { userId, routineText } = await request.json();

    if (!userId || !routineText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse the routine text into structured data
    const parsedData = parseRoutineText(routineText);

    // Check if user already has a routine
    const { data: existingRoutine } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;

    if (existingRoutine) {
      // Update existing routine
      result = await supabase
        .from('routines')
        .update({
          routine_text: routineText,
          parsed_data: parsedData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Insert new routine
      result = await supabase
        .from('routines')
        .insert({
          user_id: userId,
          routine_text: routineText,
          parsed_data: parsedData,
        })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      success: true,
      routine: result.data,
    });
  } catch (error) {
    console.error('Error in save-routine API:', error);
    return NextResponse.json(
      { error: 'Failed to save routine' },
      { status: 500 }
    );
  }
}
