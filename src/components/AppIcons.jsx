import { Helmet } from 'react-helmet';

export default function AppIcons() {
  return (
    <Helmet>
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/logo192.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#000000" />
      <meta name="description" content="車輛管理系統 - 基於Firebase的車輛信息管理系統" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      <meta name="apple-mobile-web-app-title" content="車輛管理" />
    </Helmet>
  );
} 