/**
 * Tailwind configuration for NEWME Health.
 * Utilities are compiled ahead of time into assets/css/tailwind.css
 * (see `npm run build:css`), so no runtime script is shipped to visitors.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./*.html', './*.js', '!./tailwind.config.js'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F5F3',
        ink: '#0B0D0C',
        lime: '#C7F33A',
        mist: '#ECECE9',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
