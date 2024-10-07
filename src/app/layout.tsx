'use client';

import "../styles/index.css";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ScrollToTop from "../components/ScrollToTop";
import React from 'react';
import { Inter } from "next/font/google";
import "react-modal-video/css/modal-video.css";
import { UserProvider } from '@auth0/nextjs-auth0/client';

const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <title>EduFlujo</title>
      </head>
      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <Providers>
          <UserProvider>
            <Header />
              {children}
            <Footer />
            <ScrollToTop />
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
import { Providers } from "./providers";
