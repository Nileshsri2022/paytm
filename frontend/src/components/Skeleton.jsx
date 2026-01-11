// Reusable Skeleton Loading Components
import React from 'react';

// Base skeleton with pulse animation
export const Skeleton = ({ className = '', ...props }) => (
    <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        {...props}
    />
);

// Text line skeleton
export const SkeletonText = ({ lines = 1, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            />
        ))}
    </div>
);

// Circle skeleton (for avatars)
export const SkeletonCircle = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };
    return <Skeleton className={`rounded-full ${sizes[size]} ${className}`} />;
};

// Card skeleton
export const SkeletonCard = ({ className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-4 mb-4">
            <SkeletonCircle />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
        <SkeletonText lines={3} />
    </div>
);

// Balance skeleton
export const SkeletonBalance = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-40" />
    </div>
);

// User list skeleton
export const SkeletonUserList = ({ count = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex items-center space-x-3">
                    <SkeletonCircle size="md" />
                    <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
        ))}
    </div>
);

// Transaction list skeleton
export const SkeletonTransactionList = ({ count = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="text-right">
                        <Skeleton className="h-6 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Dashboard skeleton
export const SkeletonDashboard = () => (
    <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SkeletonBalance />
            <SkeletonBalance />
            <SkeletonBalance />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <SkeletonUserList count={4} />
            </div>
            <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <SkeletonTransactionList count={3} />
            </div>
        </div>
    </div>
);
