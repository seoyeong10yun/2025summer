// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // 반드시 src 내부 설정
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};
