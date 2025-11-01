"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Flag, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Lap = {
  number: number;
  lapTime: number;
  totalTime: number;
};

const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time % 3600000) / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const milliseconds = Math.floor((time % 1000) / 10);

  const parts = [
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ];

  if (hours > 0) {
    parts.unshift(hours.toString().padStart(2, "0"));
  }

  return `${parts.join(":")}.${milliseconds.toString().padStart(2, "0")}`;
};

export function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStartStop = () => {
    if (isRunning) {
      clearInterval(intervalRef.current!);
    } else {
      startTimeRef.current = Date.now() - time;
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    }
    setIsRunning(!isRunning);
  };

  const handleLap = () => {
    if (!isRunning) return;
    const lastLapTotalTime = laps.length > 0 ? laps[laps.length - 1].totalTime : 0;
    const lapTime = time - lastLapTotalTime;
    const newLap: Lap = {
      number: laps.length + 1,
      lapTime,
      totalTime: time,
    };
    setLaps((prevLaps) => [newLap, ...prevLaps]);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const fastestLapTime = laps.length > 1 ? Math.min(...laps.map((l) => l.lapTime)) : 0;
  const slowestLapTime = laps.length > 1 ? Math.max(...laps.map((l) => l.lapTime)) : 0;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full animated-gradient py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          TimeX Track
        </h1>
        <p className="text-muted-foreground">Your precise digital stopwatch.</p>
      </div>

      <Card className="w-full max-w-md bg-card/50 border-primary/20 shadow-2xl shadow-primary/10 backdrop-blur-sm">
        <CardContent className="p-6 flex justify-center">
          <div className="font-mono text-7xl md:text-8xl tracking-tighter tabular-nums bg-clip-text text-transparent bg-gradient-to-b from-slate-200 to-slate-400">
            {formatTime(time)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 w-full max-w-md gap-4">
        <Button onClick={handleReset} variant="outline" className="py-6 text-lg rounded-xl" disabled={time === 0 && !isRunning}>
          <RotateCcw className="h-6 w-6" />
        </Button>
        <Button onClick={handleStartStop} size="lg" className="py-8 text-lg rounded-xl col-span-1 bg-gradient-to-br from-purple-500 to-pink-500 text-primary-foreground hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
          {isRunning ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
        <Button onClick={handleLap} variant="outline" className="py-6 text-lg rounded-xl" disabled={!isRunning}>
          <Flag className="h-6 w-6" />
        </Button>
      </div>

      {laps.length > 0 && (
        <Card className="w-full max-w-md bg-card/50 border-primary/20 backdrop-blur-sm">
          <ScrollArea className="h-64">
            <Table>
              <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="w-[80px] font-bold">Lap</TableHead>
                  <TableHead className="text-center font-bold">Lap Time</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laps.map((lap) => (
                  <TableRow
                    key={lap.number}
                    className={cn(
                      "font-mono transition-colors",
                      laps.length > 1 && lap.lapTime > 0 && {
                        "text-green-400": lap.lapTime === fastestLapTime,
                        "text-red-400": lap.lapTime === slowestLapTime,
                      }
                    )}
                  >
                    <TableCell className="font-medium">
                      <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                        {lap.number}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {formatTime(lap.lapTime)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTime(lap.totalTime)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
