import { Suspense } from 'react';
import HomeContent from './HomeContent';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💭</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
