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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Flag, RotateCcw, History, Target, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Lap = {
  number: number;
  lapTime: number;
  totalTime: number;
};

type Session = {
  id: string;
  date: string;
  totalTime: number;
  laps: Lap[];
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goal, setGoal] = useState<number | null>(null);
  const [goalReached, setGoalReached] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const { toast } = useToast();

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("stopwatchState");
      if (savedState) {
        const { time, laps, isRunning } = JSON.parse(savedState);
        setLaps(laps);
        setTime(time);
        setIsRunning(isRunning);
        if (isRunning) {
          startTimeRef.current = Date.now() - time;
          intervalRef.current = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
          }, 10);
        }
      }
      const savedSessions = localStorage.getItem("stopwatchSessions");
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
      const savedGoal = localStorage.getItem("stopwatchGoal");
      if (savedGoal) {
        const parsedGoal = parseInt(savedGoal, 10);
        setGoal(parsedGoal);
        setGoalInputValue((parsedGoal / 1000).toString());
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      // Clear corrupted state
      localStorage.removeItem("stopwatchState");
      localStorage.removeItem("stopwatchSessions");
      localStorage.removeItem("stopwatchGoal");
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      time,
      laps,
      isRunning,
    };
    try {
      localStorage.setItem("stopwatchState", JSON.stringify(stateToSave));
      if (sessions.length > 0) {
        localStorage.setItem("stopwatchSessions", JSON.stringify(sessions));
      }
      if (goal !== null) {
        localStorage.setItem("stopwatchGoal", goal.toString());
      } else {
        localStorage.removeItem("stopwatchGoal");
      }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [time, laps, isRunning, sessions, goal]);
  
  // Check for goal reached
  useEffect(() => {
    if (goal !== null && time >= goal && !goalReached) {
      setGoalReached(true);
      toast({
        title: "Goal Reached!",
        description: `You've reached your goal of ${formatTime(goal)}.`,
      });
    }
  }, [time, goal, goalReached, toast]);

  const handleStartStop = () => {
    if (isRunning) {
      clearInterval(intervalRef.current!);
    } else {
      if (goal !== null && time >= goal) {
        setGoalReached(false); // Reset goal reached state when restarting
      }
      startTimeRef.current = Date.now() - time;
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    }
    setIsRunning(!isRunning);
  };

  const handleLap = () => {
    if (!isRunning) return;
    const lastLapTotalTime = laps.length > 0 ? laps[0].totalTime : 0;
    const lapTime = time - lastLapTotalTime;
    const newLap: Lap = {
      number: laps.length + 1,
      lapTime,
      totalTime: time,
    };
    setLaps((prevLaps) => [newLap, ...prevLaps]);
  };

  const handleReset = () => {
    if (time > 0 || laps.length > 0) {
      const newSession: Session = {
        id: new Date().toISOString(),
        date: new Date().toLocaleString(),
        totalTime: time,
        laps: [...laps].reverse(),
      };
      setSessions(prev => [newSession, ...prev]);
       toast({
        title: "Session Saved",
        description: "Your session has been moved to history.",
      });
    }

    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    setGoalReached(false);
    try {
      localStorage.removeItem("stopwatchState");
    } catch (error) {
      console.error("Failed to clear state from localStorage", error);
    }
  };

  const handleSetGoal = () => {
    const newGoal = parseFloat(goalInputValue) * 1000;
    if (!isNaN(newGoal) && newGoal > 0) {
      setGoal(newGoal);
      setGoalReached(false); // Reset when new goal is set
       toast({
        title: "Goal Set",
        description: `Your new goal is ${formatTime(newGoal)}.`,
      });
    } else {
      setGoal(null);
      setGoalInputValue("");
      toast({
        title: "Goal Cleared",
        description: "Your time goal has been removed.",
      });
    }
  };
  
  const clearHistory = () => {
    setSessions([]);
    try {
      localStorage.removeItem("stopwatchSessions");
    } catch (error) {
      console.error("Failed to clear sessions from localStorage", error);
    }
    toast({
      title: "History Cleared",
      description: "All saved sessions have been deleted.",
    });
  }

  const fastestLapTime = laps.length > 1 ? Math.min(...laps.map((l) => l.lapTime)) : 0;
  const slowestLapTime = laps.length > 1 ? Math.max(...laps.map((l) => l.lapTime)) : 0;
  
  const progress = goal ? Math.min((time / goal) * 100, 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full animated-gradient py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          TimeX Track
        </h1>
        <p className="text-muted-foreground">Your precise digital stopwatch.</p>
      </div>

      <Card className="w-full max-w-md bg-card/50 border-primary/20 shadow-2xl shadow-primary/10 backdrop-blur-sm">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <div className={cn("font-mono text-7xl md:text-8xl tracking-tighter tabular-nums bg-clip-text text-transparent bg-gradient-to-b from-slate-200 to-slate-400 transition-colors duration-500", goalReached && "bg-gradient-to-b from-green-300 to-green-500")}>
            {formatTime(time)}
          </div>
          {goal && (
             <div className="w-full mt-4">
              <Progress value={progress} className="h-2 bg-primary/20" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>00:00.00</span>
                <span>{formatTime(goal)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 w-full max-w-md gap-4">
        <Button onClick={handleReset} variant="outline" className="py-6 text-lg rounded-xl" disabled={time === 0 && !isRunning} aria-label="Reset">
          <RotateCcw className="h-6 w-6" />
        </Button>
        <Button onClick={handleStartStop} size="lg" className="py-8 text-lg rounded-xl col-span-1 bg-gradient-to-br from-purple-500 to-pink-500 text-primary-foreground hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg" aria-label={isRunning ? "Pause" : "Start"}>
          {isRunning ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
        <Button onClick={handleLap} variant="outline" className="py-6 text-lg rounded-xl" disabled={!isRunning} aria-label="Lap">
          <Flag className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex w-full max-w-md gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full py-6 text-lg rounded-xl">
              <History className="h-6 w-6 mr-2" />
              History
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Session History</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96">
              {sessions.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {sessions.map((session) => (
                    <Card key={session.id}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm flex justify-between items-center">
                          <span>{session.date}</span>
                           <span className="font-mono text-lg">{formatTime(session.totalTime)}</span>
                        </CardTitle>
                      </CardHeader>
                      {session.laps.length > 0 && (
                        <CardContent className="p-4 pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">Lap</TableHead>
                                <TableHead className="text-center">Time</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                             <TableBody>
                              {session.laps.map((lap) => (
                                <TableRow key={lap.number} className="font-mono text-xs">
                                  <TableCell>{lap.number}</TableCell>
                                  <TableCell className="text-center">{formatTime(lap.lapTime)}</TableCell>
                                  <TableCell className="text-right">{formatTime(lap.totalTime)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-16">No saved sessions yet.</p>
              )}
            </ScrollArea>
             {sessions.length > 0 && (
              <DialogFooter>
                <Button variant="destructive" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All History
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full py-6 text-lg rounded-xl">
              <Target className="h-6 w-6 mr-2" />
              Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Set Time Goal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goal" className="text-right">
                  Seconds
                </Label>
                <Input
                  id="goal"
                  type="number"
                  value={goalInputValue}
                  onChange={(e) => setGoalInputValue(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., 60"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={handleSetGoal}>Set Goal</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
