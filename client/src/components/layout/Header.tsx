import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-neutral-dark mb-2">{title}</h1>
      {subtitle && <p className="text-neutral-gray">{subtitle}</p>}
    </header>
  );
}
