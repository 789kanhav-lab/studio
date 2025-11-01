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
    setLaps((prevLaps) => [...prevLaps, newLap]);
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
    <div className="flex flex-col items-center justify-center min-h-screen w-full py-12 px-4 space-y-6 sm:space-y-8 text-foreground">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-primary via-accent to-primary">
          ChronoTrack
        </h1>
        <p className="text-muted-foreground mt-2">Your precise digital stopwatch.</p>
      </div>

      <Card className="w-full max-w-md bg-card/80 border-primary/20 shadow-2xl shadow-primary/5">
        <CardContent className="p-6 flex justify-center">
          <div className="text-7xl md:text-8xl font-mono tabular-nums tracking-tighter">
            {formatTime(time)}
          </div>
        </CardContent>
      </Card>

      <div className="flex w-full max-w-md justify-between gap-2 sm:gap-4">
        <Button onClick={handleReset} variant="outline" className="w-full" size="lg" disabled={time === 0 && !isRunning}>
          <RotateCcw className="h-5 w-5 sm:mr-2" /> <span className="hidden sm:inline">Reset</span>
        </Button>
        <Button onClick={handleStartStop} size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {isRunning ? (
            <Pause className="h-6 w-6 sm:mr-2" />
          ) : (
            <Play className="h-6 w-6 sm:mr-2" />
          )}
          <span className="hidden sm:inline">{isRunning ? "Pause" : "Start"}</span>
        </Button>
        <Button onClick={handleLap} variant="outline" className="w-full" size="lg" disabled={!isRunning}>
          <Flag className="h-5 w-5 sm:mr-2" /> <span className="hidden sm:inline">Lap</span>
        </Button>
      </div>

      {laps.length > 0 && (
        <Card className="w-full max-w-md bg-card/80 border-primary/20">
          <ScrollArea className="h-64">
            <Table>
              <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="w-[80px]">Lap</TableHead>
                  <TableHead className="text-center">Lap Time</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...laps].reverse().map((lap) => (
                  <TableRow
                    key={lap.number}
                    className={cn(
                      "font-mono transition-colors",
                      laps.length > 1 && {
                        "text-success": lap.lapTime === fastestLapTime,
                        "text-destructive": lap.lapTime === slowestLapTime,
                      }
                    )}
                  >
                    <TableCell className="font-medium">{lap.number}</TableCell>
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
