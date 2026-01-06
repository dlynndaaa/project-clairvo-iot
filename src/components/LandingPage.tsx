import Image from "next/image";

export default function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Image
              src="/clairvo-logo-white.png"
              alt="Clairvo Logo"
              width={50}
              height={50}
              className="h-10 w-auto object-contain"
            />
            Clairvo IoT
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Monitor Kualitas <span className="text-blue-400">Udara Bengkel</span>
            </h2>
            <p className="text-gray-300 text-lg mb-4 leading-relaxed">
              Pantau CO dan debu di bengkel Anda secara real-time. Sistem otomatis mengendalikan ventilasi saat kondisi memburuk.
            </p>
            <p className="text-gray-400 text-base mb-8">
              Jaga lingkungan kerja tetap sehat dan aman dengan teknologi sensor IoT. Dilengkapi kontrol kipas manual dan otomatis.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mt-1">✓</div>
                <div>
                  <h3 className="text-white font-semibold">Update Real-time</h3>
                  <p className="text-gray-400 text-sm">Data sensor tercatat setiap saat</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mt-1">✓</div>
                <div>
                  <h3 className="text-white font-semibold">Kipas Otomatis</h3>
                  <p className="text-gray-400 text-sm">Menyala otomatis saat udara tidak sehat</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mt-1">✓</div>
                <div>
                  <h3 className="text-white font-semibold">Laporan & Grafik</h3>
                  <p className="text-gray-400 text-sm">Lihat pola dan riwayat kualitas udara</p>
                </div>
              </div>
            </div>

            <button
              onClick={onLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
            >
              Mulai Sekarang
            </button>
          </div>

          {/* Right Side - Image/Visual */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-12 border border-blue-500/30 backdrop-blur">
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-2">💨</div>
                  <h3 className="text-white font-semibold mb-2">Ventilasi Pintar</h3>
                  <p className="text-gray-400 text-sm">Kipas aktif saat CO atau debu tinggi</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="text-white font-semibold mb-2">Dashboard Jelas</h3>
                  <p className="text-gray-400 text-sm">Lihat status kesehatan udara dengan cepat</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-2">🔒</div>
                  <h3 className="text-white font-semibold mb-2">Login Aman</h3>
                  <p className="text-gray-400 text-sm">Hanya admin bengkel yang bisa mengakses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-20 py-6 bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>&copy; 2025 Clairvo Team. Air Quality Monitoring System.</p>
        </div>
      </footer>
    </div>
  );
}
