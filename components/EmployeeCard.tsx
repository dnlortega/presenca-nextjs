"use client";
import React from 'react';
import { Button } from './ui/Button';
import Card from './ui/Card';

type Props = {
  id: string;
  name: string;
  company: string;
  sector: string;
  active?: boolean;
  onMark?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
};

export default function EmployeeCard({ id, name, company, sector, active = true, onMark }: Props) {
  return (
    <Card className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 `}>
      <div className="flex-1">
        <div className="text-lg font-bold">{name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{company} • {sector}</div>
      </div>

      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{active ? 'Ativo' : 'Inativo'}</div>
        <Button className="w-full sm:w-auto" onClick={() => onMark?.(id)}>Marcar</Button>
      </div>
    </Card>
  );
}

// Note: selection behavior is implemented in the parent component by rendering
// the EmployeeCard inside a clickable wrapper or passing selectable/selected props.
