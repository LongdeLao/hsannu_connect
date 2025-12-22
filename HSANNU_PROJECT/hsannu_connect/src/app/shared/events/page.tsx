"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Home, ChevronRight, Menu, X, Settings } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/components/custom/calendar-view";
import { EventForm } from "@/components/custom/event-form";
import { EventView } from "@/components/custom/event-view";
import { Event, fetchEvents, deleteEvent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function EventsPage() {
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventView, setShowEventView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<number | undefined>();
  const [showSidebar, setShowSidebar] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await fetchEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setSelectedHour(undefined);
    setShowEventView(true);
  };

  const handleTimeSlotClick = (date: Date, hour?: number) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setSelectedHour(hour);
    setShowEventForm(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setSelectedHour(undefined);
    setShowEventForm(true);
  };

  const handleEventFormSuccess = () => {
    loadEvents();
    toast({
      title: "Success",
      description: selectedEvent ? "Event updated successfully" : "Event created successfully",
    });
  };

  const handleDeleteEvent = async (eventID: string) => {
    try {
      await deleteEvent(eventID);
      loadEvents();
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setSelectedHour(undefined);
    setShowEventView(false);
    setShowEventForm(true);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.eventDate) >= now)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 5);
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Header */}
      <div className="lg:hidden flex-none p-4 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="h-9 w-9 rounded-xl"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Events</h1>
              <p className="text-xs text-muted-foreground">Manage your calendar</p>
            </div>
          </div>
          <Button
            onClick={handleCreateEvent}
            size="sm"
            className="rounded-xl px-4"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block flex-none p-6 pb-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Events</span>
        </nav>

        {/* Page Title and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Events</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and view upcoming events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/50 rounded-xl p-1">
              <Button
                variant={currentView === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('month')}
                className="rounded-lg px-4"
              >
                Month
              </Button>
              <Button
                variant={currentView === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('week')}
                className="rounded-lg px-4"
              >
                Week
              </Button>
              <Button
                variant={currentView === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('day')}
                className="rounded-lg px-4"
              >
                Day
              </Button>
            </div>
            <Button onClick={handleCreateEvent} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile View Toggle */}
      <div className="lg:hidden flex-none px-4 pb-4">
        <div className="flex bg-muted/50 rounded-xl p-1">
          <Button
            variant={currentView === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('month')}
            className="rounded-lg flex-1"
          >
            Month
          </Button>
          <Button
            variant={currentView === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('week')}
            className="rounded-lg flex-1"
          >
            Week
          </Button>
          <Button
            variant={currentView === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('day')}
            className="rounded-lg flex-1"
          >
            Day
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Area */}
        <div className="flex-1 lg:flex-none lg:w-0 lg:flex-grow p-4 lg:p-6 pt-0 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-background/50 rounded-2xl">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            </div>
          ) : (
            <CalendarView
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              view={currentView}
              events={events}
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
            />
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 border-l border-border/50 bg-muted/20 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div>
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.eventID}
                      className="p-4 bg-background/70 rounded-xl border border-border/50 hover:bg-background transition-colors cursor-pointer group"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">
                        {event.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(event.eventDate), 'MMM d, yyyy')}
                        {!event.isWholeDay && event.startTime && (
                          <span className="ml-2">
                            {format(parseISO(event.startTime), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      {event.address && (
                        <div className="text-xs text-muted-foreground mt-1">
                          📍 {event.address}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming events</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div>
              <h3 className="font-medium text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-border/50 hover:bg-background/80"
                  onClick={handleCreateEvent}
                >
                  <Plus className="h-4 w-4 mr-3" />
                  Create Event
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-border/50 hover:bg-background/80"
                  onClick={() => setCurrentDate(new Date())}
                >
                  <Calendar className="h-4 w-4 mr-3" />
                  Go to Today
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <div className="relative w-80 bg-background border-r border-border/50 p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">Events</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div>
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Events
                </h3>
                <div className="space-y-3">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <div
                        key={event.eventID}
                        className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => {
                          handleEventClick(event);
                          setShowSidebar(false);
                        }}
                      >
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(event.eventDate), 'MMM d, yyyy')}
                          {!event.isWholeDay && event.startTime && (
                            <span className="ml-2">
                              {format(parseISO(event.startTime), 'HH:mm')}
                            </span>
                          )}
                        </div>
                        {event.address && (
                          <div className="text-xs text-muted-foreground mt-1">
                            📍 {event.address}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming events</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div>
                <h3 className="font-medium text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    onClick={() => {
                      handleCreateEvent();
                      setShowSidebar(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    Create Event
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    onClick={() => {
                      setCurrentDate(new Date());
                      setShowSidebar(false);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    Go to Today
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Dialog */}
      <EventForm
        open={showEventForm}
        onOpenChange={setShowEventForm}
        event={selectedEvent}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        onSuccess={handleEventFormSuccess}
      />

      {/* Event View Dialog */}
      <EventView
        open={showEventView}
        onOpenChange={setShowEventView}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
} 