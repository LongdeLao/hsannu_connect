"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Event } from "@/lib/api";

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  view: 'month' | 'week' | 'day';
  events: Event[];
  onEventClick: (event: Event) => void;
  onTimeSlotClick: (date: Date, hour?: number) => void;
}

export function CalendarView({ 
  currentDate, 
  onDateChange, 
  view, 
  events, 
  onEventClick, 
  onTimeSlotClick 
}: CalendarViewProps) {
  const navigateDate = (direction: 'prev' | 'next') => {
    const amount = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      if (amount === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (amount === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else {
      if (amount === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (amount === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    }
    
    onDateChange(newDate);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.eventDate);
      return isSameDay(eventDate, date);
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="flex-1 bg-background/50 rounded-2xl overflow-hidden">
        {/* Month header */}
        <div className="grid grid-cols-7 bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-4 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="flex-1 grid grid-rows-6">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 flex-1">
              {week.map((day) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 border-r border-b border-border/30 min-h-[100px] cursor-pointer transition-colors hover:bg-muted/50",
                      !isCurrentMonth && "text-muted-foreground bg-muted/20"
                    )}
                    onClick={() => onTimeSlotClick(day)}
                  >
                    <div className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                      isCurrentDay && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.eventID}
                          className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground px-2">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex-1 bg-background/50 rounded-2xl overflow-hidden flex flex-col">
        {/* Week header */}
        <div className="grid grid-cols-8 bg-muted/30 border-b border-border/30">
          <div className="p-4"></div>
          {days.map((day) => (
            <div key={day.toISOString()} className="p-4 text-center">
              <div className="text-sm font-medium">{format(day, 'EEE')}</div>
              <div className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold mt-1",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="p-2 text-right text-sm text-muted-foreground border-b border-border/20">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
                {days.map((day) => {
                  const dayEvents = getEventsForDate(day).filter(event => {
                    if (event.isWholeDay) return hour === 0;
                    const startTime = event.startTime ? parseISO(event.startTime) : null;
                    return startTime && startTime.getHours() === hour;
                  });
                  
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="min-h-[60px] border-b border-r border-border/20 p-1 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => onTimeSlotClick(day, hour)}
                    >
                      {dayEvents.map((event) => (
                        <div
                          key={event.eventID}
                          className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors mb-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="flex-1 bg-background/50 rounded-2xl overflow-hidden flex flex-col">
        {/* Day header */}
        <div className="p-6 bg-muted/30 border-b border-border/30">
          <div className="text-sm font-medium text-muted-foreground">{format(currentDate, 'EEEE')}</div>
          <div className={cn(
            "text-3xl font-bold mt-1",
            isToday(currentDate) && "text-primary"
          )}>
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
        </div>
        
        {/* Time slots */}
        <div className="flex-1 overflow-auto">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter(event => {
              if (event.isWholeDay) return hour === 0;
              const startTime = event.startTime ? parseISO(event.startTime) : null;
              return startTime && startTime.getHours() === hour;
            });
            
            return (
              <div
                key={hour}
                className="flex border-b border-border/20 min-h-[80px] cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onTimeSlotClick(currentDate, hour)}
              >
                <div className="w-20 p-4 text-right text-sm text-muted-foreground">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
                <div className="flex-1 p-4">
                  {hourEvents.map((event) => (
                    <div
                      key={event.eventID}
                      className="p-3 rounded-xl bg-primary/10 border-l-4 border-primary hover:bg-primary/20 cursor-pointer transition-colors mb-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="font-medium text-primary mb-1">{event.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {!event.isWholeDay && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.startTime && event.endTime && 
                              `${format(parseISO(event.startTime), 'HH:mm')} - ${format(parseISO(event.endTime), 'HH:mm')}`
                            }
                          </span>
                        )}
                        {event.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.address}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="h-10 w-10 rounded-full hover:bg-muted/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {getViewTitle()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('next')}
            className="h-10 w-10 rounded-full hover:bg-muted/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(new Date())}
          className="rounded-full px-6"
        >
          Today
        </Button>
      </div>

      {/* Calendar content */}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
} 