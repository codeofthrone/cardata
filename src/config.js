export const config = {
  auth: {
    skipLogin: false, // Set to true to skip login page
    defaultEmail: 'a062977sweet+1@gmail.com', // Default email for auto-login
    defaultPassword: '123456' // Default password for auto-login
  },
  dashboard: {
    showAll: false, // Set to true to show all dashboard pages
    defaultRole: 'C', // Default role to show (A: 入庫, B: 維修, C: 總覽)
    hideRoleSwitcher: true // Set to true to hide role switcher buttons
  }
};