import { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: string;
    title?: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function Countdown({ targetDate, title = "Lanzamiento en" }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference <= 0) {
                setIsExpired(true);
                return null;
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        // Update every second
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (!newTimeLeft) {
                clearInterval(timer);
                // Reload page to show product as available
                window.location.reload();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (isExpired) {
        return null;
    }

    if (!timeLeft) {
        return (
            <div className="animate-pulse bg-gray-100 rounded-xl p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="flex gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 w-20 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <div className="bg-gray-900 text-white rounded-xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl sm:text-3xl font-bold font-mono">
                    {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="text-xs sm:text-sm text-gray-600 mt-2 font-medium uppercase tracking-wide">
                {label}
            </span>
        </div>
    );

    return (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>

            <div className="flex gap-3 sm:gap-4 justify-center">
                <TimeBlock value={timeLeft.days} label="Días" />
                <div className="text-2xl font-bold text-gray-400 self-center mb-6">:</div>
                <TimeBlock value={timeLeft.hours} label="Horas" />
                <div className="text-2xl font-bold text-gray-400 self-center mb-6">:</div>
                <TimeBlock value={timeLeft.minutes} label="Min" />
                <div className="text-2xl font-bold text-gray-400 self-center mb-6">:</div>
                <TimeBlock value={timeLeft.seconds} label="Seg" />
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
                Disponible el {new Date(targetDate).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
        </div>
    );
}
