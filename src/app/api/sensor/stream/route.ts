import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const stream = new ReadableStream({
      async start(controller) {
        // Kirim data awal
        const sendData = async () => {
          try {
            const result = await pool.query(
              'SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 1'
            );

            if (result.rows.length > 0) {
              const data = result.rows[0];
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(data)}\n\n`
                )
              );
            }
          } catch (error) {
            console.error('Error fetching sensor data:', error);
          }
        };

        // Kirim data setiap 1 detik
        const interval = setInterval(sendData, 1000);

        // Cleanup ketika client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });

        // Kirim data pertama kali
        await sendData();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    return NextResponse.json(
      { error: 'Gagal membuka stream' },
      { status: 500 }
    );
  }
}
