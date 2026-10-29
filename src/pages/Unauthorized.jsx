import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Unauthorized = () => (
  <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
    <Card className="text-center p-8 max-w-md">
      <h2 className="text-2xl font-bold text-danger mb-2">403 - Access Denied</h2>
      <p className="text-gray-400 text-xs mb-6">Administrator privileges required.</p>
      <Link to="/"><Button variant="outline">Return Home</Button></Link>
    </Card>
  </div>
);