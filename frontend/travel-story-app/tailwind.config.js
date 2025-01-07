/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      display: ["Poppins", "sans-serif"],
    },

    extend: {
      // Colors used in the projects
      colors: {
        primary: "#05B6D3",
        secondary: "#EF863E",
      },
      backgroundImage: {
        "login-bg-img": "url('/assets/images/bg-login.jpg')", // For public folder
        "signup-bg-img": "url('/assets/images/bg-signup.jpg')", // For public folder
      },
    },
  },
  plugins: [],
};
