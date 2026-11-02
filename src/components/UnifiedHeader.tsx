"use client";

import React, { useState, useEffect } from 'react';
import Header from './Header';
import { usePathname } from 'next/navigation';

export default function UnifiedHeader() {
  const pathname = usePathname();

  // Hide header on game play screens to avoid clutter
  const hideHeader = pathname.startsWith('/games/') && !pathname.includes('/profile') && !pathname.includes('/daily') && !pathname.includes('/challenge');

  if (hideHeader) {
    return null;
  }

  return <Header />;
}