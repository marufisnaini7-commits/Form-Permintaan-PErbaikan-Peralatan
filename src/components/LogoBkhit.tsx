/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoBkhitProps {
  className?: string;
  size?: number;
}

export default function LogoBkhit({ className = '', size = 70 }: LogoBkhitProps) {
  return (
    <img
      src="https://lh3.googleusercontent.com/d/1bPZXtvaDjpTBo_f2oKdSIYZ7SzY5cc7k"
      alt="Logo BKHIT"
      width={size}
      height={size}
      className={className}
      referrerPolicy="no-referrer"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain'
      }}
    />
  );
}
