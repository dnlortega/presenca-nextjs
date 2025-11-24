import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Helper to get the current date in Sao Paulo timezone (UTC-3)
// Returns a Date object representing 12:00 PM UTC on the current Sao Paulo day.
// This ensures that when saved to a @db.Date column, it remains the correct date.
function getSaoPauloDate() {
  const now = new Date();
  const offset = -3 * 60 * 60 * 1000; // -3 hours
  const localTime = new Date(now.getTime() + offset);

  // Create a date object for the local calendar day
  const year = localTime.getUTCFullYear();
  const month = localTime.getUTCMonth();
  const day = localTime.getUTCDate();

  // Return Noon UTC on that day to be safe against minor offsets
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

function getDayRange() {
  const refDate = getSaoPauloDate();

  // Start: 00:00 UTC on this day (which is effectively covering the date)
  // Since we are using @db.Date, we just need to match the date part.
  // However, Prisma/Postgres comparison with DateTime vs Date column can be tricky.
  // If the column is @db.Date, it stores YYYY-MM-DD.
  // Prisma usually sends a timestamp.
  // To be safe, we define the range in UTC that covers the entire day.

  const start = new Date(refDate);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end, refDate };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { funcionario, empresa, setor, status = 'present' } = body;
    if (!funcionario || !empresa || !setor) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { start, end, refDate } = getDayRange();

    const existing = await prisma.presenca.findFirst({
      where: {
        funcionario,
        empresa,
        setor,
        data_hora: {
          gte: start,
          lt: end,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ ok: false, error: 'Duplicate', existingId: existing.id }, { status: 409 });
    }

    // Use refDate (Noon UTC of the local day) to ensure it saves as the correct date
    const created = await prisma.presenca.create({
      data: {
        funcionario,
        empresa,
        setor,
        data_hora: refDate
      }
    });
    return NextResponse.json({ ok: true, data: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresa = searchParams.get('empresa');
    const setor = searchParams.get('setor');

    if (!empresa || !setor) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { start, end } = getDayRange();

    const records = await prisma.presenca.findMany({
      where: {
        empresa,
        setor,
        data_hora: {
          gte: start,
          lt: end,
        },
      },
      select: {
        funcionario: true,
      },
    });

    const present = records.map((r) => r.funcionario);
    return NextResponse.json({ present });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
