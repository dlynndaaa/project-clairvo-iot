import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { temperature, co2, particulate } = await request.json(); // Data dari ESP32

    // 1. Ambil Settingan Threshold dari Database
    const settingsRes = await pool.query('SELECT * FROM fan_settings WHERE id = 1');
    const setting = settingsRes.rows[0];

    // 2. Logika Penentuan Status & Kipas
    let air_quality_status = "AMAN";
    let fan_status = false;

    // Default setting jika database kosong
    const threshold_co2_warning = setting?.fan_on_threshold_co2 || 150;
    const threshold_particulate_warning = setting?.fan_on_threshold_particulate || 50;
    const threshold_co2_danger = setting?.danger_threshold_co2 || 250;
    const threshold_particulate_danger = setting?.danger_threshold_particulate || 75;

    // Cek Bahaya/Warning
    if (co2 > threshold_co2_danger || particulate > threshold_particulate_danger) {
      air_quality_status = "BERBAHAYA";
    } else if (co2 > threshold_co2_warning || particulate > threshold_particulate_warning) {
      air_quality_status = "WARNING";
    }

    // Cek Mode Otomatis
    if (setting?.is_auto_mode) {
      if (air_quality_status !== "AMAN") {
        fan_status = true; // Nyalakan kipas
      }
    } else {
       // Jika manual, kita bisa mengambil status terakhir kipas dari DB atau default mati
       // Untuk sederhananya, di request POST ini kita biarkan false, 
       // atau terima input 'fan_status' dari ESP32 jika ESP32 mengirim status relaynya.
       fan_status = false; 
    }

    // 3. Simpan ke Database
    const result = await pool.query(
      'INSERT INTO sensor_readings (temperature, co2, particulate, air_quality_status, fan_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [temperature, co2, particulate, air_quality_status, fan_status]
    );

    // 4. Balas ke ESP32 (PENTING: fan_status dikirim balik agar ESP32 tahu harus ngapain)
    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        command: {
           fan_status: fan_status ? 1 : 0 // 1 = ON, 0 = OFF
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sensor data error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data sensor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ambil data terakhir untuk real-time
    const result = await pool.query(
      'SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 100'
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal ambil data' }, { status: 500 });
  }
}