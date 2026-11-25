'use client';

import { useEffect } from 'react';
import { mark } from '@/lib/journey';

// Records one anonymous "arrived" step per visit.
export default function Tracker() {
  useEffect(() => {
    mark('arrived');
  }, []);
  return null;
}
