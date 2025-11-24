/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vscode-dark': '#1e1e1e',
        'vscode-sidebar': '#252526',
        'vscode-active': '#37373d',
        'astra-blue': '#007acc',
      }
    },
  },
  plugins: [],
}
