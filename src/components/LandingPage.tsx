import Image from "next/image";

export default function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 pt-2 pb-1">
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
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Air Quality <span className="text-blue-400">Monitoring</span>
            </h2>
            <p className="text-gray-300 text-lg mb-4 leading-relaxed">
              Sistem monitoring kualitas udara real-time untuk bengkel Anda. Pantau suhu, CO, dan partikel debu dengan presisi tinggi.
            </p>
            <p className="text-gray-400 text-base mb-8">
              Teknologi IoT terdepan memastikan kesehatan dan keselamatan kerja di lingkungan bengkel Anda tetap optimal.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mt-1">✓</div>
                <div>
                  <h3 className="text-white font-semibold">Real-time Monitoring</h3>
                  <p className="text-gray-400 text-sm">Data sensor diperbarui setiap detik</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mt-1">✓</div>
                <div>
                  <h3 className="text-white font-semibold">Smart Fan Control</h3>
                  <p className="text-gray-400 text-sm">Mode otomatis dan manual untuk kipas ventilasi</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mt-1">✓</div>
                <div>
                  <h3 className="text-white font-semibold">Data Analytics</h3>
                  <p className="text-gray-400 text-sm">Grafik tren untuk analisis pola kualitas udara</p>
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
            <div className="bg-linear-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-12 border border-blue-500/30 backdrop-blur">
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-2">💨</div>
                  <h3 className="text-white font-semibold mb-2">Kipas Otomatis</h3>
                  <p className="text-gray-400 text-sm">Kontrol ventilasi berbasis kondisi real-time</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="text-white font-semibold mb-2">Analitik Lanjutan</h3>
                  <p className="text-gray-400 text-sm">Visualisasi data dengan grafik interaktif</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-2">🔐</div>
                  <h3 className="text-white font-semibold mb-2">Aman & Terpercaya</h3>
                  <p className="text-gray-400 text-sm">Data terenkripsi dengan keamanan tingkat enterprise</p>
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
