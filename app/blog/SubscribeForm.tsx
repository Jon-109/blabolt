"use client";
import React from "react";

export default function SubscribeForm() {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center w-full max-w-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay in the loop</h3>
      <p className="text-gray-600 mb-4 text-center">Get tips, tools, and exclusive guides straight to your inbox.</p>
      <form className="flex w-full gap-2" onSubmit={e => e.preventDefault()}>
        <input
          type="email"
          placeholder="Your email address"
          className="flex-1 px-4 py-2 rounded-l-md border border-gray-300 focus:ring-2 focus:ring-blue-300 outline-none"
          disabled
        />
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-r-md hover:bg-blue-700 transition disabled:opacity-60"
          disabled
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
