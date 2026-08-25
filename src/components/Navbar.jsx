import React from 'react';

export default function Navbar({ activePage, setActivePage }) {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex h-16 items-center justify-between">

          {/* Logo Section */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActivePage('home')}
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-govblue-600 text-white shadow-md shadow-govblue-600/20">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
                  />
              </svg>

            </div>

            <div>

              <span className="text-xl font-bold tracking-tight text-govblue-900 font-['Outfit'] block sm:inline">
                AI Constituency
              </span>

              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium -mt-1">
                Government Portal
              </span>

            </div>

          </div>


          {/* Navigation Links */}
          <nav className="flex space-x-1" aria-label="Tabs">

            {/* Citizen Complaint */}
            <button
              onClick={() => setActivePage('home')}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activePage === 'home'
                  ? 'bg-govblue-50 text-govblue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
                  />
              </svg>

              Citizen Complaint

            </button>
            {/* Track Complaint */}
              <button
                onClick={() => setActivePage('tracking')}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activePage === 'tracking'
                    ? 'bg-govblue-50 text-govblue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
                    />
                </svg>

                Track Complaint
              </button>

            {/* MP Dashboard */}
            <button
              onClick={() => setActivePage('dashboard')}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activePage === 'dashboard'
                  ? 'bg-govblue-50 text-govblue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
                />
              </svg>

              MP Dashboard

            </button>


            {/* Complaint Management */}
            <button
              onClick={() => setActivePage('complaints')}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activePage === 'complaints'
                  ? 'bg-govblue-50 text-govblue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
                  />
              </svg>

              Complaint Management

            </button>

          </nav>

        </div>

      </div>

    </header>
  );
}