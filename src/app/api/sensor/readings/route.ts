import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { co2, particulate } = await request.json();

    // Ambil setting threshold
    const settingsRes = await pool.query(
      'SELECT * FROM fan_settings WHERE id = 1'
    );
    const setting = settingsRes.rows[0];

    let air_quality_status = 'AMAN';
    let fan_status = false;

    const threshold_co2_warning = setting?.fan_on_threshold_co2 || 150;
    const threshold_particulate_warning = setting?.fan_on_threshold_particulate || 50;
    const threshold_co2_danger = setting?.danger_threshold_co2 || 250;
    const threshold_particulate_danger = setting?.danger_threshold_particulate || 75;

    if (co2 > threshold_co2_danger || particulate > threshold_particulate_danger) {
      air_quality_status = 'BERBAHAYA';
    } else if (
      co2 > threshold_co2_warning ||
      particulate > threshold_particulate_warning
    ) {
      air_quality_status = 'WARNING';
    }

    if (setting?.is_auto_mode && air_quality_status !== 'AMAN') {
      fan_status = true;
    }

    const result = await pool.query(
      `
      INSERT INTO sensor_readings 
      (co2, particulate, air_quality_status, fan_status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [co2, particulate, air_quality_status, fan_status]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        command: {
          fan_status: fan_status ? 1 : 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sensor data error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan data sensor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 100'
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal ambil data' },
      { status: 500 }
    );
  }
}
