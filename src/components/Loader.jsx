import React from 'react';

export default function Loader({ message = "Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="relative flex h-14 w-14 items-center justify-center">
        {/* Outer ring */}
        <div className="absolute h-full w-full rounded-full border-4 border-govblue-100 opacity-60"></div>
        {/* Spinning ring */}
        <div className="absolute h-full w-full rounded-full border-4 border-transparent border-t-govblue-600 animate-spin"></div>
        {/* Inner static emblem */}
        <div className="h-5 w-5 text-govblue-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-full w-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.43c1.002-.5 2.096-.135 2.76.71l1.833 2.33M21 21.001c0 .414-.336.75-.75.75H3.75a.75.75 0 01-.75-.75V3.75a.75.75 0 01.75-.75h16.5a.75.75 0 01.75.75v17.25z" />
          </svg>
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold tracking-wider text-slate-500 uppercase font-['Outfit'] animate-pulse">
        {message}
      </p>
    </div>
  );
}
